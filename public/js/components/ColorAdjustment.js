const {BaseComponent} = require('./BaseComponent.js');
const dom = require('../utils/dom.js');
class ColorAdjustment extends BaseComponent {
    constructor() {
        super();
        this.state = {
            contrast: 100,
            saturation: 100,
            isDarkMode: false
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
        }, ['Color Adjustments']);

        const controls = dom.createElement('div', {}, {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '15px'
        });

        const contrastControl = dom.createAccessibilityControl({
            icon: 'fa-sharp fa-light fa-circle-half-stroke',
            label: 'Contrast',
            isActive: this.state.contrast !== 100,
            onClick: () => this.adjustContrast()
        });

        const saturationControl = dom.createAccessibilityControl({
            icon: 'fa-light fa-droplet',
            label: 'Saturation',
            isActive: this.state.saturation !== 100,
            onClick: () => this.adjustSaturation()
        });

        controls.appendChild(contrastControl);
        controls.appendChild(saturationControl);
        container.appendChild(title);
        container.appendChild(controls);

        return container;
    }

    adjustContrast() {
        const values = [100, 125, 150, 175, 200];
        const currentIndex = values.indexOf(this.state.contrast);
        const nextIndex = (currentIndex + 1) % values.length;
        this.setState({ contrast: values[nextIndex] });
        
        document.documentElement.style.filter = `contrast(${this.state.contrast}%)`;
    }

    adjustSaturation() {
        const values = [100, 150, 200, 50, 0];
        const currentIndex = values.indexOf(this.state.saturation);
        const nextIndex = (currentIndex + 1) % values.length;
        this.setState({ saturation: values[nextIndex] });
        
        document.documentElement.style.filter = `saturate(${this.state.saturation}%)`;
    }
}

module.exports = { ColorAdjustment };
