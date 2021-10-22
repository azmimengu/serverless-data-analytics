import * as cdk from '@aws-cdk/core';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as s3 from '@aws-cdk/aws-s3';

export class AnalyticsDataTransformerLambdaCodebuildStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketAttributes(this, 'FunctionArtifactsBucket', {
      bucketArn: cdk.Fn.importValue('FunctionArtifactsBucketArn'),
      bucketName: cdk.Fn.importValue('FunctionArtifactsBucketName')
    });

    const project = new codebuild.Project(this, 'AnalyticsDataTransformerLambdaCodebuildProject', {
      projectName: 'analytics-data-transformer-lambda',
      source: codebuild.Source.gitHub({
        owner: 'azmimengu',
        repo: 'serverless-data-analytics',
        branchOrRef: 'main',
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo "Changing working directory"',
              'cd lib/lambda/analytics-data-transformer/src',
              'echo "Installing package dependencies..."',
              'npm install'
            ]
          },
          build: {
            commands: [
              'echo "Build started"',
              'npm run build',
              'cp -R node_modules/ build/'
            ],
          },
        },
        artifacts: {
          'base-directory': 'lib/lambda/analytics-data-transformer/src/build',
          files: [
            '**/*'
          ],
          name: '$LAMBDA_VERSION'
        }
      }),
      artifacts: codebuild.Artifacts.s3({
        bucket,
        includeBuildId: false,
        packageZip: true,
        path: 'analytics-data-transformer',
      }),
    });

  }
}