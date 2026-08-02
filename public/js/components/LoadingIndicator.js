class LoadingIndicator {
	constructor() {
		return this.create();
	}

	create() {
		const loader = document.createElement("div");
		loader.id = "wcag-tools-loader";
		loader.style.cssText = `
			position: fixed;
			bottom: 20px;
			left: 20px;
			background-color: #f3f4f6;
			border: 1px solid #d1d5db;
			padding: 12px 20px;
			border-radius: 6px;
			font-family: system-ui, -apple-system, sans-serif;
			z-index: 999999999;
			display: flex;
			align-items: center;
			gap: 8px;
			box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		`;

		const spinner = document.createElement("div");
		spinner.style.cssText = `
			width: 16px;
			height: 16px;
			border: 2px solid #d1d5db;
			border-top-color: #6b7280;
			border-radius: 50%;
			animation: wcag-tools-spin 1s linear infinite;
		`;

		const style = document.createElement("style");
		style.textContent = `
			@keyframes wcag-tools-spin {
				to { transform: rotate(360deg); }
			}
		`;
		document.head.appendChild(style);

		const text = document.createElement("span");
		text.style.color = "#4b5563";
		text.textContent = "Loading...";

		loader.appendChild(spinner);
		loader.appendChild(text);
		return loader;
	}
}

module.exports = { LoadingIndicator };
