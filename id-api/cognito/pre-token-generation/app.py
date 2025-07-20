import base64
import hashlib
import time

import oelib



table = None
def lambda_handler(event, context):
    global table
    if table is None: table = oelib.table.client(event=event)
    return main(event, context)



checked = {}
def main(event, context):
    global checked

    email = event['request']['userAttributes']['email']

    hashedEmail = hash_and_encode(email)

    if hashedEmail in checked: userId = checked[hashedEmail]
    else:
        userId = get_user_id(hashedEmail)
        if userId is None: raise Exception('Error')
        checked = { **checked, userId: hashedEmail }

    event['response']['claimsAndScopeOverrideDetails'] = {
        'idTokenGeneration': {
            'claimsToAddOrOverride': {'portfolio_id': userId},
            'claimsToSuppress': ['email', 'cognito:groups'],
        },
        'accessTokenGeneration': {
            'claimsToAddOrOverride': {'portfolio_id': userId},
            'claimsToSuppress': ['username', 'cognito:groups', 'version'],
            'scopesToAdd': ['portfolio'],
            'scopesToSuppress': ['openid', 'profile', 'email'],
        }
    }

    return event



def hash_and_encode(s):
    hash_bytes = hashlib.sha256(s.encode()).digest()
    return base64.b64encode(hash_bytes).decode('utf-8').rstrip('=')



def get_user_id(hashedEmail):
    item = table.get_item(
        pk=f"Auth.{hashedEmail[:2]}",
        sk=f"Email#{hashedEmail}"
    )
    if item: return item.get('UserId', {}).get('S')
    return None

