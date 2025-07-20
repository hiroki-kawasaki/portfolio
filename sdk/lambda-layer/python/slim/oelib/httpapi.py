__all__ = ['HttpApi', 'HttpApiEvent']

import json
from decimal import Decimal
from datetime import datetime
import logging
import string

import oelib



logger = logging.getLogger()
logger.setLevel(logging.INFO)



class HttpapiError(Exception):
    __fmt = (
        'HTTP API ERROR'
        'Status Code: ${statusCode} ${errorType}'
        '${msg}'
    )
    statusCode = None
    errorType = None

    def __init__(self, msg=None):
        if msg is None: msg = 'An unspecified error occurred.'
        super().__init__(msg=msg)

    @property
    def fmt(self):
        return string.Template(self.__fmt).safe_substitute(
            statusCode=self.statusCode,
            errorType=self.errorType
        )


class BadRequest(HttpapiError):
    statusCode=400
    errorType='Bad Request'

class Forbidden(HttpapiError):
    statusCode=403
    errorType='Forbidden'

class NotFound(HttpapiError):
    statusCode=404,
    errorType='Not Found'

class NotAcceptable(HttpapiError):
    statusCode=406
    errorType='Not Acceptable'

class Conflict(HttpapiError):
    statusCode=409
    errorType='Conflict'

class InternalServerError(HttpapiError):
    statusCode=500
    errorType='Internal Server Error'

class NotImplemented(HttpapiError):
    statusCode=501
    errorType='Not Implemented'

class ServiceUnavailable(HttpapiError):
    statusCode=503
    errorType='Service Unavailable'



class HttpApiEvent:
    def __init__(self, event):
        self.__event = event
        self.__requestContext = None
        self.__authorizer = None
        self.__httpMethod = None
        self.__pathParameters = None
        self.__queryStringParameters = None
        self.__headers = None
        self.__fullBody = None


    @property
    def rawEvent(self):
        return self.__event

    @property
    def requestContext(self):
        if self.__requestContext is None:
            self.__requestContext = self.__event.get('requestContext', {}) or {}
        return self.__requestContext

    @property
    def authorizer(self):
        if self.__authorizer is None:
            self.__authorizer = self.requestContext.get('authorizer', {}).get('lambda', {}) or {}
        return self.__authorizer

    @property
    def httpMethod(self):
        if self.__httpMethod is None:
            self.__httpMethod = self.requestContext.get('http', {}).get('method').upper()
        return self.__httpMethod

    @property
    def pathParameters(self):
        if self.__pathParameters is None:
            self.__pathParameters = self.__event.get('pathParameters') or {}
        return self.__pathParameters

    @property
    def queryStringParameters(self):
        if self.__queryStringParameters is None:
            self.__queryStringParameters = self.__event.get('queryStringParameters') or {}
        return self.__queryStringParameters

    @property
    def headers(self):
        if self.__headers is None:
            self.__headers = self.__event.get('headers') or {}
        return self.__headers

    @property
    def fullBody(self):
        if self.__fullBody is None:
            self.__fullBody = json.loads(self.__event['body']) if 'body' in self.__event else {}
        return self.__fullBody


    @property
    def lang(self):
        return self.headers.get('lang') or 'ja'

    @property
    def user_id(self):
        return self.auth('userid')

    @property
    def idempotency_key(self):
        return self.headers.get('idempotency-key')


    def auth(self, name, default=None):
        return self.authorizer.get(name, default)


    def path(self, name, default=None):
        val = self.pathParameters.get(name)
        return val.lower() if val else default


    def query(self, name, default=None):
        val = self.queryStringParameters.get(name)
        return val.lower() if val else default


    def body(self, name, default=None):
        return self.fullBody.get(name, default)



