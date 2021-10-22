# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

### S3 Function Artifacts Bucket Deployment
cdk synth --app "npx ts-node bin/analytics-stack.ts" FunctionArtifactsBucketStack
cdk deploy --app "npx ts-node bin/analytics-stack.ts" FunctionArtifactsBucketStack

### S3 Delivery Bucket Deployment
cdk synth --app "npx ts-node bin/analytics-stack.ts" DeliveryBucketStack-dev
cdk deploy --app "npx ts-node bin/analytics-stack.ts" DeliveryBucketStack-dev

### Glue Deployment
cdk synth --app "npx ts-node bin/analytics-stack.ts" GlueStack-dev
cdk deploy --app "npx ts-node bin/analytics-stack.ts" GlueStack-dev

### Kinesis Data Stream Deployment
cdk synth --app "npx ts-node bin/analytics-stack.ts" KinesisDataStreamStack-dev
cdk deploy --app "npx ts-node bin/analytics-stack.ts" KinesisDataStreamStack-dev

### Kinesis Data Firehose Deployment
cdk synth --app "npx ts-node bin/analytics-stack.ts" KinesisDataFirehoseStack-dev
cdk deploy --app "npx ts-node bin/analytics-stack.ts" KinesisDataFirehoseStack-dev

### Athena Table Scheduler Lambda Codebuild Deployment
cdk synth --app "npx ts-node bin/codebuild-stack.ts" AthenaTableSchedulerLambdaCodebuildStack
cdk deploy --app "npx ts-node bin/codebuild-stack.ts" AthenaTableSchedulerLambdaCodebuildStack

### Start Lambda Build via Codebuild
aws codebuild start-build --project-name athena-table-scheduler-lambda --environment-variables-override "[{\"name\":\"LAMBDA_VERSION\",\"value\":\"1.0.0\"}]"
### Athena Table Scheduler Lambda Function Deployment
TAG=1.0.0 cdk synth --app "npx ts-node bin/lambda-stack.ts" AthenaTableSchedulerLambdaStack-dev
TAG=1.0.0 cdk deploy --app "npx ts-node bin/lambda-stack.ts" AthenaTableSchedulerLambdaStack-dev
