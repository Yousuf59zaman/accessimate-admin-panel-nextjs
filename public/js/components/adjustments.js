const accessibility = require("../utils/accessibility.js");
const {Component} = require("./Component.js");

const TEXT_SPACING_OPTIONS = [
	{ value: 0, label: "Text Spacing", icon: "fa-light fa-text-width" },
	{ value: 1, label: "Light Spacing", icon: "fa-light fa-text-width" },
	{ value: 2, label: "Relaxed Spacing", icon: "fa-light fa-text-width" },
	{ value: 3, label: "Moderate Spacing", icon: "fa-light fa-text-width" },
	{ value: 4, label: "Heavy Spacing", icon: "fa-light fa-text-width" },
]

const getTextSpacingLabel = (value) =>
	TEXT_SPACING_OPTIONS.find((option) => option.value === value)?.label || "Text Spacing"

const SATURATION_MODE_OPTIONS = [
	{ value: "default", label: "Saturation", icon: "fa-light fa-palette" },
	{ value: "low", label: "Low Saturation", icon: "fa-light fa-droplet" },
	{ value: "high", label: "High Saturation", icon: "fa-solid fa-droplet" },
	{ value: "desaturate", label: "Desaturation", icon: "fa-light fa-water" },
]

const BRIGHTNESS_MODE_OPTIONS = [
	{ value: "default", label: "Brightness", icon: "fa-light fa-sun" },
	{ value: "dim", label: "Dim Brightness", icon: "fa-light fa-cloud-moon" },
	{ value: "bright", label: "Bright Boost", icon: "fa-light fa-lightbulb" },
	{ value: "vivid", label: "Vivid Brightness", icon: "fa-solid fa-sun" },
]

const CONTRAST_MODE_OPTIONS = [
	{ value: "default", label: "Contrast +", icon: "fa-light fa-adjust" },
	{ value: "invert", label: "Invert Colors", icon: "fa-light fa-circle-half-stroke" },
	{ value: "dark", label: "Dark Contrast", icon: "fa-light fa-moon" },
	{ value: "light", label: "Light Contrast", icon: "fa-light fa-sun" },
]

const BIG_CURSOR_OPTIONS = [
	{
		value: "default",
		label: "Big Cursor",
		icon: "fa-light fa-arrow-pointer",
		cursor: "",
	},
	{
		value: "black",
		label: "Black Cursor",
		icon: "fa-light fa-arrow-pointer",
		cursor:
			"data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\"><path d=\"M2 2 L2 28 L10 20 L14 28 L18 26 L14 18 L22 18 Z\" fill=\"black\" stroke=\"white\" stroke-width=\"1\"/></svg>",
	},
	{
		value: "white",
		label: "White Cursor",
		icon: "fa-light fa-arrow-pointer",
		cursor:
			"data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\"><path d=\"M2 2 L2 28 L10 20 L14 28 L18 26 L14 18 L22 18 Z\" fill=\"white\" stroke=\"black\" stroke-width=\"1\"/></svg>",
	},
]

const getBigCursorLabel = (value) =>
	BIG_CURSOR_OPTIONS.find((option) => option.value === value)?.label || "Big Cursor"

const PAUSE_ANIMATION_OPTIONS = [
	{ value: false, label: "Pause Animations", icon: "fa-light fa-pause" },
	{ value: true, label: "Play Animations", icon: "fa-light fa-play" },
]

class ContentAdjustment extends Component {
	constructor(wcagTools) {
		super(wcagTools)
		this.defaultState = {
			fontSize: 100,
			lineHeight: 1.5,
			letterSpacing: 0,
			textMagnifier: false,
			highlightLinks: false,
			highlightTitles: false,
			showHeadlines: false,
			contentScaling: 100,
			textAlign: "default",
		}
		this.translatedOptions = {
			textAlign: {},
			textSpacing: {},
		}
		this.translationProbeCreated = false

		// Load saved state from localStorage or use default
		this.state = this.loadState()
		this.magnifierElement = null
		this.headlinesPanel = null
		this.isInitialized = false

		this.accentColor = "#1e3a8a"
		this.inactiveBorderColor = "#e5e7eb"
		this.defaultTextColor = "#1f2937"

		// Bind methods to preserve context
		this.handleMagnifierMove = this.handleMagnifierMove.bind(this)
		this.handleMagnifierEnter = this.handleMagnifierEnter.bind(this)

		// Create translation probe early so Google Translate can pick up option labels
		this.ensureOptionTranslationProbe()
	}

	// Load state from localStorage
	loadState() {
		try {
			const saved = localStorage.getItem("wcag-content-adjustments")
			if (saved) {
				const parsedState = JSON.parse(saved)
				// Merge with defaults to handle new features
				return { ...this.defaultState, ...parsedState }
			}
		} catch (error) {
			console.warn("Failed to load WCAG state:", error)
		}
		return { ...this.defaultState }
	}

	//  Save state locally and ping the badge so it updates
	saveState() {
		try {
			localStorage.setItem("wcag-content-adjustments", JSON.stringify(this.state))
			// Update active feature count badge
			if (typeof window.updateWcagFeatureCount === 'function') {
				window.updateWcagFeatureCount();
			}
		} catch (error) {
			console.warn("Failed to save WCAG state:", error)
		}
	}

	// Initialize or restore the component
	initialize() {
		if (this.isInitialized) {
			this.restoreActiveStates()
			return
		}

		// Check for existing text magnifier from global initialization
		const existingMagnifier = document.querySelector('.wcag-text-magnifier');
		if (existingMagnifier && this.state.textMagnifier) {
			// Use the existing magnifier element
			this.magnifierElement = existingMagnifier;
		} else if (!existingMagnifier && this.state.textMagnifier) {
			// Create new magnifier if none exists but state says it should be active
			this.initializeTextMagnifier();
		}

		// Check for existing headlines panel
		const existingHeadlinesPanel = document.querySelector('.wcag-headlines-panel');
		if (existingHeadlinesPanel && this.state.showHeadlines) {
			// Use the existing headlines panel element
			this.headlinesPanel = existingHeadlinesPanel;
		} else if (!existingHeadlinesPanel && this.state.showHeadlines) {
			// Create new headlines panel if none exists but state says it should be active
			this.createHeadlinesPanel();
		}

		this.restoreActiveStates()
		this.isInitialized = true
	}

	// Restore all active states when reopening
	restoreActiveStates() {
		// First restore the actual functionality without UI updates
		if (this.state.textMagnifier) {
			this.restoreTextMagnifier()
		}
		if (this.state.highlightLinks) {
			this.restoreHighlightLinks()
		}
		if (this.state.highlightTitles) {
			this.restoreHighlightTitles()
		}
		if (this.state.showHeadlines) {
			this.restoreShowHeadlines()
		}

		// Apply styles
		if (this.state.fontSize === 100) {
			this.clearFontSizeStyles();
		} else {
			this.applyFontSizeToElements(this.state.fontSize);
		}
		this.applyLineHeightToElements(this.state.lineHeight)
		this.applyLetterSpacingToElements(this.state.letterSpacing)
		this.applyTextAlignToElements(this.state.textAlign)
		// Apply content scaling zoom if not default
		document.body.style.zoom = `${this.state.contentScaling}%`

		// Apply counter-zoom to widget to keep it at original size
		const widget = document.querySelector("#wcag_tools_widget")
		if (widget) {
			const counterZoom = (10000 / this.state.contentScaling)
			widget.style.zoom = `${counterZoom}%`
		}

		// Update all control appearances after DOM is rendered
		setTimeout(() => {
			;["fontSize", "lineHeight", "letterSpacing", "textMagnifier", "highlightLinks", "highlightTitles", "showHeadlines", "textAlign", "contentScaling"].forEach((id) => {
				this.updateControlAppearance(id)
			})
			// Update value displays for controls with value displays
			;["fontSize", "lineHeight", "letterSpacing", "contentScaling"].forEach((id) => {
				this.updateValueDisplay(id)
			})
		}, 100)
	}

	applyLineHeightToElements(lineHeight) {
		// Remove existing line height style from body
		document.body.style.lineHeight = '';

		// Get all elements except WCAG widget related elements
		const allElements = document.querySelectorAll('*');
		const wcagElementSelectors = [
			'#wcag_tools_widget',
			'.wcag_tools_item_block',
			'#wcap_tools_btn',
			'#wcag_skip_to_main_content_btn'
		];

		allElements.forEach(element => {
			// Skip if element is the WCAG widget or its children
			let isWcagElement = false;

			wcagElementSelectors.forEach(selector => {
				if (element.matches(selector) || element.closest(selector)) {
					isWcagElement = true;
				}
			});

			// Apply line height only to non-WCAG elements
			if (!isWcagElement) {
				element.style.lineHeight = lineHeight;
			}
		});
	}

	applyFontSizeToElements(fontSize) {
		// Remove existing font size style from body
		document.body.style.fontSize = '';

		// First, ensure WCAG widget maintains its original styles
		this.protectWcagWidgetStyles();

		// Get all elements except WCAG widget related elements
		const allElements = document.querySelectorAll('*');
		const wcagElementSelectors = [
			'#wcag_tools_widget',
			'.wcag_tools_item_block',
			'#wcap_tools_btn',
			'#wcag_skip_to_main_content_btn',
			'[data-control-id]',
			'.wcag-control',
			'#wcag_tools_widget *',
			'.wcag_tools_item_block *'
		];

		allElements.forEach(element => {
			// Skip if element is the WCAG widget or its children
			let isWcagElement = false;

			wcagElementSelectors.forEach(selector => {
				if (element.matches(selector) || element.closest(selector)) {
					isWcagElement = true;
				}
			});

			// Apply font size only to non-WCAG elements
			if (!isWcagElement) {
				// Get or store the original font size
				if (!element.dataset.originalFontSize) {
					const computedStyle = window.getComputedStyle(element);
					element.dataset.originalFontSize = computedStyle.fontSize;
				}

				// Calculate new font size based on percentage of original
				const originalFontSize = parseFloat(element.dataset.originalFontSize);
				const newFontSize = (originalFontSize * fontSize) / 100;
				element.style.fontSize = `${newFontSize}px`;
			}
		});
	}

	clearFontSizeStyles() {
		// Remove font size style from body
		document.body.style.fontSize = '';

		// Ensure WCAG widget styles are protected
		this.protectWcagWidgetStyles();

		// Get all elements except WCAG widget related elements
		const allElements = document.querySelectorAll('*');
		const wcagElementSelectors = [
			'#wcag_tools_widget',
			'.wcag_tools_item_block',
			'#wcap_tools_btn',
			'#wcag_skip_to_main_content_btn',
			'[data-control-id]',
			'.wcag-control',
			'#wcag_tools_widget *',
			'.wcag_tools_item_block *'
		];

		allElements.forEach(element => {
			// Skip if element is the WCAG widget or its children
			let isWcagElement = false;

			wcagElementSelectors.forEach(selector => {
				if (element.matches(selector) || element.closest(selector)) {
					isWcagElement = true;
				}
			});

			// Clear inline font size for non-WCAG elements
			if (!isWcagElement) {
				element.style.fontSize = '';
				// Remove stored original font size
				delete element.dataset.originalFontSize;
			}
		});
	}

	protectWcagWidgetStyles() {
		// Create or update a style element to protect WCAG widget styles
		let protectionStyleId = 'wcag-widget-protection-styles';
		let existingStyle = document.getElementById(protectionStyleId);

		if (!existingStyle) {
			const style = document.createElement('style');
			style.id = protectionStyleId;
			style.textContent = `
				#wcag_tools_widget,
				#wcag_tools_widget *,
				.wcag_tools_item_block,
				.wcag_tools_item_block *,
				.wcag-headlines-panel,
				.wcag-headlines-panel *,
				#wcap_tools_btn,
				#wcag_skip_to_main_content_btn,
				[data-control-id],
				[data-control-id] *,
				.wcag-control,
				.wcag-control * {
					font-size: 14px !important;
					line-height: 1.4 !important;
					letter-spacing: normal !important;
				}
				
				#wcag_tools_widget [data-control-id] i {
					font-size: 18px !important;
				}
				
				#wcag_tools_widget [data-control-id] span,
				#wcag_tools_widget [data-control-id] div {
					font-size: 12px !important;
					line-height: 1.3 !important;
				}
				
				#wcag_tools_widget h3 {
					font-size: 16px !important;
					line-height: 1.2 !important;
				}
				
				#wcag_tools_widget .reset-button {
					font-size: 12px !important;
				}
			`;
			document.head.appendChild(style);
		}
	}

	applyLetterSpacingToElements(letterSpacing) {
		// Remove existing letter spacing style from body
		document.body.style.letterSpacing = '';

		// Get all elements except WCAG widget related elements
		const allElements = document.querySelectorAll('*');
		const wcagElementSelectors = [
			'#wcag_tools_widget',
			'.wcag_tools_item_block',
			'#wcap_tools_btn',
			'#wcag_skip_to_main_content_btn'
		];

		allElements.forEach(element => {
			// Skip if element is the WCAG widget or its children
			let isWcagElement = false;

			wcagElementSelectors.forEach(selector => {
				if (element.matches(selector) || element.closest(selector)) {
					isWcagElement = true;
				}
			});

			// Apply letter spacing only to non-WCAG elements
			if (!isWcagElement) {
				element.style.letterSpacing = `${letterSpacing}px`;
			}
		});
	}

