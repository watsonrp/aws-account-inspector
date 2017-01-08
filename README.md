# aws-account-inspector
## Setup
1. Put the html/css/javascript in an s3 bucket.
2. Create a lambda function (in the aws-account-inspector directory) called AAEGetItems
3. Setup an AWS Cognito identity federation and configure the unauthenticated_role with the right to invoke the AAEGetItems lambda fucntion.
## Using
1. Access the index.htm page using https.
2. Enter credentials that have readonly to services and click list resources. 
