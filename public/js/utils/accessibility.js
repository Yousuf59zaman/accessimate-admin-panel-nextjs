module.exports = {
  async getContrastRatio(color1, color2) {
    // Utility function to calculate contrast ratio
    const luminance1 = getLuminance(color1);
    const luminance2 = getLuminance(color2);
    const brightest = Math.max(luminance1, luminance2);
    const darkest = Math.min(luminance1, luminance2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  async getLuminance(color) {
    // Convert hex to RGB and calculate luminance
    const rgb = hexToRgb(color);
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
      channel = channel / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  async hexToRgb(hex) {
    // Convert hex color to RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  async isValidColor(color) {
    // Check if color is valid hex
    return /^#[0-9A-F]{6}$/i.test(color);
  },

  async announceChange(message) {
    // Create or get existing live region
    let liveRegion = document.getElementById("wcag-live-region");
    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.id = "wcag-live-region";
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.style.cssText =
        "position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;";
      document.body.appendChild(liveRegion);
    }

    // Update message
    liveRegion.textContent = message;
  },

  async trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function handleTab(e) {
      const isTabPressed = e.key === "Tab";

      if (!isTabPressed) return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }

    element.addEventListener("keydown", handleTab);
    firstFocusable?.focus();

    return () => {
      element.removeEventListener("keydown", handleTab);
    };
  },
};
