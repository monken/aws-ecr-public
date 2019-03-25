# Public Proxy for AWS ECR

Host any Elastic Container Registry (ECR) publicly on a custom domain using this serverless proxy.

## Solution Overview

ECR doesn't support [public registries](https://aws.amazon.com/ecr/faqs/). Instead, the docker client needs to authenticate with ECR using AWS IAM credentials which requires the AWS CLI or an SDK that can generate those credentials.

If you would like to make your registries publicly available then this solution can help. It deploys an API Gateway and a Lambda function that act as a proxy for AWS ECR. It is trivial to add a [custom authentication layer](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html) because this solution uses the API Gateway. Roll your own JWT-based authentication or whatever you desire. Additionally, you can configure the [API Gateway to be private](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-private-apis.html) and thus limit access to docker clients within your VPC.

![diagram](docs/aws-ecr-public.svg)

## Deploy

CloudFormation is used to deploy the solution.


## Develop

```
npm install --global cfn-include
make build
```