	applyTextAlignToElements(alignment) {
		const normalizedAlignment = alignment && alignment !== "default" ? alignment : "";
		const allElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
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
				if (normalizedAlignment) {
					if (element.dataset.wcagOriginalTextAlign === undefined) {
						const currentAlign = element.style.textAlign || ""
						element.dataset.wcagOriginalTextAlign = currentAlign || "__wcag-empty"
					}
					element.style.textAlign = normalizedAlignment;
				} else if (element.dataset.wcagOriginalTextAlign !== undefined) {
					const originalValue = element.dataset.wcagOriginalTextAlign === "__wcag-empty" ? "" : element.dataset.wcagOriginalTextAlign
					element.style.textAlign = originalValue
					delete element.dataset.wcagOriginalTextAlign
				}
			}
		});
	}

	reset() {
		this.state = { ...this.defaultState }
		this.saveState()

		// Reset basic styles
		if (this.state.fontSize === 100) {
			this.clearFontSizeStyles();
		} else {
			this.applyFontSizeToElements(this.state.fontSize);
		}
		this.applyLineHeightToElements(this.state.lineHeight)
		this.applyLetterSpacingToElements(this.state.letterSpacing)
		// Reset content scaling zoom
		document.body.style.zoom = "100%"

		// Reset widget zoom to keep it at original size
		const widget = document.querySelector("#wcag_tools_widget")
		if (widget) {
			widget.style.zoom = "100%"
		}

		// Reset accessibility features
		this.toggleTextMagnifier(false, true)
		this.toggleHighlightLinks(false, true)
		this.toggleHighlightTitles(false, true)
		this.toggleShowHeadlines(false, true)

		// Clear wcag_tools_enabled_list for toggle features only
		// Other features (fontSize, lineHeight, letterSpacing, textAlign, contentScaling) are counted from wcag-content-adjustments
		const wcagToolsList = JSON.parse(localStorage.getItem('wcag_tools_enabled_list') || '{}');
		["textMagnifier", "highlightLinks", "highlightTitles", "showHeadlines"].forEach((id) => {
			delete wcagToolsList[`wcag_${id}`];
		});
		localStorage.setItem('wcag_tools_enabled_list', JSON.stringify(wcagToolsList));

			;["fontSize", "lineHeight", "letterSpacing", "textMagnifier", "highlightLinks", "highlightTitles", "showHeadlines", "textAlign", "contentScaling"].forEach((id) => {
				this.updateControlAppearance(id)
			})
			// Update value displays for controls with value displays
			;["fontSize", "lineHeight", "letterSpacing", "contentScaling"].forEach((id) => {
				this.updateValueDisplay(id)
			})

		accessibility.announceChange("Content adjustment reset to default")
	}

	render() {
		// Protect WCAG widget styles from font size changes
		this.protectWcagWidgetStyles();

		const container = document.createElement("div")
		Object.assign(container.style, {
			padding: "20px",
			marginBottom: "20px",
			position: "relative",
		})

		container.appendChild(this.createTitle("Content Adjustments"))
		// container.appendChild(this.createResetButton())
		container.appendChild(this.createControls())

		// Initialize after rendering
		setTimeout(() => this.initialize(), 0)

		return container
	}

	createTitle(text) {
		return this.wcagTools.createElement(
			"h2",
			{},
			{
				fontSize: "16px",
				marginBottom: "15px",
				color: "#374151",
			},
			[text]
		)
	}

	createResetButton() {
		const resetBtn = this.wcagTools.createElement(
			"button",
			{
				"aria-label": "Reset content adjustments",
				title: "Reset to default",
			},
			{
				backgroundColor: "#dc2626",
				color: "white",
				border: "none",
				padding: "8px 14px",
				borderRadius: "6px",
				fontSize: "14px",
				fontWeight: "600",
				cursor: "pointer",
				transition: "all 0.2s ease",
				display: "inline-flex",
				alignItems: "center",
				gap: "8px",
				position: "absolute",
				top: "10px",
				right: "10px",
			},
			[
				this.wcagTools.createElement("i", { class: "fas fa-undo" }),
				""
			]
		)

		// Add hover effects
		resetBtn.addEventListener("mouseenter", () => {
			resetBtn.style.backgroundColor = "#b91c1c";
			resetBtn.style.transform = "translateY(-1px)";
		});

		resetBtn.addEventListener("mouseleave", () => {
			resetBtn.style.backgroundColor = "#dc2626";
			resetBtn.style.transform = "translateY(0)";
		});

		resetBtn.addEventListener("click", () => {
			this.reset()
		})

		return resetBtn
	}

	createControls() {
		const container = this.wcagTools.createElement(
			"div",
			{},
			{
				display: "grid",
				gridTemplateColumns: "repeat(6, 1fr)",
				gap: "18px",
				fontSize: "12px",
				color: "#000",
			}
		)

		const controls = [
			{ id: "contentScaling", icon: "fa-sharp fa-solid fa-expand", label: "Content Scaling", type: "scaler", colSpan: 4 },
			{ id: "textMagnifier", icon: "fa-light fa-search-plus", label: "Text Magnifier", type: "toggle", colSpan: 2 },
			{ id: "highlightLinks", icon: "fa-light fa-link", label: "Highlight Links", type: "toggle", colSpan: 2 },
			{ id: "highlightTitles", icon: "fa-light fa-heading", label: "Highlight Titles", type: "toggle", colSpan: 2 },
			{ id: "textAlign", icon: "fa-light fa-align-center", label: "Text Align", type: "toggle", colSpan: 2 },
			// { id: "showHeadlines", icon: "fa-light fa-list-ul", label: "Show Headlines", type: "toggle", colSpan: 2 },
			{ id: "fontSize", icon: "fa-light fa-text-size", label: "Adjust Font Sizing", type: "scaler", colSpan: 4 },
			{ id: "letterSpacing", icon: "fa-light fa-text-width", label: "Text Spacing", type: "toggle", colSpan: 2 },
			{ id: "lineHeight", icon: "fa-light fa-line-height", label: "Adjust Line Height", type: "scaler", colSpan: 4 },
		]

		controls.forEach((control) => {
			container.appendChild(this.createControl(control))
		})

		return container
	}

	createControl({ id, icon, label, type, colSpan }) {
		const accentColor = this.accentColor
		const inactiveBorder = this.inactiveBorderColor
		const inactiveText = this.defaultTextColor
		const isDefault = this.state[id] === this.defaultState[id]
		const isToggle = type === "toggle"
		const isScaler = type === "scaler"
		const isActive = !isDefault

		// Create wrapper div with column span - this holds the main border and background
		const wrapper = this.wcagTools.createElement(
			"div",
			{
				"data-control-wrapper": id,
			},
			{
				gridColumn: "span " + colSpan,
				position: "relative",
				display: "flex",
				alignItems: "stretch",
				justifyContent: "center",
				width: "100%",
				minHeight: "130px",
				border: "none",
				borderRadius: "18px",
				padding: "3px",
				transition: "all 0.3s",
				boxSizing: "border-box",
			}
		)
		wrapper.setAttribute("data-active", isActive ? "true" : "false")

		const innerContainer = this.wcagTools.createElement(
			"div",
			{
				"data-control-inner": id,
			},
			{
				width: "100%",
				minHeight: "130px",
				backgroundColor: "white",
				borderRadius: "16px",
				border: isActive ? "2px solid " + accentColor : "1px solid " + inactiveBorder,
				padding: "16px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				position: "relative",
				transition: "all 0.3s",
				boxSizing: "border-box",
			}
		)
		wrapper.appendChild(innerContainer)

		// Create checkmark badge for active state
		if (isActive) {
			const checkmark = this.wcagTools.createElement(
				"div",
				{
					"data-checkmark": id,
				},
				{
					position: "absolute",
					top: "-1px",
					right: "-1px",
					width: "40px",
					height: "40px",
					backgroundColor: accentColor,
					borderRadius: "0 16px 0 16px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					zIndex: "10",
				},
				[
					this.wcagTools.createElement("i", { class: "fa fa-check" }, {
						fontSize: "14px",
						color: "white",
					})
				]
			)
			innerContainer.appendChild(checkmark)
		}

		const restoreBaseBorders = () => {
			const activeState = wrapper.getAttribute("data-active") === "true"
			innerContainer.style.border = activeState ? "4px solid " + accentColor : "1px solid " + inactiveBorder
			innerContainer.style.background = "white"
			innerContainer.style.boxShadow = "none"
		}

		// Hover effects
		wrapper.addEventListener("mouseenter", () => {
			if (wrapper.getAttribute("data-active") === "true") return
			innerContainer.style.borderColor = "#1e3a8a"
			innerContainer.style.background = "white"
			innerContainer.style.boxShadow = "0 2px 6px rgba(15, 23, 42, 0.08)"
		})
		wrapper.addEventListener("mouseleave", restoreBaseBorders)

		if (isScaler) {
			// Scaler type control (with increment/decrement)
			const content = this.wcagTools.createElement(
				"div",
				{
					"data-control-id": id,
						tabindex: "0",
				},
				{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: "16px",
					width: "100%",
					height: "100%",
					cursor: "pointer",
					userSelect: "none",
					color: isActive ? accentColor : inactiveText,
				}
			)

			// Icon and label row
			const headerRow = this.wcagTools.createElement(
				"div",
				{},
				{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					gap: "8px",
				},
				[
					this.wcagTools.createElement("i", { class: icon }, { fontSize: "18px !important" }),
					this.wcagTools.createElement("span", {}, {}, [this.getInitialLabel(id, label)])
				]
			)

			// Control row (with arrows and value)
			const controlRow = this.wcagTools.createElement(
				"div",
				{},
				{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					gap: "6px",
					transition: "all 1s",
				}
			)

			const controlInner = this.wcagTools.createElement(
				"div",
				{},
				{
					display: "flex",
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					height: "32px",
					minWidth: "150px",
					maxWidth: "240px",
					backgroundColor: "#f3f4f6",
				}
			)

			// Decrement button
			const decrementBtn = this.wcagTools.createElement(
				"div",
				{
					tabindex: "0",
					"data-arrow-button": "true",
				},
				{
					display: "flex",
					width: "34px",
					height: "34px",
					backgroundColor: isActive ? accentColor : "#d1d5db",
					color: isActive ? "white" : inactiveText,
					alignItems: "center",
					justifyContent: "center",
					cursor: "pointer",
					borderRadius: "50%",
					transition: "all 0.3s",
				},
				[this.wcagTools.createElement("i", { class: "fa fa-chevron-down" })]
			)

			decrementBtn.addEventListener("mouseenter", () => {
				decrementBtn.style.boxShadow = "0 0 0 2px " + accentColor
			})
			decrementBtn.addEventListener("mouseleave", () => {
				decrementBtn.style.boxShadow = "none"
			})
			decrementBtn.addEventListener("click", (e) => {
				e.stopPropagation()
				this.handleDecrement(id)
			})

			// Value display
			const valueDisplay = this.wcagTools.createElement(
				"div",
				{
					"data-value-id": id,
				},
				{
					display: "flex",
					alignItems: "center",
					flex: "1",
					justifyContent: "center",
				},
				["Default"]
			)

			// Increment button
			const incrementBtn = this.wcagTools.createElement(
				"div",
				{
					tabindex: "0",
					"data-arrow-button": "true",
				},
				{
					display: "flex",
					width: "34px",
					height: "34px",
					backgroundColor: isActive ? accentColor : "#d1d5db",
					color: isActive ? "white" : inactiveText,
					alignItems: "center",
					justifyContent: "center",
					cursor: "pointer",
					borderRadius: "50%",
					transition: "all 0.3s",
				},
				[this.wcagTools.createElement("i", { class: "fa fa-chevron-up" })]
			)

			incrementBtn.addEventListener("mouseenter", () => {
				incrementBtn.style.boxShadow = "0 0 0 2px " + accentColor
			})
			incrementBtn.addEventListener("mouseleave", () => {
				incrementBtn.style.boxShadow = "none"
			})
			incrementBtn.addEventListener("click", (e) => {
				e.stopPropagation()
				this.handleIncrement(id)
			})

			controlInner.appendChild(decrementBtn)
			controlInner.appendChild(valueDisplay)
			controlInner.appendChild(incrementBtn)
			controlRow.appendChild(controlInner)

			content.appendChild(headerRow)
			content.appendChild(controlRow)
			innerContainer.appendChild(content)
		} else {
			const isTextAlignControl = id === "textAlign"
			const isTextSpacingControl = id === "letterSpacing"
			const content = this.wcagTools.createElement(
				"div",
				{
					"data-control-id": id,
						tabindex: "0",
					role: "switch",
					"aria-pressed": (isTextAlignControl || isTextSpacingControl)
						? (this.state[id] !== this.defaultState[id] ? "true" : "false")
						: (this.state[id] ? "true" : "false"),
				},
				{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: isTextAlignControl || isTextSpacingControl ? "12px" : "10px",
					width: "100%",
					minHeight: "100%",
					cursor: "pointer",
					userSelect: "none",
					color: isActive ? accentColor : inactiveText,
					borderRadius: "16px",
				}
			)

			if (isTextAlignControl) {
				const options = this.getTextAlignOptions()
				const activeOption = options.find((option) => option.value === this.state.textAlign)
				const labelText = activeOption ? activeOption.label : "Text Align"
				const iconClass = activeOption ? activeOption.icon : "fa-light fa-align-left"

				const iconElement = this.wcagTools.createElement(
					"i",
					{ class: iconClass, "data-align-icon": "true" },
					{ fontSize: "22px", transition: "color 0.2s ease" }
				)

				const labelElement = this.wcagTools.createElement(
					"span",
					{ "data-align-label": "true" },
					{
						fontSize: "14px",
						fontWeight: "600",
						textAlign: "center",
					},
					[labelText]
				)

				const indicatorRow = this.wcagTools.createElement(
					"div",
					{ "data-align-indicator": "true" },
					{
						display: "flex",
						gap: "6px",
						width: "100%",
						justifyContent: "center",
						marginTop: "auto",
					}
				)

				options.forEach((option, index) => {
					const indicator = this.wcagTools.createElement(
						"span",
						{
							"data-align-dot": option.value,
							"data-align-index": index,
						},
						{
							width: "24px",
							height: "6px",
							borderRadius: "999px",
							backgroundColor: "#e5e7eb",
							opacity: 0.4,
							transition: "all 0.2s ease",
						}
					)
					indicatorRow.appendChild(indicator)
				})

				content.appendChild(iconElement)
				content.appendChild(labelElement)
				content.appendChild(indicatorRow)
				content.setAttribute("aria-label", labelText)
				this.updateTextAlignVisuals(content)
			} else if (isTextSpacingControl) {
				const options = TEXT_SPACING_OPTIONS
				const activeOption = options.find((option) => option.value === this.state.letterSpacing) || options[0]
				const labelText = activeOption ? activeOption.label : "Text Spacing"
				const iconClass = activeOption ? activeOption.icon : icon

				const iconElement = this.wcagTools.createElement(
					"i",
					{ class: iconClass, "data-spacing-icon": "true" },
					{ fontSize: "22px", transition: "color 0.2s ease" }
				)

				const labelElement = this.wcagTools.createElement(
					"span",
					{ "data-spacing-label": "true" },
					{
						fontSize: "14px",
						fontWeight: "600",
						textAlign: "center",
					},
					[labelText]
				)

				const indicatorRow = this.wcagTools.createElement(
					"div",
					{ "data-spacing-indicator": "true" },
					{
						display: "flex",
						gap: "6px",
						width: "100%",
						justifyContent: "center",
						marginTop: "auto",
					}
				)

				options.slice(1).forEach((option, index) => {
					const indicator = this.wcagTools.createElement(
						"span",
						{
							"data-spacing-dot": option.value,
							"data-spacing-index": index,
						},
						{
							width: "24px",
							height: "6px",
							borderRadius: "999px",
							backgroundColor: "#e5e7eb",
							opacity: 0.4,
							transition: "all 0.2s ease",
						}
					)
					indicatorRow.appendChild(indicator)
				})

				content.appendChild(iconElement)
				content.appendChild(labelElement)
				content.appendChild(indicatorRow)
				content.setAttribute("aria-label", labelText)
				this.updateTextSpacingVisuals(content)
			} else {
				content.appendChild(this.wcagTools.createElement("i", { class: icon }, { fontSize: "18px !important" }))

				const labelText = type === "scaler" ? this.getInitialLabel(id, label) : label
				content.appendChild(this.wcagTools.createElement("span", {}, {}, [labelText]))
			}

			content.addEventListener("click", () => this.handleAdjustment(id))
			innerContainer.appendChild(content)
		}

		return wrapper
	}

	getInitialLabel(id, defaultLabel) {
		// Return label with current value for scaler controls
		if (id === "fontSize") {
			return `Font Size (${this.state.fontSize}%)`;
		} else if (id === "lineHeight") {
			return `Line Height (${this.state.lineHeight})`;
		} else if (id === "letterSpacing") {
			return getTextSpacingLabel(this.state.letterSpacing);
		}
		return defaultLabel;
	}

	handleIncrement(id) {
		switch (id) {
			case "fontSize":
				this.adjustFontSize()
				break
			case "lineHeight":
				this.adjustLineHeight()
				break
			case "letterSpacing":
				this.adjustLetterSpacing()
				break
			case "contentScaling":
				this.adjustContentScaling()
				break
		}
		this.updateValueDisplay(id)
		this.saveState()
	}

	handleDecrement(id) {
		switch (id) {
			case "fontSize":
				this.adjustFontSize(true) // Pass true for decrement
				break
			case "lineHeight":
				this.adjustLineHeight(true)
				break
			case "letterSpacing":
				this.adjustLetterSpacing(true)
				break
			case "contentScaling":
				this.adjustContentScaling(true)
				break
		}
		this.updateValueDisplay(id)
		this.saveState()
	}

	updateValueDisplay(id) {
		const valueElement = document.querySelector(`[data-value-id="${id}"]`)
		if (!valueElement) return

		let displayValue = null
		let isDefault = false

		switch (id) {
			case "fontSize":
				isDefault = this.state.fontSize === 100
				displayValue = isDefault ? null : `${this.state.fontSize}%`
				break
			case "lineHeight":
				isDefault = this.state.lineHeight === 1.5
				displayValue = isDefault ? null : `${this.state.lineHeight}`
				break
			case "letterSpacing":
				isDefault = this.state.letterSpacing === 0
				displayValue = isDefault ? null : getTextSpacingLabel(this.state.letterSpacing)
				break
			case "contentScaling":
				isDefault = this.state.contentScaling === 100
				displayValue = isDefault ? null : `${this.state.contentScaling}%`
				break
		}

		// When translation is active and this control is at default, snapshot the translated label now
		const currentText = (valueElement.textContent || "").trim()
		const fallback = "Default"
		if (this.isTranslationActive() && isDefault && currentText && currentText !== fallback) {
			this.storeDefaultLabel(valueElement, fallback, true)
		}

		const defaultLabel =
			valueElement.dataset.defaultTranslated ||
			valueElement.dataset.defaultLabel ||
			this.storeDefaultLabel(valueElement, fallback)

		if (isDefault) {
			valueElement.textContent = defaultLabel || "Default"
		} else if (displayValue !== null) {
			valueElement.textContent = displayValue
		}
	}

	// Store the current default/translated labels so we can restore them after adjustments or reset
	captureDefaultLabels() {
		const valueIds = ["fontSize", "lineHeight", "letterSpacing", "contentScaling"]
		valueIds.forEach((id) => {
			const el = document.querySelector(`[data-value-id="${id}"]`)
			const isDefault =
				(id === "fontSize" && this.state.fontSize === 100) ||
				(id === "lineHeight" && this.state.lineHeight === 1.5) ||
				(id === "letterSpacing" && this.state.letterSpacing === 0) ||
				(id === "contentScaling" && this.state.contentScaling === 100)

			if (el && isDefault) {
				this.storeDefaultLabel(el, "Default", true)
			}
		})

		const alignLabel = document.querySelector('[data-align-label]')
		if (alignLabel && this.state.textAlign === "default") {
			this.storeDefaultLabel(alignLabel, "Text Align", true)
		}

		const spacingLabel = document.querySelector('[data-spacing-label]')
		if (spacingLabel && this.state.letterSpacing === 0) {
			this.storeDefaultLabel(spacingLabel, "Text Spacing", true)
		}

		const fontSizeLabel = document.querySelector('[data-control-id="fontSize"] span')
		if (fontSizeLabel && this.state.fontSize === 100) {
			this.storeDefaultLabel(fontSizeLabel, "Font Size (100%)", true)
		}

		const lineHeightLabel = document.querySelector('[data-control-id="lineHeight"] span')
		if (lineHeightLabel && this.state.lineHeight === 1.5) {
			this.storeDefaultLabel(lineHeightLabel, "Line Height (1.5)", true)
		}

		// Cache translated option labels for text align and spacing so toggles stay translated
		this.captureOptionTranslations()
	}

	ensureOptionTranslationProbe() {
		if (this.translationProbeCreated || typeof document === "undefined") return

		const existing = document.getElementById("wcag-content-translation-probe")
		if (existing) {
			this.translationProbeCreated = true
			this.translationProbe = existing
			return
		}

		const probe = document.createElement("div")
		probe.id = "wcag-content-translation-probe"
		Object.assign(probe.style, {
			position: "absolute",
			left: "-9999px",
			top: "0",
			opacity: "0",
			pointerEvents: "none",
			zIndex: "-1",
		})

		const groups = [
			{ key: "textAlign", options: [{ value: "default", label: "Text Align" }, ...this.getTextAlignOptions()] },
			{ key: "textSpacing", options: TEXT_SPACING_OPTIONS },
		]

		groups.forEach(({ key, options }) => {
			options.forEach((opt) => {
				const span = document.createElement("span")
				span.dataset.translateProbe = `${key}-${opt.value}`
				span.textContent = opt.label
				probe.appendChild(span)
			})
		})

		document.body.appendChild(probe)
		this.translationProbeCreated = true
		this.translationProbe = probe
	}

	captureOptionTranslations() {
		if (!this.isTranslationActive()) return
		this.ensureOptionTranslationProbe()

		const groups = [
			{ key: "textAlign", options: [{ value: "default", label: "Text Align" }, ...this.getTextAlignOptions()] },
			{ key: "textSpacing", options: TEXT_SPACING_OPTIONS },
		]

		groups.forEach(({ key, options }) => {
			options.forEach((opt) => {
				const el = document.querySelector(`[data-translate-probe="${key}-${opt.value}"]`)
				if (!el) return
				const text = (el.textContent || "").trim()
				if (text && !this.isValueOnlyText(text) && text !== opt.label) {
					this.translatedOptions[key][opt.value] = text
				}
			})
		})
	}

	getTranslatedOptionLabel(group, option, fallback) {
		const translated = this.translatedOptions[group]?.[option.value]
		return translated || option.label || fallback
	}

	applyValueToLabel(baseText, newValue) {
		const label = (baseText || "").trim()
		if (!label) return `(${newValue})`

		const start = label.indexOf("(")
		const end = label.lastIndexOf(")")

		if (start !== -1 && end > start) {
			return label.slice(0, start + 1) + newValue + label.slice(end)
		}

		return `${label} (${newValue})`
	}

	handleAdjustment(id) {
		switch (id) {
			case "textMagnifier":
				this.toggleTextMagnifier()
				break
			case "highlightLinks":
				this.toggleHighlightLinks()
				break
			case "highlightTitles":
				this.toggleHighlightTitles()
				break
			case "showHeadlines":
				this.toggleShowHeadlines()
				break
			case "textAlign":
				this.toggleTextAlign()
				break
			case "letterSpacing":
				this.cycleLetterSpacing()
				break
		}

		// Only update wcag_tools_enabled_list for boolean toggle features
		// textAlign and letterSpacing are counted from wcag-content-adjustments instead
		const toggleFeatures = ["textMagnifier", "highlightLinks", "highlightTitles", "showHeadlines"];

		if (toggleFeatures.includes(id)) {
			const wcagToolsList = JSON.parse(localStorage.getItem('wcag_tools_enabled_list') || '{}');

			if (this.state[id] !== this.defaultState[id]) {
				wcagToolsList[`wcag_${id}`] = {
					status: true,
					value: this.state[id]
				};
			} else {
				delete wcagToolsList[`wcag_${id}`];
			}

			localStorage.setItem('wcag_tools_enabled_list', JSON.stringify(wcagToolsList));
		}

		// Note: saveState() will call updateWcagFeatureCount()
		this.saveState();
	}

	adjustFontSize(decrement = false) {
		const steps = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150]
		const currentIndex = steps.indexOf(this.state.fontSize)

		if (decrement) {
			const newIndex = currentIndex > 0 ? currentIndex - 1 : 0
			this.state.fontSize = steps[newIndex]
		} else {
			const newIndex = currentIndex < steps.length - 1 ? currentIndex + 1 : steps.length - 1
			this.state.fontSize = steps[newIndex]
		}

		if (this.state.fontSize === 100) {
			this.clearFontSizeStyles();
		} else {
			this.applyFontSizeToElements(this.state.fontSize);
		}
		this.updateControlAppearance("fontSize")
		accessibility.announceChange(`Font size set to ${this.state.fontSize}%`)
	}

	adjustLineHeight(decrement = false) {
		const lineHeights = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3]
		const currentIndex = lineHeights.indexOf(this.state.lineHeight)

		if (decrement) {
			const newIndex = currentIndex > 0 ? currentIndex - 1 : 0
			this.state.lineHeight = lineHeights[newIndex]
		} else {
			const newIndex = currentIndex < lineHeights.length - 1 ? currentIndex + 1 : lineHeights.length - 1
			this.state.lineHeight = lineHeights[newIndex]
		}

		this.applyLineHeightToElements(this.state.lineHeight);
		this.updateControlAppearance("lineHeight");
		accessibility.announceChange(`Line height set to ${this.state.lineHeight}`);
	}

	adjustLetterSpacing(decrement = false) {
		const spacingValues = TEXT_SPACING_OPTIONS.map((option) => option.value)
		let currentIndex = spacingValues.indexOf(this.state.letterSpacing)
		if (currentIndex === -1) currentIndex = 0

		if (decrement) {
			const newIndex = currentIndex > 0 ? currentIndex - 1 : 0
			this.state.letterSpacing = spacingValues[newIndex]
		} else {
			const newIndex = currentIndex < spacingValues.length - 1 ? currentIndex + 1 : spacingValues.length - 1
			this.state.letterSpacing = spacingValues[newIndex]
		}

		this.applyLetterSpacingToElements(this.state.letterSpacing)
		this.updateControlAppearance("letterSpacing")
		accessibility.announceChange(`${getTextSpacingLabel(this.state.letterSpacing)} selected`)
	}

	cycleLetterSpacing() {
		const spacingValues = TEXT_SPACING_OPTIONS.map((option) => option.value)
		let currentIndex = spacingValues.indexOf(this.state.letterSpacing)
		if (currentIndex === -1) currentIndex = 0

		// Cycle through values and wrap
		const nextIndex = (currentIndex + 1) % spacingValues.length
		this.state.letterSpacing = spacingValues[nextIndex]

		this.applyLetterSpacingToElements(this.state.letterSpacing)
		this.updateControlAppearance("letterSpacing")

		// Note: handleAdjustment() will call saveState() which handles:
		// - Saving to localStorage
		// - Calling updateWcagFeatureCount()
		// - Updating cache via updateAdjustmentsInCache()

		accessibility.announceChange(`${getTextSpacingLabel(this.state.letterSpacing)} selected`)
	}

	adjustContentScaling(decrement = false) {
		const scales = [50, 75, 100, 125, 150]
		const currentIndex = scales.indexOf(this.state.contentScaling)

		if (decrement) {
			const newIndex = currentIndex > 0 ? currentIndex - 1 : 0
			this.state.contentScaling = scales[newIndex]
		} else {
			const newIndex = currentIndex < scales.length - 1 ? currentIndex + 1 : scales.length - 1
			this.state.contentScaling = scales[newIndex]
		}

		// Use zoom instead of transform scale to maintain layout dimensions
		document.body.style.zoom = `${this.state.contentScaling}%`

		// Apply counter-zoom to widget to keep it at original size
		const widget = document.querySelector("#wcag_tools_widget")
		if (widget) {
			const counterZoom = (10000 / this.state.contentScaling)
			widget.style.zoom = `${counterZoom}%`
		}

		this.updateControlAppearance("contentScaling")
		accessibility.announceChange(`Content scaling set to ${this.state.contentScaling}%`)
	}

	toggleTextAlign() {
		const alignments = ["default", "left", "right", "center", "justify"]
		const currentIndex = alignments.indexOf(this.state.textAlign)
		const nextIndex = (currentIndex + 1) % alignments.length
		this.state.textAlign = alignments[nextIndex]

		this.applyTextAlignToElements(this.state.textAlign)
		this.updateControlAppearance("textAlign")

		if (this.state.textAlign === "default") {
			accessibility.announceChange("Text alignment reset to default")
		} else {
			accessibility.announceChange(`Text alignment set to ${this.state.textAlign}`)
		}
	}

	// Text Magnifier functionality
	initializeTextMagnifier() {
		// Remove any existing magnifiers from previous instances
		const existingMagnifiers = document.querySelectorAll('.wcag-text-magnifier');
		existingMagnifiers.forEach(magnifier => magnifier.remove());

		// Clear any existing event listeners from previous instances
		document.removeEventListener("mousemove", this.handleMagnifierMove);
		document.removeEventListener("mouseenter", this.handleMagnifierEnter, true);

		this.magnifierElement = document.createElement("div")
		this.magnifierElement.className = "wcag-text-magnifier"
		Object.assign(this.magnifierElement.style, {
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
			display: "none",
			pointerEvents: "none",
			wordWrap: "break-word",
			overflowWrap: "break-word",
			overflow: "hidden",
			boxSizing: "border-box",
		})
		document.body.appendChild(this.magnifierElement)
	}

	toggleTextMagnifier(force = null, silent = false) {
		this.state.textMagnifier = force !== null ? force : !this.state.textMagnifier

		if (this.state.textMagnifier) {
			// Initialize the magnifier if it doesn't exist
			if (!this.magnifierElement) {
				this.initializeTextMagnifier();
			}

			this.magnifierElement.style.display = "block"

			// Bind methods to preserve 'this' context
			this.handleMagnifierMove = this.handleMagnifierMove.bind(this)
			this.handleMagnifierEnter = this.handleMagnifierEnter.bind(this)

			document.addEventListener("mousemove", this.handleMagnifierMove)
			document.addEventListener("mouseenter", this.handleMagnifierEnter, true)
		} else {
			if (this.magnifierElement) {
				this.magnifierElement.style.display = "none"
			}

			// Remove event listeners
			document.removeEventListener("mousemove", this.handleMagnifierMove)
			document.removeEventListener("mouseenter", this.handleMagnifierEnter, true)
		}

		if (!silent) {
			this.updateControlAppearance("textMagnifier")
			accessibility.announceChange(`Text magnifier ${this.state.textMagnifier ? "enabled" : "disabled"}`)
		}
	}

	handleMagnifierMove(e) {
		if (this.magnifierElement) {
			this.magnifierElement.style.left = `${e.clientX + 20}px`
			this.magnifierElement.style.top = `${e.clientY + 20}px`
		}
	}

	handleMagnifierEnter(e) {
		if (!this.magnifierElement) return
		const element = e.target
		const text = element.textContent || element.innerText || ""
		if (text.trim()) {
			// Set the full text first
			this.magnifierElement.textContent = text

			// Use requestAnimationFrame to check overflow after text is rendered
			requestAnimationFrame(() => {
				if (!this.magnifierElement) return

				const maxHeightValue = parseFloat(getComputedStyle(this.magnifierElement).maxHeight)
				const scrollHeight = this.magnifierElement.scrollHeight

				// If content overflows max height, truncate with ellipsis
				if (scrollHeight > maxHeightValue) {
					// Binary search to find the right truncation point
					let low = 0
					let high = text.length
					let bestFit = ""

					while (low <= high) {
						const mid = Math.floor((low + high) / 2)
						this.magnifierElement.textContent = text.substring(0, mid) + "..."

						if (this.magnifierElement.scrollHeight <= maxHeightValue) {
							bestFit = text.substring(0, mid) + "..."
							low = mid + 1
						} else {
							high = mid - 1
						}
					}

					this.magnifierElement.textContent = bestFit || text.substring(0, 50) + "..."
				}
			})
		}
	}

	// Highlight Links functionality
	toggleHighlightLinks(force = null, silent = false) {
		this.state.highlightLinks = force !== null ? force : !this.state.highlightLinks

		const links = document.querySelectorAll("a")
		const wcagElementSelectors = [
			'#wcag_tools_widget',
			'.wcag_tools_item_block',
			'#wcap_tools_btn',
			'#wcag_skip_to_main_content_btn'
		];

		links.forEach((link) => {
			// Skip if link is within WCAG widget elements
			let isWcagElement = false;
			wcagElementSelectors.forEach(selector => {
				if (link.matches(selector) || link.closest(selector)) {
					isWcagElement = true;
				}
			});

			// Only apply highlighting to non-WCAG elements
			if (!isWcagElement) {
				if (this.state.highlightLinks) {
					if (!link.dataset.originalBg) {
						link.dataset.originalBg = link.style.backgroundColor || ""
						link.dataset.originalBorder = link.style.border || ""
						link.dataset.originalPadding = link.style.padding || ""
					}

					link.style.backgroundColor = "#ffff00"
					link.style.border = "2px solid #000"
					link.style.padding = "2px 4px"
					link.classList.add("wcag-highlighted-link")
				} else {
					// Restore original styles
					link.style.backgroundColor = link.dataset.originalBg || ""
					link.style.border = link.dataset.originalBorder || ""
					link.style.padding = link.dataset.originalPadding || ""
					link.classList.remove("wcag-highlighted-link")
				}
			}
		})

		if (!silent) {
			this.updateControlAppearance("highlightLinks")
			accessibility.announceChange(`Link highlighting ${this.state.highlightLinks ? "enabled" : "disabled"}`)
		}
	}

	// Highlight Titles functionality
	toggleHighlightTitles(force = null, silent = false) {
		this.state.highlightTitles = force !== null ? force : !this.state.highlightTitles

		const titles = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')
		const wcagElementSelectors = [
			'#wcag_tools_widget',
			'.wcag_tools_item_block',
			'#wcap_tools_btn',
			'#wcag_skip_to_main_content_btn'
		];

		titles.forEach((title) => {
			// Skip if title is within WCAG widget elements
			let isWcagElement = false;
			wcagElementSelectors.forEach(selector => {
				if (title.matches(selector) || title.closest(selector)) {
					isWcagElement = true;
				}
			});

			// Only apply highlighting to non-WCAG elements
			if (!isWcagElement) {
				if (this.state.highlightTitles) {
					if (!title.dataset.originalBg) {
						title.dataset.originalBg = title.style.backgroundColor || ""
						title.dataset.originalBorder = title.style.border || ""
						title.dataset.originalPadding = title.style.padding || ""
						title.dataset.originalBorderRadius = title.style.borderRadius || ""
					}

					title.style.backgroundColor = "#e6f3ff"
					title.style.border = "2px solid #0066cc"
					title.style.padding = "4px 8px"
					title.style.borderRadius = "4px"
					title.classList.add("wcag-highlighted-title")
				} else {
					// Restore original styles
					title.style.backgroundColor = title.dataset.originalBg || ""
					title.style.border = title.dataset.originalBorder || ""
					title.style.padding = title.dataset.originalPadding || ""
					title.style.borderRadius = title.dataset.originalBorderRadius || ""
					title.classList.remove("wcag-highlighted-title")
				}
			}
		})

		if (!silent) {
			this.updateControlAppearance("highlightTitles")
			accessibility.announceChange(`Title highlighting ${this.state.highlightTitles ? "enabled" : "disabled"}`)
		}
	}

	// Show Headlines functionality
	toggleShowHeadlines(force = null, silent = false) {
		this.state.showHeadlines = force !== null ? force : !this.state.showHeadlines

		if (this.state.showHeadlines) {
			// Initialize the headlines panel if it doesn't exist
			if (!this.headlinesPanel) {
				this.createHeadlinesPanel();
			} else {
				this.headlinesPanel.style.display = "block";
			}
		} else {
			this.removeHeadlinesPanel()
		}
		if (!silent) {
			this.updateControlAppearance("showHeadlines")
			accessibility.announceChange(`Headline display ${this.state.showHeadlines ? "enabled" : "disabled"}`)
		}
	}

	createHeadlinesPanel() {
		// Remove existing panel to prevent duplicates
		this.removeHeadlinesPanel()

		this.headlinesPanel = document.createElement("div")
		this.headlinesPanel.className = "wcag-headlines-panel"
		Object.assign(this.headlinesPanel.style, {
			position: "fixed",
			top: "50px",
			right: "20px",
			width: "300px",
			maxHeight: "400px",
			backgroundColor: "#fff",
			border: "2px solid #0066cc",
			borderRadius: "8px",
			padding: "15px",
			zIndex: "9999999",
			overflow: "auto",
			boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
		})

		const title = document.createElement("h3")
		title.textContent = "Page Headlines"
		title.style.margin = "0 0 10px 0"
		title.style.fontSize = "16px"
		title.style.color = "#0066cc"
		this.headlinesPanel.appendChild(title)


		const headlinesList = document.createElement("ul")
		headlinesList.style.listStyle = "none"
		headlinesList.style.padding = "0"
		headlinesList.style.margin = "0"

		const headlines = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')

		// Filter out headlines from WCAG widget
		const filteredHeadlines = Array.from(headlines).filter(headline => {
			// Check if the headline is inside the WCAG widget
			return !headline.closest('#wcag_tools_widget');
		});

		filteredHeadlines.forEach((headline, index) => {
			const listItem = document.createElement("li")
			listItem.style.marginBottom = "8px"
			listItem.style.color = "#374151"

			const link = document.createElement("button")
			link.textContent = headline.textContent || `Headline ${index + 1}`
			link.setAttribute("aria-label", `Jump to ${headline.tagName || "heading"}: ${link.textContent}`)
			Object.assign(link.style, {
				display: "block",
				width: "100%",
				textAlign: "left",
				padding: "8px",
				border: "1px solid #e5e7eb",
				backgroundColor: "#f9f9f9",
				borderRadius: "4px",
				cursor: "pointer",
				fontSize: "14px",
				transition: "background-color 0.2s",
				color: "#374151",
			})

			link.addEventListener("click", () => {
				headline.scrollIntoView({ behavior: "smooth", block: "start" })
				headline.focus()
				accessibility.announceChange(`Jumped to ${headline.tagName || "heading"}: ${headline.textContent}`)
			})

			link.addEventListener("mouseenter", () => {
				link.style.backgroundColor = "#e6f3ff"
			})

			link.addEventListener("mouseleave", () => {
				link.style.backgroundColor = "#f9f9f9"
			})

			listItem.appendChild(link)
			headlinesList.appendChild(listItem)
		})

		if (filteredHeadlines.length === 0) {
			const noHeadlines = document.createElement("p")
			noHeadlines.textContent = "No headlines found on this page."
			noHeadlines.style.color = "#666"
			noHeadlines.style.fontStyle = "italic"
			this.headlinesPanel.appendChild(noHeadlines)
		} else {
			this.headlinesPanel.appendChild(headlinesList)
		}

		document.body.appendChild(this.headlinesPanel)
	}

	removeHeadlinesPanel() {
		if (this.headlinesPanel) {
			this.headlinesPanel.remove()
			this.headlinesPanel = null
		}
	}

	// Restore methods for features without UI updates or announcements
	restoreTextMagnifier() {
		const existingMagnifier = document.querySelector('.wcag-text-magnifier');
		if (existingMagnifier) {
			// Use existing magnifier
			this.magnifierElement = existingMagnifier;
		} else if (!this.magnifierElement) {
			// Create new magnifier
			this.initializeTextMagnifier();
		}

		if (this.magnifierElement) {
			this.magnifierElement.style.display = "block"
			// Bind methods to preserve 'this' context
			this.handleMagnifierMove = this.handleMagnifierMove.bind(this)
			this.handleMagnifierEnter = this.handleMagnifierEnter.bind(this)
			document.addEventListener("mousemove", this.handleMagnifierMove)
			document.addEventListener("mouseenter", this.handleMagnifierEnter, true)
		}
	}

	restoreHighlightLinks() {
		const links = document.querySelectorAll("a")
		const wcagElementSelectors = [
			'#wcag_tools_widget',
			'.wcag_tools_item_block',
			'#wcap_tools_btn',
			'#wcag_skip_to_main_content_btn'
		];

		links.forEach((link) => {
			// Skip if link is within WCAG widget elements
			let isWcagElement = false;
			wcagElementSelectors.forEach(selector => {
				if (link.matches(selector) || link.closest(selector)) {
					isWcagElement = true;
				}
			});

			// Only apply highlighting to non-WCAG elements that aren't already highlighted
			if (!isWcagElement && !link.classList.contains('wcag-highlighted-link')) {
				if (!link.dataset.originalBg) {
					link.dataset.originalBg = link.style.backgroundColor || ""
					link.dataset.originalBorder = link.style.border || ""
					link.dataset.originalPadding = link.style.padding || ""
				}

				link.style.backgroundColor = "#ffff00"
				link.style.border = "2px solid #000"
				link.style.padding = "2px 4px"
				link.classList.add("wcag-highlighted-link")
			}
		})
	}

	restoreHighlightTitles() {
		const titles = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')
		const wcagElementSelectors = [
			'#wcag_tools_widget',
			'.wcag_tools_item_block',
			'#wcap_tools_btn',
			'#wcag_skip_to_main_content_btn'
		];

		titles.forEach((title) => {
			// Skip if title is within WCAG widget elements
			let isWcagElement = false;
			wcagElementSelectors.forEach(selector => {
				if (title.matches(selector) || title.closest(selector)) {
					isWcagElement = true;
				}
			});

			// Only apply highlighting to non-WCAG elements that aren't already highlighted
			if (!isWcagElement && !title.classList.contains('wcag-highlighted-title')) {
				if (!title.dataset.originalBg) {
					title.dataset.originalBg = title.style.backgroundColor || ""
					title.dataset.originalBorder = title.style.border || ""
					title.dataset.originalPadding = title.style.padding || ""
					title.dataset.originalBorderRadius = title.style.borderRadius || ""
				}

				title.style.backgroundColor = "#e6f3ff"
				title.style.border = "2px solid #0066cc"
				title.style.padding = "4px 8px"
				title.style.borderRadius = "4px"
				title.classList.add("wcag-highlighted-title")
			}
		})
	}

	restoreShowHeadlines() {
		const existingPanel = document.querySelector('.wcag-headlines-panel');
		if (existingPanel) {
			// Use existing panel
			this.headlinesPanel = existingPanel;
			this.headlinesPanel.style.display = "block";
		} else if (!this.headlinesPanel) {
			// Create new panel
			this.createHeadlinesPanel();
		} else {
			// Show existing panel
			this.headlinesPanel.style.display = "block";
		}
	}

	applyState() {
		const content = document.querySelector(".wcag-adjustable-content")
		if (content) {
			content.style.fontSize = `${this.state.fontSize}%`
			content.style.lineHeight = `${this.state.lineHeight}`
			content.style.letterSpacing = `${this.state.letterSpacing}px`
		}
	}

	updateControlAppearance(id) {
		const control = document.querySelector('[data-control-id="' + id + '"]')
		if (!control) return

		const wrapper = document.querySelector('[data-control-wrapper="' + id + '"]')
		const inner = document.querySelector('[data-control-inner="' + id + '"]')
		const existingCheckmark = inner ? inner.querySelector('div[data-checkmark="' + id + '"]') : null
		const arrowButtons = control.querySelectorAll('[data-arrow-button="true"]')

		const toggleIds = ["textMagnifier", "highlightLinks", "highlightTitles", "showHeadlines", "letterSpacing", "textAlign"]
		const isToggle = toggleIds.includes(id)
		let isActive
		if (isToggle) {
			if (id === "letterSpacing" || id === "textAlign") {
				isActive = this.state[id] !== this.defaultState[id]
			} else {
				isActive = !!this.state[id]
			}
		} else {
			isActive = this.state[id] !== this.defaultState[id]
		}

		const accent = this.accentColor
		const inactiveBorder = this.inactiveBorderColor
		const inactiveText = this.defaultTextColor

		if (wrapper) {
			wrapper.setAttribute("data-active", isActive ? "true" : "false")
		}

		if (inner) {
			inner.style.border = isActive ? "2px solid " + accent : "1px solid " + inactiveBorder
			inner.style.backgroundColor = "white"
		}

		if (isActive && !existingCheckmark && inner) {
			const checkmark = this.wcagTools.createElement(
				"div",
				{ "data-checkmark": id },
				{
					position: "absolute",
					top: "-1px",
					right: "-1px",
					width: "40px",
					height: "40px",
					backgroundColor: accent,
					borderRadius: "0 16px 0 16px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					zIndex: "10",
				},
				[ this.wcagTools.createElement("i", { class: "fa fa-check" }, { fontSize: "14px", color: "white" }) ]
			)
			inner.appendChild(checkmark)
		} else if (!isActive && existingCheckmark) {
			existingCheckmark.remove()
		}

		if (isToggle) {
			control.setAttribute("aria-pressed", isActive ? "true" : "false")
		}

		const targetColor = isActive ? accent : inactiveText
		control.style.color = targetColor
		Array.from(control.querySelectorAll("i"))
			.filter((icon) => !icon.closest('[data-arrow-button="true"]'))
			.forEach((icon) => {
				icon.style.color = targetColor
			})

		arrowButtons.forEach((btn) => {
			btn.style.backgroundColor = isActive ? accent : "#d1d5db"
			btn.style.color = isActive ? "white" : inactiveText
		})

		const labelSpan = ["textAlign", "letterSpacing", "contrast", "saturation"].includes(id) ? null : control.querySelector("span")
		if (labelSpan) {
			// Only update labels that have dynamic values (fontSize, lineHeight)
			// Static labels (textMagnifier, highlightLinks, etc.) should NOT be overwritten
			// to preserve Google Translate translations
			if (id === "fontSize" || id === "lineHeight") {
				const baseFallback = id === "fontSize" ? "Font Size" : "Line Height"
				const currentText = (labelSpan.textContent || "").trim()

				// Helper to extract base text without value in parentheses
				const extractBase = (text) => {
					if (!text) return null
					const parenIndex = text.indexOf("(")
					return parenIndex > 0 ? text.slice(0, parenIndex).trim() : text
				}

				const currentBase = extractBase(currentText)

				// Capture translated base label whenever translation is active.
				// This avoids reverting to English if an earlier snapshot happened before translation applied.
				if (this.isTranslationActive() && currentBase && currentBase !== baseFallback && !this.isValueOnlyText(currentBase)) {
					labelSpan.dataset.defaultTranslated = currentBase
				}

				// Get the base label to use:
				// 1. Prefer captured translated base (already without parentheses)
				// 2. Extract base from stored defaultLabel (in case it has parentheses)
				// 3. Fall back to English base
				let baseLabel = extractBase(labelSpan.dataset.defaultTranslated)
				if (!baseLabel && labelSpan.dataset.defaultLabel) {
					baseLabel = extractBase(labelSpan.dataset.defaultLabel)
				}
				if (!baseLabel && currentBase) {
					baseLabel = currentBase
				}
				if (!baseLabel) {
					baseLabel = baseFallback
				}

				const valueText = id === "fontSize" ? `${this.state.fontSize}%` : `${this.state.lineHeight}`
				const labelText = `${baseLabel} (${valueText})`
				labelSpan.textContent = labelText
				control.setAttribute("aria-label", labelText)
			}
			// For static labels (textMagnifier, highlightLinks, etc.),
			// do NOT update textContent - leave the translated text as-is
		}

		if (id === "textAlign") {
			this.updateTextAlignVisuals(control)
		}
		if (id === "letterSpacing") {
			this.updateTextSpacingVisuals(control)
		}
		if (id === "saturation") {
			this.updateSaturationModeVisuals(control)
		}
	}

	updateTextAlignVisuals(control) {
		if (!control) return

		const options = this.getTextAlignOptions()
		const activeOption = options.find((option) => option.value === this.state.textAlign)
		const isDefault = !activeOption
		const iconClass = (activeOption ? activeOption.icon : "fa-light fa-align-left")
		const accent = this.accentColor

		const labelSpan = control.querySelector('[data-align-label]')
		if (labelSpan) {
			const fallback = "Text Align"
			const currentText = (labelSpan.textContent || "").trim()

			// Ensure we always have a stable base default label (avoid capturing an option label as the default)
			if (!labelSpan.dataset.defaultLabel) {
				labelSpan.dataset.defaultLabel = fallback
			}

			// Capture option translations first so we can safely detect whether current text is an option label
			if (this.isTranslationActive()) {
				this.captureOptionTranslations()
			}

			// Only capture as the translated default label if the current text is not one of the (non-default) option labels
			if (isDefault && this.isTranslationActive() && currentText && currentText !== fallback) {
				const normalize = (text) => String(text || "").trim().toLowerCase()
				const nonDefaultLabels = options.flatMap((opt) =>
					[opt.label, this.translatedOptions?.textAlign?.[opt.value]].filter(Boolean)
				)
				const isNonDefaultOptionLabel = nonDefaultLabels.some((label) => normalize(label) === normalize(currentText))
				if (!isNonDefaultOptionLabel) {
					this.storeDefaultLabel(labelSpan, fallback, true)
				}
			}

			const defaultLabel = labelSpan.dataset.defaultTranslated || labelSpan.dataset.defaultLabel || fallback
			if (!isDefault && activeOption) {
				const labelText = this.getTranslatedOptionLabel("textAlign", activeOption, defaultLabel)
				labelSpan.textContent = labelText
				control.setAttribute("aria-label", labelText)
			} else {
				const translatedDefault = this.translatedOptions?.textAlign?.default
				const labelText = translatedDefault || defaultLabel
				labelSpan.textContent = labelText
				control.setAttribute("aria-label", labelText)
			}
		}

		const iconElement = control.querySelector('[data-align-icon]')
		if (iconElement) {
			iconElement.className = iconClass
		}

		const indicatorDots = control.querySelectorAll('[data-align-dot]')
		const activeIndex = activeOption ? options.findIndex((option) => option.value === activeOption.value) : -1
		indicatorDots.forEach((dot) => {
			const dotIndex = Number(dot.getAttribute("data-align-index"))
			const isFilled = activeIndex >= 0 && dotIndex <= activeIndex
			dot.style.backgroundColor = isFilled ? accent : "#e5e7eb"
			dot.style.opacity = isFilled ? 1 : 0.4
		})
	}

	updateTextSpacingVisuals(control) {
		if (!control) return

		const options = TEXT_SPACING_OPTIONS
		const activeOption = options.find((option) => option.value === this.state.letterSpacing) || options[0]
		const isDefault = !activeOption || activeOption.value === 0
		const accent = this.accentColor

		const labelSpan = control.querySelector('[data-spacing-label]')
		if (labelSpan) {
			const fallback = "Text Spacing"
			const currentText = (labelSpan.textContent || "").trim()

			// Ensure we always have a stable base default label (avoid capturing an option label as the default)
			if (!labelSpan.dataset.defaultLabel) {
				labelSpan.dataset.defaultLabel = fallback
			}

			// Capture option translations first so we can safely detect whether current text is an option label
			if (this.isTranslationActive()) {
				this.captureOptionTranslations()
			}

			// Only capture as the translated default label if the current text is not one of the non-default option labels
			if (isDefault && this.isTranslationActive() && currentText && currentText !== fallback) {
				const normalize = (text) => String(text || "").trim().toLowerCase()
				const nonDefaultLabels = options
					.filter((opt) => opt.value !== 0)
					.flatMap((opt) => [opt.label, this.translatedOptions?.textSpacing?.[opt.value]].filter(Boolean))
				const isNonDefaultOptionLabel = nonDefaultLabels.some((label) => normalize(label) === normalize(currentText))
				if (!isNonDefaultOptionLabel) {
					this.storeDefaultLabel(labelSpan, fallback, true)
				}
			}

			const defaultLabel = labelSpan.dataset.defaultTranslated || labelSpan.dataset.defaultLabel || fallback
			if (!isDefault && activeOption) {
				const labelText = this.getTranslatedOptionLabel("textSpacing", activeOption, defaultLabel)
				labelSpan.textContent = labelText
				control.setAttribute("aria-label", labelText)
			} else {
				const translatedDefault = this.translatedOptions?.textSpacing?.[0]
				const labelText = translatedDefault || defaultLabel
				labelSpan.textContent = labelText
				control.setAttribute("aria-label", labelText)
			}
		}

		const iconElement = control.querySelector('[data-spacing-icon]')
		if (iconElement) {
			iconElement.className = activeOption.icon
		}

		const indicatorDots = control.querySelectorAll('[data-spacing-dot]')
		const activeIndex = options.findIndex((option) => option.value === this.state.letterSpacing)
		const fillCount = Math.max(0, activeIndex)

		indicatorDots.forEach((dot) => {
			const dotIndex = Number(dot.getAttribute("data-spacing-index"))
			const isFilled = dotIndex < fillCount
			dot.style.backgroundColor = isFilled ? accent : "#e5e7eb"
			dot.style.opacity = isFilled ? 1 : 0.4
		})
	}

	getTextAlignOptions() {
		return [
			{ value: "left", label: "Align Left", icon: "fa-light fa-align-left" },
			{ value: "right", label: "Align Right", icon: "fa-light fa-align-right" },
			{ value: "center", label: "Align Center", icon: "fa-light fa-align-center" },
			{ value: "justify", label: "Align Justify", icon: "fa-light fa-align-justify" },
		]
	}



	// Cleanup method to remove event listeners and elements
	destroy() {
		if (this.magnifierElement) {
			this.magnifierElement.remove()
			this.magnifierElement = null
		}
		if (this.headlinesPanel) {
			this.headlinesPanel.remove()
			this.headlinesPanel = null
		}

		// Remove event listeners
		document.removeEventListener("mousemove", this.handleMagnifierMove)
		document.removeEventListener("mouseenter", this.handleMagnifierEnter, true)

		this.isInitialized = false
	}
}

