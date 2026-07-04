import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { applyTags } from '../utils/tagging';

export class DevStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const stage = 'dev';

    // 将来ここに StorageStack 等を追加する
    // new StorageStack(this, 'StorageStack', { stage });

    // 必須タグを全リソースに付与
    applyTags(this, stage);
  }
}
