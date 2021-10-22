import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {
  getConfig,
  getAppEnv
} from '../lib/config';
import { 
  AthenaTableSchedulerLambdaCodebuildStack,
  AnalyticsDataTransformerLambdaCodebuildStack
} from '../lib/lambda';

const app = new cdk.App();
const appEnv = getAppEnv();
const conf = getConfig(app, appEnv);

const env = { account: conf.account, region: conf.region };

new AthenaTableSchedulerLambdaCodebuildStack(app, 'AthenaTableSchedulerLambdaCodebuildStack', { env });
new AnalyticsDataTransformerLambdaCodebuildStack(app, 'AnalyticsDataTransformerLambdaCodebuildStack', { env });
