const loaderScript = document.querySelector("script[data-account]");
const scriptOrigin = loaderScript?.src
  ? new URL(loaderScript.src, window.location.href).origin
  : window.location.origin;

const config = {
  baseUrl: loaderScript?.dataset.accessimateBaseUrl || scriptOrigin,
  apiBaseUrl: loaderScript?.dataset.accessimateApiBaseUrl || scriptOrigin,
  appMode: "prod",
};

module.exports = config;
