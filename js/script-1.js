document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    var map = L.map('map').setView([0.1989826, 37.0060], 6);

    // Add base layers
    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

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

    // Class colors
    const classColors = {
        0: 'rgba(0, 0, 0, 0)', // no change to no change
        1: 'rgb(0, 109, 44)', // Unclassified to Dense Forest
        2: 'rgb(247, 248, 233)', // Unclassified to Barren Land
        3: 'rgb(186, 228, 179)', // Unclassified to Settlement
        4: 'rgb(49, 163, 84)', // Unclassified to Grassland
        5: 'rgb(116, 196, 118)', // Unclassified to Planted Farmland
        6: 'rgb(255, 0, 0)', // Dense Forest to Unclassified
        7: 'rgba(0, 0, 0, 0)', // none
        8: 'rgb(255, 165, 0)', // Dense Forest to Barren Land
        9: 'rgb(255, 255, 0)', // Dense Forest to Settlement
        10: 'rgb(0, 255, 0)', // Dense Forest to Grassland
        11: 'rgb(0, 0, 255)', // Dense Forest to Planted Farmland
        12: 'rgb(128, 0, 128)', // Barren Land to Unclassified
        13: 'rgb(0, 128, 128)', // Barren Land to Dense Forest
        14: 'rgba(0, 0, 0, 0)', // none
        15: 'rgb(128, 128, 0)', // Barren Land to Settlement
        16: 'rgb(128, 0, 0)', // Barren Land to Grassland
        17: 'rgb(0, 128, 0)', // Barren Land to Planted Farmland
        18: 'rgb(0, 0, 128)', // Settlement to Unclassified
        19: 'rgb(255, 0, 255)', // Settlement to Dense Forest
        20: 'rgb(255, 20, 147)', // Settlement to Barren Land
        21: 'rgba(0, 0, 0, 0)', // none
        22: 'rgb(255, 69, 0)', // Settlement to Grassland
        23: 'rgb(75, 0, 130)', // Settlement to Planted Farmland
        24: 'rgb(30, 144, 255)', // Grassland to Unclassified
        25: 'rgb(124, 252, 0)', // Grassland to Dense Forest
        26: 'rgb(127, 255, 0)', // Grassland to Barren Land
        27: 'rgb(0, 255, 255)', // Grassland to Settlement
        28: 'rgba(0, 0, 0, 0)', // none
        29: 'rgb(255, 0, 255)', // Grassland to Planted Farmland
        30: 'rgb(173, 255, 47)', // Planted Farmland to Unclassified
        31: 'rgb(75, 0, 130)', // Planted Farmland to Dense Forest
        32: 'rgb(199, 21, 133)', // Planted Farmland to Barren Land
        33: 'rgb(144, 238, 144)', // Planted Farmland to Settlement
        34: 'rgb(135, 206, 250)', // Planted Farmland to Grassland
        35: 'rgba(0, 0, 0, 0)' // none
    };

    let rasterLayers = {};
    let currentOverlayLayer = null;
    let layerTitle = null;
    let legend = null;

    // Load and display a GeoTIFF file
    async function loadGeoTIFF(url, year) {
        try {
            console.log(`Fetching GeoTIFF for year ${year} from ${url}`);
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
    loadGeoTIFF('http://localhost:8000/raster_img/THEMATIC%20CHANGE%20ANALYSIS%201984%20-%201986.tif', "1984");
    loadGeoTIFF('http://localhost:8000/raster_img/THEMATIC%20CHANGE%20ANALYSIS%201986%20-%201995.tif', "1986");
    loadGeoTIFF('http://localhost:8000/raster_img/THEMATIC%20CHANGE%20ANALYSIS%201995%20-%202002.tif', "1995");
    loadGeoTIFF('http://localhost:8000/raster_img/THEMATIC%20CHANGE%20ANALYSIS%202002%20-%202014.tif', "2002");
    loadGeoTIFF('http://localhost:8000/raster_img/THEMATIC%20CHANGE%20ANALYSIS%202014%20-%202024.tif', "2014");

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
            div.innerHTML = `<h4>Thematic Change Analysis Image for ${year}</h4>`;
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
                "no change to no change": classColors[0],
                "Unclassified to Dense Forest": classColors[1],
                "Unclassified to Barren Land": classColors[2],
                "Unclassified to Settlement": classColors[3],
                "Unclassified to Grassland": classColors[4],
                "Unclassified to Planted Farmland": classColors[5],
                "Dense Forest to Unclassified": classColors[6],
                "none": classColors[7],
                "Dense Forest to Barren Land": classColors[8],
                "Dense Forest to Settlement": classColors[9],
                "Dense Forest to Grassland": classColors[10],
                "Dense Forest to Planted Farmland": classColors[11],
                "Barren Land to Unclassified": classColors[12],
                "Barren Land to Dense Forest": classColors[13],
                "none": classColors[14],
                "Barren Land to Settlement": classColors[15],
                "Barren Land to Grassland": classColors[16],
                "Barren Land to Planted Farmland": classColors[17],
                "Settlement to Unclassified": classColors[18],
                "Settlement to Dense Forest": classColors[19],
                "Settlement to Barren Land": classColors[20],
                "none": classColors[21],
                "Settlement to Grassland": classColors[22],
                "Settlement to Planted Farmland": classColors[23],
                "Grassland to Unclassified": classColors[24],
                "Grassland to Dense Forest": classColors[25],
                "Grassland to Barren Land": classColors[26],
                "Grassland to Settlement": classColors[27],
                "none": classColors[28],
                "Grassland to Planted Farmland": classColors[29],
                "Planted Farmland to Unclassified": classColors[30],
                "Planted Farmland to Dense Forest": classColors[31],
                "Planted Farmland to Barren Land": classColors[32],
                "Planted Farmland to Settlement": classColors[33],
                "Planted Farmland to Grassland": classColors[34],
                "none": classColors[35]
            };

            for (var key in categories) {
                div.innerHTML +=
                    '<i style="background:' + categories[key] + '"></i> ' +
                    key + '<br>';
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