class ColorAdjustment extends Component {
	constructor(wcagTools) {
		super(wcagTools)
		this.defaultState = {
			contrast: 100,
			contrastMode: "default",
			brightness: 100,
			brightnessMode: "default",
			saturation: 100,
			saturationMode: "default",
			invertColors: false,
			darkMode: false,
			lightContrast: false,
		}
		this.translatedOptions = {
			contrast: {},
			brightness: {},
			saturation: {},
		}
		this.translationProbeCreated = false

		this.accentColor = "#1e3a8a"
		this.inactiveBorderColor = "#e5e7eb"
		this.defaultTextColor = "#1f2937"

		// Load saved state from localStorage or use default
		this.state = this.loadState()
		this.applyContrastModeFlags()
		this.applyBrightnessModeValue()
		this.applySaturationModeValue()
		this.isInitialized = false
		this.filterStyle = null
		this.rootElement = null

		// Create translation probe early so Google Translate can pick up option labels
		this.ensureOptionTranslationProbe()

		this.initializeColorFilters()
	}

	// Load state from localStorage
	loadState() {
		try {
			const saved = localStorage.getItem("wcag-color-adjustments")
			if (saved) {
				const parsedState = JSON.parse(saved)
				// Merge with defaults to handle new features
				if (!parsedState.contrastMode) {
					if (parsedState.lightContrast) {
						parsedState.contrastMode = "light"
					} else if (parsedState.darkMode) {
						parsedState.contrastMode = "dark"
					} else if (parsedState.invertColors) {
						parsedState.contrastMode = "invert"
					} else {
						parsedState.contrastMode = "default"
					}
				}
				if (!parsedState.saturationMode) {
					const satValue = typeof parsedState.saturation === "number" ? parsedState.saturation : this.defaultState.saturation
					parsedState.saturationMode = this.inferSaturationModeFromValue(satValue)
				}
				if (!parsedState.brightnessMode) {
					const brightnessValue =
						typeof parsedState.brightness === "number" ? parsedState.brightness : this.defaultState.brightness
					parsedState.brightnessMode = this.inferBrightnessModeFromValue(brightnessValue)
				}
				return { ...this.defaultState, ...parsedState }
			}
		} catch (error) {
			console.warn("Failed to load WCAG color state:", error)
		}
		return { ...this.defaultState }
	}

