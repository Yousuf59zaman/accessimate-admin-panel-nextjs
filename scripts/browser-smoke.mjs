import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const siteUrl = process.argv[2]?.replace(/\/+$/, "");
if (!siteUrl?.startsWith("https://")) {
  throw new Error("Pass the production HTTPS site URL as the first argument.");
}

const outputDirectory = resolve("artifacts", "sqa");
const chromeCandidates = [
  join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "Application", "chrome.exe"),
  join(process.env.ProgramFiles ?? "", "Google", "Chrome", "Application", "chrome.exe"),
  join(process.env["ProgramFiles(x86)"] ?? "", "Google", "Chrome", "Application", "chrome.exe"),
];
const chromePath = chromeCandidates.find((candidate) => candidate && existsSync(candidate));
if (!chromePath) throw new Error("Google Chrome is not installed.");

const delay = (milliseconds) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

const waitForFile = async (path, timeoutMilliseconds = 15_000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMilliseconds) {
    if (existsSync(path)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${path}.`);
};

const profileDirectory = await mkdtemp(join(tmpdir(), "accessimate-sqa-"));
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${profileDirectory}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);

let socket;
try {
  const activePortFile = join(profileDirectory, "DevToolsActivePort");
  await waitForFile(activePortFile);
  const [port] = (await readFile(activePortFile, "utf8")).trim().split(/\r?\n/);
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  const target = targets.find((item) => item.type === "page");
  if (!target?.webSocketDebuggerUrl) throw new Error("Chrome page target was unavailable.");

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });

  let commandId = 0;
  const pendingCommands = new Map();
  const eventWaiters = new Map();
  const browserErrors = [];

  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const pending = pendingCommands.get(message.id);
      if (!pending) return;
      pendingCommands.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
      return;
    }

    if (message.method === "Runtime.exceptionThrown") {
      browserErrors.push(message.params?.exceptionDetails?.text ?? "Uncaught runtime exception");
    }
    if (message.method === "Log.entryAdded" && message.params?.entry?.level === "error") {
      browserErrors.push(message.params.entry.text);
    }

    const waiters = eventWaiters.get(message.method) ?? [];
    waiters.splice(0).forEach((resolveEvent) => resolveEvent(message.params));
  });

  const command = (method, params = {}) =>
    new Promise((resolveCommand, rejectCommand) => {
      const id = ++commandId;
      pendingCommands.set(id, { resolve: resolveCommand, reject: rejectCommand });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const waitForEvent = (method, timeoutMilliseconds = 20_000) =>
    new Promise((resolveEvent, rejectEvent) => {
      const waiters = eventWaiters.get(method) ?? [];
      const timer = setTimeout(() => {
        const current = eventWaiters.get(method) ?? [];
        eventWaiters.set(method, current.filter((item) => item !== onEvent));
        rejectEvent(new Error(`Timed out waiting for browser event ${method}.`));
      }, timeoutMilliseconds);
      const onEvent = (params) => {
        clearTimeout(timer);
        resolveEvent(params);
      };
      waiters.push(onEvent);
      eventWaiters.set(method, waiters);
    });

  const evaluate = async (expression) => {
    const response = await command("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.text ?? "Browser evaluation failed.");
    }
    return response.result?.value;
  };

  const navigate = async (url) => {
    const loaded = waitForEvent("Page.loadEventFired");
    await command("Page.navigate", { url });
    await loaded;
    await delay(2_000);
  };

  const waitUntil = async (expression, timeoutMilliseconds = 30_000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMilliseconds) {
      if (await evaluate(expression)) return;
      await delay(250);
    }
    throw new Error(`Timed out waiting for browser condition: ${expression}`);
  };

  const setViewport = (width, height, mobile = false) =>
    command("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });

  const capture = async (filename) => {
    const screenshot = await command("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    await writeFile(join(outputDirectory, filename), Buffer.from(screenshot.data, "base64"));
  };

  const pageState = () =>
    evaluate(`(() => ({
      title: document.title,
      heading: document.querySelector('h1, h2')?.textContent?.trim() ?? '',
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      bodyText: document.body.innerText.slice(0, 5000),
      fontAwesomeReady: (() => {
        const icon = document.querySelector('.fa-solid, .fas');
        return icon ? getComputedStyle(icon, '::before').content !== 'none' : false;
      })()
    }))()`);

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    command("Page.enable"),
    command("Runtime.enable"),
    command("Log.enable"),
  ]);

  await setViewport(1440, 900);
  await navigate(siteUrl);
  const landingDesktop = await pageState();
  await capture("landing-desktop.png");

  const reviewerLogin = await evaluate(`(async () => {
    const response = await fetch('/api/admin/demo-login', { method: 'POST' });
    const payload = await response.json();
    return {
      status: response.status,
      tokenExposed: Boolean(payload?.data?.token),
      success: payload?.status === true
    };
  })()`);
  if (reviewerLogin.status !== 201 || !reviewerLogin.success || reviewerLogin.tokenExposed) {
    throw new Error("Production reviewer login did not satisfy the secure BFF contract.");
  }

  await navigate(`${siteUrl}/admin-panel`);
  await waitUntil(
    `document.querySelector('[data-dashboard-loading]')?.getAttribute('data-dashboard-loading') === 'false'`,
  );
  await delay(500);
  const dashboardDesktop = await pageState();
  await capture("dashboard-desktop.png");

  await setViewport(390, 844, true);
  await navigate(`${siteUrl}/admin-panel`);
  await waitUntil(
    `document.querySelector('[data-dashboard-loading]')?.getAttribute('data-dashboard-loading') === 'false'`,
  );
  await delay(500);
  const dashboardMobile = await pageState();
  await capture("dashboard-mobile.png");

  const checks = {
    landingBrand: landingDesktop.bodyText.includes("Accessimate Control"),
    landingNoOverflow: !landingDesktop.horizontalOverflow,
    dashboardLoaded:
      dashboardDesktop.bodyText.includes("Overview") ||
      dashboardDesktop.bodyText.includes("Active records"),
    dashboardNoOverflowDesktop: !dashboardDesktop.horizontalOverflow,
    dashboardNoOverflowMobile: !dashboardMobile.horizontalOverflow,
    iconsLoaded: landingDesktop.fontAwesomeReady && dashboardDesktop.fontAwesomeReady,
    browserErrorCount: browserErrors.length,
  };

  if (Object.entries(checks).some(([name, value]) => name !== "browserErrorCount" && value !== true)) {
    throw new Error(`Browser smoke checks failed: ${JSON.stringify(checks)}`);
  }
  if (browserErrors.length) {
    throw new Error(`Browser errors detected: ${browserErrors.join(" | ")}`);
  }

  process.stdout.write(
    `${JSON.stringify({
      status: "passed",
      checks,
      screenshots: [
        "artifacts/sqa/landing-desktop.png",
        "artifacts/sqa/dashboard-desktop.png",
        "artifacts/sqa/dashboard-mobile.png",
      ],
    })}\n`,
  );
} finally {
  socket?.close();
  chrome.kill();
  await Promise.race([once(chrome, "exit"), delay(5_000)]).catch(() => undefined);
  await delay(250);
  await rm(profileDirectory, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 200,
  });
}
