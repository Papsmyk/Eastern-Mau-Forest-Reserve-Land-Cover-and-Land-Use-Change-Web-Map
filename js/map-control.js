let currentScript = null;

const scripts = {
    classified_images: './js/classified_images.js',
    density_slices: './js/density_slices.js',
    thematic_change: './js/thematic_change_images.js'
};

function loadScript(src) {
    if (currentScript) {
        document.body.removeChild(currentScript);
    }
    currentScript = document.createElement('script');
    currentScript.src = src;
    currentScript.id = 'dynamic-script';
    document.body.appendChild(currentScript);
}

function switchScript() {
    const selectedValue = document.getElementById('mapTypeSelector').value;
    const scriptPath = scripts[selectedValue];
    loadScript(scriptPath);
    document.getElementById('map-title').innerText = document.getElementById('mapTypeSelector').options[document.getElementById('mapTypeSelector').selectedIndex].text;
}

// Load the initial script
document.addEventListener('DOMContentLoaded', () => {
    switchScript();
});
