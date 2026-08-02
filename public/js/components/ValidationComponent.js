const { LoadingIndicator } = require("./LoadingIndicator.js");

class ValidationComponent {
    constructor(wcagTools) {
        this.wcagTools = wcagTools;
        this.container = null;
    }

    render() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            text-align: center;
        `;

        if (this.wcagTools.state.isValidating) {
            const loader = new LoadingIndicator();
            loader.style.position = 'static';
            this.container.appendChild(loader);
        } else if (!this.wcagTools.state.isValid) {
            const errorMessage = document.createElement('div');
            errorMessage.style.cssText = `
                background-color: #fee2e2;
                border: 1px solid #ef4444;
                color: #991b1b;
                padding: 16px 24px;
                border-radius: 8px;
                margin: 20px 0;
                font-size: 16px;
            `;
            errorMessage.textContent = this.wcagTools.state.errorMessage || "Token is invalid";

            const retryButton = document.createElement('button');
            retryButton.style.cssText = `
                background-color: #ef4444;
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                border: none;
                margin-top: 16px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.2s;
            `;
            retryButton.textContent = "Close Widget";
            retryButton.addEventListener('click', () => this.wcagTools.closeWidget());

            this.container.appendChild(errorMessage);
            this.container.appendChild(retryButton);
        }

        return this.container;
    }

    update() {
        if (this.container) {
            this.container.innerHTML = '';
            const newContent = this.render();
            this.container.replaceWith(newContent);
        }
    }
}

module.exports = { ValidationComponent };
