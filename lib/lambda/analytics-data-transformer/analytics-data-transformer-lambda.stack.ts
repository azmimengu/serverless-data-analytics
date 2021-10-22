import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import { getAppEnv } from '../../config';

export class AnalyticsDataTransformerLambdaStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const appEnv = getAppEnv();
    const lambdaTag = process.env.ARTIFACT_TAG;

    if (!lambdaTag) {
      throw new Error('Must be supply lambda TAG variable to deploy function.');
    }

    const functionsBucket = s3.Bucket.fromBucketAttributes(this, 'FunctionArtifactsBucket', {
      bucketArn: cdk.Fn.importValue('FunctionArtifactsBucketArn'),
      bucketName: cdk.Fn.importValue('FunctionArtifactsBucketName')
    });

    const lambdaFunction = new lambda.Function(this, 'AnalyticsDataTransformerLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      architectures: [lambda.Architecture.ARM_64],
      code: lambda.Code.fromBucket(functionsBucket, `analytics-data-transformer/${lambdaTag}`),
      handler: 'index.handler',
      functionName: `analytics-data-transformer-${appEnv}-function`,
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
      description: `deployed at ${new Date()}`,
    });

    const lambdaVersion = new lambda.Version(this, 'LambdaVersion', {
      lambda: lambdaFunction,
    });
    (lambdaVersion.node.tryFindChild('Resource') as lambda.CfnVersion).cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    (lambdaVersion.node.tryFindChild('Resource') as lambda.CfnVersion).cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN;

    new cdk.CfnOutput(this, 'AnalyticsDataTransformerLambdaArn', {
      exportName: `AnalyticsDataTransformerLambdaArn-${appEnv}`,
      value: lambdaFunction.functionArn,
      description: `Analytics Data Transofmer ${appEnv} Function ARN`,
    });
  }

}
