import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as iam from '@aws-cdk/aws-iam';
import * as events from '@aws-cdk/aws-events';
import * as eventsTargets from '@aws-cdk/aws-events-targets';
import { getAppEnv } from '../../config';

export class AthenaTableSchedulerLambdaStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const appEnv = getAppEnv();
    const lambdaTag = process.env.TAG;

    if (!lambdaTag) {
      throw new Error('Must be supply lambda TAG variable to deploy function.');
    }

    const functionsBucket = s3.Bucket.fromBucketAttributes(this, 'FunctionArtifactsBucket', {
      bucketArn: cdk.Fn.importValue('FunctionArtifactsBucketArn'),
      bucketName: cdk.Fn.importValue('FunctionArtifactsBucketName')
    });

    const lambdaFunction = new lambda.Function(this, 'AthenaTableScheduledLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      architectures: [lambda.Architecture.ARM_64],
      code: lambda.Code.fromBucket(functionsBucket, `athena-table-scheduler/${lambdaTag}`),
      handler: 'index.handler',
      functionName: `athena-table-scheduled-${appEnv}-function`,
      environment: {
          APP_ENV: appEnv,
          ATHENA_CATALOG_NAME: 'AwsDataCatalog',
          ATHENA_DATABASE_NAME: cdk.Fn.importValue(`GlueDatabaseName-${appEnv}`),
          ATHENA_TABLE_NAME: cdk.Fn.importValue(`GlueTableName-${appEnv}`),
          ATHENA_QUERY_RESULTS_LOCATION: 's3://athena-query-results-devnot/',
      },
      currentVersionOptions: {
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      },
      description: `deployed at ${new Date()}`,
    });

    new events.Rule(this, 'AthenaTableScheduledLambdaScheduledEventsRule', {
      ruleName: `athena-table-${appEnv}-scheduler-rule`,
      description: `athena table scheduled ${appEnv} events rule.`, 
      schedule: events.Schedule.cron({ minute: '0' }),
      targets: [new eventsTargets.LambdaFunction(lambdaFunction)],
    });

    const lambdaVersion = new lambda.Version(this, 'LambdaVersion', {
      lambda: lambdaFunction,
    });
    (lambdaVersion.node.tryFindChild('Resource') as lambda.CfnVersion).cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.RETAIN;
    (lambdaVersion.node.tryFindChild('Resource') as lambda.CfnVersion).cfnOptions.updateReplacePolicy = cdk.CfnDeletionPolicy.RETAIN;

    lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "secretsmanager:GetSecretValue",
        "athena:StartQueryExecution",
        "athena:GetQueryResults",
        "athena:GetWorkGroup",
        "athena:StopQueryExecution",
        "athena:GetQueryExecution",
        "s3:ListMultipartUploadParts",
        "s3:PutObject",
        "s3:GetObject",
        "s3:AbortMultipartUpload",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "glue:*",
      ],
      resources: ['*']
    }));

  }

}