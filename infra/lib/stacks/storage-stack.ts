import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface StorageStackProps extends cdk.StackProps {
  /** 環境ステージ名（dev / stg / prod） */
  stage: string;
}

export class StorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, {
      ...props,
      stackName: `cloud-rosetta-${props.stage}-stack-storage`,
    });

    // Phase 4 (User Story 2) で S3 バケットと DynamoDB テーブルを追加する
  }
}
