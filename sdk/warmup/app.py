import os
import boto3



tagClient = lambdaClient = None
def lambda_handler(event, context):
    global tagClient, lambdaClient

    if tagClient is None:
        tagClient = boto3.client('resourcegroupstaggingapi')

    if lambdaClient is None:
        lambdaClient = boto3.client('lambda')

    if event and event.get('warmup'): return

    if appGroupName := os.getenv('APP_GROUP_NAME'):
        resources = []
        for _ in range(100):
            res = tagClient.get_resources(
                TagFilters=[
                    {
                        'Key': 'application-group-name',
                        'Values': [appGroupName]
                    }, {
                        'Key': 'aws-lambda-warmup-target',
                        'Values': ['true']
                    }
                ],
                ResourceTypeFilters=['lambda:function']
            )
            resources += res['ResourceTagMappingList']
            if not res['PaginationToken']: break

        for resource in resources:
            try: lambdaClient.invoke(
                FunctionName=resource['ResourceARN'],
                InvocationType='Event',
                Payload='{"warmup":true}'
            )
            except: pass
