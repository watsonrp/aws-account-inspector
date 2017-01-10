# aws-account-inspector

A simple example of using Cognito, Lambda, and S3 to create a serverless application.  The aplication will display the resources of an account across regions if given a set of credentials.

## Setup
1. Put the html/css/javascript in an s3 bucket.
2. Create a lambda function (in the aws-account-inspector directory) called AAEGetItems
3. Setup an AWS Cognito identity federation and configure the unauthenticated_role with the right to invoke the AAEGetItems lambda function.

## Using
1. Access the index.htm page using https.
2. Enter credentials that have read only access to services and click list resources. 

## Challenge Task
- Add other resources (e.g. the rest)
- Extend this and allow the use of roles.

### Why did I do this?
To learn about the AWS Javascript SDK.  Using services such as Lambda and Cognito really helped simplify the app.  One significant challenge was dealing with the async nature of Javascript and as each region is iterated I had to use promises to ensure the post processing was correctly handled. 