class HttpApi:
    def __init__(self, pathNames=None):
        self.__prefixSet = set()
        self.__routes = {}
        self.__tableClient = None

    @property
    def routes(self):
        return list(self.__routes.keys())

    def __setRoute(self, func, method, prefix=None, **kwargs):
        key = method + '::' + prefix or '#'
        self.__routes[key] = func

    def get(self, prefix=None, **kwargs):
        if prefix is not None: self.__prefixSet.add(prefix)
        def wraper(func):
            self.__setRoute(func, 'GET', prefix, **kwargs)
            return func
        return wraper

    def post(self, prefix=None, **kwargs):
        if prefix is not None: self.__prefixSet.add(prefix)
        def wraper(func):
            self.__setRoute(func, 'POST', prefix, **kwargs)
            return func
        return wraper

    def put(self, prefix=None, **kwargs):
        if prefix is not None: self.__prefixSet.add(prefix)
        def wraper(func):
            self.__setRoute(func, 'PUT', prefix, **kwargs)
            return func
        return wraper

    def patch(self, prefix=None, **kwargs):
        if prefix is not None: self.__prefixSet.add(prefix)
        def wraper(func):
            self.__setRoute(func, 'PATCH', prefix, **kwargs)
            return func
        return wraper

    def delete(self, prefix=None, **kwargs):
        if prefix is not None: self.__prefixSet.add(prefix)
        def wraper(func):
            self.__setRoute(func, 'DELETE', prefix, **kwargs)
            return func
        return wraper



    def run(self, event, context):
        if self.__tableClient is None:
            self.__tableClient = oelib.table.client(event=event)

        isApi = 'requestContext' in event and 'apiId' in event['requestContext']
        httpapiEvent = None

        function_name = context.function_name
        try:
            qsp = event.get('queryStringParameters') or {}

            if qsp.get('dryrun') == 'true' or event.get('dryrun') == True:
                data = {'dryrun': True}

            elif event.get('warmup') == True:
                data = {'warmup': True}

            else:
                rawPath = event.get('rawPath', '')
                prefix = rawPath.split('/')[1]

                httpapiEvent = HttpApiEvent(event)

                isIdempotency = httpapiEvent.httpMethod != 'get' and isApi
                if isIdempotency:
                    uid = httpapiEvent.user_id
                    ik = httpapiEvent.idempotency_key
                    pk = 'Idempotency.'+ik[-2:]
                    sk = ('User#'+uid+'#' if uid else '')+'IdempotencyKey#'+ik
                    item = self.__tableClient.get_item(pk=pk, sk=sk)
                    if item: return {
                        'statusCode': int(item['StatusCode']['N']),
                        'body': item['ResponseBody']['S'],
                    }

                method = httpapiEvent.httpMethod
                if prefix not in self.__prefixSet: prefix = '#'
                key = method + '::' + prefix

                if key not in self.__routes: raise NotFound

                data = self.__routes[key](httpapiEvent, self.__tableClient) or {}

            status_code, body = 200, {'ok': True, **data}

        except HttpapiError as e:
            logger.debug(str(e), extra={'functionName': function_name})
            status_code = e.statusCode
            body = {'ok': False, 'error': e.errorType}

        except Exception:
            message = 'Internal Server Error'
            logger.exception(message, extra={'functionName': function_name})
            status_code = 500
            body = {'ok': False, 'error': message}


        def json_default(obj):
            if isinstance(obj, Decimal):
                return int(obj)
            if isinstance(obj, datetime):
                return obj.isoformat()
            if isinstance(obj, (set, list, tuple, filter)):
                return [json_default(v) for v in obj]
            if isinstance(obj, dict):
                return {k: json_default(v) for k, v in obj.items()}
            return obj

        body = json.dumps(body, default=json_default)
        if isApi:
            if isIdempotency:
                self.__tableClient.put_item(
                    Item={
                        'PK': {'S': pk},
                        'SK': {'S': sk},
                        'UserId': {'S': uid},
                        'IdempotencyKey': {'S': ik},
                        'StatusCode': {'N': str(status_code)},
                        'ResponseBody': {'S': body},
                    },
                    ttl=300
                )
            return {'statusCode': status_code, 'body': body}
        else: return json.loads(body)



    @staticmethod
    def HttpapiError(): return HttpapiError

    @staticmethod
    def BadRequest(): return BadRequest

    @staticmethod
    def Forbidden(): return Forbidden

    @staticmethod
    def NotFound(): return NotFound

    @staticmethod
    def NotAcceptable(): return NotAcceptable

    @staticmethod
    def Conflict(): return Conflict

    @staticmethod
    def InternalServerError(): return InternalServerError

    @staticmethod
    def NotImplemented(): return NotImplemented
