const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// Replace 'path_to_your_images' with the actual path to your images directory
const imagesPath = path.join(__dirname, 'raster_img');
const geoJSONPath = path.join(__dirname, 'geojson');
app.use('/raster_img', express.static(imagesPath));
app.use('/data', express.static(geoJSONPath));

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});
