class ContentScaling {
    constructor() {
        this.state = {
            default_scale_value: 0,
            cur_scale_value: 0,
            scale_per_click: 10,
            scale_value_up_limit: 100,
            scale_value_down_limit: -100
        };
        this.element = null;
        this.init();
    }

    init() {
        const stored = localStorage.getItem('wcag_tools_enabled_list');
        if (stored) {
            const data = JSON.parse(stored);
            if (data.wcag_content_scaling?.status) {
                this.state.cur_scale_value = data.wcag_content_scaling.value;
                this.add_highlight();
            }
        }
    }

    render() {
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            width: 100%;
            height: 100%;
            cursor: pointer;
            user-select: none;
            border-radius: 0.75rem;
        `;

        // Header section
        const header = this.createHeader();

        // Controls section
        const controls = this.createControls();

        container.appendChild(header);
        container.appendChild(controls);
        container.addEventListener('click', () => this.content_scaling());
        container.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.content_scaling();
        });
        container.setAttribute('tabindex', '0');

        this.element = container;
        return container;
    }

    createHeader() {
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 12px;
        `;

        const icon = document.createElement('i');
        icon.className = 'fa-sharp fa-solid fa-expand';
        icon.style.fontSize = '18px';

        const text = document.createElement('div');
        text.textContent = 'Content Scaling';

        header.appendChild(icon);
        header.appendChild(text);
        return header;
    }

    createControls() {
        const controlsWrapper = document.createElement('div');
        controlsWrapper.style.cssText = `
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 1s;
        `;

        // Scale controls
        const scaleControls = this.createScaleControls();
        controlsWrapper.appendChild(scaleControls);

        // Reset button
        if (this.state.default_scale_value !== this.state.cur_scale_value) {
            const resetButton = this.createResetButton();
            controlsWrapper.appendChild(resetButton);
        }

        return controlsWrapper;
    }

    // ... Continue with the rest of the methods from Vue component ...
    scale_up() {
        this.scale_class_remove();
        this.state.cur_scale_value = Math.min(
            this.state.cur_scale_value + this.state.scale_per_click,
            this.state.scale_value_up_limit
        );
        this.html_update();
        this.updateDisplay();
    }

    // ... Add all other methods from Vue component ...
}

module.exports = {
    ContentScaling
};
