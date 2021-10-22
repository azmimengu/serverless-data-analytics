import * as cdk from '@aws-cdk/core';
import * as kinesis from '@aws-cdk/aws-kinesis';
import {
  getAppEnv
} from '../config';

export class KinesisDataStreamStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appEnv = getAppEnv();

    const stream = new kinesis.Stream(this, 'KinesisDataStream', {
      streamName: `${appEnv}-kinesis-data-stream`,
      shardCount: 1,
      retentionPeriod: cdk.Duration.days(1),
    });

    new cdk.CfnOutput(this, 'KinesisDataStreamArn', {
      exportName: `KinesisDataStreamArn-${appEnv}`,
      value: stream.streamArn,
      description: `${appEnv} Kinesis Data Stream ARN`,
    });

    new cdk.CfnOutput(this, 'KinesisDataStreamName', {
      exportName: `KinesisDataStreamName-${appEnv}`,
      value: stream.streamName,
      description: `${appEnv} Kinesis Data Stream Name`,
    });

  }
}
