import * as cdk from '@aws-cdk/core';
import * as firehose from '@aws-cdk/aws-kinesisfirehose';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import {
  getAppEnv,
  getConfig
} from '../config';

export class KinesisDataFirehoseStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  
    const appEnv = getAppEnv();
    const conf = getConfig(this, appEnv);

    const destinationErrorLogGroup = new logs.LogGroup(this, 'ErrorLogGroup', {
      logGroupName: `/aws/kinesisfirehose/application-${appEnv}-firehose`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const firehoseRole = new iam.Role(this, 'DataFirehoseKinesisRole', {
      roleName: `DataFirehoseKinesisRole-${appEnv}`,
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com')
    });

    const s3DestinationPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3:AbortMultipartUpload",
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:PutObject"
      ],
      resources: [
        cdk.Fn.importValue(`DeliveryBucketArn-${appEnv}`),
        `${cdk.Fn.importValue(`DeliveryBucketArn-${appEnv}`)}/*`,
      ]
    });

    const sourceKinesisPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "kinesis:DescribeStream",
        "kinesis:DescribeStreamSummary",
        "kinesis:GetRecords",
        "kinesis:GetShardIterator",
        "kinesis:ListShards",
        "kinesis:SubscribeToShard"
      ],
      resources: [
        cdk.Fn.importValue(`KinesisDataStreamArn-${appEnv}`)
      ]
    });

    const firehoseLogPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "logs:PutLogEvents"
      ],
      resources: [
        destinationErrorLogGroup.logGroupArn,
      ]
    });

    const gluePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "glue:GetTableVersions"
      ],
      resources: [
        "*"
      ]
    });

    const lambdaPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "lambda:InvokeFunction",
        "lambda:GetFunctionConfiguration"
      ],
      resources: [
        "*"
      ]
    });

    firehoseRole.addToPolicy(s3DestinationPolicy);
    firehoseRole.addToPolicy(sourceKinesisPolicy);
    firehoseRole.addToPolicy(firehoseLogPolicy);
    firehoseRole.addToPolicy(gluePolicy);
    firehoseRole.addToPolicy(lambdaPolicy);

    const deliveryStream = new firehose.CfnDeliveryStream(this, 'DataFirehose', {
      deliveryStreamType: 'KinesisStreamAsSource',
      deliveryStreamName: `application-${appEnv}-firehose`,
      kinesisStreamSourceConfiguration: {
        roleArn: firehoseRole.roleArn,
        kinesisStreamArn: cdk.Fn.importValue(`KinesisDataStreamArn-${appEnv}`)
      },
      extendedS3DestinationConfiguration: {
        roleArn: firehoseRole.roleArn,
        bucketArn: cdk.Fn.importValue(`DeliveryBucketArn-${appEnv}`),
        s3BackupMode: 'Enabled',
        bufferingHints: {
          intervalInSeconds: 300,
          sizeInMBs: 128
        },
        processingConfiguration: {
          enabled: false, //switch true to enable data transformer lambda function.
          processors: [{
            type: 'Lambda',
            parameters: [
              { parameterName: 'BufferIntervalInSeconds', parameterValue: '60' },
              { parameterName: 'BufferSizeInMBs', parameterValue: '3' },
              { parameterName: 'LambdaArn', parameterValue: cdk.Fn.importValue(`AnalyticsDataTransformerLambdaArn-${appEnv}`) },
              { parameterName: 'RoleArn', parameterValue: firehoseRole.roleArn }
            ]
          }]
        },
        dataFormatConversionConfiguration: {
          enabled: true,
          schemaConfiguration: {
            region: conf.region,
            catalogId: conf.account,
            databaseName: cdk.Fn.importValue(`GlueDatabaseName-${appEnv}`),
            tableName: cdk.Fn.importValue(`GlueTableName-${appEnv}`),
            roleArn: firehoseRole.roleArn,
          },
          inputFormatConfiguration: {
            deserializer: {
              openXJsonSerDe: {
                convertDotsInJsonKeysToUnderscores: false,
                caseInsensitive: true
              }
            }
          },
          outputFormatConfiguration: {
            serializer: {
              parquetSerDe: {
                compression: "SNAPPY"
              }
            }
          }
        },
        prefix: 'processed/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/',
        errorOutputPrefix: 'error/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/',
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: destinationErrorLogGroup.logGroupName,
          logStreamName: 'error-logs',
        },
        s3BackupConfiguration: {
          roleArn: firehoseRole.roleArn,
          bucketArn: cdk.Fn.importValue(`DeliveryBucketArn-${appEnv}`),
          prefix: 'raw-data/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/',
          //@errorOutputPrefix - this is useless but because of a bug of a from aws side, we need to put this config to here also. 
          errorOutputPrefix: 'error/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/',
          compressionFormat: 'GZIP',
        },
      },
    });
    deliveryStream.node.addDependency(firehoseRole);
  }
}