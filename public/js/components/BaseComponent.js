class BaseComponent {
    constructor(wcagTools) {
        this.wcagTools = wcagTools;
        this.element = null;
        this.state = {};
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.update();
        console.log('1')
    }

    update() {
        const newElement = this.render();
        if (this.element) {
            this.element.replaceWith(newElement);
        }
        this.element = newElement;
        console.log('2')
    }

    render() {
        console.log('3')
        return document.createElement('div');
        
    }

    createResetButton() {
        console.log('4')
        const button = this.wcagTools.createElement('button', 
            { 
                'aria-label': 'Reset to default settings',
                title: 'Reset to default'
            }, 
            {
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '4px 8px',
                fontSize: '12px',
                color: '#666',
                backgroundColor: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }, 
            ['Reset']
        );

        button.addEventListener('click', () => this.reset());
        return button;
    }

    reset() {
        // Override in child classes
        console.log('calling reset')
    }
}

module.exports = { BaseComponent };
