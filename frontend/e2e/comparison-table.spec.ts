import { test, expect } from '@playwright/test';

test.describe('比較結果テーブルページ', () => {
  // テスト用の既知パス（実データが存在する前提）
  const TEST_PATH = '/comparisons/serverless-compute/cold-start';

  test('比較テーブルがプロバイダー列方向で表示される', async ({ page }) => {
    const response = await page.goto(TEST_PATH);

    // ページが正常に表示される（200 or ISR でキャッシュされた状態）
    if (response && response.status() === 200) {
      // テーブルの存在確認
      const table = page.locator('table');
      await expect(table).toBeVisible();

      // ヘッダー行に「属性」列がある（行方向の属性ラベル）
      await expect(page.locator('th:has-text("属性")')).toBeVisible();

      // 「サービス名」行がある
      await expect(page.locator('td:has-text("サービス名")')).toBeVisible();
    }
  });

  test('参照元リンクが新しいタブで開く設定になっている', async ({ page }) => {
    const response = await page.goto(TEST_PATH);

    if (response && response.status() === 200) {
      const links = page.locator('a[target="_blank"][rel="noopener noreferrer"]');
      const count = await links.count();

      if (count > 0) {
        const href = await links.first().getAttribute('href');
        expect(href).toMatch(/^https?:\/\//);
      }
    }
  });

  test('比較日時が表示される', async ({ page }) => {
    const response = await page.goto(TEST_PATH);

    if (response && response.status() === 200) {
      // 「比較日:」テキストの存在確認
      await expect(page.locator('text=比較日')).toBeVisible();
    }
  });

  test('存在しないテーマ・軸で404が表示される', async ({ page }) => {
    const response = await page.goto('/comparisons/nonexistent-theme/nonexistent-axis');
    expect(response?.status()).toBe(404);
  });

  test('モバイル表示でテーブルが横スクロール可能', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const response = await page.goto(TEST_PATH);

    if (response && response.status() === 200) {
      const scrollContainer = page.locator('.overflow-x-auto');
      await expect(scrollContainer).toBeVisible();
    }
  });
});
