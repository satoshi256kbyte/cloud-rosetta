import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * 必須タグを対象スコープ配下の全リソースに付与する（FR-019）。
 * Tags: Project=cloud-rosetta, Stage={stage}, ManagedBy=cdk
 */
export function applyTags(scope: Construct, stage: string): void {
  cdk.Tags.of(scope).add('Project', 'cloud-rosetta');
  cdk.Tags.of(scope).add('Stage', stage);
  cdk.Tags.of(scope).add('ManagedBy', 'cdk');
}