	// Save state locally and ping the badge so it updates
	saveState() {
		try {
			localStorage.setItem("wcag-color-adjustments", JSON.stringify(this.state))
			// Update active feature count badge
			if (typeof window.updateWcagFeatureCount === 'function') {
				window.updateWcagFeatureCount();
			}
		} catch (error) {
			console.warn("Failed to save WCAG color state:", error)
		}
	}

	// Initialize or restore the component
	initialize() {
		if (this.isInitialized) {
			this.restoreActiveStates()
			return
		}

		this.restoreActiveStates()
		this.isInitialized = true
	}

	// Restore all active states when reopening
	restoreActiveStates() {
		this.applyContrastModeFlags()
		this.applyBrightnessModeValue()
		this.applySaturationModeValue()
		this.applyColorFilters()

		setTimeout(() => {
			;["contrast", "brightness", "saturation"].forEach((id) => {
				this.updateControlAppearance(id)
			})
		}, 100)
	}

	reset() {
		this.state = { ...this.defaultState }
		this.saveState()

		this.applyContrastModeFlags()
		this.applyBrightnessModeValue()
		this.applySaturationModeValue()
		this.applyColorFilters()

			;["contrast", "brightness", "saturation"].forEach((id) => {
				this.updateControlAppearance(id)
			})

		accessibility.announceChange("Color adjustments reset to default")
	}

	render() {
		const container = document.createElement("div")
		this.rootElement = container
		Object.assign(container.style, {
			padding: "20px",
			marginBottom: "20px",
			position: "relative",
		})

		container.appendChild(this.createTitle("Color Adjustments"))
		// container.appendChild(this.createResetButton())
		container.appendChild(this.createControls())

		// Initialize after rendering
		setTimeout(() => this.initialize(), 200)

		return container
	}

	createTitle(text) {
		return this.wcagTools.createElement(
			"h2",
			{},
			{
				fontSize: "16px",
				marginBottom: "15px",
				color: "#374151",
			},
			[text]
		)
	}

	createResetButton() {
		const resetBtn = this.wcagTools.createElement(
			"button",
			{
				"aria-label": "Reset color adjustments",
				title: "Reset to default",
			},
			{
				backgroundColor: "#dc2626",
				color: "white",
				border: "none",
				padding: "8px 14px",
				borderRadius: "6px",
				fontSize: "14px",
				fontWeight: "600",
				cursor: "pointer",
				transition: "all 0.2s ease",
				display: "inline-flex",
				alignItems: "center",
				gap: "8px",
				position: "absolute",
				top: "10px",
				right: "10px",
			},
			[
				this.wcagTools.createElement("i", { class: "fas fa-undo" }),
				""
			]
		)

		// Add hover effects
		resetBtn.addEventListener("mouseenter", () => {
			resetBtn.style.backgroundColor = "#b91c1c";
			resetBtn.style.transform = "translateY(-1px)";
		});

		resetBtn.addEventListener("mouseleave", () => {
			resetBtn.style.backgroundColor = "#dc2626";
			resetBtn.style.transform = "translateY(0)";
		});

		resetBtn.addEventListener("click", () => {
			this.reset()
		})

		return resetBtn
	}

	createControls() {
		const container = this.wcagTools.createElement(
			"div",
			{},
			{
				display: "grid",
				gridTemplateColumns: "repeat(6, 1fr)",
				gap: "20px",
				fontSize: "12px",
				color: "#000",
			}
		)

		const controls = [
			{ id: "contrast", icon: "fa-light fa-adjust", label: "Contrast", type: "cyclic", colSpan: 2 },
			{ id: "brightness", icon: "fa-light fa-sun", label: "Brightness", type: "cyclic", colSpan: 2 },
			{ id: "saturation", icon: "fa-light fa-palette", label: "Saturation", type: "cyclic", colSpan: 2 },
		]

		controls.forEach((control) => {
			container.appendChild(this.createControl(control))
		})

		return container
	}

