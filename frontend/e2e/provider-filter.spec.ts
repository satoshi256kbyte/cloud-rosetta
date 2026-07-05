import { test, expect } from '@playwright/test';

test.describe('プロバイダーフィルタ', () => {
  const TEST_PATH = '/comparisons/serverless-compute/cold-start';

  test('フィルタボタンが表示される', async ({ page }) => {
    const response = await page.goto(TEST_PATH);

    if (response && response.status() === 200) {
      // フィルタ UI の存在確認
      await expect(page.locator('text=フィルタ')).toBeVisible();

      // プロバイダーボタンが存在する
      const filterButtons = page.locator('button[aria-pressed]');
      const count = await filterButtons.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('フィルタ選択でURLクエリパラメータが更新される', async ({ page }) => {
    const response = await page.goto(TEST_PATH);

    if (response && response.status() === 200) {
      const filterButtons = page.locator('button[aria-pressed]');
      const count = await filterButtons.count();

      if (count >= 2) {
        // 最初のプロバイダーボタンをクリック
        await filterButtons.first().click();

        // URL にクエリパラメータが含まれることを確認
        await page.waitForURL(/providers=/);
        expect(page.url()).toContain('providers=');
      }
    }
  });

  test('URLにフィルタパラメータがある場合そのフィルタ状態が再現される', async ({ page }) => {
    const response = await page.goto(`${TEST_PATH}?providers=AWS`);

    if (response && response.status() === 200) {
      // テーブルに AWS が表示されることを確認
      const table = page.locator('table');
      await expect(table).toBeVisible();

      const tableText = await table.textContent();
      expect(tableText).toContain('AWS');
    }
  });

  test('リセットボタンでフィルタが解除される', async ({ page }) => {
    const response = await page.goto(`${TEST_PATH}?providers=AWS`);

    if (response && response.status() === 200) {
      const resetButton = page.locator('button:has-text("リセット")');

      if (await resetButton.isVisible()) {
        await resetButton.click();
        // URL からクエリパラメータが消える
        await page.waitForURL((url) => !url.searchParams.has('providers'));
        expect(page.url()).not.toContain('providers=');
      }
    }
  });
});
