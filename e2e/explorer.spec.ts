import { expect, test } from '@playwright/test';

test('selection and time controls form a usable exploration loop', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: '从这里，望向宇宙。' }),
  ).toBeVisible();
  await expect(page.locator('.scene-container canvas')).toBeVisible();
  await expect(page.getByText('正在计算太阳系位置…')).not.toBeVisible();
  await expect(page.getByText('三维场景暂不可用')).not.toBeVisible();
  await page.getByRole('button', { name: /06.*火星/ }).click();
  await expect(
    page.getByRole('heading', { name: '火星', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '暂停时间' }).click();
  await expect(page.getByText('模拟暂停', { exact: true })).toBeVisible();
  await page.getByRole('combobox').selectOption('-86400');
  await page.getByRole('button', { name: '播放模拟时间' }).click();
  await expect(page.getByText('模拟播放', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '回到现在' }).click();
  await expect(page.getByText('实时', { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveValue('1');
  expect(errors).toEqual([]);
});

test('mobile layout keeps essential controls reachable', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await expect(
    page.getByRole('navigation', { name: '天体选择' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: '回到现在' })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(360);
});

test('surface previews reuse the canvas while switching detailed bodies', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.getByText('正在加载表面细节…')).not.toBeVisible();
  await expect(page.locator('.planet-preview canvas')).toBeVisible();
  for (const name of [/08.*土星/, /05.*月亮/, /01.*太阳/, /04.*地球/]) {
    await page.getByRole('button', { name }).click();
    await expect(
      page.getByText('表面贴图预览 · 非实时影像', { exact: true }),
    ).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(2);
  }
  expect(errors).toEqual([]);
});

test('failed texture keeps the scene usable and can be retried', async ({
  page,
}) => {
  await page.route('**/textures/earth.webp', (route) =>
    route.fulfill({ status: 503, body: 'unavailable' }),
  );
  await page.goto('/');
  const retry = page.getByRole('button', { name: '贴图加载失败，点击重试' });
  await expect(retry).toBeVisible();
  await expect(page.locator('.scene-container canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: '回到现在' })).toBeVisible();
  await page.unroute('**/textures/earth.webp');
  await retry.click();
  await expect(
    page.getByText('表面贴图预览 · 非实时影像', { exact: true }),
  ).toBeVisible();
  await expect(retry).not.toBeVisible();
});
