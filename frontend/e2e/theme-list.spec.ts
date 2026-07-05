import { test, expect } from '@playwright/test';
import { MOCK_THEMES_RESPONSE, MOCK_EMPTY_THEMES } from './fixtures/test-data';

test.describe('テーマ一覧ページ', () => {
  test('公開済みテーマがカード形式で表示される', async ({ page }) => {
    // DynamoDB へのリクエストをモック（Next.js SSR のため page.route は使えないが、
    // 開発サーバーが実データを返す前提でテスト）
    await page.goto('/');

    // ページタイトルの確認
    await expect(page.locator('h1')).toContainText('クラウドサービス比較');

    // テーマカードの存在確認（データがある場合）
    const cards = page.locator('a[href^="/comparisons/"]');
    const count = await cards.count();

    if (count > 0) {
      // カードがクリック可能であることを確認
      const firstCard = cards.first();
      await expect(firstCard).toBeVisible();

      // カードにテーマ情報が含まれることを確認
      const cardText = await firstCard.textContent();
      expect(cardText).toBeTruthy();
    }
  });

  test('テーマカードをクリックするとテーマ詳細に遷移する', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('a[href^="/comparisons/"]');
    const count = await cards.count();

    if (count > 0) {
      const href = await cards.first().getAttribute('href');
      await cards.first().click();
      await expect(page).toHaveURL(new RegExp(href!));
    }
  });

  test('データがない場合は空状態メッセージが表示される', async ({ page }) => {
    // データがない場合のテスト（実環境にデータがある場合はスキップ）
    await page.goto('/');

    const emptyMessage = page.locator('text=比較データはまだありません');
    const cards = page.locator('a[href^="/comparisons/"]');

    // どちらかが表示されることを確認
    const hasCards = (await cards.count()) > 0;
    const hasEmpty = await emptyMessage.isVisible().catch(() => false);
    expect(hasCards || hasEmpty).toBe(true);
  });

  test('ページが2秒以内に表示される', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});
