document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    var map = L.map('map').setView([0.1989826, 37.0060], 6);

    // Add base layers
    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });

    var googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    var CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    });

    // Add OpenStreetMap by default
    osm.addTo(map);

    // Class colors
    const classColors = {
        1: 'rgb(0, 109, 44)',
        2: 'rgb(247, 248, 233)',
        3: 'rgb(186, 228, 179)',
        4: 'rgb(49, 163, 84)',
        5: 'rgb(116, 196, 118)'
    };

    let rasterLayers = {};
    let currentOverlayLayer = null;
    let layerTitle = null;
    let legend = null;

    // Load and display a GeoTIFF file
    async function loadGeoTIFF(url, year) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const georaster = await parseGeoraster(arrayBuffer);
            console.log(`GeoRaster ${year}:`, georaster);

            const rasterLayer = new GeoRasterLayer({
                georaster: georaster,
                opacity: 0.7,
                resolution: 256,
                pixelValuesToColorFn: values => {
                    const value = values[0];
                    if (value === 0 || value === georaster.noDataValue) return null;
                    return classColors[value] || null;
                }
            });

            rasterLayers[year] = rasterLayer;

            if (year === "1984") {
                rasterLayer.addTo(map);
                currentOverlayLayer = rasterLayer;
                map.fitBounds(rasterLayer.getBounds());
                updateLayerTitle(year);
                updateLegend();
            }
        } catch (error) {
            console.error(`Error loading GeoTIFF ${year}:`, error);
        }
    }

    // Load TIF files
    loadGeoTIFF('http://localhost:8000/raster_img/Classified%20Image%20-%2019841.tif', "1984");
    loadGeoTIFF('http://localhost:8000/raster_img/Classified%20Image%20-%2019861.tif', "1986");
    loadGeoTIFF('http://localhost:8000/raster_img/Classified%20Image%20-%2019951.tif', "1995");
    loadGeoTIFF('http://localhost:8000/raster_img/Classified%20Image%20-%2020021.tif', "2002");
    loadGeoTIFF('http://localhost:8000/raster_img/Classified%20Image%20-%2020141.tif', "2014");
    loadGeoTIFF('http://localhost:8000/raster_img/Classified%20Image%20-%2020241.tif', "2024");

    // Layer control
    var baseMaps = {
        "OpenStreetMap": osm,
        "Google Streets": googleStreets,
        "Google Satellite": googleSat,
        "CartoDB Dark Matter": CartoDB_DarkMatter
    };

    var layerControl = L.control.layers(baseMaps).addTo(map);

    // Update the layer title
    function updateLayerTitle(year) {
        if (layerTitle) {
            map.removeControl(layerTitle);
        }
        layerTitle = L.control({ position: 'topright' });
        layerTitle.onAdd = function(map) {
            var div = L.DomUtil.create('div', 'info');
            div.innerHTML = `<h4>Classified Image for ${year}</h4>`;
            return div;
        };
        layerTitle.addTo(map);
    }

    // Update the legend
    function updateLegend() {
        if (legend) {
            map.removeControl(legend);
        }
        legend = L.control({ position: 'topright' });
        legend.onAdd = function(map) {
            var div = L.DomUtil.create('div', 'info legend');
            var categories = {
                1: "Dense Forest",
                2: "Barren Land",
                3: "Settlement",
                4: "Grassland",
                5: "Planted Farmland"
            };

            for (var key in categories) {
                div.innerHTML +=
                    '<i style="background:' + classColors[key] + '"></i> ' +
                    categories[key] + '<br>';
            }

            return div;
        };
        legend.addTo(map);
    }

    // Add event listener to base map change
    map.on('baselayerchange', function() {
        if (currentOverlayLayer) {
            currentOverlayLayer.addTo(map);
        }
    });

    // Create and configure the slider
    var slider = document.getElementById('year-slider');

    noUiSlider.create(slider, {
        start: [1984],
        step: 1,
        range: {
            'min': 1984,
            'max': 2024
        },
        format: {
            to: value => Math.round(value),
            from: value => Number(value)
        },
        tooltips: true,
        pips: {
            mode: 'values',
            values: [1984, 1986, 1995, 2002, 2014, 2024],
            density: 4
        }
    });

    slider.noUiSlider.on('update', function(values, handle) {
        var year = values[handle].toString();
        if (rasterLayers[year]) {
            if (currentOverlayLayer) {
                map.removeLayer(currentOverlayLayer);
            }
            currentOverlayLayer = rasterLayers[year];
            rasterLayers[year].addTo(map);
            updateLayerTitle(year);
            updateLegend();
        }
    });

    // Ensure slider only moves to specified years
    slider.noUiSlider.on('slide', function(values, handle) {
        var nearestYear = Math.round(values[handle]);
        slider.noUiSlider.set(nearestYear);
    });

    // Initial title and legend setup
    updateLayerTitle('1984');
    updateLegend();
});
