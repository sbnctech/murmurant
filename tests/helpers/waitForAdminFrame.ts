import { Page, Frame } from "@playwright/test";

/**
 * Waits for the admin iframe to load and returns the iframe's Frame object.
 *
 * This helper:
 * 1. Waits for iframe#admin-frame to appear
 * 2. Waits for the iframe's content to finish loading
 * 3. Waits for data-test-id="admin-root" to be present inside the iframe
 */
export async function waitForAdminFrame(page: Page): Promise<Frame> {
  const iframeElement = await page.waitForSelector("iframe#admin-frame");
  const frame = await iframeElement.contentFrame();

  if (!frame) {
    throw new Error("Admin iframe was found but no frame content is available.");
  }

  // Wait for the admin root element inside the iframe
  await frame.waitForSelector('[data-test-id="admin-root"]');

  return frame;
}
