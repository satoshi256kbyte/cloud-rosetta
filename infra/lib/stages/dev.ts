import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StorageStack } from '../stacks/storage-stack';
import { applyTags } from '../utils/tagging';

export class DevStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const stage = 'dev';

    new StorageStack(this, 'StorageStack', { stage });

    // 必須タグを全リソースに付与
    applyTags(this, stage);
  }
}
