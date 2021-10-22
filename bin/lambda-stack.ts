import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {
  getConfig,
  getAppEnv
} from '../lib/config';
import { 
  AthenaTableSchedulerLambdaStack,
  AnalyticsDataTransformerLambdaStack
} from '../lib/lambda';

const app = new cdk.App();
const appEnv = getAppEnv();
const conf = getConfig(app, appEnv);

const env = { account: conf.account, region: conf.region };

new AthenaTableSchedulerLambdaStack(app, `AthenaTableSchedulerLambdaStack-${appEnv}`, { env });
new AnalyticsDataTransformerLambdaStack(app, `AnalyticsDataTransformerLambdaStack-${appEnv}`, { env });
