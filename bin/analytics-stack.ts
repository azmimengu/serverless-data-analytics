import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {
  getConfig,
  getAppEnv
} from '../lib/config';
import { 
  DeliveryBucketStack,
  FunctionArtifactsBucketStack
} from '../lib/s3';
import { GlueStack } from '../lib/glue';
import { KinesisDataStreamStack } from '../lib/kinesis-data-stream';
import { KinesisDataFirehoseStack } from '../lib/kinesis-data-firehose';

const app = new cdk.App();
const appEnv = getAppEnv();
const conf = getConfig(app, appEnv);

const env = { account: conf.account, region: conf.region };

new DeliveryBucketStack(app, `DeliveryBucketStack-${appEnv}`, { env });
new FunctionArtifactsBucketStack(app, `FunctionArtifactsBucketStack`, { env });
new GlueStack(app, `GlueStack-${appEnv}`, { env });

new KinesisDataStreamStack(app, `KinesisDataStreamStack-${appEnv}`, { env });
new KinesisDataFirehoseStack(app, `KinesisDataFirehoseStack-${appEnv}`, { env });