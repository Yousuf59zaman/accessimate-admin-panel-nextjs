class ReadingMask {
    constructor() {
        this.state = {
            isEnabled: false,
            settings: {
                wcag_reading_mask: null
            },
            boundUpdatePosition: null
        };
        this.init();
    }

    init() {
        const stored = localStorage.getItem('wcag_tools_enabled_list');
        if (stored) {
            const settings = JSON.parse(stored);
            if (settings.wcag_reading_mask?.status) {
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

        const icon = document.createElement('i');
        icon.className = 'fa-regular fa-mask-face';
        icon.style.fontSize = '18px';

        const text = document.createElement('div');
        text.textContent = 'Reading Mask';

        container.appendChild(icon);
        container.appendChild(text);
        container.setAttribute('tabindex', '0');
        container.setAttribute('title', 'Reading Mask');

        container.addEventListener('click', () => this.toggle());
        container.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.toggle();
        });

        return container;
    }

    add_highlight() {
        // Remove existing if any
        this.remove_highlight();
        
        const topMask = document.createElement('div');
        topMask.id = 'reading-mask-top';
        Object.assign(topMask.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '40%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '999999',
            pointerEvents: 'none',
            transition: 'height 0.1s ease-out'
        });
        
        const bottomMask = document.createElement('div');
        bottomMask.id = 'reading-mask-bottom';
        Object.assign(bottomMask.style, {
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100%',
            height: '40%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '999999',
            pointerEvents: 'none',
            transition: 'height 0.1s ease-out'
        });
        
        document.body.appendChild(topMask);
        document.body.appendChild(bottomMask);
        
        // Bind and add event listener
        this.state.boundUpdatePosition = this.updateMaskPosition.bind(this);
        document.addEventListener('mousemove', this.state.boundUpdatePosition);

        // Update state and storage
        this.state.isEnabled = true;
        this.state.settings.wcag_reading_mask = { status: true };
        this.local_storage_update();
    }

    remove_highlight() {
        ['reading-mask-top', 'reading-mask-bottom'].forEach(id => {
            const mask = document.getElementById(id);
            if (mask) mask.remove();
        });
        
        if (this.state.boundUpdatePosition) {
            document.removeEventListener('mousemove', this.state.boundUpdatePosition);
            this.state.boundUpdatePosition = null;
        }

        this.state.isEnabled = false;
        this.state.settings.wcag_reading_mask = null;
        this.local_storage_update();
    }

    updateMaskPosition(e) {
        requestAnimationFrame(() => {
            const topMask = document.getElementById('reading-mask-top');
            const bottomMask = document.getElementById('reading-mask-bottom');
            if (topMask && bottomMask) {
                const centerY = e.clientY;
                const gap = 100; // Reading gap height
                topMask.style.height = `${Math.max(0, centerY - gap/2)}px`;
                bottomMask.style.height = `${Math.max(0, window.innerHeight - (centerY + gap/2))}px`;
            }
        });
    }

    local_storage_update() {
        const settings = JSON.parse(localStorage.getItem('wcag_tools_enabled_list') || '{}');
        if (this.state.settings.wcag_reading_mask) {
            settings.wcag_reading_mask = this.state.settings.wcag_reading_mask;
        } else {
            delete settings.wcag_reading_mask;
        }
        localStorage.setItem('wcag_tools_enabled_list', JSON.stringify(settings));
    }

    toggle() {
        if (this.state.isEnabled) {
            this.remove_highlight();
        } else {
            this.add_highlight();
        }
    }
}

module.exports = ReadingMask;
