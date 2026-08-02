class AdjustFontSizing {
    constructor(wcagTools) {
        this.wcagTools = wcagTools;
        this.state = {
            default_size_value: 0,
            cur_size_value: 0,
            size_per_click: 10,
            size_value_up_limit: 100,
            size_value_down_limit: -100
        };
        this.init();
    }

    init() {
        const stored = localStorage.getItem('wcag_tools_enabled_list');
        if (stored) {
            const data = JSON.parse(stored);
            if (data.wcag_adjust_font_sizing?.status) {
                this.state.cur_size_value = data.wcag_adjust_font_sizing.value;
                this.add_highlight();
            }
        }
    }

    render() {
        const container = document.createElement('div');
        Object.assign(container.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: '0.75rem'
        });

        const header = this.createHeader();
        const controls = this.createControls();

        container.appendChild(header);
        container.appendChild(controls);

        container.addEventListener('click', () => this.adjust_font_sizing());
        container.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.adjust_font_sizing();
        });
        container.setAttribute('tabindex', '0');

        return container;
    }

    createHeader() {
        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
        });

        const icon = document.createElement('i');
        icon.className = 'fa-sharp fa-solid fa-font';
        icon.style.fontSize = '18px';

        const text = document.createElement('div');
        text.textContent = 'Adjust Font Sizing';

        header.appendChild(icon);
        header.appendChild(text);

        return header;
    }

    createControls() {
        // Create controls container
        const controls = document.createElement('div');
        // ...Add controls styling and elements...

        // Add size adjustment buttons and display
        const sizeControls = this.createSizeControls();
        controls.appendChild(sizeControls);

        // Add reset button if needed
        if (this.state.default_size_value !== this.state.cur_size_value) {
            const resetButton = this.createResetButton();
            controls.appendChild(resetButton);
        }

        return controls;
    }

    createSizeControls() {
        const controlsWrapper = document.createElement('div');
        Object.assign(controlsWrapper.style, {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: '28px',
            minWidth: '150px',
            maxWidth: '250px',
            backgroundColor: 'rgb(243 244 246)'
        });

        // Down button
        const downButton = this.createButton('down', this.size_down.bind(this));
        
        // Size display
        const sizeDisplay = document.createElement('div');
        Object.assign(sizeDisplay.style, {
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
            fontSize: '12px'
        });
        sizeDisplay.textContent = this.state.default_size_value === this.state.cur_size_value ? 
            'Default' : `${this.state.cur_size_value}%`;

        // Up button
        const upButton = this.createButton('up', this.size_up.bind(this));

        controlsWrapper.appendChild(downButton);
        controlsWrapper.appendChild(sizeDisplay);
        controlsWrapper.appendChild(upButton);

        return controlsWrapper;
    }

    createButton(type, onClick) {
        const button = document.createElement('div');
        Object.assign(button.style, {
            display: 'flex',
            width: '32px',
            height: '32px',
            backgroundColor: '#ea580c',
            color: 'white',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '9999px',
            transition: 'all 0.3s'
        });

        const icon = document.createElement('i');
        icon.className = `fa fa-chevron-${type}`;
        button.appendChild(icon);

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
        });
        button.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') onClick();
        });
        button.setAttribute('tabindex', '0');

        // Hover effects
        button.addEventListener('mouseover', () => {
            button.style.outline = '2px solid #dc2626';
            button.style.outlineOffset = '2px';
        });
        button.addEventListener('mouseout', () => {
            button.style.outline = 'none';
        });

        return button;
    }

    createResetButton() {
        if (this.state.default_size_value === this.state.cur_size_value) {
            return null;
        }

        const resetButton = document.createElement('span');
        Object.assign(resetButton.style, {
            color: '#dc2626',
            fontSize: '10px',
            cursor: 'pointer',
            transition: 'all 0.3s'
        });
        resetButton.textContent = 'Reset';

        resetButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.size_reset();
        });
        resetButton.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.size_reset();
        });
        resetButton.setAttribute('tabindex', '0');

        // Hover effects
        resetButton.addEventListener('mouseover', () => {
            resetButton.style.fontWeight = '600';
            resetButton.style.color = '#ea580c';
        });
        resetButton.addEventListener('mouseout', () => {
            resetButton.style.fontWeight = '400';
            resetButton.style.color = '#dc2626';
        });

        return resetButton;
    }

    size_up() {
        this.size_class_remove();
        this.state.cur_size_value = Math.min(
            this.state.cur_size_value + this.state.size_per_click,
            this.state.size_value_up_limit
        );
        this.html_update();
    }

    size_down() {
        this.size_class_remove();
        this.state.cur_size_value = Math.max(
            this.state.cur_size_value - this.state.size_per_click,
            this.state.size_value_down_limit
        );
        this.html_update();
    }

    size_reset() {
        this.size_class_remove();
        this.state.cur_size_value = this.state.default_size_value;
        this.remove_highlight();
        this.html_update();
    }

    size_class_remove() {
        document.body.classList.remove(`wcag_font_sizing-${this.state.cur_size_value}`);
    }

    html_update() {
        const zoomValue = this.calculateZoomValue(this.state.cur_size_value);
        document.body.style.zoom = zoomValue;
        
        Array.from(document.getElementsByTagName('*')).forEach(element => {
            if (!element.closest('.wcag_tools_item_block')) {
                element.style.zoom = zoomValue;
            }
        });

        this.updateUI();
    }

    calculateZoomValue(value) {
        if (value > 0) {
            return (1 + (value * 0.0005)).toFixed(3);
        } else if (value < 0) {
            return (1 - (Math.abs(value) * 0.0005)).toFixed(3);
        }
        return "1.000";
    }

    add_highlight() {
        document.body.classList.add('wcag_adjust_font_sizing');
        
        const settings = {
            wcag_adjust_font_sizing: {
                status: true,
                value: this.state.cur_size_value
            }
        };
        
        localStorage.setItem('wcag_tools_enabled_list', JSON.stringify(settings));
    }

    remove_highlight() {
        document.body.classList.remove('wcag_adjust_font_sizing', 'wcag_font_sizing-0');
        
        const settings = JSON.parse(localStorage.getItem('wcag_tools_enabled_list') || '{}');
        delete settings.wcag_adjust_font_sizing;
        localStorage.setItem('wcag_tools_enabled_list', JSON.stringify(settings));
    }

    updateUI() {
        // Find and update size display
        const sizeDisplay = this.element.querySelector('.size-display');
        if (sizeDisplay) {
            sizeDisplay.textContent = this.state.default_size_value === this.state.cur_size_value ? 
                'Default' : `${this.state.cur_size_value}%`;
        }

        // Update reset button visibility
        const resetContainer = this.element.querySelector('.reset-container');
        if (resetContainer) {
            resetContainer.style.display = 
                this.state.default_size_value !== this.state.cur_size_value ? 'block' : 'none';
        }
    }
}

module.exports = {
    AdjustFontSizing
};
