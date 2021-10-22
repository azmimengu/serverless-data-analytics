import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import { getAppEnv } from '../config';

export class DeliveryBucketStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appEnv = getAppEnv();

    const bucket = new s3.Bucket(this, 'DeliveryBucket', {
      bucketName: `${appEnv}-delivery-bucket`
    });

    new cdk.CfnOutput(this, 'DeliveryBucketArn', {
      exportName: `DeliveryBucketArn-${appEnv}`,
      value: bucket.bucketArn,
      description: `Delivery Bucket ARN`,
    });

    new cdk.CfnOutput(this, 'DeliveryBucketName', {
      exportName: `DeliveryBucketName-${appEnv}`,
      value: bucket.bucketName,
      description: `Delivery Bucket Name`,
    });
    
  }
}