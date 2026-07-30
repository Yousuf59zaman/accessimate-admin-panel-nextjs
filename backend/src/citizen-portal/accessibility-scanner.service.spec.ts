import { BadRequestException } from "@nestjs/common";
import { AccessibilityScannerService } from "./accessibility-scanner.service";

describe("AccessibilityScannerService", () => {
  const scanner = new AccessibilityScannerService();

  it("reports structural, image, control, form, and navigation defects", () => {
    const result = scanner.analyzeHtml(`
      <html>
        <head></head>
        <body>
          <img src="hero.jpg">
          <button></button>
          <a href="/next"></a>
          <input id="email" type="email">
        </body>
      </html>
    `);

    expect(result.summary.errors).toBeGreaterThanOrEqual(4);
    expect(result.summary.warnings).toBeGreaterThanOrEqual(2);
    expect(result.results.images.issues).toHaveLength(1);
    expect(result.results.forms.issues).toHaveLength(1);
    expect(result.results.clickables.issues).toHaveLength(2);
  });

  it("accepts a well-labelled accessible document without errors", () => {
    const result = scanner.analyzeHtml(`
      <!doctype html>
      <html lang="en">
        <head>
          <title>Accessible test page</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <a href="#main" class="skip-link">Skip to main content</a>
          <main id="main">
            <h1>Account</h1>
            <img src="profile.jpg" alt="Profile portrait">
            <button aria-label="Save profile"></button>
            <label for="email">Email</label>
            <input id="email" type="email">
          </main>
        </body>
      </html>
    `);

    expect(result.summary.errors).toBe(0);
    expect(result.results.images.issues).toHaveLength(0);
    expect(result.results.forms.issues).toHaveLength(0);
  });

  it.each([
    "http://localhost",
    "http://127.0.0.1",
    "http://10.0.0.5",
    "http://[::1]",
  ])("blocks private-network scan targets: %s", async (url) => {
    await expect(scanner.scan(url, { fullSite: false })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
