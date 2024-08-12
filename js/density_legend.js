document.addEventListener('DOMContentLoaded', function() {
    // Ensure densitySliceClassRanges is available globally
    if (typeof densitySliceClassRanges === 'undefined') {
        console.error('densitySliceClassRanges is not defined.');
        return;
    }

    var map = L.map('map').setView([0.1989826, 37.0060], 6);

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

    var baseMaps = {
        "OpenStreetMap": osm,
        "Google Streets": googleStreets,
        "Google Satellite": googleSat,
        "CartoDB Dark Matter": CartoDB_DarkMatter
    };

    L.control.layers(baseMaps).addTo(map);

    const classColors = [
        "#000000", "transparent", "#e3eec4", "#c8dd89", "#accc4f", "#91bb14",
        "#75aa00", "#5a9900", "#3e8800", "#217600", "#066500", "#005400",
        "#004300", "#003200", "#002100", "#001000", "#000000"
    ];

    const colors = [
        "#e3eec4", "#c8dd89", "#accc4f", "#91bb14", "#75aa00", "#5a9900", "#3e8800", "#217600",
        "#066500", "#005400", "#004300", "#003200", "#002100", "#001000", "#000000"
    ];

    let densityLayers = {};
    let currentOverlayLayer = null;
    let layerTitle = null;
    let legend = L.control({ position: 'topright' });

    legend.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'info legend');
        var labels = ['<strong>Density Slices</strong>'];
        densitySliceClassRanges["1984"].forEach((range, index) => {
            labels.push(
                `<i style="background:${colors[index]}"></i> ${range[0].toFixed(6)} - ${range[1].toFixed(6)}`
            );
        });
        div.innerHTML = labels.join('<br>');
        return div;
    };
    legend.addTo(map);

    function updateLayerTitle(year) {
        if (layerTitle) {
            map.removeControl(layerTitle);
        }
        layerTitle = L.control({ position: 'topright' });
        layerTitle.onAdd = function(map) {
            var div = L.DomUtil.create('div', 'info');
            div.innerHTML = `<h4>Density Slice for ${year}</h4>`;
            return div;
        };
        layerTitle.addTo(map);
    }

    function updateLegend(year, legendControl, classRanges, colorScale) {
        legendControl.remove(); // Remove the existing legend
        legendControl.onAdd = function(map) {
            var div = L.DomUtil.create('div', 'info legend');
            var labels = ['<strong>Density Slices</strong>'];
            classRanges[year].forEach((range, index) => {
                labels.push(
                    `<i style="background:${colorScale[index]}"></i> ${range[0].toFixed(6)} - ${range[1].toFixed(6)}`
                );
            });
            div.innerHTML = labels.join('<br>');
            return div;
        };
        legendControl.addTo(map);
    }

    async function loadGeoTIFF(url, year) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const georaster = await parseGeoraster(arrayBuffer);

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
            densityLayers[year] = rasterLayer;

            if (year === "1984") {
                rasterLayer.addTo(map);
                currentOverlayLayer = rasterLayer;
                map.fitBounds(rasterLayer.getBounds());
                updateLayerTitle(year);
                updateLegend(year, legend, densitySliceClassRanges, colors);
            }
        } catch (error) {
            console.error(`Error loading GeoTIFF ${year}:`, error);
        }
    }

    // Load TIF files
    loadGeoTIFF('http://localhost:8000/raster_img/Density_Slice_1984.tif', "1984");
    loadGeoTIFF('http://localhost:8000/raster_img/Density_Slice_1986.tif', "1986");
    loadGeoTIFF('http://localhost:8000/raster_img/Density_Slice_1995.tif', "1995");
    loadGeoTIFF('http://localhost:8000/raster_img/Density_Slice_2002.tif', "2002");
    loadGeoTIFF('http://localhost:8000/raster_img/Density_Slice_2014.tif', "2014");
    loadGeoTIFF('http://localhost:8000/raster_img/Density_Slice_2024.tif', "2024");

    map.on('baselayerchange', function() {
        if (currentOverlayLayer) {
            currentOverlayLayer.addTo(map);
        }
    });

    var slider = document.getElementById('year-slider');
    
    if (slider) {
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
            var year = parseInt(values[handle]);
            if (densitySliceClassRanges[year]) {
                updateLegend(year, legend, densitySliceClassRanges, colors);
            }
            if (densityLayers[year]) {
                if (currentOverlayLayer) {
                    map.removeLayer(currentOverlayLayer);
                }
                currentOverlayLayer = densityLayers[year];
                densityLayers[year].addTo(map);
                updateLayerTitle(year);
            }
        });

        slider.noUiSlider.on('slide', function(values, handle) {
            var nearestYear = Math.round(values[handle]);
            slider.noUiSlider.set(nearestYear);
        });

        updateLayerTitle('1984');
        updateLegend('1984', legend, densitySliceClassRanges, colors);
    } else {
        console.error('Slider element not found.');
    }
});
