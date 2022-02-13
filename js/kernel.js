import Desktop from './classes/desktop.js';

window.desktop = new Desktop({
    autorun: [
        { name: 'bio', css: { top: 10, right: 10, bottom: 'auto', left: 'auto' } }
    ]
});

/*Show splashscreen*/
desktop.splashScreen();

/*Hide splashscreen*/
window.onload = () => desktop.splashScreen(true)