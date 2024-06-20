# Eastern Mau Forest Reserve Land Cover and Land Use Change Web Map

## Project Description
This project presents an interactive web map developed using Leaflet.js to visualize the land cover and land use changes in the Eastern Mau Forest Reserve from 1984 to 2024. The web map includes classified maps, density slices, and thematic change analysis maps, providing a comprehensive view of the region's ecological dynamics. The project aims to offer an accessible and user-friendly tool for researchers, policymakers, and the general public to understand and analyze the land cover changes in the Eastern Mau Forest Reserve.

## Table of Contents
1. [Installation](#installation)
2. [Usage](#usage)
3. [Data Sources](#data-sources)
4. [Features](#features)
5. [Contributing](#contributing)
6. [License](#license)

## Installation

### Prerequisites
- Node.js and npm should be installed on your machine. You can download and install Node.js from [here](https://nodejs.org/).

### Steps
1. **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/eastern-mau-forest-webmap.git
    ```

2. **Navigate to the project directory:**
    ```sh
    cd eastern-mau-forest-webmap
    ```

3. **Install the required dependencies:**
    ```sh
    npm install
    ```

4. **Start the server:**
    ```sh
    node server.js
    ```

5. **Open your web browser and navigate to `http://localhost:8000`:**

## Usage

### Web Map Layers
The web map provides three main layers for visualization:
1. **Classified Maps:** Displays land cover classifications for different years, allowing users to observe how land cover has evolved over time.
2. **Density Slices:** Visualizes the density of specific land cover types, providing a more nuanced view of land cover distribution.
3. **Thematic Change Analysis Maps:** Illustrates transitions between different land cover types over time, highlighting significant changes.

### Interacting with the Map
- **Temporal Slider:** Use the year slider at the bottom of the map to select different years and observe changes in land cover.
- **Base Maps:** Switch between different base maps such as OpenStreetMap, Google Streets, Google Satellite, and CartoDB Dark Matter to view the data in various contexts.
- **Legend:** A color-coded legend is provided to explain the land cover classifications and transitions, ensuring users can accurately interpret the data.

## Data Sources
The project utilizes the following data sources:
- **GeoTIFF Files:** Representing classified land cover maps for different years.
- **GeoJSON Files:** Delineating specific features and boundaries within the forest reserve.

## Features
- **Interactive Map:** The web map is built with Leaflet.js, providing a user-friendly and interactive interface.
- **Multiple Layers:** Users can toggle between classified maps, density slices, and thematic change analysis maps.
- **Temporal Analysis:** The temporal slider enables users to visualize land cover changes over time.
- **High-Resolution Data:** Utilizes GeoTIFF and GeoJSON data to offer detailed and accurate representations of land cover.
- **Customizable Views:** Users can switch between different base maps for better context and understanding.

## Contributing
Contributions are welcome! To contribute to this

