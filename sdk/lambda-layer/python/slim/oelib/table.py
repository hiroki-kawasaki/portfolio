__all__ = ['client']



import os
from time import time
import uuid

import boto3
from botocore.config import Config
from boto3.dynamodb.types import TypeSerializer, TypeDeserializer

MAX_RETRY_COUNT = 10

EAN = 'ExpressionAttributeNames'
EAV = 'ExpressionAttributeValues'
KCE = 'KeyConditionExpression'



class Table:
    def __init__(self, ddb, name):
        self.__client = ddb
        self.__serializer = None
        self.__deserializer = None
        self.__history = []
        self.__name = name


    @property
    def client(self):
        return self.__client

    @property
    def exceptions(self):
        return self.client.exceptions

    @property
    def name(self):
        return self.__name


    def get_item(self, pk=None, sk=None, indexName=None, Key=None, **params):
        if not (pk and sk) and not Key: raise ValueError('invalid key')

        if 'TableName' not in params: params['TableName'] = self.name

        if indexName:
            if pk and sk:
                key1, key2 = indexName.split('_')[1].split('-')
                value1, value2 = pk, sk
            elif Key:
                (key1, value1), (key2, value2) = Key.items()

            items = self.query(
                TableName=params['TableName'],
                IndexName=indexName,
                KeyConditionExpression='#k1=:v1 AND #k2=:v2',
                ExpressionAttributeNames={'#k1':key1,'#k2':key2},
                ExpressionAttributeValues={':v1':{'S':value1},':v2':{'S':value2}}
            )
            item = items[0] if items else None

        else:
            params['Key'] = {'PK':{'S':pk},'SK':{'S':sk}} if pk and sk else Key
            item = self.client.get_item(**params).get('Item')

        return item


    def _query_params(self, pk=None, sk=None, **params):
        if 'TableName' not in params: params['TableName'] = self.name

        indexFlag = 'IndexName' in params
        if pk and sk:
            params['KeyConditionExpression'] = '#pk=:pk AND begins_with(#sk, :sk)'

            if indexFlag: pk_name, sk_name = params['IndexName'].split('_')[1].split('-')
            else: pk_name, sk_name = 'PK', 'SK'

            ean = {'#pk':pk_name,'#sk':sk_name}
            if EAN in params: params[EAN].update(ean)
            else: params[EAN] = ean

            eav = {':pk':{'S':pk},':sk':{'S':sk}}
            if EAV in params: params[EAV].update(eav)
            else: params[EAV] = eav

        elif pk:
            params['KeyConditionExpression'] = '#pk=:pk'

            if indexFlag: pk_name = params['IndexName'].split('_')[1].split('-')[0]
            else: pk_name = 'PK'

            ean = {'#pk':pk_name}
            if EAN in params: params[EAN].update(ean)
            else: params[EAN] = ean

            eav = {':pk':{'S':pk}}
            if EAV in params: params[EAV].update(eav)
            else: params[EAV] = eav

        return params

    def _query(self, **params):
        items = []
        while True:
            res = self.client.query(**params)
            items += res.get('Items', [])
            if not res.get('LastEvaluatedKey'): break
            params['ExclusiveStartKey'] = res['LastEvaluatedKey']
        return items

    def query(self, pk=None, sk=None, attr=None, lang=None, **params):
        if not pk and not params.get(KCE): raise ValueError('invalid key')

        params = self._query_params(pk, sk, **params)
        return self._query(**params)


    def put_item(self, item=None, ttl=None, **params):
        if 'TableName' not in params: params['TableName'] = self.name
        if item: params['Item'] = self.serialize_item(item)
        if ttl: params['Item']['TTL'] = {'N': str(int(time()+ttl))};
        return self.client.put_item(**params)


    def update_item(self, pk=None, sk=None, **params):
        if 'TableName' not in params: params['TableName'] = self.name
        if pk and sk: params['Key'] = {'PK':{'S':pk},'SK':{'S':sk}}
        return self.client.update_item(**params)


    def delete_item(self, pk=None, sk=None, **params):
        if 'TableName' not in params: params['TableName'] = self.name
        if pk and sk: params['Key'] = {'PK':{'S':pk},'SK':{'S':sk}}
        return self.client.delete_item(**params)


    def batch_get_item(self, **params):
        items = []
        for _ in range(MAX_RETRY_COUNT):
            res = self.client.batch_get_item(**params)
            items += res['Responses'][self.name]
            params['RequestKeys'] = res.get('UnprocessedKeys')

        return items


    def batch_write_item(self, **params):
        while params.get('RequestItems'):
            res = self.client.batch_write_item(**params)
            params['RequestItems'] = res.get('UnprocessedItems')

        return True



    @property
    def serializer(self):
        if self.__serializer is None: self.__serializer = TypeSerializer()
        return self.__serializer

    def serialize(self, value):
        return self.serializer.serialize(value)

    def serialize_item(self, item):
        return { k: self.serialize(v) for k, v in item.items() }

    def serialize_items(self, items):
        res = []
        for item in items: res.append(self.serialize_item(item))
        return res


    @property
    def deserializer(self):
        if self.__deserializer is None: self.__deserializer = TypeDeserializer()
        return self.__deserializer

    def deserialize(self, value):
        return self.deserializer.deserialize(value)

    def deserialize_item(self, item):
        return { k: self.deserialize(v) for k, v in item.items() }

    def deserialize_items(self, items):
        res = []
        for item in items: res.append(self.deserialize_item(item))
        return res



ddb = config = None
def client(TabelName=None, event=None):
    global ddb, config

    if TabelName is None:
        TabelName = os.getenv('MAIN_TABLE_NAME')
        if not TabelName: raise Exception('Please specify the table name.')

    if config is None:
        config = Config(
            retries = {
                'mode': 'standard',
                'max_attempts': MAX_RETRY_COUNT,
            }
        )

    if ddb is None:
        ddb = boto3.client('dynamodb', config=config)

        if event and event.get('warmup') == True:
            for _ in range(2):
                pk = str(uuid.uuid4())
                ddb.get_item(
                    TableName=TabelName,
                    Key={'PK':{'S':pk},'SK':{'S':'warmup'}}
                )

    return Table(ddb, TabelName)
