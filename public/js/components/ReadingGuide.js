class ReadingGuide {
    constructor() {
        this.state = {
            isEnabled: false,
            boundUpdatePosition: null
        };
        this.init();
    }

    init() {
        const stored = localStorage.getItem('wcag_tools_enabled_list');
        if (stored) {
            const settings = JSON.parse(stored);
            if (settings.wcag_reading_guide?.status) {
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
            width: '100px',
            height: '100px',
            cursor: 'pointer',
            userSelect: 'none',
            borderRadius: '0.75rem'
        });

        const icon = document.createElement('i');
        icon.className = 'fa-sharp fa-light fa-pen-line';
        icon.style.fontSize = '18px';

        const text = document.createElement('div');
        text.textContent = 'Reading Guide';

        container.appendChild(icon);
        container.appendChild(text);
        container.setAttribute('tabindex', '0');

        container.addEventListener('click', () => this.toggle());
        container.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.toggle();
        });

        return container;
    }

    add_highlight() {
        // Remove any existing guide before creating new
        this.remove_highlight();

        const guide = document.createElement('div');
        guide.id = 'reading-guide';
        Object.assign(guide.style, {
            position: 'fixed',
            left: '0',
            top: '0',
            width: '100%',
            height: '2px',
            backgroundColor: '#16a34a',
            zIndex: '999999', // Make sure it's really on top
            pointerEvents: 'none'
        });
        document.body.appendChild(guide);

        this.state.boundUpdatePosition = this.updateGuidePosition.bind(this);
        document.addEventListener('mousemove', this.state.boundUpdatePosition);

        const settings = JSON.parse(localStorage.getItem('wcag_tools_enabled_list') || '{}');
        settings.wcag_reading_guide = { status: true };
        localStorage.setItem('wcag_tools_enabled_list', JSON.stringify(settings));
        this.state.isEnabled = true;
    }

    remove_highlight() {
        const guide = document.getElementById('reading-guide');
        if (guide) guide.remove();

        if (this.state.boundUpdatePosition) {
            document.removeEventListener('mousemove', this.state.boundUpdatePosition);
            this.state.boundUpdatePosition = null;
        }

        const settings = JSON.parse(localStorage.getItem('wcag_tools_enabled_list') || '{}');
        delete settings.wcag_reading_guide;
        localStorage.setItem('wcag_tools_enabled_list', JSON.stringify(settings));
        this.state.isEnabled = false;
    }

    updateGuidePosition(e) {
        const guide = document.getElementById('reading-guide');
        if (guide) {
            guide.style.top = `${e.clientY}px`;
        }
    }

    toggle() {
        if (this.state.isEnabled) {
            this.remove_highlight();
        } else {
            this.add_highlight();
        }
    }
}

module.exports = ReadingGuide;
