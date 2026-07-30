import { Controller, Get, Query, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { Public } from "../common/decorators/public.decorator";

const widgetScript = String.raw`(() => {
  if (window.__accessimateWidgetLoaded) return;
  window.__accessimateWidgetLoaded = true;

  const current = document.currentScript;
  const account = current && current.dataset ? current.dataset.account : '';
  const root = document.createElement('div');
  root.id = 'accessimate-widget';
  root.innerHTML = '<button class="am-trigger" type="button" aria-expanded="false" aria-controls="am-panel" aria-label="Open accessibility tools">◐</button>' +
    '<section class="am-panel" id="am-panel" aria-label="Accessibility tools" hidden>' +
    '<header><strong>Accessibility tools</strong><button class="am-close" type="button" aria-label="Close accessibility tools">×</button></header>' +
    '<div class="am-grid"><button type="button" data-action="increase">A+<small>Increase text</small></button>' +
    '<button type="button" data-action="decrease">A−<small>Decrease text</small></button>' +
    '<button type="button" data-action="contrast">◑<small>High contrast</small></button>' +
    '<button type="button" data-action="links">⌁<small>Highlight links</small></button></div>' +
    '<button class="am-reset" type="button" data-action="reset">Reset all settings</button>' +
    '<p class="am-status" aria-live="polite"></p></section>';

  const style = document.createElement('style');
  style.textContent = '#accessimate-widget{all:initial;position:fixed;right:20px;bottom:20px;z-index:2147483647;font-family:Inter,Arial,sans-serif;color:#102236}' +
    '#accessimate-widget *{box-sizing:border-box}' +
    '#accessimate-widget button{font:inherit}' +
    '.am-trigger{width:56px;height:56px;border:0;border-radius:50%;background:#087d78;color:#fff;font-size:28px;cursor:pointer;box-shadow:0 12px 32px rgba(7,38,53,.28)}' +
    '.am-trigger:focus-visible,.am-panel button:focus-visible{outline:3px solid #f7ba2a;outline-offset:3px}' +
    '.am-panel{position:absolute;right:0;bottom:68px;width:min(330px,calc(100vw - 32px));padding:18px;background:#fff;border:1px solid #dbe5e8;border-radius:16px;box-shadow:0 20px 50px rgba(7,38,53,.25)}' +
    '.am-panel header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;font-size:17px}.am-close{border:0;background:transparent;font-size:25px;cursor:pointer;color:#425b67}' +
    '.am-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.am-grid button,.am-reset{border:1px solid #cbdadd;border-radius:10px;background:#f7fbfb;color:#102236;padding:13px 10px;cursor:pointer;font-weight:700}' +
    '.am-grid small{display:block;margin-top:5px;font-size:11px;font-weight:500}.am-grid button[aria-pressed="true"]{background:#087d78;color:#fff;border-color:#087d78}' +
    '.am-reset{width:100%;margin-top:10px;background:#fff}.am-status{min-height:16px;margin:10px 0 0;font-size:12px;color:#48626d}' +
    'html.am-high-contrast{filter:contrast(1.4) saturate(.9)}html.am-highlight-links a{outline:3px solid #f2b705!important;background:#fff4a3!important;color:#111!important;text-decoration:underline!important}';
  document.head.appendChild(style);
  document.body.appendChild(root);

  const trigger = root.querySelector('.am-trigger');
  const panel = root.querySelector('.am-panel');
  const close = root.querySelector('.am-close');
  const status = root.querySelector('.am-status');
  let scale = 100;

  const say = (message) => { status.textContent = message; };
  const setOpen = (open) => {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) close.focus(); else trigger.focus();
  };
  const setPressed = (action, pressed) => {
    const button = root.querySelector('[data-action="' + action + '"]');
    if (button) button.setAttribute('aria-pressed', String(pressed));
  };

  trigger.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'increase' || action === 'decrease') {
      scale = Math.max(80, Math.min(140, scale + (action === 'increase' ? 10 : -10)));
      document.documentElement.style.fontSize = scale + '%';
      say('Text size set to ' + scale + ' percent.');
    }
    if (action === 'contrast') {
      const active = document.documentElement.classList.toggle('am-high-contrast');
      setPressed('contrast', active);
      say(active ? 'High contrast enabled.' : 'High contrast disabled.');
    }
    if (action === 'links') {
      const active = document.documentElement.classList.toggle('am-highlight-links');
      setPressed('links', active);
      say(active ? 'Links highlighted.' : 'Link highlighting disabled.');
    }
    if (action === 'reset') {
      scale = 100;
      document.documentElement.style.removeProperty('font-size');
      document.documentElement.classList.remove('am-high-contrast', 'am-highlight-links');
      setPressed('contrast', false);
      setPressed('links', false);
      say('Accessibility settings reset.');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false);
  });
  if (!account) console.warn('Accessimate widget: missing data-account API key.');
})();`;

@ApiTags("Public widget")
@Controller("public")
export class PublicWidgetController {
  @Public()
  @Get("widget.js")
  script(@Res() response: Response) {
    response.setHeader("Content-Type", "application/javascript; charset=utf-8");
    response.setHeader(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=3600",
    );
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.send(widgetScript);
  }

  @Public()
  @Get("widget-preview")
  preview(
    @Query("account") account: string | undefined,
    @Res() response: Response,
  ) {
    const safeAccount = (account ?? "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 100);
    response.removeHeader("X-Frame-Options");
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "public, max-age=60");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; frame-ancestors https://accessimate-admin-panel-nextjs.vercel.app",
    );
    response.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Accessimate widget preview</title>
    <style>
      body{margin:0;font-family:Arial,sans-serif;background:linear-gradient(135deg,#eef8f7,#eef3ff);color:#132b39}
      main{max-width:620px;margin:0 auto;padding:45px 24px}
      article{background:#fff;border:1px solid #d9e6eb;border-radius:18px;padding:26px;box-shadow:0 18px 45px rgba(20,55,70,.1)}
      h1{font-size:27px;margin:0 0 12px}p{line-height:1.7;color:#536b77}a{color:#1769e0}
    </style>
  </head>
  <body>
    <main>
      <article>
        <h1>Widget preview page</h1>
        <p>Open the accessibility button in the lower-right corner, then try text scaling, high contrast, link highlighting, keyboard focus, and reset.</p>
        <a href="#details">Example product link</a>
      </article>
    </main>
    <script src="/api/v1/public/widget.js" data-account="${safeAccount}" defer></script>
  </body>
</html>`);
  }
}