	createControl({ id, icon, label, type, colSpan }) {
		const isContrastControl = id === "contrast"
		const isBrightnessControl = id === "brightness"
		const isSaturationControl = id === "saturation"
		const isActive = this.isControlActive(id)
		const accentColor = this.accentColor
		const inactiveBorder = this.inactiveBorderColor
		const inactiveText = this.defaultTextColor

		// Create wrapper div with column span
		const wrapper = this.wcagTools.createElement(
			"div",
			{
				"data-control-wrapper": id
			},
			{
				gridColumn: `span ${colSpan}`,
				position: "relative",
				display: "flex",
				alignItems: "stretch",
				justifyContent: "center",
				width: "100%",
				minHeight: "130px",
				border: "none",
				borderRadius: "18px",
				padding: "3px",
				transition: "all 0.3s",
				boxSizing: "border-box",
			}
		)
		wrapper.setAttribute("data-active", isActive ? "true" : "false")

		// Inner container (white background)
		const innerContainer = this.wcagTools.createElement(
			"div",
			{
				"data-control-inner": id
			},
			{
				width: "100%",
				minHeight: "130px",
				backgroundColor: "white",
				borderRadius: "16px",
				border: isActive ? "2px solid " + accentColor : "1px solid " + inactiveBorder,
				padding: "16px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				position: "relative",
				transition: "all 0.3s",
				boxSizing: "border-box",
			}
		)

		// Create checkmark badge for active state
		if (isActive) {
			const checkmark = this.wcagTools.createElement(
				"div",
				{
					"data-checkmark": id,
				},
				{
					position: "absolute",
					top: "-1px",
					right: "-1px",
					width: "40px",
					height: "40px",
					backgroundColor: accentColor,
					borderRadius: "0 16px 0 16px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					zIndex: "10",
				},
				[
					this.wcagTools.createElement("i", { class: "fa fa-check" }, {
						fontSize: "14px",
						color: "white",
					})
				]
			)
			innerContainer.appendChild(checkmark)
		}

		const restoreBaseBorders = () => {
			const activeState = wrapper.getAttribute("data-active") === "true"
			innerContainer.style.border = activeState ? "4px solid " + accentColor : "1px solid " + inactiveBorder
			innerContainer.style.background = "white"
			innerContainer.style.boxShadow = "none"
		}

		// Hover effects (match Content Adjustment behavior)
		wrapper.addEventListener("mouseenter", () => {
			if (wrapper.getAttribute("data-active") === "true") return
			innerContainer.style.borderColor = "#1e3a8a"
			innerContainer.style.background = "white"
			innerContainer.style.boxShadow = "0 2px 6px rgba(15, 23, 42, 0.08)"
		})

		wrapper.addEventListener("mouseleave", () => {
			restoreBaseBorders()
		})

		if (isContrastControl) {
			const content = this.wcagTools.createElement(
				"div",
				{
					"data-control-id": id,
					tabindex: "0",
					role: "switch",
					"aria-pressed": this.state.contrastMode !== "default" ? "true" : "false",
				},
				{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: "12px",
					width: "100%",
					minHeight: "100%",
					cursor: "pointer",
					userSelect: "none",
					borderRadius: "16px",
					color: isActive ? accentColor : inactiveText,
				}
			)

			const options = CONTRAST_MODE_OPTIONS
			const activeOption = options.find((option) => option.value === this.state.contrastMode) || options[0]

			const iconElement = this.wcagTools.createElement(
				"i",
				{ class: activeOption.icon, "data-contrast-icon": "true" },
				{
					fontSize: "22px",
					transition: "color 0.2s ease",
				}
			)

			const labelElement = this.wcagTools.createElement(
				"span",
				{ "data-contrast-label": "true" },
				{
					fontSize: "14px",
					fontWeight: "600",
					textAlign: "center",
				},
				[activeOption.label]
			)

			const indicatorRow = this.wcagTools.createElement(
				"div",
				{ "data-contrast-indicator": "true" },
				{
					display: "flex",
					gap: "6px",
					width: "100%",
					justifyContent: "center",
					marginTop: "auto",
				}
			)

			CONTRAST_MODE_OPTIONS.slice(1).forEach((option, index) => {
				const indicator = this.wcagTools.createElement(
					"span",
					{
						"data-contrast-dot": option.value,
						"data-contrast-index": index + 1,
					},
					{
						width: "24px",
						height: "6px",
						borderRadius: "999px",
						backgroundColor: "#e5e7eb",
						opacity: 0.4,
						transition: "all 0.2s ease",
					}
				)
				indicatorRow.appendChild(indicator)
			})

			content.appendChild(iconElement)
			content.appendChild(labelElement)
			content.appendChild(indicatorRow)
			content.setAttribute("aria-label", activeOption.label)
			this.updateContrastModeVisuals(content)
			content.addEventListener("click", () => this.cycleContrastMode())
			innerContainer.appendChild(content)
			wrapper.appendChild(innerContainer)
			return wrapper
		}

		if (isBrightnessControl) {
			const content = this.wcagTools.createElement(
				"div",
				{
					"data-control-id": id,
					tabindex: "0",
					role: "switch",
					"aria-pressed": this.state.brightnessMode && this.state.brightnessMode !== "default" ? "true" : "false",
				},
				{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: "12px",
					width: "100%",
					minHeight: "100%",
					cursor: "pointer",
					userSelect: "none",
					borderRadius: "16px",
					color: isActive ? accentColor : inactiveText,
				}
			)

			const options = BRIGHTNESS_MODE_OPTIONS
			const activeOption = options.find((option) => option.value === this.state.brightnessMode) || options[0]

			const iconElement = this.wcagTools.createElement(
				"i",
				{ class: activeOption.icon, "data-brightness-icon": "true" },
				{
					fontSize: "22px",
					transition: "color 0.2s ease",
				}
			)

			const labelElement = this.wcagTools.createElement(
				"span",
				{ "data-brightness-label": "true" },
				{
					fontSize: "14px",
					fontWeight: "600",
					textAlign: "center",
				},
				[activeOption.label]
			)

			const indicatorRow = this.wcagTools.createElement(
				"div",
				{ "data-brightness-indicator": "true" },
				{
					display: "flex",
					gap: "6px",
					width: "100%",
					justifyContent: "center",
					marginTop: "auto",
				}
			)

			BRIGHTNESS_MODE_OPTIONS.slice(1).forEach((option, index) => {
				const indicator = this.wcagTools.createElement(
					"span",
					{
						"data-brightness-dot": option.value,
						"data-brightness-index": index + 1,
					},
					{
						width: "24px",
						height: "6px",
						borderRadius: "999px",
						backgroundColor: "#e5e7eb",
						opacity: 0.4,
						transition: "all 0.2s ease",
					}
				)
				indicatorRow.appendChild(indicator)
			})

			content.appendChild(iconElement)
			content.appendChild(labelElement)
			content.appendChild(indicatorRow)
			content.setAttribute("aria-label", activeOption.label)
			this.updateBrightnessModeVisuals(content)
			content.addEventListener("click", () => this.cycleBrightnessMode())
			innerContainer.appendChild(content)
			wrapper.appendChild(innerContainer)
			return wrapper
		}

		if (isSaturationControl) {
			const content = this.wcagTools.createElement(
				"div",
				{
					"data-control-id": id,
					tabindex: "0",
					role: "switch",
					"aria-pressed": this.state.saturationMode && this.state.saturationMode !== "default" ? "true" : "false",
				},
				{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: "12px",
					width: "100%",
					minHeight: "100%",
					cursor: "pointer",
					userSelect: "none",
					borderRadius: "16px",
					color: isActive ? accentColor : inactiveText,
				}
			)

			const options = SATURATION_MODE_OPTIONS
			const activeOption = options.find((option) => option.value === this.state.saturationMode) || options[0]

			const iconElement = this.wcagTools.createElement(
				"i",
				{ class: activeOption.icon, "data-saturation-icon": "true" },
				{
					fontSize: "22px",
					transition: "color 0.2s ease",
				}
			)

			const labelElement = this.wcagTools.createElement(
				"span",
				{ "data-saturation-label": "true" },
				{
					fontSize: "14px",
					fontWeight: "600",
					textAlign: "center",
				},
				[activeOption.label]
			)

			const indicatorRow = this.wcagTools.createElement(
				"div",
				{ "data-saturation-indicator": "true" },
				{
					display: "flex",
					gap: "6px",
					width: "100%",
					justifyContent: "center",
					marginTop: "auto",
				}
			)

			SATURATION_MODE_OPTIONS.slice(1).forEach((option, index) => {
				const indicator = this.wcagTools.createElement(
					"span",
					{
						"data-saturation-dot": option.value,
						"data-saturation-index": index + 1,
					},
					{
						width: "24px",
						height: "6px",
						borderRadius: "999px",
						backgroundColor: "#e5e7eb",
						opacity: 0.4,
						transition: "all 0.2s ease",
					}
				)
				indicatorRow.appendChild(indicator)
			})

			content.appendChild(iconElement)
			content.appendChild(labelElement)
			content.appendChild(indicatorRow)
			content.setAttribute("aria-label", activeOption.label)
			this.updateSaturationModeVisuals(content)
			content.addEventListener("click", () => this.cycleSaturationMode())
			innerContainer.appendChild(content)
			wrapper.appendChild(innerContainer)
			return wrapper
		}

		// Toggle type control (simple button)
		const content = this.wcagTools.createElement(
			"div",
			{
				"data-control-id": id,
				tabindex: "0",
				role: "switch",
				"aria-pressed": isActive ? "true" : "false",
			},
			{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: "10px",
				width: "100%",
				minHeight: "100%",
				cursor: "pointer",
				userSelect: "none",
				borderRadius: "16px",
				color: isActive ? accentColor : inactiveText,
			}
		)

		const iconElement = this.wcagTools.createElement(
			"i",
			{ class: icon },
			{
				fontSize: "18px !important",
				color: isActive ? accentColor : inactiveText,
			}
		)
		content.appendChild(iconElement)

		const labelElement = this.wcagTools.createElement(
			"span",
			{},
			{},
			[label]
		)
		content.appendChild(labelElement)

		content.addEventListener("click", () => this.handleAdjustment(id, type))
		innerContainer.appendChild(content)

		wrapper.appendChild(innerContainer)
		return wrapper
	}

	handleAdjustment(id, type) {
		if (type === "toggle") {
			this.toggleColorMode(id)
		} else {
			if (id === "contrast") {
				this.cycleContrastMode()
			} else if (id === "brightness") {
				this.cycleBrightnessMode()
			} else if (id === "saturation") {
				this.cycleSaturationMode()
			} else {
				this.adjustColorProperty(id)
			}
		}
		this.saveState()
	}

	cycleContrastMode() {
		const modes = CONTRAST_MODE_OPTIONS.map((option) => option.value)
		let currentIndex = modes.indexOf(this.state.contrastMode)
		if (currentIndex === -1) currentIndex = 0
		const nextIndex = (currentIndex + 1) % modes.length
		this.setContrastMode(modes[nextIndex])
	}

	setContrastMode(mode, silent = false) {
		if (!CONTRAST_MODE_OPTIONS.some((option) => option.value === mode)) {
			mode = "default"
		}
		this.state.contrastMode = mode
		this.applyContrastModeFlags()
		this.applyColorFilters()
		this.saveState()

		if (mode !== "default") {
			this.wcagTools?.orientationAdjustment?.handleContrastModeActivated?.()
		}

		const idsToUpdate = ["contrast"]
		if (!silent) {
			idsToUpdate.forEach((controlId) => this.updateControlAppearance(controlId))
			const modeLabel = CONTRAST_MODE_OPTIONS.find((option) => option.value === mode)?.label || "Contrast +"
			if (mode === "default") {
				accessibility.announceChange("Contrast reset to default")
			} else {
				accessibility.announceChange(`${modeLabel} enabled`)
			}
		}
	}

	applyContrastModeFlags() {
		this.state.contrast = this.defaultState.contrast
		this.state.invertColors = this.state.contrastMode === "invert"
		this.state.darkMode = this.state.contrastMode === "dark"
		this.state.lightContrast = this.state.contrastMode === "light"
	}

	updateContrastModeFromToggles() {
		if (this.state.lightContrast) {
			this.state.contrastMode = "light"
		} else if (this.state.darkMode) {
			this.state.contrastMode = "dark"
		} else if (this.state.invertColors) {
			this.state.contrastMode = "invert"
		} else {
			this.state.contrastMode = "default"
		}
	}

	updateContrastModeVisuals(control) {
		if (!control) return

		const options = CONTRAST_MODE_OPTIONS
		const activeOption = options.find((option) => option.value === this.state.contrastMode) || options[0]
		const isDefault = !activeOption || activeOption.value === "default"
		const accent = this.accentColor

		const labelSpan = control.querySelector('[data-contrast-label]')
		if (labelSpan) {
			const fallback = "Contrast +"
			const currentText = (labelSpan.textContent || "").trim()

			// Capture option translations first so we can check against them
			if (this.isTranslationActive()) {
				this.captureOptionTranslations()
			}

			// Only capture as default translated label if:
			// 1. We're at default state
			// 2. Translation is active
			// 3. Current text exists and is not the English fallback
			// 4. Current text is NOT one of the non-default options (translated or not)
			if (isDefault && this.isTranslationActive() && currentText && currentText !== fallback) {
				// Check if current text is a non-default option's label (shouldn't capture those)
				const nonDefaultLabels = options
					.filter(opt => opt.value !== "default")
					.flatMap(opt => [opt.label, this.translatedOptions?.contrast?.[opt.value]].filter(Boolean))
				const isNonDefaultOptionLabel = nonDefaultLabels.some(label =>
					currentText.toLowerCase() === label.toLowerCase()
				)
				if (!isNonDefaultOptionLabel) {
					this.storeDefaultLabel(labelSpan, fallback, true)
				}
			}

			// Get the default label - prefer previously captured translated label
			const defaultLabel =
				labelSpan.dataset.defaultTranslated ||
				labelSpan.dataset.defaultLabel ||
				fallback

			if (!isDefault && activeOption) {
				const labelText = this.getTranslatedOptionLabel("contrast", activeOption, defaultLabel)
				labelSpan.textContent = labelText
				control.setAttribute("aria-label", labelText)
			} else {
				// Prefer per-option translation for the default label; fall back to the captured default label if missing
				const translatedDefault = this.translatedOptions?.contrast?.[options[0].value]
				const labelText = translatedDefault || defaultLabel
				labelSpan.textContent = labelText
				control.setAttribute("aria-label", labelText)
			}
		}

		const iconElement = control.querySelector('[data-contrast-icon]')
		if (iconElement) {
			iconElement.className = activeOption.icon
		}

		const indicatorDots = control.querySelectorAll('[data-contrast-dot]')
		const activeIndex = options.findIndex((option) => option.value === this.state.contrastMode)
		const fillCount = Math.max(0, activeIndex)

		indicatorDots.forEach((dot) => {
			const dotIndex = Number(dot.getAttribute("data-contrast-index"))
			const isFilled = dotIndex <= fillCount && fillCount > 0
			dot.style.backgroundColor = isFilled ? accent : "#e5e7eb"
			dot.style.opacity = isFilled ? 1 : 0.4
		})
	}

	cycleBrightnessMode() {
		const modes = BRIGHTNESS_MODE_OPTIONS.map((option) => option.value)
		let currentIndex = modes.indexOf(this.state.brightnessMode)
		if (currentIndex === -1) currentIndex = 0
		const nextIndex = (currentIndex + 1) % modes.length
		this.setBrightnessMode(modes[nextIndex])
	}

	setBrightnessMode(mode, silent = false) {
		if (!BRIGHTNESS_MODE_OPTIONS.some((option) => option.value === mode)) {
			mode = "default"
		}
		this.state.brightnessMode = mode
		this.state.brightness = this.getBrightnessValueForMode(mode)
		this.applyColorFilters()
		this.saveState()
		this.updateControlAppearance("brightness")

		if (!silent) {
			if (mode === "default") {
				accessibility.announceChange("Brightness reset to default")
			} else {
				const modeLabel = BRIGHTNESS_MODE_OPTIONS.find((option) => option.value === mode)?.label || "Brightness"
				accessibility.announceChange(`${modeLabel} enabled`)
			}
		}
	}

	getBrightnessValueForMode(mode) {
		switch (mode) {
			case "dim":
				return 75
			case "bright":
				return 125
			case "vivid":
				return 150
			default:
				return this.defaultState.brightness
		}
	}

	inferBrightnessModeFromValue(value) {
		if (value >= 145) return "vivid"
		if (value >= 115) return "bright"
		if (value <= 90) return "dim"
		return "default"
	}

	applyBrightnessModeValue() {
		this.state.brightness = this.getBrightnessValueForMode(this.state.brightnessMode || "default")
	}

	updateBrightnessModeVisuals(control) {
		if (!control) return

		const options = BRIGHTNESS_MODE_OPTIONS
		const activeOption = options.find((option) => option.value === this.state.brightnessMode) || options[0]
		const isDefault = !activeOption || activeOption.value === "default"
		const accent = this.accentColor

		const labelSpan = control.querySelector('[data-brightness-label]')
		if (labelSpan) {
			const fallback = "Brightness"
			const currentText = (labelSpan.textContent || "").trim()

			// Capture option translations first so we can check against them
			if (this.isTranslationActive()) {
				this.captureOptionTranslations()
			}

			// Only capture as default translated label if current text is NOT a non-default option's label
			if (isDefault && this.isTranslationActive() && currentText && currentText !== fallback) {
				const nonDefaultLabels = options
					.filter(opt => opt.value !== "default")
					.flatMap(opt => [opt.label, this.translatedOptions?.brightness?.[opt.value]].filter(Boolean))
				const isNonDefaultOptionLabel = nonDefaultLabels.some(label =>
					currentText.toLowerCase() === label.toLowerCase()
				)
				if (!isNonDefaultOptionLabel) {
					this.storeDefaultLabel(labelSpan, fallback, true)
				}
			}

			const defaultLabel =
				labelSpan.dataset.defaultTranslated ||
				labelSpan.dataset.defaultLabel ||
				fallback

			if (!isDefault && activeOption) {
				const labelText = this.getTranslatedOptionLabel("brightness", activeOption, defaultLabel)
				labelSpan.textContent = labelText
				control.setAttribute("aria-label", labelText)
			} else {
				// Prefer per-option translation for the default label; fall back to the captured default label if missing
				const translatedDefault = this.translatedOptions?.brightness?.[options[0].value]
				const labelText = translatedDefault || defaultLabel
				labelSpan.textContent = labelText
				control.setAttribute("aria-label", labelText)
			}
		}

		const iconElement = control.querySelector('[data-brightness-icon]')
		if (iconElement) {
			iconElement.className = activeOption.icon
		}

		const indicatorDots = control.querySelectorAll('[data-brightness-dot]')
		const activeIndex = options.findIndex((option) => option.value === this.state.brightnessMode)
		const fillCount = Math.max(0, activeIndex)

		indicatorDots.forEach((dot) => {
			const dotIndex = Number(dot.getAttribute("data-brightness-index"))
			const isFilled = dotIndex <= fillCount && fillCount > 0
			dot.style.backgroundColor = isFilled ? accent : "#e5e7eb"
			dot.style.opacity = isFilled ? 1 : 0.4
		})
	}

	cycleSaturationMode() {
		const modes = SATURATION_MODE_OPTIONS.map((option) => option.value)
		let currentIndex = modes.indexOf(this.state.saturationMode)
		if (currentIndex === -1) currentIndex = 0
		const nextIndex = (currentIndex + 1) % modes.length
		this.setSaturationMode(modes[nextIndex])
	}

	setSaturationMode(mode, silent = false) {
		if (!SATURATION_MODE_OPTIONS.some((option) => option.value === mode)) {
			mode = "default"
		}
		this.state.saturationMode = mode
		this.state.saturation = this.getSaturationValueForMode(mode)
		this.applyColorFilters()
		this.saveState()
		this.updateControlAppearance("saturation")

		if (!silent) {
			if (mode === "default") {
				accessibility.announceChange("Saturation reset to default")
			} else {
				const modeLabel = SATURATION_MODE_OPTIONS.find((option) => option.value === mode)?.label || "Saturation"
				accessibility.announceChange(`${modeLabel} enabled`)
			}
		}
	}

	getSaturationValueForMode(mode) {
		switch (mode) {
			case "low":
				return 75
			case "high":
				return 150
			case "desaturate":
				return 0
			default:
				return this.defaultState.saturation
		}
	}

	inferSaturationModeFromValue(value) {
		if (value <= 5) return "desaturate"
		if (value >= 140) return "high"
		if (value <= 85) return "low"
		return "default"
	}

	applySaturationModeValue() {
		this.state.saturation = this.getSaturationValueForMode(this.state.saturationMode || "default")
	}

	updateSaturationModeVisuals(control) {
		if (!control) return

		const options = SATURATION_MODE_OPTIONS
		const activeOption = options.find((option) => option.value === this.state.saturationMode) || options[0]
		const isDefault = !activeOption || activeOption.value === "default"
		const accent = this.accentColor

		const labelSpan = control.querySelector('[data-saturation-label]')
		if (labelSpan) {
			const fallback = "Saturation"
			const currentText = (labelSpan.textContent || "").trim()

			// Capture option translations first so we can check against them
			if (this.isTranslationActive()) {
				this.captureOptionTranslations()
			}

			// Only capture as default translated label if current text is NOT a non-default option's label
			if (isDefault && this.isTranslationActive() && currentText && currentText !== fallback) {
				const nonDefaultLabels = options
					.filter(opt => opt.value !== "default")
					.flatMap(opt => [opt.label, this.translatedOptions?.saturation?.[opt.value]].filter(Boolean))
				const isNonDefaultOptionLabel = nonDefaultLabels.some(label =>
					currentText.toLowerCase() === label.toLowerCase()
				)
				if (!isNonDefaultOptionLabel) {
					this.storeDefaultLabel(labelSpan, fallback, true)
				}
			}

			const defaultLabel =
				labelSpan.dataset.defaultTranslated ||
				labelSpan.dataset.defaultLabel ||
				fallback

			if (!isDefault && activeOption) {
				const labelText = this.getTranslatedOptionLabel("saturation", activeOption, defaultLabel)
				labelSpan.textContent = labelText
				control.setAttribute("aria-label", labelText)
			} else {
				// Prefer per-option translation for the default label; fall back to the captured default label if missing
				const translatedDefault = this.translatedOptions?.saturation?.[options[0].value]
				const labelText = translatedDefault || defaultLabel
				labelSpan.textContent = labelText
				control.setAttribute("aria-label", labelText)
			}
		}

		const iconElement = control.querySelector('[data-saturation-icon]')
		if (iconElement) {
			iconElement.className = activeOption.icon
		}

		const indicatorDots = control.querySelectorAll('[data-saturation-dot]')
		const activeIndex = options.findIndex((option) => option.value === this.state.saturationMode)
		const fillCount = Math.max(0, activeIndex)

		indicatorDots.forEach((dot) => {
			const dotIndex = Number(dot.getAttribute("data-saturation-index"))
			const isFilled = dotIndex <= fillCount && fillCount > 0
			dot.style.backgroundColor = isFilled ? accent : "#e5e7eb"
			dot.style.opacity = isFilled ? 1 : 0.4
		})
	}

	// Capture translated/default labels for color controls
	captureDefaultLabels() {
		const contrastLabel = document.querySelector('[data-contrast-label]')
		if (contrastLabel && this.state.contrastMode === "default") {
			this.storeDefaultLabel(contrastLabel, "Contrast +", true)
		}

		const brightnessLabel = document.querySelector('[data-brightness-label]')
		if (brightnessLabel && this.state.brightnessMode === "default") {
			this.storeDefaultLabel(brightnessLabel, "Brightness", true)
		}

		const saturationLabel = document.querySelector('[data-saturation-label]')
		if (saturationLabel && this.state.saturationMode === "default") {
			this.storeDefaultLabel(saturationLabel, "Saturation", true)
		}

		// Also cache translated labels for each option so switching modes keeps the selected language
		this.captureOptionTranslations()
	}

