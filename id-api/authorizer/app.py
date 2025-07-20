import logging
import os
from jwt import PyJWT, PyJWKClient, InvalidTokenError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

class AccessDeny(Exception): pass



def guest(event, context):
    return main(event, context, 'guest')

def member(event, context):
    return main(event, context, 'member')



def main(event, context, who):
    try:
        headers = event['headers']

        # M2M authentication
        m2m_validate(headers)

        # User JWT authorization
        res = idp_validate(headers) if who == 'member' else {}

        return {'isAuthorized': True, **res}

    except (KeyError, InvalidTokenError, AccessDeny, ValueError) as e:
        logger.warning(f"Authorization failed: {type(e).__name__} - {e}")
        return {'isAuthorized': False}

    except Exception as e:
        function_name = context.function_name if context else 'UnknownFunction'
        logger.exception(f"An unexpected error occurred in {function_name}: {e}")
        return {'isAuthorized': False}



def _validate_jwt(token, jwks_client, issuer=None, audience=None):
    signing_key = jwks_client.get_signing_key_from_jwt(token)

    decoded_token = PyJWT().decode(
        token,
        signing_key.key,
        algorithms=['RS256'],
        issuer=issuer,
        audience=audience
    )
    return decoded_token



m2m_jwks_client = None
def m2m_validate(headers):
    global m2m_jwks_client

    if m2m_jwks_client is None:
        issusers = os.environ['M2M_ISSUERS'].split(',')
        m2m_jwks_client = PyJWKClient(f"{issusers[0]}/.well-known/jwks.json")

    token = headers['x-server-signature']
    decoded_token = _validate_jwt(token, m2m_jwks_client, audience='portfolio')
    token_issuer = decoded_token['iss']
    if token_issuer not in issusers:
        raise ValueError(f"Invalid issuer. Token issuer '{token_issuer}' is not in the trusted list.")



idp_jwks_client = None
def idp_validate(headers):
    global idp_jwks_client

    if idp_jwks_client is None:
        issuser = os.environ['IDP_ISSUER']
        idp_jwks_client = PyJWKClient(f"{issuser}/.well-known/jwks.json")

    client_id = os.environ['IDP_CLIENT_ID']
    token = headers['authorization'].split(' ', 1)[1]
    decoded_token = _validate_jwt(token, idp_jwks_client, issuer=issuser)

    if decoded_token.get('client_id') != client_id:
        raise AccessDeny("Token client_id does not match.")

    if decoded_token.get('token_use') != 'access':
        raise AccessDeny("Token token_use is not 'access'.")

    user_id = decoded_token.get('portfolio_id')
    if not user_id: raise AccessDeny("portfolio_id claim not found in token.")

    return {'context': {'user_id': user_id}}