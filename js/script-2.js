document.addEventListener('DOMContentLoaded', function() {
    // Load external density slice class ranges
    var densitySliceClassRanges = {};

    fetch('./js/density_slices_class_ranges.js')
        .then(response => response.text())
        .then(scriptContent => {
            eval(scriptContent);
            initializeMap();
        });

    function initializeMap() {
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

        function generateColorScale(numClasses) {
            const colors = [];
            for (let i = 0; i < numClasses; i++) {
                const ratio = i / (numClasses - 1);
                const r = Math.round(255 * (1 - ratio));
                const g = Math.round(255 * ratio);
                const b = Math.round(255 * (1 - ratio));
                colors.push(`rgb(${r},${g},${b})`);
            }
            return colors;
        }

        const colorScale = generateColorScale(16);

        let densityLayers = {};
        let currentOverlayLayer = null;
        let layerTitle = null;
        let legend = null;

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

        function updateLegend(year) {
            if (legend) {
                map.removeControl(legend);
            }
            legend = L.control({ position: 'topright' });
            legend.onAdd = function(map) {
                var div = L.DomUtil.create('div', 'info legend');
                const classRangesForYear = densitySliceClassRanges[year] || [];
                const labels = [];
                for (let i = 0; i < classRangesForYear.length; i++) {
                    labels.push(
                        `<i style="background:${colorScale[i]}"></i> ${classRangesForYear[i][0].toFixed(6)} to ${classRangesForYear[i][1].toFixed(6)}`
                    );
                }
                div.innerHTML = labels.join('<br>');
                return div;
            };
            legend.addTo(map);
        }

        async function loadGeoTIFF(url, year) {
            try {
                console.log(`Loading GeoTIFF for ${year} from ${url}`);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const arrayBuffer = await response.arrayBuffer();
                const georaster = await parseGeoraster(arrayBuffer);
                console.log(`GeoRaster ${year}:`, georaster);

                const classRangesForYear = densitySliceClassRanges[year] || [];

                const rasterLayer = new GeoRasterLayer({
                    georaster: georaster,
                    opacity: 0.7,
                    resolution: 256,
                    pixelValuesToColorFn: values => {
                        const value = values[0];
                        if (value === 0 || value === georaster.noDataValue) return null;

                        for (let i = 0; i < classRangesForYear.length; i++) {
                            if (value >= classRangesForYear[i][0] && value <= classRangesForYear[i][1]) {
                                return colorScale[i];
                            }
                        }
                        return null;
                    }
                });

                densityLayers[year] = rasterLayer;

                if (year === "1984") {
                    rasterLayer.addTo(map);
                    currentOverlayLayer = rasterLayer;
                    map.fitBounds(rasterLayer.getBounds());
                    updateLayerTitle(year);
                    updateLegend(year);
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

        // Add event listener to base map change
        map.on('baselayerchange', function() {
            if (currentOverlayLayer) {
                currentOverlayLayer.addTo(map);
            }
        });

        // Create and configure the slider
        var slider = document.getElementById('slider');

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
            if (densityLayers[year]) {
                if (currentOverlayLayer) {
                    map.removeLayer(currentOverlayLayer);
                }
                currentOverlayLayer = densityLayers[year];
                densityLayers[year].addTo(map);
                updateLayerTitle(year);
                updateLegend(year);
            }
        });

        // Ensure slider only moves to specified years
        slider.noUiSlider.on('slide', function(values, handle) {
            var nearestYear = Math.round(values[handle]);
            slider.noUiSlider.set(nearestYear);
        });

        // Initial title and legend setup
        updateLayerTitle('1984');
        updateLegend('1984');
    }
});