	ensureOptionTranslationProbe() {
		if (this.translationProbeCreated || typeof document === "undefined") return

		const existing = document.getElementById("wcag-translation-probe")
		if (existing) {
			this.translationProbeCreated = true
			this.translationProbe = existing
			return
		}

		const probe = document.createElement("div")
		probe.id = "wcag-translation-probe"
		Object.assign(probe.style, {
			position: "absolute",
			left: "-9999px",
			top: "0",
			opacity: "0",
			pointerEvents: "none",
			zIndex: "-1",
		})

		const groups = [
			{ key: "contrast", options: CONTRAST_MODE_OPTIONS },
			{ key: "brightness", options: BRIGHTNESS_MODE_OPTIONS },
			{ key: "saturation", options: SATURATION_MODE_OPTIONS },
		]

		groups.forEach(({ key, options }) => {
			options.forEach((opt) => {
				const span = document.createElement("span")
				span.dataset.translateProbe = `${key}-${opt.value}`
				span.textContent = opt.label
				probe.appendChild(span)
			})
		})

		document.body.appendChild(probe)
		this.translationProbeCreated = true
		this.translationProbe = probe
	}

	captureOptionTranslations() {
		if (!this.isTranslationActive()) return
		this.ensureOptionTranslationProbe()

		const groups = [
			{ key: "contrast", options: CONTRAST_MODE_OPTIONS },
			{ key: "brightness", options: BRIGHTNESS_MODE_OPTIONS },
			{ key: "saturation", options: SATURATION_MODE_OPTIONS },
		]

		groups.forEach(({ key, options }) => {
			options.forEach((opt) => {
				const el = document.querySelector(`[data-translate-probe="${key}-${opt.value}"]`)
				if (!el) return
				const text = (el.textContent || "").trim()
				if (text && !this.isValueOnlyText(text) && text !== opt.label) {
					this.translatedOptions[key][opt.value] = text
				}
			})
		})
	}

	getTranslatedOptionLabel(group, option, fallback) {
		const translated = this.translatedOptions[group]?.[option.value]
		return translated || option.label || fallback
	}

	adjustColorProperty(property) {
		// Define adjustment ranges and steps
		const adjustments = {
			contrast: {
				values: [50, 75, 100, 125, 150, 175, 200],
				default: 100,
			},
			brightness: {
				values: [50, 75, 100, 125, 150],
				default: 100,
			},
			saturation: {
				values: [0, 25, 50, 75, 100, 125, 150, 200],
				default: 100,
			},
		}

		const config = adjustments[property]
		const currentIndex = config.values.indexOf(this.state[property])
		const nextIndex = (currentIndex + 1) % config.values.length

		this.state[property] = config.values[nextIndex]

		this.applyColorFilters()

		this.updateControlAppearance(property)

		accessibility.announceChange(`${property} set to ${this.state[property]}%`)
	}

	toggleColorMode(mode) {
		if (mode === "invertColors" || mode === "darkMode" || mode === "lightContrast") {
			const targetMode =
				mode === "invertColors"
					? (this.state.contrastMode === "invert" ? "default" : "invert")
					: mode === "darkMode"
						? (this.state.contrastMode === "dark" ? "default" : "dark")
						: (this.state.contrastMode === "light" ? "default" : "light")

			this.setContrastMode(targetMode)
			return
		}

		// Toggle the requested mode
		this.state[mode] = !this.state[mode]

		// Apply the changes
		this.applyColorFilters()

		const idsToUpdate = ["contrast"]
		idsToUpdate.forEach((id) => this.updateControlAppearance(id))

		accessibility.announceChange(`${mode} ${this.state[mode] ? "enabled" : "disabled"}`)
	}

	updateControlAppearance(id) {
		const root = this.rootElement || document
		if (!root) return

		const wrapper = root.querySelector('[data-control-wrapper="' + id + '"]')
		const inner = root.querySelector('[data-control-inner="' + id + '"]')
		const control = root.querySelector('[data-control-id="' + id + '"]')
		if (!wrapper || !inner || !control) return
		const icon = control.querySelector('i')
		const existingCheckmark = inner.querySelector('div[data-checkmark="' + id + '"]')

		const isActive = this.isControlActive(id)
		const accent = this.accentColor
		const inactiveBorder = this.inactiveBorderColor
		const inactiveText = this.defaultTextColor

		if (wrapper) {
			wrapper.setAttribute("data-active", isActive ? "true" : "false")
		}

		if (inner) {
			inner.style.border = isActive ? "2px solid " + accent : "1px solid " + inactiveBorder
			inner.style.backgroundColor = "white"
		}

		if (isActive && !existingCheckmark && inner) {
			const checkmark = this.wcagTools.createElement(
				"div",
				{ "data-checkmark": id },
				{
					position: "absolute",
					top: "-1px",
					right: "-1px",
					width: "40px",
					height: "40px",
					backgroundColor: accent,
					borderRadius: "0 16px 0 16px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					zIndex: "10",
				},
				[ this.wcagTools.createElement("i", { class: "fa fa-check" }, { fontSize: "14px", color: "white" }) ]
			)
			inner.appendChild(checkmark)
		} else if (!isActive && existingCheckmark) {
			existingCheckmark.remove()
		}

		control.setAttribute("aria-pressed", isActive ? "true" : "false")
		const targetColor = isActive ? accent : inactiveText
		control.style.color = targetColor
		if (icon) {
			icon.style.color = targetColor
		}

		if (id === "contrast") {
			this.updateContrastModeVisuals(control)
		} else if (id === "brightness") {
			this.updateBrightnessModeVisuals(control)
		} else if (id === "saturation") {
			this.updateSaturationModeVisuals(control)
		}
	}

	isControlActive(id) {
		const toggleControls = ["invertColors", "darkMode", "lightContrast"]
		const cyclicControls = ["contrast", "brightness", "saturation"]

		if (id === "contrast") {
			return this.state.contrastMode !== "default"
		}
		if (id === "saturation") {
			return this.state.saturationMode && this.state.saturationMode !== "default"
		}

		if (toggleControls.includes(id)) {
			return !!this.state[id]
		}

		if (cyclicControls.includes(id)) {
			const value = Number(this.state[id])
			const defaultValue = Number(this.defaultState[id])
			if (Number.isNaN(value)) return false

			// Treat both 100 (percentage) and 1 (normalized) as "default"
			if (Math.abs(value - defaultValue) < 0.0001) return false
			if (Math.abs(value - 1) < 0.0001) return false
			return true
		}

		return this.state[id] !== this.defaultState[id]
	}

	// Initialize color filter styles
	initializeColorFilters() {
		if (!document.getElementById("wcag-color-filters-style")) {
			this.filterStyle = document.createElement("style")
			this.filterStyle.id = "wcag-color-filters-style"
			document.head.appendChild(this.filterStyle)
		} else {
			this.filterStyle = document.getElementById("wcag-color-filters-style")
		}
	}

	// Apply color filters to the entire page
	applyColorFilters() {
		if (!this.filterStyle) {
			this.initializeColorFilters();
		}

		const { contrast, brightness, saturation, invertColors, darkMode, lightContrast } = this.state;

		// Build base filter string (convert percentages to decimal values)
		let baseFilters = `contrast(${contrast / 100}) brightness(${brightness / 100}) saturate(${saturation / 100})`;

		if (invertColors) {
			baseFilters += " invert(1)";
		}

		// One place to define what to ignore
		const ignoreSelectorsList = [
			'#wcag_tools_widget',
			'#wcap_tools_btn *',
			'.wcag_tools_item_block',
			'#wcap_tools_btn',
			'#wcag_skip_to_main_content_btn',
			'[data-control-id]',
			'.wcag-control',
			'#wcag_tools_widget *',
			'.wcag_tools_item_block *'
		];
		// Use :is() to group them, then negate with :not()
		const IGNORE = `:is(${ignoreSelectorsList.join(', ')})`;

		let cssContent = `
    /* Share filters via a var so we can update cheaply */
    :root { --wcag-base-filters: ${baseFilters}; }

    /* Apply filter ONLY to top-level body children, excluding ignored */
    body > *:not(${IGNORE}) {
      filter: var(--wcag-base-filters) !important;
      transition: filter 0.3s ease !important;
    }
  `;

		/* ---- Dark Mode ---- */
		if (darkMode) {
			cssContent += `
      html, body { background-color: #1a1a1a !important; color: #e0e0e0 !important; }

      /* Don’t touch ignored elements */
      *:not(${IGNORE}) {
        background-color: #1a1a1a !important;
        color: #e0e0e0 !important;
        border-color: #404040 !important;
      }

      input:not(${IGNORE}), textarea:not(${IGNORE}), select:not(${IGNORE}) {
        background-color: #2d2d2d !important;
        color: #e0e0e0 !important;
        border: 1px solid #555 !important;
      }

      button:not(${IGNORE}) {
        background-color: #3a3a3a !important;
        color: #e0e0e0 !important;
        border: 1px solid #555 !important;
      }

      a:not(${IGNORE}) { color: #66b3ff !important; }
      a:visited:not(${IGNORE}) { color: #b399ff !important; }

      img:not(${IGNORE}) { opacity: 0.85 !important; }

      table:not(${IGNORE}), th:not(${IGNORE}), td:not(${IGNORE}) {
        border-color: #555 !important;
        background-color: #2d2d2d !important;
      }

      input:focus:not(${IGNORE}), textarea:focus:not(${IGNORE}), select:focus:not(${IGNORE}) {
        outline: 2px solid #66b3ff !important;
        background-color: #333 !important;
      }
    `;
		}

		/* ---- Light Contrast ---- */
		if (lightContrast) {
			cssContent += `
      html, body { background-color: #ffffff !important; color: #000000 !important; }

      *:not(${IGNORE}) {
        background-color: #ffffff !important;
        color: #000000 !important;
        border-color: #cccccc !important;
        text-shadow: none !important;
        box-shadow: none !important;
      }

      input:not(${IGNORE}), textarea:not(${IGNORE}), select:not(${IGNORE}) {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #000000 !important;
      }

      button:not(${IGNORE}) {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #000000 !important;
      }

      a:not(${IGNORE}) { color: #0000ee !important; text-decoration: underline !important; }
      a:visited:not(${IGNORE}) { color: #551a8b !important; }

      img:not(${IGNORE}) { border: 1px solid #000000 !important; }

      table:not(${IGNORE}), th:not(${IGNORE}), td:not(${IGNORE}) {
        border: 1px solid #000000 !important;
        background-color: #ffffff !important;
      }

      input:focus:not(${IGNORE}),
      textarea:focus:not(${IGNORE}),
      select:focus:not(${IGNORE}),
      button:focus:not(${IGNORE}),
      a:focus:not(${IGNORE}) {
        outline: 3px solid #000000 !important;
        outline-offset: 2px !important;
      }
    `;
		}

		/* ---- Common extras (non-ignored only) ---- */
		cssContent += `
    img:not(${IGNORE}) { image-rendering: auto !important; }

    *:not(${IGNORE}) { text-rendering: optimizeLegibility !important; }

    /* Correct ordering: selector then ::before/::after */
    *:not(${IGNORE})::before, *:not(${IGNORE})::after {
      transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
    }
  `;

		this.filterStyle.textContent = cssContent;

	}



	// Get readable description of current settings
	getSettingsDescription() {
		const descriptions = []

		if (this.state.contrast !== this.defaultState.contrast) {
			descriptions.push(`Contrast: ${this.state.contrast}%`)
		}
		if (this.state.brightness !== this.defaultState.brightness) {
			descriptions.push(`Brightness: ${this.state.brightness}%`)
		}
		if (this.state.saturation !== this.defaultState.saturation) {
			descriptions.push(`Saturation: ${this.state.saturation}%`)
		}
		if (this.state.invertColors) {
			descriptions.push("Invert Colors: On")
		}
		if (this.state.darkMode) {
			descriptions.push("Dark Mode: On")
		}
		if (this.state.lightContrast) {
			descriptions.push("Light Contrast: On")
		}

		return descriptions.length > 0 ? descriptions.join(", ") : "Default settings"
	}

	applyPreset(presetName) {
		const presets = {
			"high-contrast": {
				contrast: 200,
				brightness: 100,
				saturation: 0,
				invertColors: false,
				darkMode: false,
				lightContrast: true,
			},
			"dark-mode": {
				contrast: 100,
				brightness: 100,
				saturation: 100,
				invertColors: false,
				darkMode: true,
				lightContrast: false,
			},
			"invert-colors": {
				contrast: 100,
				brightness: 100,
				saturation: 100,
				invertColors: true,
				darkMode: false,
				lightContrast: false,
			},
			grayscale: {
				contrast: 100,
				brightness: 100,
				saturation: 0,
				invertColors: false,
				darkMode: false,
				lightContrast: false,
			},
			bright: {
				contrast: 100,
				brightness: 150,
				saturation: 100,
				invertColors: false,
				darkMode: false,
				lightContrast: false,
			},
		}

		if (presets[presetName]) {
			this.state = { ...presets[presetName] }
			this.applyColorFilters()
			this.saveState()

			;["contrast", "brightness", "saturation"].forEach((id) => {
				this.updateControlAppearance(id)
			})

			accessibility.announceChange(`Applied ${presetName} preset`)
		}
	}

	// Enhanced cleanup method
	destroy() {
		this.state = { ...this.defaultState }
		this.applyColorFilters()

		if (this.filterStyle && this.filterStyle.parentNode) {
			const otherInstances = document.querySelectorAll(".wcag-color-adjustment")
			if (otherInstances.length <= 1) {
				this.filterStyle.remove()
			}
		}

		this.isInitialized = false
	}

	// Utility method to check if any adjustments are active
	hasActiveAdjustments() {
		return (
			this.state.contrast !== this.defaultState.contrast ||
			this.state.brightness !== this.defaultState.brightness ||
			this.state.saturation !== this.defaultState.saturation ||
			this.state.contrastMode !== "default" ||
			(this.state.saturationMode && this.state.saturationMode !== "default") ||
			this.state.invertColors ||
			this.state.darkMode ||
			this.state.lightContrast
		)
	}

	// Export current settings for sharing/importing
	exportSettings() {
		return {
			version: "1.0",
			timestamp: new Date().toISOString(),
			user: "zihaddi",
			settings: { ...this.state },
		}
	}

	// Import settings from exported data
	importSettings(settingsData) {
		if (settingsData && settingsData.settings) {
			this.state = { ...this.defaultState, ...settingsData.settings }
			this.applyContrastModeFlags()
			this.applySaturationModeValue()
			this.applyColorFilters()
			this.saveState()

			;["contrast", "brightness", "saturation"].forEach((id) => {
				this.updateControlAppearance(id)
			})

			accessibility.announceChange("Color settings imported successfully")
			return true
		}
		return false
	}
}

class OrientationAdjustment extends Component {
	constructor(wcagTools) {
		super(wcagTools)
		this.defaultState = {
			hideImages: false,
			pauseAnimations: false,
			bigCursor: "default",
			readingMask: false,
			readingGuide: false,
			screenReader: false,
		}
		this.translatedOptions = {
			hideImages: {},
			pauseAnimations: {},
			bigCursor: {},
		}
		this.translationProbeCreated = false

		this.accentColor = "#1e3a8a"
		this.inactiveBorderColor = "#e5e7eb"
		this.defaultTextColor = "#1f2937"

		// Load saved state from localStorage or use default
		this.state = this.loadState()
		this.readingMaskElement = null
		this.readingWindow = null
		this.readingGuideElement = null
		this.screenReaderElement = null
		this.isRecording = false
		this.mediaRecorder = null
		this.recordedChunks = []
		this.isInitialized = false

		// Bind methods to preserve context
		this.handleReadingMaskMove = this.handleReadingMaskMove.bind(this)
		this.handleReadingGuideMove = this.handleReadingGuideMove.bind(this)
		this.updateMaskSize = this.updateMaskSize.bind(this)

		// Create translation probe early so Google Translate can pick up option labels
		this.ensureOptionTranslationProbe()
	}

	// Load state from localStorage
	loadState() {
		try {
			const saved = localStorage.getItem("wcag-orientation-adjustments")
			if (saved) {
				const parsedState = JSON.parse(saved)

				if (typeof parsedState.bigCursor === "boolean") {
					parsedState.bigCursor = parsedState.bigCursor ? "black" : "default"
				}

				if (!["default", "black", "white"].includes(parsedState.bigCursor)) {
					parsedState.bigCursor = "default"
				}

				return { ...this.defaultState, ...parsedState }
			}
		} catch (error) {
			console.warn("Failed to load WCAG orientation state:", error)
		}
		return { ...this.defaultState }
	}

	// Save state locally and ping the badge so it updates
	saveState() {
		try {
			localStorage.setItem("wcag-orientation-adjustments", JSON.stringify(this.state))
			// Update active feature count badge
			if (typeof window.updateWcagFeatureCount === 'function') {
				window.updateWcagFeatureCount();
			}
		} catch (error) {
			console.warn("Failed to save WCAG orientation state:", error)
		}
	}

	// Get full document dimensions
	getDocumentDimensions() {
		const body = document.body
		const html = document.documentElement

		const height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)

