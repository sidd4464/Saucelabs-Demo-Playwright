import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

const SAUCE_URL = 'https://www.saucedemo.com/';
const DEFAULT_USER = process.env.SAUCE_USERNAME || 'standard_user';
const DEFAULT_PASS = process.env.SAUCE_PASSWORD || 'secret_sauce';

function pickRandomIndices(len: number, n: number) {
  const indices = new Set<number>();
  while (indices.size < n) {
    indices.add(Math.floor(Math.random() * len));
  }
  return Array.from(indices);
}

test.describe('SauceDemo checkout flow — select 3 random items and complete checkout', () => {
  test('happy path: add 3 random items and finish order', async ({ page }) => {
    await page.goto(SAUCE_URL);
    await expect(page).toHaveURL(SAUCE_URL);
    await page.waitForTimeout(1000);
    await page.locator('#user-name').fill(DEFAULT_USER);
    await page.waitForTimeout(1000);
    await page.locator('#password').fill(DEFAULT_PASS)
    await page.waitForTimeout(1000);
    await page.locator('#login-button').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.inventory_list')).toBeVisible();
    await page.waitForTimeout(1000);
    
    const items = page.locator('.inventory_item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const pick = pickRandomIndices(count, 3);

    const selectedNames: string[] = [];

    for (const idx of pick) {
      const item = items.nth(idx);
      const name = await item.locator('.inventory_item_name').innerText();
      selectedNames.push(name);
      const btn = item.locator('button:has-text("Add to cart")');
      await expect(btn).toBeVisible();
      await page.waitForTimeout(1000);
      await btn.click();
      await page.waitForTimeout(1000);
      await expect(item.locator('button:has-text("Remove")')).toBeVisible();
    }

    await page.locator('.shopping_cart_link').click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/.*cart.html/);
    await page.waitForTimeout(1000);

    const cartItems = page.locator('.cart_item');
    await expect(cartItems).toHaveCount(3);

    const cartNames = await cartItems.locator('.inventory_item_name').allTextContents();
    for (const name of selectedNames) {
      expect(cartNames).toContain(name);
    }

    await page.locator('#checkout').click();
    await page.waitForTimeout(1000);

    await page.locator('#first-name').fill('Saurav');
    await page.waitForTimeout(1000);
    await page.locator('#last-name').fill('Test');
    await page.waitForTimeout(1000);
    await page.locator('#postal-code').fill('400001')
    await page.waitForTimeout(1000);
    await page.locator('#continue').click();

    const overviewItems = page.locator('.cart_item');
    await expect(overviewItems).toHaveCount(3);

    const overviewNames = await overviewItems.locator('.inventory_item_name').allTextContents();
    for (const name of selectedNames) {
      expect(overviewNames).toContain(name);
    }

    await page.locator('#finish').click();
    await expect(page).toHaveURL(/.*checkout-complete.html/);

    const thankYou = await page.locator('.complete-header').innerText();
    expect(thankYou).toMatch(/thank you for your order/i);
  });
});
