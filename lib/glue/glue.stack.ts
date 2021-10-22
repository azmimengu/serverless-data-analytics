import * as cdk from '@aws-cdk/core';
import * as glue from '@aws-cdk/aws-glue';
import * as s3 from '@aws-cdk/aws-s3';
import {
  getAppEnv
} from '../config';

export class GlueStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appEnv = getAppEnv();
    const glueDatabaseName = `analytics_${appEnv}_database`;

    const glueDatabase = new glue.Database(this, 'GlueDatabase', {
      databaseName: glueDatabaseName
    });

    const dataSourceBucket = s3.Bucket.fromBucketAttributes(this, 'DeliveryBucket', {
      bucketArn: cdk.Fn.importValue(`DeliveryBucketArn-${appEnv}`),
      bucketName: cdk.Fn.importValue(`DeliveryBucketName-${appEnv}`)
    });

    const table = new glue.Table(this, 'ApplicationDataTable', {
      tableName: 'application_data',
      dataFormat: glue.DataFormat.PARQUET,
      database: glueDatabase,
      bucket: dataSourceBucket,
      s3Prefix: 'processed/',
      compressed: true,
      partitionKeys: [
        {
          name: 'year',
          type: glue.Schema.STRING
        },
        {
          name: 'month',
          type: glue.Schema.STRING
        },
        {
          name: 'day',
          type: glue.Schema.STRING
        },
        {
          name: 'hour',
          type: glue.Schema.STRING
        }
      ],
      columns: [
        {
          name: 'request_id',
          type: glue.Schema.STRING
        },
        {
          name: 'user_id',
          type: glue.Schema.STRING
        },
        {
          name: 'event_name',
          type: glue.Schema.STRING
        },
        {
          name: 'event_raw_data',
          type: glue.Schema.STRING
        },
      ],
    });

    new cdk.CfnOutput(this, 'GlueDatabaseName', {
      exportName: `GlueDatabaseName-${appEnv}`,
      value: glueDatabase.databaseName,
      description: `${appEnv} Glue Database Name`,
    });

    new cdk.CfnOutput(this, 'GlueDatabaseArn', {
      exportName: `GlueDatabaseArn-${appEnv}`,
      value: glueDatabase.databaseArn,
      description: `${appEnv} Glue Database ARN`,
    });

    new cdk.CfnOutput(this, 'GlueTableName', {
      exportName: `GlueTableName-${appEnv}`,
      value: table.tableName,
      description: `${appEnv} Glue Table Name`,
    });

    new cdk.CfnOutput(this, 'GlueTableArn', {
      exportName: `GlueTableArn-${appEnv}`,
      value: table.tableArn,
      description: `${appEnv} Glue Table ARN`,
    });

  }
}