		const width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth)

		return { width, height }
	}

	// Update mask size to cover full document
	updateMaskSize() {
		if (this.readingMaskElement) {
			const { width, height } = this.getDocumentDimensions()
			this.readingMaskElement.style.width = `${width}px`
			this.readingMaskElement.style.height = `${height}px`
		}
		if (this.readingGuideElement) {
			const { width } = this.getDocumentDimensions()
			this.readingGuideElement.style.width = `${width}px`
		}
	}

	// Initialize or restore the component
	initialize() {
		if (this.isInitialized) {
			this.restoreActiveStates()
			return
		}

		// Check for existing elements and reuse them if they match the current state
		if (this.state.readingMask) {
			const existingMask = document.querySelector('.wcag-reading-mask');
			if (existingMask) {
				this.readingMaskElement = existingMask;
			}
		}

		if (this.state.readingGuide) {
			const existingGuide = document.querySelector('.wcag-reading-guide');
			if (existingGuide) {
				this.readingGuideElement = existingGuide;
			}
		}

		if (this.state.screenReader) {
			const existingRecorder = document.querySelector('.wcag-screen-recorder');
			if (existingRecorder) {
				this.screenReaderElement = existingRecorder;
			}
		}

		this.initializeComponents()
		this.restoreActiveStates()
		this.isInitialized = true
	}

	// Restore all active states when reopening
	restoreActiveStates() {
		// First restore the actual functionality without UI updates
		if (this.state.hideImages) {
			this.restoreHideImages()
		}
		if (this.state.pauseAnimations) {
			this.restorePauseAnimations()
		}
		if (this.state.bigCursor && this.state.bigCursor !== "default") {
			this.restoreBigCursor()
		} else {
			this.applyBigCursorStyle()
		}
		if (this.state.readingMask) {
			this.restoreReadingMask()
		}
		if (this.state.readingGuide) {
			this.restoreReadingGuide()
		}
		if (this.state.screenReader) {
			this.restoreScreenRecording()
		}

		setTimeout(() => {
			;["hideImages", "pauseAnimations", "bigCursor", "readingMask", "readingGuide", "screenReader"].forEach((id) => {
				this.updateControlAppearance(id)
			})
		}, 100)
	}

	reset() {
		this.state = { ...this.defaultState }
		this.saveState()

		this.toggleHideImages(false, true)
		this.togglePauseAnimations(false, true)
		this.setBigCursorMode("default", true)
		this.toggleReadingMask(false, true)
		this.toggleReadingGuide(false, true)
		this.toggleScreenRecording(false, true)

		// Orientation features are counted from wcag-orientation-adjustments, not wcag_tools_enabled_list
		// So we don't need to clear wcag_tools_enabled_list here

			;["hideImages", "pauseAnimations", "bigCursor", "readingMask", "readingGuide", "screenReader"].forEach((id) => {
				this.updateControlAppearance(id)
			})

		accessibility.announceChange("Orientation adjustments reset to default")
	}

	// Store translated/default labels for orientation controls so resets keep the current language
	captureDefaultLabels() {
		const labelConfigs = [
			{ selector: '[data-control-id="hideImages"] span', fallback: "Hide Images", isDefault: !this.state.hideImages },
			{ selector: '[data-pause-label]', fallback: "Pause Animations", isDefault: !this.state.pauseAnimations },
			{ selector: '[data-cursor-label]', fallback: "Big Cursor", isDefault: this.state.bigCursor === "default" },
			{ selector: '[data-control-id="readingMask"] span', fallback: "Reading Mask", isDefault: !this.state.readingMask },
			{ selector: '[data-control-id="readingGuide"] span', fallback: "Reading Guide", isDefault: !this.state.readingGuide },
			{ selector: '[data-control-id="screenReader"] span', fallback: "Screen Recorder", isDefault: !this.state.screenReader },
		]

		labelConfigs.forEach(({ selector, fallback, isDefault }) => {
			if (!isDefault) return
			const el = document.querySelector(selector)
			if (!el) return
			this.storeDefaultLabel(el, fallback, true)
		})

		this.captureOptionTranslations()
	}

	ensureOptionTranslationProbe() {
		if (this.translationProbeCreated || typeof document === "undefined") return

		const existing = document.getElementById("wcag-orientation-translation-probe")
		if (existing) {
			this.translationProbeCreated = true
			this.translationProbe = existing
			return
		}

		const probe = document.createElement("div")
		probe.id = "wcag-orientation-translation-probe"
		Object.assign(probe.style, {
			position: "absolute",
			left: "-9999px",
			top: "0",
			opacity: "0",
			pointerEvents: "none",
			zIndex: "-1",
		})

		const groups = [
			{ key: "hideImages", options: [{ value: "hide", label: "Hide Images" }, { value: "show", label: "Show Images" }] },
			{ key: "pauseAnimations", options: PAUSE_ANIMATION_OPTIONS },
			{ key: "bigCursor", options: BIG_CURSOR_OPTIONS },
		]

		groups.forEach(({ key, options }) => {
			options.forEach((opt) => {
				const span = document.createElement("span")
				span.dataset.translateProbe = `${key}-${opt.value}`
				span.textContent = opt.label
				probe.appendChild(span)
			})
		})

		document.body.appendChild(probe)
		this.translationProbeCreated = true
		this.translationProbe = probe
	}

	captureOptionTranslations() {
		if (!this.isTranslationActive()) return
		this.ensureOptionTranslationProbe()

		const groups = [
			{ key: "hideImages", options: [{ value: "hide", label: "Hide Images" }, { value: "show", label: "Show Images" }] },
			{ key: "pauseAnimations", options: PAUSE_ANIMATION_OPTIONS },
			{ key: "bigCursor", options: BIG_CURSOR_OPTIONS },
		]

		groups.forEach(({ key, options }) => {
			options.forEach((opt) => {
				const el = document.querySelector(`[data-translate-probe="${key}-${opt.value}"]`)
				if (!el) return
				const text = (el.textContent || "").trim()
				if (text && !this.isValueOnlyText(text) && text !== opt.label) {
					if (!this.translatedOptions[key]) this.translatedOptions[key] = {}
					this.translatedOptions[key][opt.value] = text
				}
			})
		})
	}

	getTranslatedOptionLabel(group, option, fallback) {
		const translated = this.translatedOptions[group]?.[option.value]
		return translated || option.label || fallback
	}

	render() {
		const container = document.createElement("div")
		Object.assign(container.style, {
			padding: "20px",
			marginBottom: "20px",
			position: "relative",
		})

		container.appendChild(this.createTitle("Orientation Adjustments"))
		// container.appendChild(this.createResetButton())
		container.appendChild(this.createControls())

		setTimeout(() => this.initialize(), 200)

		return container
	}

	createTitle(text) {
		return this.wcagTools.createElement(
			"h2",
			{},
			{
				fontSize: "16px",
				marginBottom: "15px",
				color: "#374151",
			},
			[text]
		)
	}

	createResetButton() {
		const resetBtn = this.wcagTools.createElement(
			"button",
			{
				"aria-label": "Reset orientation adjustments",
				title: "Reset to default",
			},
			{
				backgroundColor: "#dc2626",
				color: "white",
				border: "none",
				padding: "8px 14px",
				borderRadius: "6px",
				fontSize: "14px",
				fontWeight: "600",
				cursor: "pointer",
				transition: "all 0.2s ease",
				display: "inline-flex",
				alignItems: "center",
				gap: "8px",
				position: "absolute",
				top: "10px",
				right: "10px",
			},
			[
				this.wcagTools.createElement("i", { class: "fas fa-undo" }),
				""
			]
		)

		// Add hover effects
		resetBtn.addEventListener("mouseenter", () => {
			resetBtn.style.backgroundColor = "#b91c1c";
			resetBtn.style.transform = "translateY(-1px)";
		});

		resetBtn.addEventListener("mouseleave", () => {
			resetBtn.style.backgroundColor = "#dc2626";
			resetBtn.style.transform = "translateY(0)";
		});

		resetBtn.addEventListener("click", () => {
			this.reset()
		})

		return resetBtn
	}

	createControls() {
		const container = this.wcagTools.createElement(
			"div",
			{},
			{
				display: "grid",
				gridTemplateColumns: "repeat(6, 1fr)",
				gap: "20px",
				fontSize: "12px",
				color: "#000",
			}
		)

		const controls = [
			{ id: "hideImages", icon: "fa-regular fa-image-slash", label: "Hide Images", colSpan: 2 },
			{ id: "pauseAnimations", icon: "fa-light fa-pause-circle", label: "Pause Animations", colSpan: 2 },
			{ id: "bigCursor", icon: "fa-light fa-arrow-pointer", label: "Big Cursor", colSpan: 2 },
			{ id: "readingMask", icon: "fa-regular fa-mask-face", label: "Reading Mask", colSpan: 2 },
			{ id: "readingGuide", icon: "fa-light fa-pen-line", label: "Reading Guide", colSpan: 2 },
			{ id: "screenReader", icon: "fa-light fa-record-vinyl", label: "Screen Recorder", colSpan: 2 },
		]

		controls.forEach((control) => {
			container.appendChild(this.createControl(control))
		})

		return container
	}

	createControl({ id, icon, label, colSpan }) {
		const isActive = !!this.state[id]
		const accentColor = this.accentColor
		const inactiveBorder = this.inactiveBorderColor
		const inactiveText = this.defaultTextColor

		// Create wrapper div with column span
		const wrapper = this.wcagTools.createElement(
			"div",
			{
				"data-control-wrapper": id
			},
			{
				gridColumn: `span ${colSpan}`,
				position: "relative",
				display: "flex",
				alignItems: "stretch",
				justifyContent: "center",
				width: "100%",
				minHeight: "130px",
				border: "none",
				borderRadius: "18px",
				padding: "3px",
				transition: "all 0.3s",
				boxSizing: "border-box",
			}
		)
		wrapper.setAttribute("data-active", isActive ? "true" : "false")

		// Inner container (white background)
		const innerContainer = this.wcagTools.createElement(
			"div",
			{
				"data-control-inner": id
			},
			{
				width: "100%",
				minHeight: "130px",
				backgroundColor: "white",
				borderRadius: "16px",
				border: isActive ? "2px solid " + accentColor : "1px solid " + inactiveBorder,
				padding: "16px",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				position: "relative",
				transition: "all 0.3s",
				boxSizing: "border-box",
			}
		)

		// Create checkmark badge for active state
		if (isActive) {
			const checkmark = this.wcagTools.createElement(
				"div",
				{
					"data-checkmark": id,
				},
				{
					position: "absolute",
					top: "-1px",
					right: "-1px",
					width: "40px",
					height: "40px",
					backgroundColor: accentColor,
					borderRadius: "0 16px 0 16px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					zIndex: "10",
				},
				[
					this.wcagTools.createElement("i", { class: "fa fa-check" }, {
						fontSize: "14px",
						color: "white",
					})
				]
			)
			innerContainer.appendChild(checkmark)
		}

		const restoreBaseBorders = () => {
			const activeState = wrapper.getAttribute("data-active") === "true"
			innerContainer.style.border = activeState ? "4px solid " + accentColor : "1px solid " + inactiveBorder
			innerContainer.style.background = "white"
			innerContainer.style.boxShadow = "none"
		}

		// Hover effects aligned with Content Adjustment cards
		wrapper.addEventListener("mouseenter", () => {
			if (wrapper.getAttribute("data-active") === "true") return
			innerContainer.style.borderColor = "#1e3a8a"
			innerContainer.style.background = "white"
			innerContainer.style.boxShadow = "0 2px 6px rgba(15, 23, 42, 0.08)"
		})

		wrapper.addEventListener("mouseleave", () => {
			restoreBaseBorders()
		})

		// Toggle type control (simple button)
		const content = this.wcagTools.createElement(
			"div",
			{
				"data-control-id": id,
				tabindex: "0",
				role: "switch",
				"aria-pressed": id === "bigCursor" ? (this.state.bigCursor !== "default" ? "true" : "false") : (this.state[id] ? "true" : "false"),
			},
			{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: id === "bigCursor" ? "12px" : "10px",
				width: "100%",
				minHeight: "100%",
				cursor: "pointer",
				userSelect: "none",
				borderRadius: "16px",
				color: isActive ? accentColor : inactiveText,
			}
		)

		if (id === "bigCursor") {
			const options = BIG_CURSOR_OPTIONS
			const activeOption = options.find((option) => option.value === this.state.bigCursor) || options[0]

			const iconElement = this.wcagTools.createElement(
				"i",
				{ class: activeOption.icon, "data-cursor-icon": "true" },
				{
					fontSize: "22px",
					transition: "color 0.2s ease",
				}
			)

			const labelElement = this.wcagTools.createElement(
				"span",
				{ "data-cursor-label": "true" },
				{
					fontSize: "14px",
					fontWeight: "600",
					textAlign: "center",
				},
				[activeOption.label]
			)

			const indicatorRow = this.wcagTools.createElement(
				"div",
				{ "data-cursor-indicator": "true" },
				{
					display: "flex",
					gap: "6px",
					width: "100%",
					justifyContent: "center",
					marginTop: "auto",
				}
			)

			BIG_CURSOR_OPTIONS.slice(1).forEach((option, index) => {
				const indicator = this.wcagTools.createElement(
					"span",
					{
						"data-cursor-dot": option.value,
						"data-cursor-index": index,
					},
					{
						width: "24px",
						height: "6px",
						borderRadius: "999px",
						backgroundColor: "#e5e7eb",
						opacity: 0.4,
						transition: "all 0.2s ease",
					}
				)
				indicatorRow.appendChild(indicator)
			})

			content.appendChild(iconElement)
			content.appendChild(labelElement)
			content.appendChild(indicatorRow)
			content.setAttribute("aria-label", activeOption.label)
			this.updateBigCursorVisuals(content)
		} else if (id === "pauseAnimations") {
			const options = PAUSE_ANIMATION_OPTIONS
			const activeOption = options.find((option) => option.value === this.state.pauseAnimations) || options[0]

			const iconElement = this.wcagTools.createElement(
				"i",
				{ class: activeOption.icon, "data-pause-icon": "true" },
				{
					fontSize: "22px",
					transition: "color 0.2s ease",
				}
			)

			const labelElement = this.wcagTools.createElement(
				"span",
				{ "data-pause-label": "true" },
				{
					fontSize: "14px",
					fontWeight: "600",
					textAlign: "center",
				},
				[activeOption.label]
			)

			content.appendChild(iconElement)
			content.appendChild(labelElement)
			content.setAttribute("aria-label", activeOption.label)
			this.updatePauseAnimationsVisuals(content)
		} else {
			const iconElement = this.wcagTools.createElement(
				"i",
				{ class: icon },
				{
					fontSize: "18px !important",
					color: isActive ? accentColor : inactiveText,
				}
			)
			content.appendChild(iconElement)

			const labelText = this.getOrientationLabel(id, label)
			content.appendChild(this.wcagTools.createElement("span", {}, {}, [labelText]))
		}

		content.addEventListener("click", () => this.handleAdjustment(id))
		innerContainer.appendChild(content)

		wrapper.appendChild(innerContainer)
		return wrapper
	}

	getOrientationLabel(id, defaultLabel) {
		if (id === "hideImages") {
			return this.state.hideImages ? "Show Images" : "Hide Images"
		}
		return defaultLabel
	}

	getColorAdjustmentComponent() {
		return this.wcagTools && this.wcagTools.colorAdjustment ? this.wcagTools.colorAdjustment : null
	}

	isContrastModeActive() {
		const colorAdjustment = this.getColorAdjustmentComponent()
		return !!(colorAdjustment && colorAdjustment.state?.contrastMode && colorAdjustment.state.contrastMode !== "default")
	}

	resetContrastModeForReadingTools() {
		const colorAdjustment = this.getColorAdjustmentComponent()
		if (colorAdjustment && colorAdjustment.state.contrastMode !== "default") {
			colorAdjustment.setContrastMode("default", true)
			colorAdjustment.updateControlAppearance("contrast")
		}
	}

	handleContrastModeActivated() {
		let changed = false
		if (this.state.readingMask) {
			this.toggleReadingMask(false, true)
			this.updateControlAppearance("readingMask")
			changed = true
		}
		if (this.state.readingGuide) {
			this.toggleReadingGuide(false, true)
			this.updateControlAppearance("readingGuide")
			changed = true
		}
		if (changed) {
			this.saveState()
		}
	}

	handleAdjustment(id) {
		switch (id) {
			case "hideImages":
				this.toggleHideImages()
				break
			case "pauseAnimations":
				this.togglePauseAnimations()
				break
			case "bigCursor":
				this.cycleBigCursor()
				break
			case "readingMask":
				this.toggleReadingMask()
				break
			case "readingGuide":
				this.toggleReadingGuide()
				break
			case "screenReader":
				this.toggleScreenRecording()
				break
		}

		// Orientation features are counted from wcag-orientation-adjustments, not wcag_tools_enabled_list
		// So we don't need to update wcag_tools_enabled_list here
		// Note: saveState() will call updateWcagFeatureCount()
		this.saveState()
	}

	// Initialize components
	initializeComponents() {
		this.createReadingMask()
		this.createReadingGuide()
		this.createScreenReaderPanel()
		this.addCustomCursorStyles()
		this.setupAnimationStyles()
	}

	// Hide Images functionality
	toggleHideImages(force = null, silent = false) {
		this.state.hideImages = force !== null ? force : !this.state.hideImages

		const images = document.querySelectorAll('img, svg, picture, video, canvas, [style*="background-image"]')
		images.forEach((img) => {
			if (this.state.hideImages) {
				if (!img.dataset.originalDisplay) {
					img.dataset.originalDisplay = img.style.display || ""
				}
				img.style.display = "none"
				img.classList.add("wcag-hidden-image")
			} else {
				img.style.display = img.dataset.originalDisplay || ""
				img.classList.remove("wcag-hidden-image")
			}
		})

		// Handle CSS background images
		if (this.state.hideImages) {
			this.addImageHidingStyles()
		} else {
			this.removeImageHidingStyles()
		}

		if (!silent) {
			this.updateControlAppearance("hideImages")
			accessibility.announceChange(`Images ${this.state.hideImages ? "hidden" : "shown"}`)
		}
	}

	addImageHidingStyles() {
		if (!document.getElementById("wcag-hide-images-style")) {
			const style = document.createElement("style")
			style.id = "wcag-hide-images-style"
			style.textContent = `
				.wcag-hidden-image,
				*[style*="background-image"] {
					background-image: none !important;
				}
				img::before {
					content: "Image hidden for accessibility";
					display: block;
					padding: 10px;
					background: #f0f0f0;
					border: 1px solid #ddd;
					color: #666;
					font-size: 12px;
				}
			`
			document.head.appendChild(style)
		}
	}

	removeImageHidingStyles() {
		const style = document.getElementById("wcag-hide-images-style")
		if (style) {
			style.remove()
		}
	}

	// Pause Animations functionality
	setupAnimationStyles() {
		if (!document.getElementById("wcag-pause-animations-style")) {
			const style = document.createElement("style")
			style.id = "wcag-pause-animations-style"
			document.head.appendChild(style)
		}
	}

	togglePauseAnimations(force = null, silent = false) {
		this.state.pauseAnimations = force !== null ? force : !this.state.pauseAnimations

		this.setupAnimationStyles()
		const style = document.getElementById("wcag-pause-animations-style")
		if (this.state.pauseAnimations) {
			style.textContent = `
				*, *::before, *::after {
					animation-duration: 0s !important;
					animation-delay: 0s !important;
					transition-duration: 0s !important;
					transition-delay: 0s !important;
				}
				video, audio {
					animation-play-state: paused !important;
				}
			`
			// Pause all videos
			document.querySelectorAll("video").forEach((video) => {
				video.pause()
			})
		} else {
			style.textContent = ""
		}

		if (!silent) {
			this.updateControlAppearance("pauseAnimations")
			accessibility.announceChange(`Animations ${this.state.pauseAnimations ? "paused" : "resumed"}`)
		}
	}

	// Big Cursor functionality
	addCustomCursorStyles() {
		if (!document.getElementById("wcag-big-cursor-style")) {
			const style = document.createElement("style")
			style.id = "wcag-big-cursor-style"
			document.head.appendChild(style)
		}
	}

	cycleBigCursor() {
		const modes = BIG_CURSOR_OPTIONS.map((option) => option.value)
		let currentIndex = modes.indexOf(this.state.bigCursor)
		if (currentIndex === -1) currentIndex = 0
		const nextIndex = (currentIndex + 1) % modes.length
		this.setBigCursorMode(modes[nextIndex])
	}

	setBigCursorMode(mode, silent = false) {
		this.state.bigCursor = mode
		this.applyBigCursorStyle()
		if (!silent) {
			this.updateControlAppearance("bigCursor")
			const label = getBigCursorLabel(mode)
			if (mode === "default") {
				accessibility.announceChange("Big cursor reset to default")
			} else {
				accessibility.announceChange(`${label} enabled`)
			}
		}
	}

	applyBigCursorStyle() {
		let style = document.getElementById("wcag-big-cursor-style")
		if (!style) {
			this.addCustomCursorStyles()
			style = document.getElementById("wcag-big-cursor-style")
		}
		if (!style) return
		const option = BIG_CURSOR_OPTIONS.find((opt) => opt.value === this.state.bigCursor)
		if (option && option.cursor) {
			style.textContent = `
				* {
					cursor: url('${option.cursor}') 2 2, auto !important;
				}
			`
		} else {
			style.textContent = ""
		}
	}

	updateBigCursorVisuals(control) {
		if (!control) return

		const options = BIG_CURSOR_OPTIONS
		const activeOption = options.find((option) => option.value === this.state.bigCursor) || options[0]
		const accent = this.accentColor

		const labelSpan = control.querySelector('[data-cursor-label]')
		if (labelSpan) {
			const fallback = "Big Cursor"
			const currentText = (labelSpan.textContent || "").trim()
			const isDefault = !activeOption || activeOption.value === "default"

			// Capture option translations first so we can check against them
			if (this.isTranslationActive()) {
				this.captureOptionTranslations()
			}

			// Only capture as default translated label if current text is NOT a non-default option's label
			if (isDefault && this.isTranslationActive() && currentText && currentText !== fallback) {
				const nonDefaultLabels = options
					.filter(opt => opt.value !== "default")
					.flatMap(opt => [opt.label, this.translatedOptions?.bigCursor?.[opt.value]].filter(Boolean))
				const isNonDefaultOptionLabel = nonDefaultLabels.some(label =>
					currentText.toLowerCase() === label.toLowerCase()
				)
				if (!isNonDefaultOptionLabel) {
					this.storeDefaultLabel(labelSpan, fallback, true)
				}
			}

			const defaultLabel =
				labelSpan.dataset.defaultTranslated ||
				labelSpan.dataset.defaultLabel ||
				fallback

			const translatedDefault = this.translatedOptions?.bigCursor?.[options[0].value]

			const labelText = isDefault
				? (translatedDefault || defaultLabel)
				: this.getTranslatedOptionLabel("bigCursor", activeOption, defaultLabel)
			labelSpan.textContent = labelText
			control.setAttribute("aria-label", labelText)
		}

		const iconElement = control.querySelector('[data-cursor-icon]')
		if (iconElement) {
			iconElement.className = activeOption.icon
		}

		const indicatorDots = control.querySelectorAll('[data-cursor-dot]')
		const activeIndex = options.findIndex((option) => option.value === this.state.bigCursor)
		const fillCount = Math.max(0, activeIndex)

		indicatorDots.forEach((dot) => {
			const dotIndex = Number(dot.getAttribute("data-cursor-index"))
			const isFilled = dotIndex < fillCount
			dot.style.backgroundColor = isFilled ? accent : "#e5e7eb"
			dot.style.opacity = isFilled ? 1 : 0.4
		})
	}

	updatePauseAnimationsVisuals(control) {
		if (!control) return

		const options = PAUSE_ANIMATION_OPTIONS
		const activeOption = options.find((option) => option.value === this.state.pauseAnimations) || options[0]

		const labelSpan = control.querySelector('[data-pause-label]')
		if (labelSpan) {
			const fallback = "Pause Animations"
			const currentText = (labelSpan.textContent || "").trim()
			const isDefault = !activeOption || activeOption.value === false

			// Capture option translations first so we can check against them
			if (this.isTranslationActive()) {
				this.captureOptionTranslations()
			}

			// Only capture as default translated label if current text is NOT a non-default option's label
			if (isDefault && this.isTranslationActive() && currentText && currentText !== fallback) {
				const nonDefaultLabels = options
					.filter(opt => opt.value !== false)
					.flatMap(opt => [opt.label, this.translatedOptions?.pauseAnimations?.[opt.value]].filter(Boolean))
				const isNonDefaultOptionLabel = nonDefaultLabels.some(label =>
					currentText.toLowerCase() === label.toLowerCase()
				)
				if (!isNonDefaultOptionLabel) {
					this.storeDefaultLabel(labelSpan, fallback, true)
				}
			}

			const defaultLabel =
				labelSpan.dataset.defaultTranslated ||
				labelSpan.dataset.defaultLabel ||
				fallback

			const translatedDefault = this.translatedOptions?.pauseAnimations?.[options[0].value]

			const labelText = isDefault
				? (translatedDefault || defaultLabel)
				: this.getTranslatedOptionLabel("pauseAnimations", activeOption, defaultLabel)
			labelSpan.textContent = labelText
			control.setAttribute("aria-label", labelText)
		}

		const iconElement = control.querySelector('[data-pause-icon]')
		if (iconElement) {
			iconElement.className = activeOption.icon
		}
	}

	// Reading Mask functionality - FIXED WITH ABSOLUTE POSITIONING AND FULL DOCUMENT COVERAGE
	createReadingMask() {
		this.cleanupReadingMask()

		const { width, height } = this.getDocumentDimensions()

		this.readingMaskElement = document.createElement("div")
		this.readingMaskElement.className = "wcag-reading-mask"
		Object.assign(this.readingMaskElement.style, {
			position: "absolute",
			top: "0",
			left: "0",
			width: `${width}px`,
			height: `${height}px`,
			pointerEvents: "none",
			zIndex: "9999999",
			display: "none",
			overflow: "hidden",
		})

		// Create top overlay
		const topOverlay = document.createElement("div")
		Object.assign(topOverlay.style, {
			position: "absolute",
			top: "0",
			left: "0",
			width: "100%",
			height: "40%",
			backgroundColor: "rgba(0, 0, 0, 0.8)",
			transition: "height 0.1s ease-out",
		})

		// Create bottom overlay
		const bottomOverlay = document.createElement("div")
		Object.assign(bottomOverlay.style, {
			position: "absolute",
			bottom: "0",
			left: "0",
			width: "100%",
			height: "40%",
			backgroundColor: "rgba(0, 0, 0, 0.8)",
			transition: "height 0.1s ease-out",
		})

		// Store references for later manipulation
		this.topOverlay = topOverlay
		this.bottomOverlay = bottomOverlay

		this.readingMaskElement.appendChild(topOverlay)
		this.readingMaskElement.appendChild(bottomOverlay)
		document.body.appendChild(this.readingMaskElement)
	}

	cleanupReadingMask() {
		// Remove any existing reading mask elements
		const existingMasks = document.querySelectorAll(".wcag-reading-mask")
		existingMasks.forEach((mask) => mask.remove())

		// Remove event listeners
		document.removeEventListener("mousemove", this.handleReadingMaskMove)
		document.removeEventListener("resize", this.updateMaskSize)
		document.removeEventListener("scroll", this.updateMaskSize)

		// Reset references
		this.readingMaskElement = null
		this.topOverlay = null
		this.bottomOverlay = null
	}

	toggleReadingMask(force = null, silent = false) {
		this.state.readingMask = force !== null ? force : !this.state.readingMask

		if (this.state.readingMask) {
			this.resetContrastModeForReadingTools()

			this.cleanupReadingMask()
			this.createReadingMask()

			this.readingMaskElement.style.display = "block"
			document.addEventListener("mousemove", this.handleReadingMaskMove)
			document.addEventListener("resize", this.updateMaskSize)
			document.addEventListener("scroll", this.updateMaskSize)

			this.updateMaskSize()
		} else {
			this.cleanupReadingMask()
		}

		if (!silent) {
			this.updateControlAppearance("readingMask")
			accessibility.announceChange(`Reading mask ${this.state.readingMask ? "enabled" : "disabled"}`)
		}
	}

	handleReadingMaskMove(e) {
		if (!this.topOverlay || !this.bottomOverlay) return

		const windowHeight = 80
		const mouseY = e.clientY + window.scrollY
		const { height } = this.getDocumentDimensions()

		// Calculate the clear window boundaries
		const clearTop = Math.max(0, mouseY - windowHeight / 2)
		const clearBottom = Math.min(height, mouseY + windowHeight / 2)

		// Update overlay heights
		this.topOverlay.style.height = `${clearTop}px`
		this.bottomOverlay.style.height = `${height - clearBottom}px`
		this.bottomOverlay.style.top = `${clearBottom}px`
	}

	// Reading Guide functionality - FIXED WITH ABSOLUTE POSITIONING
	createReadingGuide() {
		this.cleanupReadingGuide()

		const { width } = this.getDocumentDimensions()

		this.readingGuideElement = document.createElement("div")
		this.readingGuideElement.className = "wcag-reading-guide"
		Object.assign(this.readingGuideElement.style, {
			position: "absolute",
			left: "0",
			// top: "50vh",
			width: `${width}px`,
			height: "2px",
			backgroundColor: "#ff6b35",
			boxShadow: `
				0 0 4px rgba(255, 107, 53, 0.8),
				0 0 8px rgba(255, 107, 53, 0.6),
				0 0 12px rgba(255, 107, 53, 0.4)
			`,
			pointerEvents: "none",
			zIndex: "9999999",
			display: "none",
			transition: "top 0.05s ease-out",
		})

		document.body.appendChild(this.readingGuideElement)
	}

	cleanupReadingGuide() {
		// Remove any existing reading guide elements
		const existingGuides = document.querySelectorAll(".wcag-reading-guide")
		existingGuides.forEach((guide) => guide.remove())

		// Remove event listeners
		document.removeEventListener("mousemove", this.handleReadingGuideMove)
		document.removeEventListener("resize", this.updateMaskSize)
		document.removeEventListener("scroll", this.updateMaskSize)

		// Reset reference
		this.readingGuideElement = null
	}

	toggleReadingGuide(force = null, silent = false) {
		this.state.readingGuide = force !== null ? force : !this.state.readingGuide

		if (this.state.readingGuide) {
			this.resetContrastModeForReadingTools()

			// Ensure clean state before enabling
			this.cleanupReadingGuide()
			this.createReadingGuide()

			this.readingGuideElement.style.display = "block"
			document.addEventListener("mousemove", this.handleReadingGuideMove)
			document.addEventListener("resize", this.updateMaskSize)
			document.addEventListener("scroll", this.updateMaskSize)

			// Initial update
			this.updateMaskSize()
		} else {
			// Clean up when disabling
			this.cleanupReadingGuide()
		}

		if (!silent) {
			this.updateControlAppearance("readingGuide")
			accessibility.announceChange(`Reading guide ${this.state.readingGuide ? "enabled" : "disabled"}`)
		}
	}

	handleReadingGuideMove(e) {
		if (!this.readingGuideElement) return
		const mouseY = e.clientY + window.scrollY // Account for scroll position
		this.readingGuideElement.style.top = `${mouseY}px`
	}

	// Screen Recorder functionality - IMPROVED CLEANUP
	createScreenReaderPanel() {
		// Always clean up first to prevent duplicates
		this.cleanupScreenRecorder()

		this.screenReaderElement = document.createElement("div")
		this.screenReaderElement.className = "wcag-screen-recorder"
		Object.assign(this.screenReaderElement.style, {
			position: "fixed",
			top: "20px",
			right: "20px",
			width: "300px",
			backgroundColor: "#fff",
			border: "2px solid #dc2626",
			borderRadius: "8px",
			padding: "15px",
			zIndex: "9999999",
			display: "none",
			boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
		})

		const title = document.createElement("h3")
		title.textContent = "Screen Recorder"
		title.style.margin = "0 0 10px 0"
		title.style.fontSize = "16px"
		title.style.color = "#dc2626"

		this.recordButton = document.createElement("button")
		this.recordButton.textContent = "Start Recording"
		this.recordButton.setAttribute("aria-label", "Start screen recording")
		Object.assign(this.recordButton.style, {
			width: "100%",
			padding: "10px",
			backgroundColor: "#dc2626",
			color: "white",
			border: "none",
			borderRadius: "4px",
			cursor: "pointer",
			fontSize: "14px",
			marginBottom: "10px",
		})

		this.recordStatus = document.createElement("div")
		this.recordStatus.textContent = "Ready to record"
		this.recordStatus.style.fontSize = "12px"
		this.recordStatus.style.color = "#666"

		this.recordButton.addEventListener("click", () => {
			if (this.isRecording) {
				this.stopScreenRecording()
			} else {
				this.startScreenRecording()
			}
		})



		this.screenReaderElement.appendChild(title)
		this.screenReaderElement.appendChild(this.recordButton)
		this.screenReaderElement.appendChild(this.recordStatus)

		document.body.appendChild(this.screenReaderElement)
	}

	cleanupScreenRecorder() {
		// Remove any existing screen recorder elements
		const existingRecorders = document.querySelectorAll(".wcag-screen-recorder")
		existingRecorders.forEach((recorder) => recorder.remove())

		// Stop any active recording
		if (this.isRecording) {
			this.stopScreenRecording()
		}

		// Reset references
		this.screenReaderElement = null
		this.recordButton = null
		this.recordStatus = null
	}

	toggleScreenRecording(force = null, silent = false) {
		this.state.screenReader = force !== null ? force : !this.state.screenReader

		if (this.state.screenReader) {
			// Ensure clean state before enabling
			this.cleanupScreenRecorder()
			this.createScreenReaderPanel()
			this.screenReaderElement.style.display = "block"
		} else {
			// Clean up when disabling
			this.cleanupScreenRecorder()
		}

		if (!silent) {
			this.updateControlAppearance("screenReader")
			accessibility.announceChange(`Screen recorder ${this.state.screenReader ? "opened" : "closed"}`)
		}
	}

	async startScreenRecording() {
		try {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: { mediaSource: "screen" },
				audio: true,
			})

			this.mediaRecorder = new MediaRecorder(stream)
			this.recordedChunks = []

			this.mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					this.recordedChunks.push(event.data)
				}
			}

			this.mediaRecorder.onstop = () => {
				const blob = new Blob(this.recordedChunks, { type: "video/webm" })
				const url = URL.createObjectURL(blob)
				const a = document.createElement("a")
				a.href = url
				a.download = `screen-recording-${new Date().toISOString().slice(0, 19)}.webm`
				a.click()
				URL.revokeObjectURL(url)
			}

			this.mediaRecorder.start()
			this.isRecording = true
			this.recordButton.textContent = "Stop Recording"
			this.recordButton.style.backgroundColor = "#dc2626"
			this.recordStatus.textContent = "Recording..."
			this.recordStatus.style.color = "#dc2626"

			accessibility.announceChange("Screen recording started")
		} catch (error) {
			console.error("Error starting screen recording:", error)
			this.recordStatus.textContent = "Recording failed - permission denied"
			this.recordStatus.style.color = "#dc2626"
			accessibility.announceChange("Screen recording failed to start")
		}
	}

	stopScreenRecording() {
		if (this.mediaRecorder && this.isRecording) {
			this.mediaRecorder.stop()
			this.mediaRecorder.stream.getTracks().forEach((track) => track.stop())
			this.isRecording = false

			if (this.recordButton && this.recordStatus) {
				this.recordButton.textContent = "Start Recording"
				this.recordButton.style.backgroundColor = "#dc2626"
				this.recordStatus.textContent = "Recording saved"
				this.recordStatus.style.color = "#059669"
			}

			accessibility.announceChange("Screen recording stopped and saved")
		}
	}

	updateControlAppearance(id) {
		const control = document.querySelector('[data-control-id="' + id + '"]')
		if (!control) return

		const wrapper = document.querySelector('[data-control-wrapper="' + id + '"]')
		const inner = document.querySelector('[data-control-inner="' + id + '"]')
		const existingCheckmark = inner ? inner.querySelector('div[data-checkmark="' + id + '"]') : null

		const isBigCursorControl = id === "bigCursor"
		const isActive = isBigCursorControl ? this.state.bigCursor !== "default" : !!this.state[id]
		const accent = this.accentColor
		const inactiveBorder = this.inactiveBorderColor
		const inactiveText = this.defaultTextColor

		if (wrapper) {
			wrapper.setAttribute("data-active", isActive ? "true" : "false")
		}

		if (inner) {
			inner.style.border = isActive ? "2px solid " + accent : "1px solid " + inactiveBorder
			inner.style.backgroundColor = "white"
		}

		if (isActive && !existingCheckmark && inner) {
			const checkmark = this.wcagTools.createElement(
				"div",
				{ "data-checkmark": id },
				{
					position: "absolute",
					top: "-1px",
					right: "-1px",
					width: "40px",
					height: "40px",
					backgroundColor: accent,
					borderRadius: "0 16px 0 16px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					zIndex: "10",
				},
				[ this.wcagTools.createElement("i", { class: "fa fa-check" }, { fontSize: "14px", color: "white" }) ]
			)
			inner.appendChild(checkmark)
		} else if (!isActive && existingCheckmark) {
			existingCheckmark.remove()
		}

		control.setAttribute("aria-pressed", isActive ? "true" : "false")
		const targetColor = isActive ? accent : inactiveText
		control.style.color = targetColor
		control.querySelectorAll("i").forEach((icon) => {
			icon.style.color = targetColor
		})

		if (id === "hideImages") {
			const label = control.querySelector("span")
			if (label) {
			const fallback = "Hide Images"
			const currentText = (label.textContent || "").trim()
			const isDefault = !this.state.hideImages
			if (isDefault && this.isTranslationActive() && currentText && currentText !== fallback) {
				this.storeDefaultLabel(label, fallback, true)
			}
			if (this.isTranslationActive()) {
				this.captureOptionTranslations()
			}

			const defaultLabel =
				label.dataset.defaultTranslated ||
				label.dataset.defaultLabel ||
				this.storeDefaultLabel(label, fallback)

			const showOption = { value: "show", label: "Show Images" }
			const labelText = this.state.hideImages
				? this.getTranslatedOptionLabel("hideImages", showOption, defaultLabel)
				: defaultLabel
				label.textContent = labelText
				control.setAttribute("aria-label", labelText)
			}
			// Update icon based on state
			const icon = control.querySelector("i")
			if (icon) {
				icon.className = this.state.hideImages ? "fa-regular fa-image" : "fa-regular fa-image-slash"
			}
		}

		if (isBigCursorControl) {
			this.updateBigCursorVisuals(control)
		}
		if (id === "pauseAnimations") {
			this.updatePauseAnimationsVisuals(control)
		}
	}

	// Enhanced cleanup method
	destroy() {
		// Clean up all features
		this.cleanupReadingMask()
		this.cleanupReadingGuide()
		this.cleanupScreenRecorder()

		// Remove styles
		const styles = ["wcag-hide-images-style", "wcag-pause-animations-style", "wcag-big-cursor-style"]
		styles.forEach((id) => {
			const style = document.getElementById(id)
			if (style) style.remove()
		})

		this.isInitialized = false
	}

	// Restore methods for OrientationAdjustment features without UI updates or announcements
	restoreHideImages() {
		const images = document.querySelectorAll('img, svg, picture, video, canvas, [style*="background-image"]')
		images.forEach((img) => {
			// Only hide images that aren't already hidden
			if (!img.classList.contains('wcag-hidden-image')) {
				if (!img.dataset.originalDisplay) {
					img.dataset.originalDisplay = img.style.display || ""
				}
				img.style.display = "none"
				img.classList.add("wcag-hidden-image")
			}
		})

		// Add CSS styles for hiding background images
		this.addImageHidingStyles()
	}

	restorePauseAnimations() {
		const style = document.getElementById("wcag-pause-animations-style")
		if (style) {
			style.textContent = `
				*, *::before, *::after {
					animation-duration: 0s !important;
					animation-delay: 0s !important;
					transition-duration: 0s !important;
					transition-delay: 0s !important;
				}
				video, audio {
					animation-play-state: paused !important;
				}
			`
			// Pause all videos
			document.querySelectorAll("video").forEach((video) => {
				video.pause()
			})
		}
	}

	restoreBigCursor() {
		this.applyBigCursorStyle()
	}

	restoreReadingMask() {
		const existingMask = document.querySelector('.wcag-reading-mask');
		if (existingMask) {
			// Use existing mask
			this.readingMaskElement = existingMask;
		} else if (!this.readingMaskElement) {
			// Create new mask
			this.createReadingMask();
		}

		if (this.readingMaskElement) {
			this.readingMaskElement.style.display = "block"
			document.addEventListener("mousemove", this.handleReadingMaskMove)
			document.addEventListener("resize", this.updateMaskSize)
			document.addEventListener("scroll", this.updateMaskSize)
			this.updateMaskSize()
		}
	}

	restoreReadingGuide() {
		const existingGuide = document.querySelector('.wcag-reading-guide');
		if (existingGuide) {
			// Use existing guide
			this.readingGuideElement = existingGuide;
		} else if (!this.readingGuideElement) {
			// Create new guide
			this.createReadingGuide();
		}

		if (this.readingGuideElement) {
			this.readingGuideElement.style.display = "block"
			document.addEventListener("mousemove", this.handleReadingGuideMove)
			document.addEventListener("resize", this.updateMaskSize)
			document.addEventListener("scroll", this.updateMaskSize)
			this.updateMaskSize()
		}
	}

	restoreScreenRecording() {
		const existingRecorder = document.querySelector('.wcag-screen-recorder');
		if (existingRecorder) {
			// Use existing recorder
			this.screenReaderElement = existingRecorder;
		} else if (!this.screenReaderElement) {
			// Create new recorder
			this.createScreenReaderPanel();
		}

		if (this.screenReaderElement) {
			this.screenReaderElement.style.display = "block"
		}
	}
}

module.exports = {
	ContentAdjustment,
	ColorAdjustment,
	OrientationAdjustment,
};
