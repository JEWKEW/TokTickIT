import { expect, Page } from "@playwright/test";

export async function expectNoClippedOrOverlappingControls(page: Page) {
  const layoutIssues = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const controls = Array.from(document.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )).filter((element) => {
      const style = getComputedStyle(element);
      return element.getClientRects().length > 0 && style.visibility !== "hidden" && style.display !== "none";
    });
    const clipped = controls
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > viewportWidth + 1;
      })
      .map((element) => element.getAttribute("aria-label") || element.textContent?.trim() || element.tagName);
    const overlapping: string[] = [];
    for (let i = 0; i < controls.length; i += 1) {
      const first = controls[i];
      const a = first.getBoundingClientRect();
      for (let j = i + 1; j < controls.length; j += 1) {
        const second = controls[j];
        if (first.contains(second) || second.contains(first)) continue;
        const b = second.getBoundingClientRect();
        const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (width > 2 && height > 2) {
          overlapping.push(`${first.tagName}:${first.textContent?.trim()} / ${second.tagName}:${second.textContent?.trim()}`);
        }
      }
    }
    return { clipped, overlapping };
  });
  expect(layoutIssues, JSON.stringify(layoutIssues)).toEqual({ clipped: [], overlapping: [] });
}
