import hashlib
import base64
import uuid

import oelib



table = None
def lambda_handler(event, context):
    global table
    if table is None: table = oelib.table.client(event=event)
    return main(event, context)
    


def main(event, context):
    try:
        email = event['request']['userAttributes']['email']

        domain = email.split('@')[1]
        if domain != 'yuyuprojects.com': raise Exception

        hashedEmail = hash_and_encode(email)
        userId = get_user_id(hashedEmail) or create_user_id()
        userName = event['userName']
        registration(hashedEmail, userId, userName)
        return event
    except:
        raise Exception('Sign-up failed.')



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



def create_user_id():
    uuid4 = oelib.uuidv7.UUID(str(uuid.uuid4()))
    return uuid4.base36



def registration(hashedEmail, userId, userName):
    table.update_item(
        Key={
            'PK': { 'S': f"Auth.{hashedEmail[:2]}" },
            'SK': { 'S': f"Email#{hashedEmail}" },
        },
        UpdateExpression='SET #uid = :uid ADD #cun :uns',
        ExpressionAttributeNames={
            '#uid': 'UserId',
            '#cun': 'CognitoUserNames'
        },
        ExpressionAttributeValues={
            ':uid': { 'S': userId },
            ':uns': { 'SS': [userName] }
        }
    )