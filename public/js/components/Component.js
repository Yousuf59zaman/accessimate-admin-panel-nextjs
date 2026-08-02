class Component {
    constructor(wcagTools) {
        this.wcagTools = wcagTools;
        this.state = {};
        this.element = null;
        this.defaultState = {};
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.update();
    }

    update() {
        if (this.element) {
            const newElement = this.render();
            this.element.replaceWith(newElement);
            this.element = newElement;
        }
    }

    mount(parent) {
        this.element = this.render();
        parent.appendChild(this.element);
        this.afterMount();
    }

    afterMount() {}
    
    unmount() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    render() {
        return document.createElement('div');
    }

    createResetButton() {
        const button = document.createElement('button');
        button.className = 'wcag-reset-button';
        button.textContent = 'Reset';
        button.setAttribute('aria-label', 'Reset settings');
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.reset();
            this.update();
        });
        return button;
    }

    reset() {
        if (this.defaultState) {
            this.setState(this.defaultState);
            this.applyState();
        }
    }

    // Detect if Google Translate currently has a selected language
    isTranslationActive() {
        if (typeof document === 'undefined') return false;
        const combo = document.querySelector('.goog-te-combo');
        if (combo && combo.value) return true;

        // Fallback: detect via googtrans cookie (works with newer Google UI)
        const cookie = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith('googtrans='));
        if (cookie) {
            const value = (cookie.split('=')[1] || '').split('/');
            // expected format: /en/<lang>
            if (value.length >= 3) {
                const lang = value[2];
                if (lang && lang.toLowerCase() !== 'en') return true;
            }
        }

        return false;
    }

    // Determine if a string is mostly numeric/value content (e.g., percentages)
    isValueOnlyText(text) {
        return /^[\s\d.,%()]+$/.test(text);
    }

    // Cache the default (and translated) label text for an element so we can restore it safely
    storeDefaultLabel(element, fallback = '', forceCapture = false) {
        if (!element) return fallback;

        const currentText = (element.textContent || '').trim();
        const hasTranslated = Boolean(element.dataset.defaultTranslated);

        if (!element.dataset.defaultLabel) {
            element.dataset.defaultLabel = currentText || fallback;
        }

        // When translation is active and the text looks like a label, remember the translated copy
        const canCapture = this.isTranslationActive() && currentText && !this.isValueOnlyText(currentText);
        if (canCapture) {
            // Force capture is used when we explicitly want to snapshot the translated default text
            if (forceCapture) {
                element.dataset.defaultTranslated = currentText;
            } else if (!hasTranslated && currentText === element.dataset.defaultLabel) {
                element.dataset.defaultTranslated = currentText;
            }
        }

        return element.dataset.defaultTranslated || element.dataset.defaultLabel || fallback;
    }

    applyState() {
        // Override in child classes
    }
}

module.exports = {
    Component
};
