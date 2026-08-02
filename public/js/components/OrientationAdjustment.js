const {BaseComponent} = require('./BaseComponent.js');
const dom = require('../utils/dom.js');
const ReadingGuide = require('./ReadingGuide.js');
const ReadingMask = require('./ReadingMask.js');

class OrientationAdjustment extends BaseComponent {
    constructor() {
        super();
        this.state = {
            readingGuide: false,
            bigCursor: false,
            readingMask: false,
            hideImages: false
        };
    }

    render() {
        const container = dom.createElement('section', {}, {
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '8px',
            marginTop: '20px'
        });

        const title = dom.createElement('h2', {}, {
            fontSize: '16px',
            marginBottom: '15px'
        }, ['Orientation Adjustments']);

        const controls = dom.createElement('div', {}, {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '15px'
        });

        const orientationControls = [
            {
                icon: 'fa-light fa-pen-line',
                label: 'Reading Guide',
                isActive: this.state.readingGuide,
                onClick: () => this.toggleReadingGuide()
            },
            {
                icon: 'fa-light fa-arrow-pointer',
                label: 'Big Cursor',
                isActive: this.state.bigCursor,
                onClick: () => this.toggleBigCursor()
            },
            {
                icon: 'fa-regular fa-mask-face',
                label: 'Reading Mask',
                isActive: this.state.readingMask,
                onClick: () => this.toggleReadingMask()
            },
            {
                icon: 'fa-regular fa-image',
                label: 'Hide Images',
                isActive: this.state.hideImages,
                onClick: () => this.toggleHideImages()
            }
        ];

        orientationControls.forEach(control => {
            controls.appendChild(dom.createAccessibilityControl(control));
        });

        container.appendChild(title);
        container.appendChild(controls);
        return container;
    }

    toggleReadingGuide() {
        this.setState({ readingGuide: !this.state.readingGuide });
        this.updateReadingGuide();
    }

    toggleBigCursor() {
        
        this.setState({ bigCursor: !this.state.bigCursor });
        document.body.style.cursor = this.state.bigCursor ? 
            'url("data:image/svg+xml,..."), auto' : 'default';
    }

    toggleReadingMask() {
        this.setState({ readingMask: !this.state.readingMask });
        this.updateReadingMask();
    }

    toggleHideImages() {
        this.setState({ hideImages: !this.state.hideImages });
        document.querySelectorAll('img').forEach(img => {
            img.style.opacity = this.state.hideImages ? '0' : '1';
        });
    }

    updateReadingGuide() {
        if (this.state.readingGuide) {
            this.createReadingGuide();
        } else {
            this.removeReadingGuide();
        }
    }

    updateReadingMask() {
        if (this.state.readingMask) {
            this.createReadingMask();
        } else {
            this.removeReadingMask();
        }
    }

    // Helper methods for reading guide and mask
    createReadingGuide() {
        if (!this.readingGuide) {
            this.readingGuide = new ReadingGuide();
        }
        this.readingGuide.add_highlight();
    }

    removeReadingGuide() {
        if (this.readingGuide) {
            this.readingGuide.remove_highlight();
        }
    }

    createReadingMask() {
        if (!this.readingMask) {
            this.readingMask = new ReadingMask();
        }
        this.readingMask.add_highlight();
    }

    removeReadingMask() {
        if (this.readingMask) {
            this.readingMask.remove_highlight();
        }
    }
}

module.exports = { OrientationAdjustment };
