document.addEventListener('DOMContentLoaded', function() {
    var map = L.map('map').setView([0.1989826, 37.0060], 6);

    // // Add base layer
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    // }).addTo(map);

    const colors = [
        "#e3eec4", "#c8dd89", "#accc4f", "#91bb14", "#75aa00", "#5a9900", "#3e8800", "#217600",
        "#066500", "#005400", "#004300", "#003200", "#002100", "#001000", "#000000"
    ];

    // Add legend
    var legend = L.control({ position: 'bottomright' });
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

    // Initialize slider
    var slider = document.getElementById('year-slider');
    noUiSlider.create(slider, {
        start: [1984],
        connect: true,
        range: {
            'min': 1984,
            'max': 2024
        },
        step: 1
    });

    slider.noUiSlider.on('update', function(values, handle) {
        var year = parseInt(values[handle]);
        if (densitySliceClassRanges[year]) {
            updateLegend(year, legend, densitySliceClassRanges, colors);
        }
    });

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
});
