class NotFoundComponent {
    constructor(message = "Invalid api key") {
        return this.create(message);
    }

    create(message) {
        const container = document.createElement("div");
        container.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            background-color: #fff;
            font-family: system-ui, -apple-system, sans-serif;
        `;

        // Error Icon
        const icon = document.createElement("div");
        icon.innerHTML = `
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" stroke="#ef4444" stroke-width="2"/>
                <path d="M12 7v6M12 17h.01" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        icon.style.marginBottom = "1.5rem";

        // Error Message
        const messageEl = document.createElement("div");
        messageEl.style.cssText = `
            color: #991b1b;
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            background-color: #fee2e2;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            border: 2px solid #ef4444;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        `;
        messageEl.textContent = message;

        // Helpful Text
        const helpText = document.createElement("p");
        helpText.style.cssText = `
            color: #64748b;
            font-size: 1rem;
            line-height: 1.5;
            max-width: 400px;
            margin: 0 auto;
        `;
        helpText.textContent = "Please check your API key and try again. If the problem persists, contact support.";

        container.appendChild(icon);
        container.appendChild(messageEl);
        container.appendChild(helpText);

        return container;
    }
}

module.exports = { NotFoundComponent };
