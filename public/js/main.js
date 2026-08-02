// Custom CommonJS-like module loader
(function (global) {
	const moduleCache = {};
	const getLoaderScript = () => {
		if (typeof document === "undefined") return null;
		return document.currentScript || document.querySelector('script[data-account]');
	};
	const loaderScript = getLoaderScript();
	const moduleBaseUrl = loaderScript?.src
		? new URL(loaderScript.src, global.location.href).origin
		: global.location.origin;

	function toAbsolute(url) {
		if (/^https?:\/\//i.test(url)) {
			return url;
		}
		return `${moduleBaseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
	}

	function normalize(from, request) {
		if (/^https?:\/\//i.test(request)) {
			return request;
		}
		if (request.startsWith('/')) {
			return request;
		}

		const baseParts = from.split('/').filter(Boolean);
		baseParts.pop(); // remove file name
		const reqParts = request.split('/');

		for (const part of reqParts) {
			if (!part || part === '.') continue;
			if (part === '..') {
				baseParts.pop();
			} else {
				baseParts.push(part);
			}
		}

		return `/${baseParts.join('/')}`;
	}

	function loadSource(url) {
		const absoluteUrl = toAbsolute(url);
		const xhr = new XMLHttpRequest();
		xhr.open('GET', absoluteUrl, false); // synchronous to match CommonJS expectations
		xhr.send(null);
		if (xhr.status < 200 || xhr.status >= 300) {
			throw new Error(`Failed to load module ${absoluteUrl}: ${xhr.status} ${xhr.statusText}`);
		}
		return xhr.responseText;
	}

	function requireFrom(fromId, request) {
		const id = normalize(fromId, request);
		const cacheKey = toAbsolute(id);
		if (moduleCache[cacheKey]) {
			return moduleCache[cacheKey].exports;
		}

		const source = loadSource(id);
		const module = { exports: {} };
		moduleCache[cacheKey] = module;

		const dirname = id.substring(0, id.lastIndexOf('/'));
		const localRequire = (req) => requireFrom(id, req);

		const wrapped = new Function('require', 'module', 'exports', '__dirname', '__filename', source);
		wrapped(localRequire, module, module.exports, dirname, id);
		return module.exports;
	}

	function requireEntry(entryId) {
		return requireFrom(entryId, entryId);
	}

	const require = (req) => requireFrom('/js/main.js', req);


const script = document.querySelector('script[data-account]');
const accountId = script ? script.dataset.account : null;
const pageOrigin = window.location.origin;
const config = require("./utils/config/config.js");

// Cache management functions
const cacheManager = {

	async storeToCache(apiKey, validationStatus = 'valid', adjustments = {}) {
		try {
			const response = await fetch(`${config.baseUrl}/api/cache/store`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					origin: pageOrigin,
					apiKey,
					validationStatus,
					adjustments
				})
			});
			const data = await response.json();
			return data.success;
		} catch (error) {
			console.error('Failed to store to cache:', error);
			return false;
		}
	},


	async retrieveFromCache() {
		try {
			const response = await fetch(`${config.baseUrl}/api/cache/retrieve`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					origin: pageOrigin
				})
			});
			const data = await response.json();
			return data.success ? data.data : null;
		} catch (error) {
			console.error('Failed to retrieve from cache:', error);
			return null;
		}
	},


	async updateAdjustments(adjustments) {
		try {
			const response = await fetch(`${config.baseUrl}/api/cache/update-adjustments`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					origin: pageOrigin,
					adjustments
				})
			});
			const data = await response.json();
			return data.success;
		} catch (error) {
			console.error('Failed to update adjustments:', error);
			return false;
		}
	},

	async clearCache() {
		try {
			const response = await fetch(`${config.baseUrl}/api/cache/clear`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					origin: pageOrigin
				})
			});
			const data = await response.json();
			return data.success;
		} catch (error) {
			console.error('Failed to clear cache:', error);
			return false;
		}
	}
};


// Check for stored API key from server cache
let cachedData = null;
let currentApiKey = accountId;

// Import Font Awesome CSS
const loadFontAwesome = () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${config.baseUrl}/css/fontAwesome.css`;
    document.head.appendChild(link);
};

const Adjustments  = require("./components/adjustments.js");
const { ValidationComponent } = require("./components/ValidationComponent.js");
const { NotFoundComponent } = require("./components/notFound.js");
const accessibility = require("./utils/accessibility.js");

const GOOGLE_TRANSLATE_LANGUAGES = [
	{ code: "", label: "Select language" },
	{ code: "en", label: "English" },
	{ code: "es", label: "Spanish" },
	{ code: "fr", label: "French" },
	{ code: "de", label: "German" },
	{ code: "it", label: "Italian" },
	{ code: "pt", label: "Portuguese" },
	{ code: "ru", label: "Russian" },
	{ code: "zh-CN", label: "Chinese (Simplified)" },
	{ code: "zh-TW", label: "Chinese (Traditional)" },
	{ code: "ja", label: "Japanese" },
	{ code: "ko", label: "Korean" },
	{ code: "ar", label: "Arabic" },
	{ code: "hi", label: "Hindi" },
	{ code: "bn", label: "Bengali" },
	{ code: "th", label: "Thai" },
	{ code: "vi", label: "Vietnamese" },
	{ code: "id", label: "Indonesian" },
	{ code: "ms", label: "Malay" },
	{ code: "tl", label: "Filipino" },
	{ code: "tr", label: "Turkish" },
	{ code: "pl", label: "Polish" },
	{ code: "nl", label: "Dutch" },
	{ code: "sv", label: "Swedish" },
	{ code: "da", label: "Danish" },
	{ code: "no", label: "Norwegian" },
	{ code: "fi", label: "Finnish" },
	{ code: "el", label: "Greek" },
	{ code: "he", label: "Hebrew" },
	{ code: "cs", label: "Czech" },
	{ code: "hu", label: "Hungarian" },
	{ code: "ro", label: "Romanian" },
	{ code: "uk", label: "Ukrainian" },
	{ code: "bg", label: "Bulgarian" },
	{ code: "hr", label: "Croatian" },
	{ code: "sk", label: "Slovak" },
	{ code: "sl", label: "Slovenian" },
	{ code: "et", label: "Estonian" },
	{ code: "lv", label: "Latvian" },
	{ code: "lt", label: "Lithuanian" },
];

const GOOGLE_TRANSLATE_LANGUAGE_CODES = GOOGLE_TRANSLATE_LANGUAGES
	.filter((lang) => lang.code)
	.map((lang) => lang.code);

const GOOGLE_TRANSLATE_LABEL_MAP = GOOGLE_TRANSLATE_LANGUAGES.reduce((map, lang) => {
	if (lang.code) {
		map[lang.code] = lang.label;
	}
	return map;
}, {});

// Google Translate uses different internal codes for some languages
// This maps our standard codes to Google's internal codes
const GOOGLE_TRANSLATE_CODE_ALIASES = {
	'he': 'iw',      // Hebrew: ISO 639-1 'he' vs Google's 'iw'
	'zh-CN': 'zh-CN', // Chinese Simplified (keep as-is, but also try 'zh')
	'zh-TW': 'zh-TW', // Chinese Traditional
	'no': 'no',       // Norwegian (Google also accepts 'nb' for Bokmål)
	'fil': 'tl',      // Filipino/Tagalog
};

const GOOGLE_TRANSLATE_CODE_REVERSE = Object.entries(GOOGLE_TRANSLATE_CODE_ALIASES).reduce((map, [standard, google]) => {
	map[google] = standard;
	return map;
}, {});

// Get the Google internal code for a language
const getGoogleLangCode = (code) => GOOGLE_TRANSLATE_CODE_ALIASES[code] || code;
const normalizeGoogleLangCode = (code) => GOOGLE_TRANSLATE_CODE_REVERSE[code] || code;

class WcagTools {
	constructor() {
		this.config = config;
		this.translateLanguages = GOOGLE_TRANSLATE_LANGUAGES;
		this.translateLanguageCodes = GOOGLE_TRANSLATE_LANGUAGE_CODES;
		this.translateLanguageLabels = GOOGLE_TRANSLATE_LABEL_MAP;
		// Convert to Google's internal codes for includedLanguages parameter
		this.translateLanguageCodesCsv = this.translateLanguageCodes.map(code => getGoogleLangCode(code)).join(',');
		this.state = {
			isOpen: false,
			isValidating: false,
			isFetching: false,
			isValid: false,
			errorMessage: null,
			baseColors: {
				bgColor: "#1e3a8a",
				borderColor: "#1e40af",
				txtColor: "#1e3a8a",
			},
			enabledTools: {},
			wasValidatedBefore: false, // Track if validation was done before
			widgetPosition: this.loadWidgetPosition(), // Load saved position (left/right)
			dragPosition: this.loadDragPosition(), // Load saved drag position (x, y coordinates)
			isDragging: false, // Track if widget button is being dragged
			dragStartX: 0, // Initial mouse X position when drag starts
			dragStartY: 0, // Initial mouse Y position when drag starts
			dragStartBtnX: 0, // Initial button X position when drag starts
			dragStartBtnY: 0, // Initial button Y position when drag starts
			// Widget panel drag state
			widgetPanelDragPosition: this.loadWidgetPanelDragPosition(), // Load saved widget panel drag position
			isWidgetPanelDragging: false, // Track if widget panel is being dragged
			widgetPanelDragStartX: 0, // Initial mouse X when panel drag starts
			widgetPanelDragStartY: 0, // Initial mouse Y when panel drag starts
			widgetPanelStartX: 0, // Initial panel X when drag starts
			widgetPanelStartY: 0, // Initial panel Y when drag starts
			moveWidgetExpanded: false, // Track if Move Widget section is expanded
			translateSectionExpanded: false, // Track if Translate section is expanded
			googleTranslateInitialized: false, // Track if Google Translate has been initialized
			pendingTranslateLang: null, // Track a language request while GT loads
			profilesSectionExpanded: false, // Track if Accessibility Profiles section is expanded
			activeProfile: null, // Track currently active accessibility profile
		}
		this.bannerCleanupTimer = null; // Interval id for Google banner cleanup
		this.translateApplyTimer = null; // Timeout id for translate apply retries
		this.highlightBlockerActive = false; // Track if translate highlight blocker is active
		this.init()
	}

	// Load widget position from localStorage
	loadWidgetPosition() {
		try {
			const saved = localStorage.getItem("wcag-widget-position");
			if (saved && (saved === 'left' || saved === 'right')) {
				return saved;
			}
		} catch (error) {
			console.warn("Failed to load widget position:", error);
		}
		return 'left'; // Default position
	}

	// Save widget position to localStorage
	saveWidgetPosition(position) {
		try {
			localStorage.setItem("wcag-widget-position", position);
		} catch (error) {
			console.warn("Failed to save widget position:", error);
		}
	}

	// Ensure the hidden Google Translate gadget container exists
	ensureGoogleTranslateContainer() {
		if (typeof document === 'undefined') return;

		let container = document.getElementById('google_translate_element');
		if (!container) {
			container = document.createElement('div');
			container.id = 'google_translate_element';
		}

		// Keep the container mounted under <body> so TranslateElement can render even if the widget section is collapsed.
		if (container.parentElement !== document.body) {
			document.body.appendChild(container);
		}

		// Offscreen but renderable (TranslateElement often fails when display:none or inside a display:none parent).
		Object.assign(container.style, {
			position: 'absolute',
			left: '-9999px',
			top: '0',
			width: '1px',
			height: '1px',
			overflow: 'hidden',
			opacity: '0',
			pointerEvents: 'none',
			zIndex: '-1',
			display: 'block',
		});
	}

	// Load drag position from localStorage
	loadDragPosition() {
		try {
			const saved = localStorage.getItem("wcag-widget-drag-position");
			if (saved) {
				const parsed = JSON.parse(saved);
				if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
					return parsed;
				}
			}
		} catch (error) {
			console.warn("Failed to load drag position:", error);
		}
		return null; // Default: no custom position (use left/right positioning)
	}

	// Save drag position to localStorage
	saveDragPosition(x, y) {
		try {
			localStorage.setItem("wcag-widget-drag-position", JSON.stringify({ x, y }));
		} catch (error) {
			console.warn("Failed to save drag position:", error);
		}
	}

	// Clear drag position (reset to default left/right positioning)
	clearDragPosition() {
		try {
			localStorage.removeItem("wcag-widget-drag-position");
			this.state.dragPosition = null;
		} catch (error) {
			console.warn("Failed to clear drag position:", error);
		}
	}

	// Load widget panel drag position from localStorage
	loadWidgetPanelDragPosition() {
		try {
			const saved = localStorage.getItem("wcag-widget-panel-drag-position");
			if (saved) {
				const parsed = JSON.parse(saved);
				if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
					return parsed;
				}
			}
		} catch (error) {
			console.warn("Failed to load widget panel drag position:", error);
		}
		return null; // Default: no custom position
	}

	// Save widget panel drag position to localStorage
	saveWidgetPanelDragPosition(x, y) {
		try {
			localStorage.setItem("wcag-widget-panel-drag-position", JSON.stringify({ x, y }));
		} catch (error) {
			console.warn("Failed to save widget panel drag position:", error);
		}
	}

	// Clear widget panel drag position
	clearWidgetPanelDragPosition() {
		try {
			localStorage.removeItem("wcag-widget-panel-drag-position");
			this.state.widgetPanelDragPosition = null;
		} catch (error) {
			console.warn("Failed to clear widget panel drag position:", error);
		}
	}

	// Set widget position and update UI
	setWidgetPosition(position) {
		if (position !== 'left' && position !== 'right') return;

		this.state.widgetPosition = position;
		this.saveWidgetPosition(position);

		// Clear drag position when manually setting left/right
		this.clearDragPosition();
		this.clearWidgetPanelDragPosition();

		// Update main button position
		const mainBtn = document.getElementById("wcap_tools_btn");
		if (mainBtn) {
			// Reset to default positioning (left/right + bottom)
			mainBtn.style.top = "auto";
			mainBtn.style.bottom = "12px";
			if (position === 'left') {
				mainBtn.style.left = "12px";
				mainBtn.style.right = "auto";
			} else {
				mainBtn.style.left = "auto";
				mainBtn.style.right = "12px";
			}
		}

		// Update widget panel position - reset to full-height edge positioning
		const widget = document.getElementById("wcag_tools_widget");
		if (widget) {
			// Reset to full-height edge mode
			widget.style.top = "0";
			widget.style.height = "100vh";
			widget.style.maxWidth = "500px";
			if (position === 'left') {
				widget.style.left = "0";
				widget.style.right = "auto";
				widget.style.transform = this.state.isOpen ? "translateX(0)" : "translateX(-100%)";
			} else {
				widget.style.left = "auto";
				widget.style.right = "0";
				widget.style.transform = this.state.isOpen ? "translateX(0)" : "translateX(100%)";
			}
		}

		// Update radio button states
		const leftRadio = document.getElementById("wcag-position-left");
		const rightRadio = document.getElementById("wcag-position-right");
		if (leftRadio) leftRadio.checked = position === 'left';
		if (rightRadio) rightRadio.checked = position === 'right';

		// Announce change for accessibility
		accessibility.announceChange(`Widget moved to ${position} side`);
	}

	restoreCachedAdjustments() {
		const adjustments = cachedData?.adjustments;
		if (!adjustments || typeof adjustments !== "object" || Array.isArray(adjustments)) {
			return;
		}

		const storageMap = {
			content: "wcag-content-adjustments",
			color: "wcag-color-adjustments",
			orientation: "wcag-orientation-adjustments",
			enabled: "wcag_tools_enabled_list",
		};

		try {
			Object.entries(storageMap).forEach(([key, storageKey]) => {
				const value = adjustments[key];
				if (value && typeof value === "object" && !Array.isArray(value)) {
					localStorage.setItem(storageKey, JSON.stringify(value));
				}
			});

			if (adjustments.enabled && typeof adjustments.enabled === "object") {
				this.state.enabledTools = adjustments.enabled;
			}

			initializeSavedSettings();
		} catch (error) {
			console.warn("Failed to restore cached WCAG adjustments:", error);
		}
	}

	async init() {
		const mainButton = this.createMainButton();

		// Initialize cached data
		cachedData = await cacheManager.retrieveFromCache();
		if (cachedData?.apiKey) {
			currentApiKey = currentApiKey || cachedData.apiKey;
		}
		this.restoreCachedAdjustments();

		document.body.appendChild(mainButton);
		this.initKeyboardShortcuts();

		// Initialize validation first
		this.validationComponent = new ValidationComponent(this);

		// Restore valid cached authorization before rendering the hidden panel.
		const shouldAutoOpenWidget = this.checkPreviousValidation();
		this.renderWidget(false);

		if (shouldAutoOpenWidget) {
			this.state.isOpen = true;
			this.toggleWidget(true); // show widget
		}
	}





	async initializeCachedData() {
		try {
			cachedData = await cacheManager.retrieveFromCache();
			if (cachedData && cachedData.apiKey) {
				currentApiKey = currentApiKey || cachedData.apiKey;
			}
		} catch (error) {
			console.error('Failed to initialize cached data:', error);
		}
	}

	checkPreviousValidation() {
		// Check cached data from server
		if (cachedData && cachedData.validationStatus === 'valid' && cachedData.apiKey && currentApiKey) {
			// Check if validation is recent (within 24 hours)
			const isValidationRecent = cachedData.timestamp && 
				(Date.now() - cachedData.timestamp) < (24 * 60 * 60 * 1000);
			
			if (isValidationRecent) {
				this.state.wasValidatedBefore = true;
				this.state.isValid = true;
				this.state.isFetching = true;
				
				// Check if user has any active adjustments and restore them
				return this.restoreActiveAdjustments();
			}
		}
		
		return false;
	}

	hasActiveAdjustments(adjustments = {}) {
		const content = adjustments.content || {};
		const color = adjustments.color || {};
		const orientation = adjustments.orientation || {};
		const enabled = adjustments.enabled || {};

		return Boolean(
			content.textMagnifier ||
			content.highlightLinks ||
			content.highlightTitles ||
			content.showHeadlines ||
			(typeof content.fontSize === "number" && content.fontSize !== 100) ||
			(typeof content.lineHeight === "number" && content.lineHeight !== 1.5) ||
			(typeof content.letterSpacing === "number" && content.letterSpacing !== 0) ||
			(typeof content.contentScaling === "number" && content.contentScaling !== 100) ||
			(content.textAlign && content.textAlign !== "default") ||
			(color.contrastMode && color.contrastMode !== "default") ||
			(color.brightnessMode && color.brightnessMode !== "default") ||
			(color.saturationMode && color.saturationMode !== "default") ||
			(typeof color.contrast === "number" && color.contrast !== 100) ||
			(typeof color.brightness === "number" && color.brightness !== 100) ||
			(typeof color.saturation === "number" && color.saturation !== 100) ||
			color.invertColors ||
			color.darkMode ||
			color.lightContrast ||
			orientation.hideImages ||
			orientation.pauseAnimations ||
			orientation.readingMask ||
			orientation.readingGuide ||
			orientation.screenReader ||
			(orientation.bigCursor && orientation.bigCursor !== "default") ||
			Object.values(enabled).some((item) => item?.status === true)
		);
	}

	restoreActiveAdjustments() {
		// Check for any saved settings that indicate active adjustments
		// First check cached data from server
		let hasActiveAdjustments = false;
		
		if (cachedData && cachedData.adjustments) {
			hasActiveAdjustments = this.hasActiveAdjustments(cachedData.adjustments);
		}
		
		// Also check localStorage for any active adjustments (fallback)
		if (!hasActiveAdjustments) {
			const contentSettings = JSON.parse(localStorage.getItem("wcag-content-adjustments") || "{}");
			const colorSettings = JSON.parse(localStorage.getItem("wcag-color-adjustments") || "{}");
			const orientationSettings = JSON.parse(localStorage.getItem("wcag-orientation-adjustments") || "{}");
			const enabledList = JSON.parse(localStorage.getItem("wcag_tools_enabled_list") || "{}");
			
			hasActiveAdjustments = this.hasActiveAdjustments({
				content: contentSettings,
				color: colorSettings,
				orientation: orientationSettings,
				enabled: enabledList,
			});
			
			if (hasActiveAdjustments) {
				this.state.enabledTools = enabledList;
			}
		}
		
		if (hasActiveAdjustments) {
			// Ensure badge reflects restored adjustments on load
			if (typeof window !== 'undefined' && window.wcagTools && typeof window.wcagTools.updateActiveFeatureCount === 'function') {
				window.wcagTools.updateActiveFeatureCount();
			}
			return true; // Indicate that widget should be auto-opened
		}
		
		return false; // No active adjustments found
	}
	createMainButton() {
		const btn = document.createElement("div")
		btn.id = "wcap_tools_btn"
		const position = this.state.widgetPosition || 'left';
		const dragPos = this.state.dragPosition;

		// Determine initial position - use drag X position if available, otherwise use left/right
		// Y axis is always fixed at bottom: 12px (no vertical movement for button)
		let leftPos, rightPos;
		if (dragPos && typeof dragPos.x === 'number') {
			// Use custom drag X position (horizontal only)
			leftPos = `${dragPos.x}px`;
			rightPos = 'auto';
		} else {
			// Use left/right position
			leftPos = position === 'left' ? '12px' : 'auto';
			rightPos = position === 'right' ? '12px' : 'auto';
		}
		// Bottom is always fixed at 12px - no vertical movement
		const bottomPos = '12px';

		btn.style.cssText = `
            position: fixed;
            display: flex;
            align-items: center;
            justify-content: center;
            left: ${leftPos};
            right: ${rightPos};
            bottom: ${bottomPos};
            z-index: 999999998;
            cursor: pointer;
            width: 48px;
            height: 48px;
            border: 1px solid #9ca3af;
            background-color: white;
            border-radius: 9999px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            line-height: 1;
            letter-spacing: normal;
            touch-action: none;
            user-select: none;
            transition: box-shadow 0.2s ease, transform 0.1s ease;
        `

		const icon = document.createElement("i")
		icon.className = "fa-light fa-universal-access"
		icon.style.cssText = "font-size: 44px; color: #1e3a8a;"
		btn.appendChild(icon)

		//  Badge: shows how many tools are active at a glance
		const countBadge = document.createElement("div")
		countBadge.id = "wcag_active_count_badge"
		countBadge.style.cssText = `
			position: absolute;
			top: -8px;
			right: -8px;
			background: #dc2626;
			color: white;
			font-size: 12px;
			font-weight: 600;
			font-family: system-ui, -apple-system, sans-serif;
			min-width: 20px;
			height: 20px;
			border-radius: 10px;
			display: none;
			align-items: center;
			justify-content: center;
			padding: 0 6px;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
			line-height: 1;
			letter-spacing: normal;
		`
		btn.appendChild(countBadge)

		// Track if this was a drag or a click
		let wasDragged = false;

		// Drag functionality - Mouse events
		const handleMouseDown = (e) => {
			// Prevent default to avoid text selection
			e.preventDefault();

			// Get button's current position
			const rect = btn.getBoundingClientRect();

			this.state.isDragging = true;
			this.state.dragStartX = e.clientX;
			this.state.dragStartY = e.clientY;
			this.state.dragStartBtnX = rect.left;
			this.state.dragStartBtnY = rect.top;
			wasDragged = false;

			// Add visual feedback for dragging
			btn.style.cursor = 'grabbing';
			btn.style.boxShadow = '0 8px 16px -2px rgba(0, 0, 0, 0.2)';
			btn.style.transform = 'scale(1.05)';
			btn.style.transition = 'none'; // Disable transition during drag

			// Add mousemove and mouseup listeners to document
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		};

		const handleMouseMove = (e) => {
			if (!this.state.isDragging) return;

			// Calculate how much the mouse has moved - ONLY X axis for button
			const deltaX = e.clientX - this.state.dragStartX;

			// Mark as dragged if moved more than 5 pixels (threshold to distinguish from click)
			if (Math.abs(deltaX) > 5) {
				wasDragged = true;
			}

			// Calculate new X position only (Y stays fixed at bottom)
			let newX = this.state.dragStartBtnX + deltaX;

			// Constrain to viewport bounds (horizontal only)
			const btnWidth = btn.offsetWidth;
			const maxX = window.innerWidth - btnWidth;

			newX = Math.max(0, Math.min(newX, maxX));

			// Update button position (horizontal only, keep at bottom)
			btn.style.left = `${newX}px`;
			btn.style.right = 'auto';
			// Keep bottom fixed at 12px - NO vertical movement
			btn.style.bottom = '12px';
			btn.style.top = 'auto';
		};

		const handleMouseUp = (e) => {
			if (!this.state.isDragging) return;

			this.state.isDragging = false;

			// Remove event listeners
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);

			// Reset visual feedback
			btn.style.cursor = 'pointer';
			btn.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
			btn.style.transform = 'scale(1)';
			btn.style.transition = 'box-shadow 0.2s ease, transform 0.1s ease';

			// Save the new position if it was actually dragged
			if (wasDragged) {
				const rect = btn.getBoundingClientRect();

				// Update state and save to localStorage (X position only, Y is always bottom)
				this.state.dragPosition = { x: rect.left, y: null };
				this.saveDragPosition(rect.left, null);

				// Update the widget position state based on which side the button is on
				const halfWidth = window.innerWidth / 2;
				if (rect.left + btn.offsetWidth / 2 < halfWidth) {
					this.state.widgetPosition = 'left';
				} else {
					this.state.widgetPosition = 'right';
				}
				this.saveWidgetPosition(this.state.widgetPosition);

				// Announce for accessibility
				accessibility.announceChange("Widget button moved to new position");
			}
		};

		// Touch events for mobile support
		const handleTouchStart = (e) => {
			if (e.touches.length !== 1) return;

			const touch = e.touches[0];
			const rect = btn.getBoundingClientRect();

			this.state.isDragging = true;
			this.state.dragStartX = touch.clientX;
			this.state.dragStartY = touch.clientY;
			this.state.dragStartBtnX = rect.left;
			this.state.dragStartBtnY = rect.top;
			wasDragged = false;

			// Add visual feedback
			btn.style.boxShadow = '0 8px 16px -2px rgba(0, 0, 0, 0.2)';
			btn.style.transform = 'scale(1.05)';
			btn.style.transition = 'none';
		};

		const handleTouchMove = (e) => {
			if (!this.state.isDragging || e.touches.length !== 1) return;

			const touch = e.touches[0];
			// Only X axis movement for button
			const deltaX = touch.clientX - this.state.dragStartX;

			if (Math.abs(deltaX) > 5) {
				wasDragged = true;
				e.preventDefault(); // Prevent scrolling when dragging
			}

			let newX = this.state.dragStartBtnX + deltaX;

			const btnWidth = btn.offsetWidth;
			const maxX = window.innerWidth - btnWidth;

			newX = Math.max(0, Math.min(newX, maxX));

			// Horizontal only - keep at bottom
			btn.style.left = `${newX}px`;
			btn.style.right = 'auto';
			btn.style.bottom = '12px';
			btn.style.top = 'auto';
		};

		const handleTouchEnd = (e) => {
			if (!this.state.isDragging) return;

			this.state.isDragging = false;

			btn.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
			btn.style.transform = 'scale(1)';
			btn.style.transition = 'box-shadow 0.2s ease, transform 0.1s ease';

			if (wasDragged) {
				const rect = btn.getBoundingClientRect();
				// Save only X position (Y is always bottom)
				this.state.dragPosition = { x: rect.left, y: null };
				this.saveDragPosition(rect.left, null);

				const halfWidth = window.innerWidth / 2;
				if (rect.left + btn.offsetWidth / 2 < halfWidth) {
					this.state.widgetPosition = 'left';
				} else {
					this.state.widgetPosition = 'right';
				}
				this.saveWidgetPosition(this.state.widgetPosition);

				accessibility.announceChange("Widget button moved to new position");
			}
		};

		// Add event listeners
		btn.addEventListener("mousedown", handleMouseDown);
		btn.addEventListener("touchstart", handleTouchStart, { passive: false });
		btn.addEventListener("touchmove", handleTouchMove, { passive: false });
		btn.addEventListener("touchend", handleTouchEnd);

		// Click handler - only toggle widget if not dragged
		btn.addEventListener("click", (e) => {
			if (!wasDragged) {
				this.toggleWidget();
			}
			wasDragged = false; // Reset for next interaction
		});

		// Update count badge on button creation
		this.updateActiveFeatureCount()

		return btn
	}
	//  Count everything that's currently non-default or switched on
	countActiveFeatures() {
		let count = 0;

		//  Enabled toggles (stored in wcag_tools_enabled_list)
		try {
			const enabledList = JSON.parse(localStorage.getItem("wcag_tools_enabled_list") || "{}");
			const enabledCount = Object.values(enabledList).filter(item => item && item.status === true).length;
			count += enabledCount;
		} catch (error) {
			console.warn("Failed to count enabled features:", error);
		}

		//  Content adjustments deviating from default values
		try {
			const contentSettings = JSON.parse(localStorage.getItem("wcag-content-adjustments") || "{}");
			let contentCount = 0;
			if (contentSettings.fontSize && contentSettings.fontSize !== 100) {
				contentCount++;
			}
			if (contentSettings.lineHeight && contentSettings.lineHeight !== 1.5) {
				contentCount++;
			}
			if (contentSettings.letterSpacing && contentSettings.letterSpacing !== 0) {
				contentCount++;
			}
			if (contentSettings.contentScaling && contentSettings.contentScaling !== 100) {
				contentCount++;
			}
			if (contentSettings.textAlign && contentSettings.textAlign !== "default") {
				contentCount++;
			}
			count += contentCount;
		} catch (error) {
			console.warn("Failed to count content adjustments:", error);
		}

		//  Color adjustments set to anything but "default"
		try {
			const colorSettings = JSON.parse(localStorage.getItem("wcag-color-adjustments") || "{}");
			let colorCount = 0;
			if (colorSettings.contrastMode && colorSettings.contrastMode !== "default") {
				colorCount++;
			}
			if (colorSettings.brightnessMode && colorSettings.brightnessMode !== "default") {
				colorCount++;
			}
			if (colorSettings.saturationMode && colorSettings.saturationMode !== "default") {
				colorCount++;
			}
			count += colorCount;
		} catch (error) {
			console.warn("Failed to count color adjustments:", error);
		}

		//  Orientation helpers/live tools that are turned on
		try {
			const orientationSettings = JSON.parse(localStorage.getItem("wcag-orientation-adjustments") || "{}");
			let orientationCount = 0;
			if (orientationSettings.hideImages === true) {
				orientationCount++;
			}
			if (orientationSettings.pauseAnimations === true) {
				orientationCount++;
			}
			if (orientationSettings.bigCursor && orientationSettings.bigCursor !== "default") {
				orientationCount++;
			}
			if (orientationSettings.readingMask === true) {
				orientationCount++;
			}
			if (orientationSettings.readingGuide === true) {
				orientationCount++;
			}
			if (orientationSettings.screenReader === true) {
				orientationCount++;
			}
			count += orientationCount;
		} catch (error) {
			console.warn("Failed to count orientation adjustments:", error);
		}

		return count;
	}

	//  Refresh the badge text + visibility
	updateActiveFeatureCount() {
		const badge = document.getElementById("wcag_active_count_badge");
		if (!badge) {
			return;
		}

		const count = this.countActiveFeatures();

		if (count > 0) {
			badge.textContent = count;
			badge.style.display = "flex";
		} else {
			badge.style.display = "none";
		}
	}

	updateMainButtonVisibility(isVisible) {
		const mainBtn = document.getElementById("wcap_tools_btn");
		if (!mainBtn) {
			return;
		}

		mainBtn.style.display = isVisible ? "flex" : "none";
	}

	showError() {
		const errorDiv = document.createElement("div");
		errorDiv.style.cssText = `
			position: fixed;
			bottom: 20px;
			left: 20px;
			background-color: #fee2e2;
			border: 1px solid #ef4444;
			color: #991b1b;
			padding: 12px 20px;
			border-radius: 6px;
			font-family: system-ui, -apple-system, sans-serif;
			z-index: 50;
			box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		`;
		errorDiv.textContent = this.state.errorMessage;
		document.body.appendChild(errorDiv);
		setTimeout(() => {
			errorDiv.remove();
		}, 5000);
	}

	async toggleWidget(value) {
		// If value is provided, use it; otherwise toggle the current state
		this.state.isOpen = value !== undefined ? value : !this.state.isOpen;
		this.updateMainButtonVisibility(!this.state.isOpen);

		if (this.state.isOpen) {
			// Check if widget already exists (from page reload)
			const existingWidget = document.querySelector("#wcag_tools_widget");
			const existingBackdrop = document.querySelector(".wcag_tools_item_block");

			if (existingWidget && existingBackdrop) {
				// Show the existing hidden widget
				existingBackdrop.style.display = "flex";
				existingWidget.style.display = "flex";

				// Apply saved panel position or default edge position
				const panelDragPos = this.state.widgetPanelDragPosition;
				if (panelDragPos && typeof panelDragPos.x === 'number' && typeof panelDragPos.y === 'number') {
					// Use saved free position
					existingWidget.style.left = `${panelDragPos.x}px`;
					existingWidget.style.right = 'auto';
					existingWidget.style.top = `${panelDragPos.y}px`;
					existingWidget.style.height = 'auto';
					existingWidget.style.maxHeight = `${window.innerHeight - panelDragPos.y}px`;
					existingWidget.style.transform = 'none';
				} else {
					// Use edge position with slide-in
					existingWidget.style.transform = "translateX(0)";
				}

				// Fade in backdrop
				requestAnimationFrame(() => (existingBackdrop.style.opacity = 0.6));
			} else {
				// Create new widget if it doesn't exist
				// Only reset validation states when manually opening (not when auto-opening)
				if (!this.state.wasValidatedBefore) {
					this.state.isValidating = false;
					this.state.isFetching = false;
					this.state.isValid = false;
				}
				this.renderWidget(true);
			}
		} else {
			this.closeWidget();
		}
	}

	renderWidget(value) {
		// Check if elements already exist to avoid duplicates
		let backdrop = document.querySelector(".wcag_tools_item_block");
		let widget = document.querySelector("#wcag_tools_widget");

		if (!backdrop) {
			backdrop = document.createElement("div");
			backdrop.className = "wcag_tools_item_block";
			Object.assign(backdrop.style, {
				position: "fixed",
				display: "none", // always start hidden
				left: 0,
				top: 0,
				height: "100%",
				width: "100%",
				backgroundColor: "black",
				opacity: 0,
				zIndex: 9999999,
				transition: "opacity 0.3s ease",
			});

			backdrop.addEventListener("click", (e) => {
				if (e.target === backdrop) {
					this.closeWidget();
				}
			});

			document.body.appendChild(backdrop);
		}

		if (!widget) {
			widget = document.createElement("div");
			widget.id = "wcag_tools_widget";
			const position = this.state.widgetPosition || 'left';
			const panelDragPos = this.state.widgetPanelDragPosition;

			// Determine initial widget panel position
			let widgetStyles;
			if (panelDragPos && typeof panelDragPos.x === 'number' && typeof panelDragPos.y === 'number') {
				// Use saved drag position for free positioning
				widgetStyles = {
					position: "fixed",
					display: "none",
					left: `${panelDragPos.x}px`,
					right: 'auto',
					top: `${panelDragPos.y}px`,
					height: "auto",
					maxHeight: `${window.innerHeight - panelDragPos.y}px`,
					width: "100%",
					maxWidth: "500px",
					backgroundColor: `${this.state.baseColors.bgColor}`,
					opacity: 1,
					fontFamily: "system-ui, -apple-system, sans-serif",
					lineHeight: "1.5",
					letterSpacing: "normal",
					zIndex: 999999999,
					overflow: "hidden",
					transform: "none",
					boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
					flexDirection: "column",
				};
			} else {
				// Use default edge positioning
				widgetStyles = {
					position: "fixed",
					display: "none",
					left: position === 'left' ? 0 : 'auto',
					right: position === 'right' ? 0 : 'auto',
					top: 0,
					height: "100vh",
					width: "100%",
					maxWidth: "500px",
					backgroundColor: `${this.state.baseColors.bgColor}`,
					opacity: 1,
					fontFamily: "system-ui, -apple-system, sans-serif",
					lineHeight: "1.5",
					letterSpacing: "normal",
					zIndex: 999999999,
					overflow: "hidden",
					transform: "translateX(0)",
					boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
					flexDirection: "column",
				};
			}
			Object.assign(widget.style, widgetStyles);

			widget.appendChild(this.createWidgetHeader());
			widget.appendChild(this.createWidgetContent());
			widget.appendChild(this.createWidgetFooter());

			widget.addEventListener("click", (e) => e.stopPropagation());

			document.body.appendChild(widget);

			// Inject custom scrollbar styles
			this.injectScrollbarStyles();
		}

		// If value=true, show immediately
		if (value) this.toggleWidget(true);
	}


	closeWidget() {
		const backdrop = document.querySelector(".wcag_tools_item_block")
		if (backdrop) {
			backdrop.style.opacity = "0"
			backdrop.style.transition = "opacity 0.3s ease"
			setTimeout(() => {
				backdrop.style.display = "none"
			}, 300)
		}

		// Hide widget instead of removing it (so it can be reused)
		const widget = document.querySelector("#wcag_tools_widget")
		if (widget) {
			const panelDragPos = this.state.widgetPanelDragPosition;
			if (panelDragPos && typeof panelDragPos.x === 'number' && typeof panelDragPos.y === 'number') {
				// Free position mode - just fade out
				widget.style.opacity = '0';
				widget.style.transition = "opacity 0.2s ease";
				setTimeout(() => {
					widget.style.display = "none";
					widget.style.opacity = '1'; // Reset for next show
				}, 200);
			} else {
				// Edge position mode - slide out
				const position = this.state.widgetPosition || 'left';
				widget.style.transform = position === 'left' ? "translateX(-100%)" : "translateX(100%)";
				widget.style.transition = "transform 0.3s ease";
				setTimeout(() => {
					widget.style.display = "none";
				}, 100);
			}
		}

		// Restore scroll ability
		document.body.style.overflow = ""

		// Remove scroll event listener
		window.onscroll = null
		this.state.isOpen = false
		this.updateMainButtonVisibility(true);
	}

	cleanupActiveFeatures() {
		// Clean up reading mask if active
		const readingMasks = document.querySelectorAll("#reading-mask-top, #reading-mask-bottom")
		readingMasks.forEach((mask) => mask.remove())

		// Reset zoom/scaling
		document.body.style.zoom = ""

		// Reset line height and letter spacing for all elements (except WCAG widget elements)
		const allElements = document.querySelectorAll('*');
		const wcagElementSelectors = [
			'#wcag_tools_widget',
			'.wcag_tools_item_block',
			'#wcap_tools_btn',
			'#wcag_skip_to_main_content_btn'
		];
		
		allElements.forEach(element => {
			let isWcagElement = false;
			wcagElementSelectors.forEach(selector => {
				if (element.matches(selector) || element.closest(selector)) {
					isWcagElement = true;
				}
			});
			
			if (!isWcagElement) {
				element.style.lineHeight = '';
				element.style.letterSpacing = '';
			}
		});

		// Clean up highlighted titles (except WCAG widget elements)
		const titles = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
		titles.forEach((title) => {
			let isWcagElement = false;
			wcagElementSelectors.forEach(selector => {
				if (title.matches(selector) || title.closest(selector)) {
					isWcagElement = true;
				}
			});
			
			if (!isWcagElement) {
				// Restore original styles if they were highlighted
				title.style.backgroundColor = title.dataset.originalBg || "";
				title.style.border = title.dataset.originalBorder || "";
				title.style.padding = title.dataset.originalPadding || "";
				title.style.borderRadius = title.dataset.originalBorderRadius || "";
				title.classList.remove("wcag-highlighted-title");
				
				// Clean up data attributes
				delete title.dataset.originalBg;
				delete title.dataset.originalBorder;
				delete title.dataset.originalPadding;
				delete title.dataset.originalBorderRadius;
			}
		});

		// Reset any other active features
		const settings = JSON.parse(localStorage.getItem("wcag_tools_enabled_list") || "{}")
		Object.keys(settings).forEach((key) => {
			if (settings[key]?.status) {
				delete settings[key]
			}
		})
		localStorage.setItem("wcag_tools_enabled_list", JSON.stringify(settings))
	}

	initKeyboardShortcuts() {
		document.addEventListener("keydown", (event) => {
			if (event.ctrlKey && event.key === "u") {
				event.preventDefault()
				this.toggleWidget()
			}
		})
	}

	createWidgetHeader() {
		const header = this.createElement(
			"div",
			{},
			{
				height: "50px",
				position: "relative",
				padding: "0px 20px",
				paddingBottom: "32px",
				paddingTop: "32px",
				background: "linear-gradient(180deg, #1e40af 0%, #3b82f6 100%)",
				color: "white",
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				cursor: "move", // Indicate draggable
				touchAction: "none",
				userSelect: "none",
			}
		)

		// Add drag functionality to the header for moving the entire widget panel
		let wasPanelDragged = false;

		const handlePanelMouseDown = (e) => {
			// Don't start drag if clicking the close button
			if (e.target.closest('button')) return;

			e.preventDefault();

			const widget = document.getElementById("wcag_tools_widget");
			if (!widget) return;

			const rect = widget.getBoundingClientRect();

			this.state.isWidgetPanelDragging = true;
			this.state.widgetPanelDragStartX = e.clientX;
			this.state.widgetPanelDragStartY = e.clientY;
			this.state.widgetPanelStartX = rect.left;
			this.state.widgetPanelStartY = rect.top;
			wasPanelDragged = false;

			// Visual feedback
			header.style.cursor = 'grabbing';
			widget.style.transition = 'none';
			widget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.3)';

			document.addEventListener('mousemove', handlePanelMouseMove);
			document.addEventListener('mouseup', handlePanelMouseUp);
		};

		const handlePanelMouseMove = (e) => {
			if (!this.state.isWidgetPanelDragging) return;

			const widget = document.getElementById("wcag_tools_widget");
			if (!widget) return;

			const deltaX = e.clientX - this.state.widgetPanelDragStartX;
			const deltaY = e.clientY - this.state.widgetPanelDragStartY;

			if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
				wasPanelDragged = true;
			}

			// Calculate new position
			let newX = this.state.widgetPanelStartX + deltaX;
			let newY = this.state.widgetPanelStartY + deltaY;

			// Constrain to viewport bounds
			const widgetWidth = widget.offsetWidth;
			const widgetHeight = widget.offsetHeight;
			const maxX = window.innerWidth - widgetWidth;
			const maxY = window.innerHeight - widgetHeight;

			newX = Math.max(0, Math.min(newX, maxX));
			newY = Math.max(0, Math.min(newY, maxY));

			// Update widget position - switch to free positioning mode
			widget.style.left = `${newX}px`;
			widget.style.right = 'auto';
			widget.style.top = `${newY}px`;
			widget.style.transform = 'none';
			widget.style.height = 'auto';
			widget.style.maxHeight = `${window.innerHeight - newY}px`;
		};

		const handlePanelMouseUp = (e) => {
			if (!this.state.isWidgetPanelDragging) return;

			this.state.isWidgetPanelDragging = false;

			document.removeEventListener('mousemove', handlePanelMouseMove);
			document.removeEventListener('mouseup', handlePanelMouseUp);

			const widget = document.getElementById("wcag_tools_widget");
			if (widget) {
				header.style.cursor = 'move';
				widget.style.transition = 'box-shadow 0.2s ease';
				widget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
			}

			if (wasPanelDragged && widget) {
				const rect = widget.getBoundingClientRect();
				this.state.widgetPanelDragPosition = { x: rect.left, y: rect.top };
				this.saveWidgetPanelDragPosition(rect.left, rect.top);

				// Update position state based on which side
				const halfWidth = window.innerWidth / 2;
				if (rect.left + widget.offsetWidth / 2 < halfWidth) {
					this.state.widgetPosition = 'left';
				} else {
					this.state.widgetPosition = 'right';
				}
				this.saveWidgetPosition(this.state.widgetPosition);

				accessibility.announceChange("Widget panel moved to new position");
			}
		};

		// Touch events for mobile
		const handlePanelTouchStart = (e) => {
			if (e.target.closest('button')) return;
			if (e.touches.length !== 1) return;

			const touch = e.touches[0];
			const widget = document.getElementById("wcag_tools_widget");
			if (!widget) return;

			const rect = widget.getBoundingClientRect();

			this.state.isWidgetPanelDragging = true;
			this.state.widgetPanelDragStartX = touch.clientX;
			this.state.widgetPanelDragStartY = touch.clientY;
			this.state.widgetPanelStartX = rect.left;
			this.state.widgetPanelStartY = rect.top;
			wasPanelDragged = false;

			widget.style.transition = 'none';
			widget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.3)';
		};

		const handlePanelTouchMove = (e) => {
			if (!this.state.isWidgetPanelDragging || e.touches.length !== 1) return;

			const touch = e.touches[0];
			const widget = document.getElementById("wcag_tools_widget");
			if (!widget) return;

			const deltaX = touch.clientX - this.state.widgetPanelDragStartX;
			const deltaY = touch.clientY - this.state.widgetPanelDragStartY;

			if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
				wasPanelDragged = true;
				e.preventDefault();
			}

			let newX = this.state.widgetPanelStartX + deltaX;
			let newY = this.state.widgetPanelStartY + deltaY;

			const widgetWidth = widget.offsetWidth;
			const widgetHeight = widget.offsetHeight;
			const maxX = window.innerWidth - widgetWidth;
			const maxY = window.innerHeight - widgetHeight;

			newX = Math.max(0, Math.min(newX, maxX));
			newY = Math.max(0, Math.min(newY, maxY));

			widget.style.left = `${newX}px`;
			widget.style.right = 'auto';
			widget.style.top = `${newY}px`;
			widget.style.transform = 'none';
			widget.style.height = 'auto';
			widget.style.maxHeight = `${window.innerHeight - newY}px`;
		};

		const handlePanelTouchEnd = (e) => {
			if (!this.state.isWidgetPanelDragging) return;

			this.state.isWidgetPanelDragging = false;

			const widget = document.getElementById("wcag_tools_widget");
			if (widget) {
				widget.style.transition = 'box-shadow 0.2s ease';
				widget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
			}

			if (wasPanelDragged && widget) {
				const rect = widget.getBoundingClientRect();
				this.state.widgetPanelDragPosition = { x: rect.left, y: rect.top };
				this.saveWidgetPanelDragPosition(rect.left, rect.top);

				const halfWidth = window.innerWidth / 2;
				if (rect.left + widget.offsetWidth / 2 < halfWidth) {
					this.state.widgetPosition = 'left';
				} else {
					this.state.widgetPosition = 'right';
				}
				this.saveWidgetPosition(this.state.widgetPosition);

				accessibility.announceChange("Widget panel moved to new position");
			}
		};

		// Add event listeners
		header.addEventListener("mousedown", handlePanelMouseDown);
		header.addEventListener("touchstart", handlePanelTouchStart, { passive: false });
		header.addEventListener("touchmove", handlePanelTouchMove, { passive: false });
		header.addEventListener("touchend", handlePanelTouchEnd);

		// Create title container for AccessiMate and Widget Features
		const titleContainer = this.createElement(
			"div",
			{},
			{
				flex: "1",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				textAlign: "center",
			}
		)

		const mainTitle = this.createElement(
			"h1",
			{},
			{
				margin: 0,
				fontSize: "20px",
				fontWeight: "700",
				color: '#fff',
				backgroundColor: 'transparent',
				border: 'none',
				padding: '0',
				borderRadius: '0',
				lineHeight: '1.2',
				letterSpacing: 'normal',
				textAlign: "center",
			},
			["Widget Features"]
		)

		const subtitle = this.createElement(
			"p",
			{},
			{
				margin: 0,
				fontSize: "16px",
				fontWeight: "500",
				color: 'rgba(255, 255, 255, 0.9)',
				backgroundColor: 'transparent',
				border: 'none',
				padding: '0',
				borderRadius: '0',
				lineHeight: '1.2',
				letterSpacing: 'normal',
				textAlign: "center",
			},
			["(CTRL+U)"]
		)

		// Apply font sizes with !important to override any cascading styles
		mainTitle.style.setProperty('font-size', '20px', 'important');
		subtitle.style.setProperty('font-size', '14px', 'important');

		titleContainer.appendChild(mainTitle)
		titleContainer.appendChild(subtitle)

		const closeBtn = this.createElement(
			"button",
			{
				"aria-label": "Close accessibility widget",
			},
			{
				marginLeft: "auto",
				width: "36px",
				height: "36px",
				padding: "0",
				background: "rgba(255, 255, 255, 0.1)",
				border: "2px solid rgba(255, 255, 255, 0.3)",
				borderRadius: "8px",
				cursor: "pointer",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
				zIndex: "50",
				lineHeight: "1",
				letterSpacing: "normal",
				fontSize: "16px",
				color: "white",
				fontWeight: "bold",
				transition: "all 0.3s ease",
				backdropFilter: "blur(10px)",
			},
			[
				this.createElement("i", { class: "fas fa-times" })
			]
		)

		// Add hover effects
		closeBtn.addEventListener("mouseenter", () => {
			closeBtn.style.background = "rgba(220, 38, 38, 0.9)";
			closeBtn.style.borderColor = "rgba(220, 38, 38, 1)";
			closeBtn.style.transform = "scale(1.1)";
			closeBtn.style.boxShadow = "0 6px 12px rgba(220, 38, 38, 0.3)";
		});

		closeBtn.addEventListener("mouseleave", () => {
			closeBtn.style.background = "rgba(255, 255, 255, 0.1)";
			closeBtn.style.borderColor = "rgba(255, 255, 255, 0.3)";
			closeBtn.style.transform = "scale(1)";
			closeBtn.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
		});

		// Add active state
		closeBtn.addEventListener("mousedown", () => {
			closeBtn.style.transform = "scale(0.95)";
		});

		closeBtn.addEventListener("mouseup", () => {
			closeBtn.style.transform = "scale(1.1)";
		});

		closeBtn.addEventListener("click", (e) => {
			e.stopPropagation()
			this.closeWidget()
		})

		header.appendChild(titleContainer)
		header.appendChild(closeBtn)
		return header
	}

	async validateAccess() {
		this.state.isValidating = true;
		this.state.isFetching = false;
		this.validationComponent.update();

		try {
			const response = await fetch(`${this.config.apiBaseUrl}/api/customer/validete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({
					api_key: currentApiKey,
					origin: pageOrigin
				})
			});
			const data = await response.json();
			
			this.state.isFetching = true;
			this.state.isValidating = false;
			
			if (data.status === true) {
				this.state.isValid = true;
				this.state.errorMessage = null;
				
				// Store API key and validation status in server cache
				if (currentApiKey) {
					// Get current adjustments from localStorage to store them
					const adjustments = {
						content: JSON.parse(localStorage.getItem("wcag-content-adjustments") || "{}"),
						color: JSON.parse(localStorage.getItem("wcag-color-adjustments") || "{}"),
						orientation: JSON.parse(localStorage.getItem("wcag-orientation-adjustments") || "{}"),
						enabled: JSON.parse(localStorage.getItem("wcag_tools_enabled_list") || "{}")
					};
					
					await cacheManager.storeToCache(currentApiKey, 'valid', adjustments);
				}
			} else {
				this.state.isValid = false;
				this.state.errorMessage = "Token invalid / Origin not allowed";
				
				// Clear stored validation data on failure
				await cacheManager.clearCache();
			}
			
			// Re-render the widget content
			const widgetContent = document.querySelector("#wcag_tools_widget > div:nth-child(2)");
			if (widgetContent) {
				widgetContent.replaceWith(this.createWidgetContent());
			}
		} catch (error) {
			console.error('API validation error:', error);
			this.state.isValid = false;
			this.state.errorMessage = "Failed to validate token";
			this.state.isFetching = true;
			this.state.isValidating = false;
			
			// Clear stored validation data on error
			await cacheManager.clearCache();
			
			// Re-render with error state
			const widgetContent = document.querySelector("#wcag_tools_widget > div:nth-child(2)");
			if (widgetContent) {
				widgetContent.replaceWith(this.createWidgetContent());
			}
		}
	}

	createWidgetContent() {
		// Gradient background wrapper
		const gradientWrapper = this.createElement(
			"div",
			{ class: "wcag-widget-gradient-wrapper" },
			{
				flex: "1",
				background: "linear-gradient(0deg, #3b82f6 100%)",
				position: "relative",
				zIndex: "1",
				padding: "4px",
				overflow: "hidden",
				display: "flex",
				flexDirection: "column",
			}
		);

		// Content container with scrolling enabled
		const container = this.createElement(
			"div",
			{ class: "wcag-widget-content" },
			{
				flex: "1",
				backgroundColor: "#e5e7eb",
				borderTopLeftRadius: "22px",
				borderTopRightRadius: "22px",
				position: "relative",
				zIndex: "2",
				overflowY: "auto",
				overflowX: "hidden",
			}
		)

		// Initial load: start validation or use cached validation
		if (!this.state.isFetching && !this.state.isValidating) {
			// If we have a previous validation and it's still valid, skip API call
			if (this.state.wasValidatedBefore && this.state.isValid) {
				// Set fetching state to show the widget content
				this.state.isFetching = true;
			} else {
				// Otherwise, validate access
				this.validateAccess();
				container.appendChild(this.validationComponent.render());
				gradientWrapper.appendChild(container);
				return gradientWrapper;
			}
		}

		// Show loading state
		if (this.state.isValidating) {
			container.appendChild(this.validationComponent.render());
			gradientWrapper.appendChild(container);
			return gradientWrapper;
		}

		// After fetch: show success or error
		if (this.state.isFetching) {
			if (this.state.isValid) {
				// Add Translate Page section at TOP
				container.appendChild(this.createTranslateSection());

				// Add Accessibility Profiles section below language
				container.appendChild(this.createAccessibilityProfilesSection());

				// Store component instances for reset all functionality
				this.contentAdjustment = new Adjustments.ContentAdjustment(this);
				this.colorAdjustment = new Adjustments.ColorAdjustment(this);
				this.orientationAdjustment = new Adjustments.OrientationAdjustment(this);

				const components = [this.contentAdjustment, this.colorAdjustment, this.orientationAdjustment];
				components.forEach(component => {
					container.appendChild(component.render());
				});

				// Add Reset All button
				container.appendChild(this.createResetAllButton());

				// Add Move Widget section
				container.appendChild(this.createMoveWidgetSection());

				// Restore active profile if saved
				const savedProfile = this.loadActiveProfile();
				if (savedProfile) {
					this.state.activeProfile = savedProfile;
					const profiles = this.getAccessibilityProfiles();
					if (profiles[savedProfile]) {
						this.activateProfile(profiles[savedProfile]);
						setTimeout(() => this.updateProfileButtons(), 100);
					}
				}

				// If the page is already translated (cookie or combo), snapshot translated defaults
				if (this.contentAdjustment?.isTranslationActive?.()) {
					setTimeout(() => this.captureTranslatedDefaults(), 600);
					setTimeout(() => this.captureTranslatedDefaults(), 1500);
				}
			} else {
				const notFoundElement = new NotFoundComponent(this.state.errorMessage || "Token is invalid");
				container.appendChild(notFoundElement);
			}
		}

		gradientWrapper.appendChild(container);
		return gradientWrapper;
	}

	createWidgetFooter() {
		const content = this.createElement(
			"div",
			{},
			{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: "10px",
				lineHeight: "1",
				width: "100%",
			},
			[
				this.createElement(
					"span",
					{},
					{
						display: "block",
						color: "#1e3a8a",
						fontWeight: "600",
						letterSpacing: "0.2px",
						fontSize: "14px",
					},
					["Powered by"]
				),
				this.createElement(
					"a",
					{
						href: "https://accessimate.com/",
						target: "_blank",
						rel: "noopener noreferrer",
						"aria-label": "Visit AccessiMate website",
					},
					{
						display: "block",
						lineHeight: "0",
					},
					[
						this.createElement(
							"img",
							{
								src: config.appMode === 'dev' ? `images/accessimate.png` : `${config.baseUrl}/images/accessimate.png`,
								alt: "AccessiMate logo",
							},
							{
								height: "28px",
								width: "auto",
								objectFit: "contain",
								display: "block",
								cursor: "pointer",
							}
						)
					]
				)
			]
		)

		return this.createElement(
			"div",
			{},
			{
				height: "50px",
				display: "flex",
				justifyContent: "center",
				padding: '0 20px',
				borderTop: "none",
				background: "white",
				alignItems: "center",
				fontSize: "14px",
				color: "#1e3a8a",
				fontWeight: "500",
			},
			[content]
		)
	}

	createResetAllButton() {
		const container = this.createElement(
			"div",
			{},
			{
				padding: "20px",
				borderTop: "1px solid #d1d5db",
				backgroundColor: "#e5e7eb",
				textAlign: "center",
			}
		);

		const gradientBackground = "linear-gradient(270deg, #1e40af 0%, #3b82f6 100%)";
		const gradientHoverBackground = "linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)";

		const resetButton = this.createElement(
			"button",
			{},
			{
				background: gradientBackground,
				color: "white",
				border: "none",
				padding: "10px 24px",
				borderRadius: "6px",
				fontSize: "14px",
				fontWeight: "600",
				cursor: "pointer",
				transition: "all 0.2s ease",
				display: "inline-flex",
				alignItems: "center",
				gap: "8px",
				width: "100%",
				maxWidth: "360px",
				justifyContent: "center",
				margin: "0 auto",
			},
			[
				this.createElement("i", { class: "fas fa-undo" }),
				"Reset All Adjustments"
			]
		);

		// Add hover effects
		resetButton.addEventListener("mouseenter", () => {
			resetButton.style.background = gradientHoverBackground;
			resetButton.style.transform = "translateY(-1px)";
		});

		resetButton.addEventListener("mouseleave", () => {
			resetButton.style.background = gradientBackground;
			resetButton.style.transform = "translateY(0)";
		});

		// Add click handler
		resetButton.addEventListener("click", () => {
			this.resetAllAdjustments();
		});

		container.appendChild(resetButton);
		return container;
	}

	// Create Translate Page section with Google Translate integration
	createTranslateSection() {
		const container = this.createElement(
			"div",
			{},
			{
				padding: "0 20px 20px 20px",
				backgroundColor: "#e5e7eb",
			}
		);

		// Collapsible header
		const header = this.createElement(
			"button",
			{
				"aria-expanded": this.state.translateSectionExpanded ? "true" : "false",
				"aria-controls": "translate-section-content",
			},
			{
				display: "flex",
				alignItems: "center",
				gap: "10px",
				width: "100%",
				padding: "12px 16px",
				marginTop: "20px",
				background: "white",
				border: "1px solid #d1d5db",
				borderRadius: "12px",
				cursor: "pointer",
				fontSize: "14px",
				fontWeight: "600",
				color: "#374151",
				transition: "all 0.2s ease",
			}
		);

		// Globe icon for translate
		const icon = this.createElement(
			"i",
			{ class: "fas fa-globe" },
			{
				fontSize: "16px",
				color: "#3b82f6",
			}
		);

		// Label text
		const label = this.createElement(
			"span",
			{},
			{ flex: "1", textAlign: "left" },
			["Translate Page"]
		);

		// Arrow indicator
		const arrow = this.createElement(
			"i",
			{ class: this.state.translateSectionExpanded ? "fas fa-chevron-up" : "fas fa-chevron-down", id: "translate-section-arrow" },
			{
				fontSize: "12px",
				color: "#6b7280",
				transition: "transform 0.2s ease",
			}
		);

		header.appendChild(icon);
		header.appendChild(label);
		header.appendChild(arrow);

		// Collapsible content
		const contentDiv = this.createElement(
			"div",
			{ id: "translate-section-content" },
			{
				display: this.state.translateSectionExpanded ? "block" : "none",
				background: "white",
				border: "1px solid #d1d5db",
				borderTop: "none",
				borderRadius: "0 0 8px 8px",
				padding: "12px 16px",
				marginTop: "-1px",
			}
		);

		// Custom language selector dropdown
		const selectWrapper = this.createElement(
			"div",
			{},
			{
				position: "relative",
				marginBottom: "8px",
			}
		);

		const languageSelect = this.createElement(
			"select",
			{ id: "accessimate-language-select", "aria-label": "Select language to translate page" },
			{
				width: "100%",
				padding: "10px 12px",
				fontSize: "14px",
				border: "1px solid #d1d5db",
				borderRadius: "6px",
				backgroundColor: "#fff",
				color: "#374151",
				cursor: "pointer",
				appearance: "none",
				backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%236b7280%27 d=%27M6 8L1 3h10z%27/%3E%3C/svg%3E')",
				backgroundRepeat: "no-repeat",
				backgroundPosition: "right 12px center",
				paddingRight: "36px",
			}
		);

		// Language options sourced from supported list
		this.translateLanguages.forEach((lang) => {
			const option = this.createElement("option", { value: lang.code }, {}, [lang.label]);
			if (!lang.code) {
				option.selected = true;
			}
			languageSelect.appendChild(option);
		});

		// Reflect an already-applied translation (combo or cookie) in the selector
		setTimeout(() => this.syncSelectedLanguage(), 0);

		// Handle language change
		languageSelect.addEventListener("change", (e) => {
			const langCode = e.target.value;
			if (langCode) {
				this.translatePage(langCode);
			}
		});

		selectWrapper.appendChild(languageSelect);

		// Info text
		const infoText = this.createElement(
			"p",
			{},
			{
				fontSize: "12px",
				color: "#6b7280",
				marginTop: "8px",
				marginBottom: "0",
			},
			["Powered by Google Translate"]
		);

		contentDiv.appendChild(selectWrapper);
		contentDiv.appendChild(infoText);

		// Ensure the TranslateElement mount point exists even when this section is collapsed.
		// This container is kept offscreen in <body> so Google Translate can reliably initialize.
		this.ensureGoogleTranslateContainer();

		// Toggle expanded state on header click
		header.addEventListener("click", () => {
			this.state.translateSectionExpanded = !this.state.translateSectionExpanded;
			contentDiv.style.display = this.state.translateSectionExpanded ? "block" : "none";
			header.setAttribute("aria-expanded", this.state.translateSectionExpanded ? "true" : "false");
			arrow.className = this.state.translateSectionExpanded ? "fas fa-chevron-up" : "fas fa-chevron-down";

			// Update header border radius when expanded
			if (this.state.translateSectionExpanded) {
				header.style.borderRadius = "8px 8px 0 0";
			} else {
				header.style.borderRadius = "12px";
			}
		});

		// Hover effect for header
		header.addEventListener("mouseenter", () => {
			header.style.backgroundColor = "#f9fafb";
		});

		header.addEventListener("mouseleave", () => {
			header.style.backgroundColor = "white";
		});

		container.appendChild(header);
		container.appendChild(contentDiv);

		return container;
	}

	// Accessibility Profiles definitions
	// Fully mappable profiles based on available widgets
	getAccessibilityProfiles() {
		return {
			colorBlind: {
				id: "colorBlind",
				label: "Color Blind",
				icon: "fa-solid fa-palette",
				description: "Enhanced contrast and saturation",
				settings: {
					color: { contrastMode: "dark", saturationMode: "high" }
				}
			},
			seizure: {
				id: "seizure",
				label: "Seizure Safe",
				icon: "fa-solid fa-bolt",
				description: "Reduced motion and saturation",
				settings: {
					orientation: { pauseAnimations: true },
					color: { saturationMode: "low" }
				}
			},
			adhd: {
				id: "adhd",
				label: "ADHD Friendly",
				icon: "fa-solid fa-bullseye",
				description: "Focus assistance tools",
				settings: {
					orientation: { pauseAnimations: true, readingMask: true },
					color: { saturationMode: "low" }
				}
			}
		};
	}

	// Create Accessibility Profiles section
	createAccessibilityProfilesSection() {
		const container = this.createElement(
			"div",
			{ id: "accessibility-profiles-section" },
			{
				padding: "0 20px 12px 20px",
				backgroundColor: "#e5e7eb",
			}
		);

		const header = this.createElement(
			"button",
			{
				"aria-expanded": this.state.profilesSectionExpanded ? "true" : "false",
				"aria-controls": "profiles-section-content",
			},
			{
				display: "flex",
				alignItems: "center",
				gap: "10px",
				width: "100%",
				padding: "12px 16px",
				border: "1px solid #d1d5db",
				borderRadius: this.state.profilesSectionExpanded ? "8px 8px 0 0" : "12px",
				background: "white",
				cursor: "pointer",
				textAlign: "left",
				fontSize: "14px",
				fontWeight: "600",
				color: "#1f2937",
				transition: "background 0.15s ease",
			}
		);

		// Accessibility icon
		const icon = this.createElement(
			"i",
			{ class: "fas fa-universal-access" },
			{
				fontSize: "16px",
				color: "#3b82f6",
			}
		);

		const label = this.createElement(
			"span",
			{},
			{ flex: "1", textAlign: "left" },
			["Accessibility Profiles"]
		);

		// Arrow indicator
		const arrow = this.createElement(
			"i",
			{ class: this.state.profilesSectionExpanded ? "fas fa-chevron-up" : "fas fa-chevron-down", id: "profiles-section-arrow" },
			{
				fontSize: "12px",
				color: "#6b7280",
				transition: "transform 0.2s ease",
			}
		);

		header.appendChild(icon);
		header.appendChild(label);
		header.appendChild(arrow);

		// Collapsible content
		const contentDiv = this.createElement(
			"div",
			{ id: "profiles-section-content" },
			{
				display: this.state.profilesSectionExpanded ? "block" : "none",
				background: "white",
				border: "1px solid #d1d5db",
				borderTop: "none",
				borderRadius: "0 0 8px 8px",
				padding: "12px 16px",
			}
		);

		// Create profiles grid
		const profilesGrid = this.createElement(
			"div",
			{},
			{
				display: "grid",
				gridTemplateColumns: "repeat(2, 1fr)",
				gap: "10px",
			}
		);

		const profiles = this.getAccessibilityProfiles();
		Object.values(profiles).forEach((profile) => {
			const profileButton = this.createProfileButton(profile);
			profilesGrid.appendChild(profileButton);
		});

		contentDiv.appendChild(profilesGrid);

		// Toggle expanded state on header click
		header.addEventListener("click", () => {
			this.state.profilesSectionExpanded = !this.state.profilesSectionExpanded;
			contentDiv.style.display = this.state.profilesSectionExpanded ? "block" : "none";
			header.setAttribute("aria-expanded", this.state.profilesSectionExpanded ? "true" : "false");
			arrow.className = this.state.profilesSectionExpanded ? "fas fa-chevron-up" : "fas fa-chevron-down";

			if (this.state.profilesSectionExpanded) {
				header.style.borderRadius = "8px 8px 0 0";
			} else {
				header.style.borderRadius = "12px";
			}
		});

		// Hover effect for header
		header.addEventListener("mouseenter", () => {
			header.style.backgroundColor = "#f9fafb";
		});

		header.addEventListener("mouseleave", () => {
			header.style.backgroundColor = "white";
		});

		container.appendChild(header);
		container.appendChild(contentDiv);

		return container;
	}

	// Create individual profile button
	createProfileButton(profile) {
		const isActive = this.state.activeProfile === profile.id;
		const accentColor = "#1e3a8a";

		const button = this.createElement(
			"button",
			{
				"data-profile-id": profile.id,
				"aria-pressed": isActive ? "true" : "false",
				title: profile.description,
			},
			{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "8px",
				padding: "16px 12px",
				border: isActive ? `2px solid ${accentColor}` : "1px solid #e5e7eb",
				borderRadius: "10px",
				background: isActive ? "#eff6ff" : "white",
				cursor: "pointer",
				transition: "all 0.15s ease",
				boxShadow: "none",
				position: "relative",
			}
		);

		// Checkmark badge for active state
		if (isActive) {
			const checkBadge = this.createElement(
				"div",
				{},
				{
					position: "absolute",
					top: "-6px",
					right: "-6px",
					width: "18px",
					height: "18px",
					borderRadius: "50%",
					background: accentColor,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}
			);
			const checkIcon = this.createElement(
				"i",
				{ class: "fas fa-check" },
				{
					color: "white",
					fontSize: "10px",
				}
			);
			checkBadge.appendChild(checkIcon);
			button.appendChild(checkBadge);
		}

		// Icon container
		const iconContainer = this.createElement(
			"div",
			{},
			{
				width: "44px",
				height: "44px",
				borderRadius: "50%",
				background: isActive ? accentColor : "#f3f4f6",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}
		);

		const iconElement = this.createElement(
			"i",
			{ class: profile.icon },
			{
				fontSize: "18px",
				color: isActive ? "white" : "#6b7280",
			}
		);
		iconContainer.appendChild(iconElement);

		// Label
		const labelElement = this.createElement(
			"span",
			{},
			{
				fontSize: "12px",
				fontWeight: "500",
				color: isActive ? accentColor : "#374151",
				textAlign: "center",
			},
			[profile.label]
		);

		button.appendChild(iconContainer);
		button.appendChild(labelElement);

		// Click handler
		button.addEventListener("click", () => {
			this.toggleProfile(profile.id);
		});

		// Hover effects
		button.addEventListener("mouseenter", () => {
			if (!isActive) {
				button.style.borderColor = "#3b82f6";
				button.style.background = "#f9fafb";
				button.style.boxShadow = "0 2px 6px rgba(15, 23, 42, 0.08)";
			}
		});

		button.addEventListener("mouseleave", () => {
			if (!isActive) {
				button.style.borderColor = "#e5e7eb";
				button.style.background = "white";
				button.style.boxShadow = "none";
			}
		});

		return button;
	}

	// Toggle accessibility profile on/off
	toggleProfile(profileId) {
		const profiles = this.getAccessibilityProfiles();
		const profile = profiles[profileId];
		if (!profile) return;

		const wasActive = this.state.activeProfile === profileId;

		if (wasActive) {
			// Deactivate profile - reset all settings
			this.deactivateProfile(profile);
			this.state.activeProfile = null;
			accessibility.announceChange(`${profile.label} profile deactivated`);
		} else {
			// Deactivate previous profile first if any
			if (this.state.activeProfile) {
				const prevProfile = profiles[this.state.activeProfile];
				if (prevProfile) {
					this.deactivateProfile(prevProfile);
				}
			}

			// Activate new profile
			this.activateProfile(profile);
			this.state.activeProfile = profileId;
			accessibility.announceChange(`${profile.label} profile activated`);
		}

		// Save active profile to localStorage
		this.saveActiveProfile();

		// Update all profile buttons
		this.updateProfileButtons();

		// Update feature count
		this.updateActiveFeatureCount();
	}

	// Activate a profile by applying its settings
	activateProfile(profile) {
		const settings = profile.settings;

		// Apply color adjustment settings
		if (settings.color && this.colorAdjustment) {
			if (settings.color.contrastMode) {
				this.colorAdjustment.setContrastMode(settings.color.contrastMode, true);
				this.colorAdjustment.updateControlAppearance("contrast");
			}
			if (settings.color.saturationMode) {
				this.colorAdjustment.setSaturationMode(settings.color.saturationMode, true);
				this.colorAdjustment.updateControlAppearance("saturation");
			}
		}

		// Apply orientation adjustment settings
		if (settings.orientation && this.orientationAdjustment) {
			if (settings.orientation.pauseAnimations) {
				this.orientationAdjustment.togglePauseAnimations(true, true);
				this.orientationAdjustment.updateControlAppearance("pauseAnimations");
			}
			if (settings.orientation.readingMask) {
				this.orientationAdjustment.toggleReadingMask(true, true);
				this.orientationAdjustment.updateControlAppearance("readingMask");
			}
			if (settings.orientation.screenReader) {
				this.orientationAdjustment.toggleScreenRecording(true, true);
				this.orientationAdjustment.updateControlAppearance("screenReader");
			}
		}
	}

	// Deactivate a profile by resetting its settings
	deactivateProfile(profile) {
		const settings = profile.settings;

		// Reset color adjustment settings
		if (settings.color && this.colorAdjustment) {
			if (settings.color.contrastMode) {
				this.colorAdjustment.setContrastMode("default", true);
				this.colorAdjustment.updateControlAppearance("contrast");
			}
			if (settings.color.saturationMode) {
				this.colorAdjustment.setSaturationMode("default", true);
				this.colorAdjustment.updateControlAppearance("saturation");
			}
		}

		// Reset orientation adjustment settings
		if (settings.orientation && this.orientationAdjustment) {
			if (settings.orientation.pauseAnimations) {
				this.orientationAdjustment.togglePauseAnimations(false, true);
				this.orientationAdjustment.updateControlAppearance("pauseAnimations");
			}
			if (settings.orientation.readingMask) {
				this.orientationAdjustment.toggleReadingMask(false, true);
				this.orientationAdjustment.updateControlAppearance("readingMask");
			}
			if (settings.orientation.screenReader) {
				this.orientationAdjustment.toggleScreenRecording(false, true);
				this.orientationAdjustment.updateControlAppearance("screenReader");
			}
		}
	}

	// Update visual state of all profile buttons
	updateProfileButtons() {
		const profiles = this.getAccessibilityProfiles();
		const accentColor = "#1e3a8a";

		Object.values(profiles).forEach((profile) => {
			const button = document.querySelector(`[data-profile-id="${profile.id}"]`);
			if (!button) return;

			const isActive = this.state.activeProfile === profile.id;

			// Update button styles
			button.style.border = isActive ? `2px solid ${accentColor}` : "1px solid #e5e7eb";
			button.style.background = isActive ? "#eff6ff" : "white";
			button.setAttribute("aria-pressed", isActive ? "true" : "false");

			// Update icon container
			const iconContainer = button.querySelector("div");
			if (iconContainer) {
				iconContainer.style.background = isActive ? accentColor : "#f3f4f6";
				const icon = iconContainer.querySelector("i");
				if (icon) {
					icon.style.color = isActive ? "white" : "#6b7280";
				}
			}

			// Update label
			const label = button.querySelector("span");
			if (label) {
				label.style.color = isActive ? accentColor : "#374151";
			}

			// Handle checkmark badge
			const existingBadge = button.querySelector("div[style*='position: absolute']");
			if (isActive && !existingBadge) {
				const checkBadge = this.createElement(
					"div",
					{},
					{
						position: "absolute",
						top: "-6px",
						right: "-6px",
						width: "18px",
						height: "18px",
						borderRadius: "50%",
						background: accentColor,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}
				);
				const checkIcon = this.createElement(
					"i",
					{ class: "fas fa-check" },
					{
						color: "white",
						fontSize: "10px",
					}
				);
				checkBadge.appendChild(checkIcon);
				button.appendChild(checkBadge);
			} else if (!isActive && existingBadge) {
				existingBadge.remove();
			}
		});
	}

	// Save active profile to localStorage
	saveActiveProfile() {
		try {
			if (this.state.activeProfile) {
				localStorage.setItem("wcag-active-profile", this.state.activeProfile);
			} else {
				localStorage.removeItem("wcag-active-profile");
			}
		} catch (error) {
			console.warn("Failed to save active profile:", error);
		}
	}

	// Load active profile from localStorage
	loadActiveProfile() {
		try {
			return localStorage.getItem("wcag-active-profile") || null;
		} catch (error) {
			console.warn("Failed to load active profile:", error);
			return null;
		}
	}

	// Translate the page using Google Translate
	translatePage(langCode) {
		if (!langCode) return;

		// Avoid unnecessary reloads if the requested language is already active
		try {
			const activeLang = this.getActiveTranslationLanguage?.();
			if (activeLang && activeLang === langCode) {
				this.syncSelectedLanguage(langCode);
				return;
			}
		} catch (_) {
			// no-op
		}

		const languageName = this.translateLanguageLabels[langCode] || langCode;
		this.state.pendingTranslateLang = langCode;

		// Get Google's internal language code (some differ from ISO codes)
		const googleLangCode = getGoogleLangCode(langCode);

		// Ensure the Google Translate script is queued before making changes
		this.initGoogleTranslate();
		this.ensureGoogleTranslateContainer();

		// Method 1: Use cookie-based translation (works with new Translate UI)
		// Keep a single googtrans cookie so language changes apply consistently
		const domain = window.location.hostname;
		const isIPAddress = (hostname) => /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
		const getParentDomain = (hostname) => {
			if (!hostname || hostname === 'localhost' || isIPAddress(hostname)) {
				return null;
			}

			const parts = hostname.split('.');
			if (parts.length > 2) {
				return `.${parts.slice(-2).join('.')}`;
			}

			return null;
		};
		const clearGoogtransCookie = () => {
			const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
			const base = `googtrans=; path=/; expires=${expired}`;
			document.cookie = base;
			if (domain && domain !== 'localhost' && !isIPAddress(domain)) {
				document.cookie = `${base}; domain=${domain}`;
				document.cookie = `${base}; domain=.${domain}`;
				const parentDomain = getParentDomain(domain);
				if (parentDomain) {
					document.cookie = `${base}; domain=${parentDomain}`;
				}
			}
		};
		clearGoogtransCookie();
		if (domain && domain !== 'localhost' && !isIPAddress(domain)) {
			const parentDomain = getParentDomain(domain);
			if (parentDomain) {
				document.cookie = `googtrans=/en/${googleLangCode}; path=/; domain=${parentDomain}`;
			} else {
				document.cookie = `googtrans=/en/${googleLangCode}; path=/; domain=.${domain}`;
			}
		} else {
			document.cookie = `googtrans=/en/${googleLangCode}; path=/`;
		}
		this.initTranslateHighlightBlocker();

		// Method 2: Prefer the classic combo when available (more reliable than reload-based cookie apply).
		// Retry for a short period because the TranslateElement UI can mount asynchronously.
		if (this.translateApplyTimer) {
			clearTimeout(this.translateApplyTimer);
			this.translateApplyTimer = null;
		}

		const startedAt = Date.now();
		const maxWaitMs = 6000;
		const retryEveryMs = 250;

		const fallbackReloadOnce = () => {
			// Fallback: reload once to let the cookie take effect.
			this.state.pendingTranslateLang = null;
			this.translateApplyTimer = null;

			let canReload = true;
			try {
				const key = 'wcag_translate_reload_guard';
				const last = JSON.parse(sessionStorage.getItem(key) || 'null');
				const now = Date.now();
				if (last && last.langCode === langCode && (now - last.ts) < 10000) {
					canReload = false;
				}
				sessionStorage.setItem(key, JSON.stringify({ langCode, ts: now }));
			} catch (error) {
				// If sessionStorage isn't available, fall back to reload anyway.
				canReload = true;
			}

			if (canReload) {
				window.location.reload();
			} else {
				console.warn('Skipping translate reload to avoid a reload loop.');
			}
		};

		// Helper to try setting combo value with multiple possible codes
		const trySetComboValue = (combo, codes) => {
			for (const code of codes) {
				// Check if this code exists as an option
				const option = Array.from(combo.options).find(opt => opt.value === code);
				if (option) {
					combo.value = code;
					combo.dispatchEvent(new Event('change', { bubbles: true }));
					return true;
				}
			}
			return false;
		};

		const attemptApply = () => {
			const combo = document.querySelector('.goog-te-combo');
			if (combo) {
				// Try Google's internal code first, then our standard code
				const codesToTry = [googleLangCode, langCode].filter((v, i, a) => a.indexOf(v) === i);
				const success = trySetComboValue(combo, codesToTry);

				if (success) {
					// Extra nudge: some pages need a second dispatch after DOM settles.
					setTimeout(() => {
						try {
							trySetComboValue(combo, codesToTry);
						} catch (_) {
							// no-op
						}
					}, 400);

					this.state.pendingTranslateLang = null;
					this.translateApplyTimer = null;
					accessibility.announceChange("Page is being translated to " + languageName);
					return;
				}
				// If no matching option found, fall through to retry or fallback
			}

			// When TranslateElement renders as `.goog-te-gadget-simple`, there is no `.goog-te-combo` to drive.
			// Switching languages reliably requires a reload with the updated cookie.
			if (document.querySelector('#google_translate_element .goog-te-gadget-simple')) {
				fallbackReloadOnce();
				return;
			}

			if (Date.now() - startedAt < maxWaitMs) {
				this.translateApplyTimer = setTimeout(attemptApply, retryEveryMs);
				return;
			}

			fallbackReloadOnce();
		};

		attemptApply();

		accessibility.announceChange("Translating page to " + languageName + "...");
		this.scheduleTranslateBannerCleanup();

		// Keep custom selector in sync with the chosen language
		this.syncSelectedLanguage(langCode);
		setTimeout(() => this.syncSelectedLanguage(langCode), 800);
		setTimeout(() => this.syncSelectedLanguage(), 2000);

		// After translation runs, capture the translated defaults so controls can reset without losing language
		setTimeout(() => this.captureTranslatedDefaults(), 1200);
		setTimeout(() => this.captureTranslatedDefaults(), 2500);
	}


	// Initialize Google Translate widget
	initGoogleTranslate() {
		if (this.state.googleTranslateInitialized) return;

		const self = this;
		const includedLanguages = this.translateLanguageCodesCsv;

		// Ensure target container and styles exist even before the section opens
		this.ensureGoogleTranslateContainer();
		// Add CSS to fix Google Translate dropdown visibility
		this.addGoogleTranslateStyles();

		// Check if Google Translate script is already loaded
		if (!window.google || !window.google.translate) {
			// Load the Google Translate script
			const script = document.createElement('script');
			script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
			script.async = true;
			document.head.appendChild(script);

			// Define the callback function globally
			window.googleTranslateElementInit = function() {
				new google.translate.TranslateElement({
					pageLanguage: 'en',
					includedLanguages: includedLanguages,
					layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
					autoDisplay: false,
				}, 'google_translate_element');

				self.state.googleTranslateInitialized = true;

				// If a language was requested before init completed, apply it now
				if (self.state.pendingTranslateLang) {
					self.translatePage(self.state.pendingTranslateLang);
				}

				// Announce for accessibility
				accessibility.announceChange("Google Translate is now available. Select a language to translate this page.");
			};
		} else {
			// Google Translate already loaded, just initialize
			new google.translate.TranslateElement({
				pageLanguage: 'en',
				includedLanguages: includedLanguages,
				layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
				autoDisplay: false,
			}, 'google_translate_element');

			this.state.googleTranslateInitialized = true;

			// Apply any queued language after init
			if (this.state.pendingTranslateLang) {
				this.translatePage(this.state.pendingTranslateLang);
			}
		}

		this.scheduleTranslateBannerCleanup();
	}

	// Add CSS styles for Google Translate dropdown to work properly
	addGoogleTranslateStyles() {
		if (document.getElementById('google-translate-fix-styles')) return;

		const style = document.createElement('style');
		style.id = 'google-translate-fix-styles';
		style.textContent = `
			/* Fix Google Translate dropdown visibility */
			.goog-te-menu-frame {
				position: fixed !important;
				z-index: 2147483647 !important;
				box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
			}

			/* Style the Google Translate gadget */
			#google_translate_element {
				position: relative;
			}

			#google_translate_element .goog-te-gadget {
				font-family: inherit !important;
			}

			#google_translate_element .goog-te-gadget-simple {
				background-color: #fff !important;
				border: 1px solid #d1d5db !important;
				border-radius: 6px !important;
				padding: 8px 12px !important;
				display: inline-flex !important;
				align-items: center !important;
				cursor: pointer !important;
				font-size: 14px !important;
			}

			#google_translate_element .goog-te-gadget-simple:hover {
				background-color: #f3f4f6 !important;
				border-color: #3b82f6 !important;
			}

			#google_translate_element .goog-te-gadget-simple .goog-te-menu-value {
				color: #374151 !important;
			}

			#google_translate_element .goog-te-gadget-simple .goog-te-menu-value span:first-child {
				display: none !important;
			}

			/* Hide Google branding */
			#google_translate_element .goog-te-gadget-simple img {
				display: none !important;
			}

			#google_translate_element .goog-te-gadget-simple .goog-te-gadget-icon {
				display: none !important;
			}

			/* Style dropdown arrow */
			#google_translate_element .goog-te-gadget-simple span[style*="border-left"] {
				border-left-color: #6b7280 !important;
				margin-left: 8px !important;
			}

			/* Ensure widget container allows overflow for dropdown */
			#translate-section-content {
				overflow: visible !important;
			}

			/* Google Translate banner at top - hide it */
			.goog-te-banner-frame,
			.goog-te-banner-frame.skiptranslate,
			.goog-te-banner,
			.skiptranslate.goog-te-banner,
			.skiptranslate.goog-te-banner-frame {
				display: none !important;
			}

			/* Hide NEW Google Translate banner (2024+ class names) */
			.VIpgJd-ZVi9od-ORHb-OEVmcd,
			.VIpgJd-ZVi9od-ORHb-OEVmcd.skiptranslate,
			iframe.skiptranslate[style*="position: fixed"] {
				display: none !important;
				height: 0 !important;
				visibility: hidden !important;
			}

			body {
				top: 0 !important;
				position: static !important;
			}

			/* Make sure the iframe dropdown appears above everything */
			iframe.goog-te-menu-frame {
				z-index: 2147483647 !important;
			}

			/* Hide Google "View translated" bar/tooltip triggers */
			.goog-text-highlight {
				background: none !important;
				box-shadow: none !important;
				border: none !important;
			}

			/* Disable hover highlights on translated text */
			font[style*="vertical-align: inherit"],
			font[style*="background"] {
				background: none !important;
				background-color: transparent !important;
			}

			/* Prevent any font element from getting highlight background */
			.skiptranslate ~ * font,
			font {
				background: inherit !important;
			}

			/* Hide Google's tooltip/popup elements */
			.VIpgJd-ZVi9od-xl07Ob-OEVmcd,
			.VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
			.VIpgJd-ZVi9od-aZ2wEe-OiiCO {
				display: none !important;
			}

			/* Force body to ignore Google banner spacing */
			body.skiptranslate, body {
				top: 0 !important;
				position: static !important;
			}

			/* Force html/body to ignore any top offset Google applies */
			html.translated-ltr,
			html.translated-rtl {
				margin-top: 0 !important;
			}

			body.translated-ltr,
			body.translated-rtl {
				top: 0 !important;
			}

			html {
				margin-top: 0 !important;
			}
		`;
		document.head.appendChild(style);
		// Also ensure the hidden gadget stays available even when the section is closed
	}

	initTranslateHighlightBlocker() {
		if (this.highlightBlockerActive) return;
		if (document.getElementById('google-translate-highlight-blocker')) {
			this.highlightBlockerActive = true;
			return;
		}

		const style = document.createElement('style');
		style.id = 'google-translate-highlight-blocker';
		style.textContent = `
			font {
				background: none !important;
				background-color: transparent !important;
			}
		`;
		document.head.appendChild(style);
		this.highlightBlockerActive = true;
	}

	scheduleTranslateBannerCleanup() {
		// Clear any existing cleanup loop
		if (this.bannerCleanupTimer) {
			clearInterval(this.bannerCleanupTimer);
		}

		let attempts = 0;
		const maxAttempts = 20; // ~6s total (300ms interval)

		this.bannerCleanupTimer = setInterval(() => {
			attempts += 1;
			this.hideGoogleTranslateBanner();

			if (attempts >= maxAttempts) {
				clearInterval(this.bannerCleanupTimer);
				this.bannerCleanupTimer = null;
			}
		}, 300);
	}

	hideGoogleTranslateBanner() {
		try {
			const bannerFrame = document.querySelector('iframe.goog-te-banner-frame');
			if (bannerFrame && bannerFrame.parentNode) {
				bannerFrame.parentNode.removeChild(bannerFrame);
			}

			const oldBanners = document.querySelectorAll('.goog-te-banner, .goog-te-banner-frame, iframe.goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame');
			oldBanners.forEach((el) => el.remove());

			const newBanners = document.querySelectorAll('.VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-ORHb-OEVmcd.skiptranslate, iframe.skiptranslate[style*="position: fixed"]');
			newBanners.forEach((el) => {
				el.style.display = 'none';
				el.style.height = '0';
				el.style.visibility = 'hidden';
			});

			// Reset any style offsets Google might have applied
			document.documentElement.style.marginTop = '0px';
			document.body.style.position = 'static';
			document.body.style.top = '0px';
		} catch (error) {
			console.warn('Failed to hide Google translate banner:', error);
		}
	}


	// Create Move Widget section with collapsible UI and radio buttons
	createMoveWidgetSection() {
		const container = this.createElement(
			"div",
			{},
			{
				padding: "0 20px 20px 20px",
				backgroundColor: "#e5e7eb",
			}
		);

		// Collapsible header
		const header = this.createElement(
			"button",
			{
				"aria-expanded": this.state.moveWidgetExpanded ? "true" : "false",
				"aria-controls": "move-widget-content",
			},
			{
				display: "flex",
				alignItems: "center",
				gap: "10px",
				width: "100%",
				padding: "12px 16px",
				background: "white",
				border: "1px solid #d1d5db",
				borderRadius: "12px",
				cursor: "pointer",
				fontSize: "14px",
				fontWeight: "600",
				color: "#374151",
				transition: "all 0.2s ease",
			}
		);

		// Settings icon
		const icon = this.createElement(
			"i",
			{ class: "fas fa-cog" },
			{
				fontSize: "16px",
				color: "#3b82f6",
			}
		);

		// Label text
		const label = this.createElement(
			"span",
			{},
			{ flex: "1", textAlign: "left" },
			["Move Widget"]
		);

		// Arrow indicator
		const arrow = this.createElement(
			"i",
			{ class: this.state.moveWidgetExpanded ? "fas fa-chevron-up" : "fas fa-chevron-down", id: "move-widget-arrow" },
			{
				fontSize: "12px",
				color: "#6b7280",
				transition: "transform 0.2s ease",
			}
		);

		header.appendChild(icon);
		header.appendChild(label);
		header.appendChild(arrow);

		// Collapsible content
		const contentDiv = this.createElement(
			"div",
			{ id: "move-widget-content" },
			{
				display: this.state.moveWidgetExpanded ? "block" : "none",
				background: "white",
				border: "1px solid #d1d5db",
				borderTop: "none",
				borderRadius: "0 0 8px 8px",
				padding: "12px 16px",
				marginTop: "-1px",
			}
		);

		// Radio button for Left
		const leftOption = this.createPositionRadioOption('left', 'Left', this.state.widgetPosition === 'left');
		const rightOption = this.createPositionRadioOption('right', 'Right', this.state.widgetPosition === 'right');

		contentDiv.appendChild(leftOption);
		contentDiv.appendChild(rightOption);

		// Toggle expanded state on header click
		header.addEventListener("click", () => {
			this.state.moveWidgetExpanded = !this.state.moveWidgetExpanded;
			contentDiv.style.display = this.state.moveWidgetExpanded ? "block" : "none";
			header.setAttribute("aria-expanded", this.state.moveWidgetExpanded ? "true" : "false");
			arrow.className = this.state.moveWidgetExpanded ? "fas fa-chevron-up" : "fas fa-chevron-down";
			
			// Update header border radius when expanded
			if (this.state.moveWidgetExpanded) {
				header.style.borderRadius = "8px 8px 0 0";
			} else {
				header.style.borderRadius = "12px";
			}
		});

		// Hover effect for header
		header.addEventListener("mouseenter", () => {
			header.style.backgroundColor = "#f9fafb";
		});
		header.addEventListener("mouseleave", () => {
			header.style.backgroundColor = "white";
		});

		container.appendChild(header);
		container.appendChild(contentDiv);

		return container;
	}

	// Create a radio button option for position selection
	createPositionRadioOption(value, labelText, isChecked) {
		const wrapper = this.createElement(
			"label",
			{},
			{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "10px 0",
				cursor: "pointer",
				borderBottom: value === 'left' ? "1px solid #e5e7eb" : "none",
			}
		);

		const labelSpan = this.createElement(
			"span",
			{},
			{
				fontSize: "14px",
				color: "#374151",
			},
			[labelText]
		);

		const radio = document.createElement("input");
		radio.type = "radio";
		radio.name = "wcag-widget-position";
		radio.id = `wcag-position-${value}`;
		radio.value = value;
		radio.checked = isChecked;
		Object.assign(radio.style, {
			width: "20px",
			height: "20px",
			accentColor: "#3b82f6",
			cursor: "pointer",
		});

		radio.addEventListener("change", () => {
			if (radio.checked) {
				this.setWidgetPosition(value);
			}
		});

		wrapper.appendChild(labelSpan);
		wrapper.appendChild(radio);

		return wrapper;
	}

	resetAllAdjustments() {
		// Reset all adjustment components
		if (this.contentAdjustment) {
			this.contentAdjustment.reset();
		}
		if (this.colorAdjustment) {
			this.colorAdjustment.reset();
		}
		if (this.orientationAdjustment) {
			this.orientationAdjustment.reset();
		}

		// Reset active profile
		if (this.state.activeProfile) {
			this.state.activeProfile = null;
			this.saveActiveProfile();
			this.updateProfileButtons();
		}

		// Clear cache when resetting all adjustments
		this.updateAdjustmentsInCache();

		//  Reset wipes everything, so refresh the badge afterward
		this.updateActiveFeatureCount();

		// Re-apply translation if Google Translate is active
		// This ensures widget text remains translated after reset
		this.reapplyTranslationIfActive();

		// Announce the reset action
		accessibility.announceChange("All accessibility adjustments have been reset to default");
	}

	// Re-apply translation if Google Translate is currently active
	reapplyTranslationIfActive() {
		// Check if Google Translate is active by looking for the goog-te-combo
		const combo = document.querySelector('.goog-te-combo');
		if (combo && combo.value && combo.value !== '') {
			const currentLang = combo.value;

			// Use a single longer delay to ensure all DOM modifications have settled,
			// then re-trigger translation by changing the language dropdown
			setTimeout(() => {
				// Force Google Translate to re-process by toggling the language
				// First set to a neutral state
				const googFrame = document.querySelector('.goog-te-menu-frame');
				if (googFrame) {
					// If Google Translate iframe exists, trigger re-translation
					combo.value = currentLang;
					combo.dispatchEvent(new Event('change', { bubbles: true }));
				} else {
					// Fallback: directly set and trigger
					combo.value = currentLang;
					combo.dispatchEvent(new Event('change', { bubbles: true }));
				}
			}, 500);

			// Additional retry at 1.5 seconds in case the first attempt didn't work
			setTimeout(() => {
				const currentValue = combo.value;
				if (currentValue === currentLang) {
					// Language is set but translation might not have applied to new elements
					// Force re-translate by briefly clearing and re-setting
					combo.value = '';
					combo.dispatchEvent(new Event('change', { bubbles: true }));

					setTimeout(() => {
						combo.value = currentLang;
						combo.dispatchEvent(new Event('change', { bubbles: true }));
					}, 100);
				}
			}, 1500);

			// After translation has been re-applied, refresh stored default labels
			setTimeout(() => this.captureTranslatedDefaults(), 2000);
			setTimeout(() => this.syncSelectedLanguage(), 1200);
		}
	}

	// Capture translated defaults for adjustment labels so future resets don't revert to English
	captureTranslatedDefaults() {
		if (this.contentAdjustment?.captureDefaultLabels) {
			this.contentAdjustment.captureDefaultLabels();
		}
		if (this.colorAdjustment?.captureDefaultLabels) {
			this.colorAdjustment.captureDefaultLabels();
		}
		if (this.orientationAdjustment?.captureDefaultLabels) {
			this.orientationAdjustment.captureDefaultLabels();
		}
	}

	// Get the currently active Google Translate language (combo or cookie)
	getActiveTranslationLanguage() {
		// Check combo (classic widget)
		const combo = document.querySelector('.goog-te-combo');
		if (combo && combo.value) {
			return combo.value;
		}

		// Fallback: check googtrans cookie (new UI)
		const cookie = document.cookie
			.split(';')
			.map((c) => c.trim())
			.find((c) => c.startsWith('googtrans='));
		if (cookie) {
			const value = (cookie.split('=')[1] || '').split('/');
			if (value.length >= 3) {
				const lang = normalizeGoogleLangCode(value[2]);
				if (lang && lang.toLowerCase() !== 'en') {
					return lang;
				}
			}
		}
		return null;
	}

	// Ensure the custom language selector reflects the active translation
	syncSelectedLanguage(preferredLang = null) {
		const languageSelect = document.getElementById('accessimate-language-select');
		if (!languageSelect) return;

		const activeLang = preferredLang || this.getActiveTranslationLanguage();
		if (!activeLang) return;

		// Add option if it doesn't exist (e.g., cookie set before selector built)
		if (!languageSelect.querySelector(`option[value="${activeLang}"]`)) {
			const label = this.translateLanguageLabels[activeLang] || activeLang;
			const option = document.createElement('option');
			option.value = activeLang;
			option.textContent = label;
			languageSelect.appendChild(option);
		}

		if (languageSelect.value !== activeLang) {
			languageSelect.value = activeLang;
		}
	}

	// Helper method to update adjustments in cache
	async updateAdjustmentsInCache() {
		try {
			const adjustments = {
				content: JSON.parse(localStorage.getItem("wcag-content-adjustments") || "{}"),
				color: JSON.parse(localStorage.getItem("wcag-color-adjustments") || "{}"),
				orientation: JSON.parse(localStorage.getItem("wcag-orientation-adjustments") || "{}"),
				enabled: JSON.parse(localStorage.getItem("wcag_tools_enabled_list") || "{}")
			};
			
			await cacheManager.updateAdjustments(adjustments);
		} catch (error) {
			console.error('Failed to update adjustments in cache:', error);
		}
	}

	createElement(tag, attrs = {}, styles = {}, children = []) {
		const element = document.createElement(tag)

		Object.entries(attrs).forEach(([key, value]) => {
			if (typeof value === "object") {
				Object.entries(value).forEach(([subKey, subValue]) => {
					element[key][subKey] = subValue
				})
			} else {
				element.setAttribute(key, value)
			}
		})

		Object.entries(styles).forEach(([key, value]) => {
			element.style[key] = value
		})

		children.forEach((child) => {
			if (child && typeof child === "object" && child.nodeType) {
				element.appendChild(child)
			} else if (typeof child === "string") {
				element.appendChild(document.createTextNode(child))
			}
		})

		return element
	}

	injectScrollbarStyles() {
		// Check if styles already exist
		if (document.getElementById('wcag-widget-scrollbar-styles')) {
			return;
		}

		// Create style element
		const styleElement = document.createElement('style');
		styleElement.id = 'wcag-widget-scrollbar-styles';
		styleElement.textContent = `
			/* Custom scrollbar for widget content */
			.wcag-widget-content {
				scrollbar-width: thin;
				scrollbar-color: #3b82f6 #e5e7eb;
			}

			.wcag-widget-content::-webkit-scrollbar {
				width: 10px;
			}

			.wcag-widget-content::-webkit-scrollbar-button {
				display: none;
				height: 0;
				width: 0;
			}

			.wcag-widget-content::-webkit-scrollbar-button:start:decrement,
			.wcag-widget-content::-webkit-scrollbar-button:end:increment {
				display: none;
				height: 0;
				width: 0;
			}

			.wcag-widget-content::-webkit-scrollbar-track {
				background: #e5e7eb;
				border-radius: 5px;
				margin: 0;
			}

			.wcag-widget-content::-webkit-scrollbar-thumb {
				background: #3b82f6;
				border-radius: 5px;
			}

			.wcag-widget-content::-webkit-scrollbar-thumb:hover {
				background: #2563eb;
			}

			.wcag-widget-content::-webkit-scrollbar-thumb:active {
				background: #1e40af;
			}
		`;

		document.head.appendChild(styleElement);
	}
}

//  Expose counter refresh so components can call it
let adjustmentsCacheUpdateTimer = null;
window.updateWcagFeatureCount = function() {
	if (window.wcagTools && typeof window.wcagTools.updateActiveFeatureCount === 'function') {
		window.wcagTools.updateActiveFeatureCount();
	}

	// The original adjustment components already call this hook after each
	// local state change. Debounce the matching PostgreSQL cache update so a
	// reviewer can refresh or revisit the public page without losing settings.
	clearTimeout(adjustmentsCacheUpdateTimer);
	adjustmentsCacheUpdateTimer = setTimeout(() => {
		if (window.wcagTools && typeof window.wcagTools.updateAdjustmentsInCache === 'function') {
			window.wcagTools.updateAdjustmentsInCache();
		}
	}, 150);
};

// Replace the direct initialization with a check for browser environment
if (typeof window !== 'undefined') {
	const startWidget = () => {
		loadFontAwesome();  // Load Font Awesome CSS

		// Initialize saved settings globally
		initializeSavedSettings();

		window.wcagTools = new WcagTools()

		// Refresh badge count after saved settings are applied
		if (window.wcagTools && typeof window.wcagTools.updateActiveFeatureCount === 'function') {
			window.wcagTools.updateActiveFeatureCount();
			// Run once more after initial render to ensure restored settings are reflected
			setTimeout(() => {
				window.wcagTools.updateActiveFeatureCount();
			}, 100);
			setTimeout(() => {
				window.wcagTools.updateActiveFeatureCount();
			}, 400);
		}
	};

	// If DOM is already ready, run immediately; otherwise wait for DOMContentLoaded
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", startWidget);
	} else {
		startWidget();
	}
}

// Global initialization for saved settings
function initializeSavedSettings() {
	// Apply saved line height
	applyLineHeightToElements();
	
	// Initialize saved text magnifier if active
	initializeTextMagnifierGlobal();
}

// Global line height application
function applyLineHeightToElements() {
	try {
		const savedSettings = JSON.parse(localStorage.getItem("wcag-content-adjustments") || "{}")
		
		if (savedSettings.lineHeight && savedSettings.lineHeight !== 1.5) {
			const wcagElementSelectors = ['#wcag_tools_widget', '.wcag_tools_item_block', '.wcag-text-magnifier', '[class*="wcag"]'];
			
			document.querySelectorAll('*').forEach(element => {
				const shouldExclude = wcagElementSelectors.some(selector => {
					if (selector.startsWith('#') || selector.startsWith('.')) {
						return element.matches(selector);
					} else if (selector.includes('*=')) {
						const attribute = selector.match(/\[(.+?)\*=/)[1];
						const value = selector.match(/="(.+?)"/)[1];
						return element.getAttribute(attribute)?.includes(value);
					}
					return false;
				});
				
				if (!shouldExclude) {
					element.style.lineHeight = savedSettings.lineHeight;
				}
			});
		}
	} catch (error) {
		console.warn("Failed to apply saved line height:", error);
	}
}

// Global text magnifier initialization
function initializeTextMagnifierGlobal() {
	try {
		const savedSettings = JSON.parse(localStorage.getItem("wcag-content-adjustments") || "{}")
		
		if (savedSettings.textMagnifier) {
			// Clean up any existing magnifiers first
			const existingMagnifiers = document.querySelectorAll('.wcag-text-magnifier');
			existingMagnifiers.forEach(magnifier => magnifier.remove());
			
			// Create new magnifier element
			const magnifierElement = document.createElement("div");
			magnifierElement.className = "wcag-text-magnifier";
			Object.assign(magnifierElement.style, {
				position: "fixed",
				top: "10px",
				left: "10px",
				width: "300px",
				minHeight: "100px",
				maxHeight: "80vh",
				height: "auto",
				backgroundColor: "#000",
				color: "#fff",
				border: "2px solid #fff",
				borderRadius: "8px",
				padding: "10px",
				fontSize: "24px",
				lineHeight: "1.4",
				zIndex: "10000",
				display: "block",
				pointerEvents: "none",
				wordWrap: "break-word",
				overflowWrap: "break-word",
				overflow: "hidden",
				boxSizing: "border-box",
			});
			
			document.body.appendChild(magnifierElement);
			
			// Add global event listeners for magnifier functionality
			const handleMagnifierMove = (e) => {
				const magnifier = document.querySelector('.wcag-text-magnifier');
				if (magnifier) {
					magnifier.style.left = `${e.clientX + 20}px`;
					magnifier.style.top = `${e.clientY + 20}px`;
				}
			};
			
			const handleMagnifierEnter = (e) => {
				const magnifier = document.querySelector('.wcag-text-magnifier');
				if (!magnifier) return;
				const element = e.target;
				const text = element.textContent || element.innerText || "";
				if (text.trim()) {
					// Set the full text first
					magnifier.textContent = text;

					// Use requestAnimationFrame to check overflow after text is rendered
					requestAnimationFrame(() => {
						if (!magnifier) return;

						const maxHeightValue = parseFloat(getComputedStyle(magnifier).maxHeight);
						const scrollHeight = magnifier.scrollHeight;

						// If content overflows max height, truncate with ellipsis
						if (scrollHeight > maxHeightValue) {
							// Binary search to find the right truncation point
							let low = 0;
							let high = text.length;
							let bestFit = "";

							while (low <= high) {
								const mid = Math.floor((low + high) / 2);
								magnifier.textContent = text.substring(0, mid) + "...";

								if (magnifier.scrollHeight <= maxHeightValue) {
									bestFit = text.substring(0, mid) + "...";
									low = mid + 1;
								} else {
									high = mid - 1;
								}
							}

							magnifier.textContent = bestFit || text.substring(0, 50) + "...";
						}
					});
				}
			};
			
			document.addEventListener("mousemove", handleMagnifierMove);
			document.addEventListener("mouseenter", handleMagnifierEnter, true);
		}
	} catch (error) {
		console.warn("Failed to initialize saved text magnifier:", error);
	}
}

if (typeof module !== "undefined" && module.exports) {
	module.exports = {
		WcagTools,
		cacheManager,
		initializeSavedSettings,
		applyLineHeightToElements,
		initializeTextMagnifierGlobal,
	};
}
})(window);
