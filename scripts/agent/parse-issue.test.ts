import { describe, it, expect } from 'vitest';
import { parseIssueBody } from './parse-issue.js';

describe('parseIssueBody', () => {
  const validBody = `### テーマID

serverless-compute

### 比較軸ID

cold-start

### 比較対象プロバイダー

- [X] AWS
- [X] GCP
- [ ] Azure
- [X] Cloudflare

### 提案理由

テスト用の比較テーマです。`;

  it('正常な Issue 本文からパラメータを抽出できる', () => {
    const result = parseIssueBody(validBody, 42);
    expect(result).toEqual({
      themeId: 'serverless-compute',
      axisId: 'cold-start',
      providers: ['AWS', 'GCP', 'Cloudflare'],
      issueNumber: 42,
    });
  });

  it('チェックされたプロバイダーのみ抽出する', () => {
    const result = parseIssueBody(validBody, 1);
    expect(result.providers).not.toContain('Azure');
    expect(result.providers).toHaveLength(3);
  });

  it('テーマIDが未入力の場合エラーを投げる', () => {
    const body = `### テーマID

### 比較軸ID

cold-start

### 比較対象プロバイダー

- [X] AWS
- [X] GCP`;

    expect(() => parseIssueBody(body, 1)).toThrow('テーマID が未入力です');
  });

  it('テーマIDのフォーマットが不正な場合エラーを投げる', () => {
    const body = `### テーマID

INVALID_ID

### 比較軸ID

cold-start

### 比較対象プロバイダー

- [X] AWS
- [X] GCP`;

    expect(() => parseIssueBody(body, 1)).toThrow('不正なフォーマット');
  });

  it('比較軸IDが未入力の場合エラーを投げる', () => {
    const body = `### テーマID

serverless-compute

### 比較軸ID

### 比較対象プロバイダー

- [X] AWS
- [X] GCP`;

    expect(() => parseIssueBody(body, 1)).toThrow('比較軸ID が未入力です');
  });

  it('プロバイダーが1件以下の場合エラーを投げる', () => {
    const body = `### テーマID

serverless-compute

### 比較軸ID

cold-start

### 比較対象プロバイダー

- [X] AWS
- [ ] GCP`;

    expect(() => parseIssueBody(body, 1)).toThrow('最低2件必要');
  });

  it('プロバイダーが0件の場合エラーを投げる', () => {
    const body = `### テーマID

serverless-compute

### 比較軸ID

cold-start

### 比較対象プロバイダー

- [ ] AWS
- [ ] GCP`;

    expect(() => parseIssueBody(body, 1)).toThrow('最低2件必要');
  });

  it('テーマIDが1文字の場合エラーを投げる（最低2文字）', () => {
    const body = `### テーマID

a

### 比較軸ID

cold-start

### 比較対象プロバイダー

- [X] AWS
- [X] GCP`;

    expect(() => parseIssueBody(body, 1)).toThrow('不正なフォーマット');
  });

  it('小文字チェックボックスも認識する', () => {
    const body = `### テーマID

serverless-compute

### 比較軸ID

cold-start

### 比較対象プロバイダー

- [x] AWS
- [x] GCP`;

    const result = parseIssueBody(body, 10);
    expect(result.providers).toEqual(['AWS', 'GCP']);
  });

  it('複数のバリデーションエラーをまとめて報告する', () => {
    const body = `### テーマID

### 比較軸ID

### 比較対象プロバイダー

- [ ] AWS`;

    expect(() => parseIssueBody(body, 1)).toThrow('テーマID が未入力');
  });
});
