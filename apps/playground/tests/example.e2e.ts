import { expect, test } from "@playwright/test";

import { testId } from "../coverage.ts";

test("counter increments and resets", async ({ page }) => {
  await page.goto("/");

  const incrementButton = page.getByTestId(testId.counter.buttonIncrement);
  const resetButton = page.getByTestId(testId.counter.buttonReset);

  await incrementButton.click();
  await incrementButton.click();
  await incrementButton.click();
  await expect(page.getByText("Count: 3")).toBeVisible();

  await resetButton.click();
  await expect(page.getByText("Count: 0")).toBeVisible();
});
