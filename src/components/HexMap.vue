<template>
    <div class="container">
        <div id="map" ref="map"></div>
    </div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import { GeoJsonLayer } from "@deck.gl/layers";
import { MapboxLayer } from "@deck.gl/mapbox";

export default {
    data() {
        return {
            accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
            mapStyle: "mapbox://styles/haxzie/ck0aryyna2lwq1crp7fwpm5vz",
            // mapStyle: "mapbox://styles/mapbox/streets-v11",
            mapData:
                "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
            latitude: 37.8411711745428,
            longitude: -120.065187687266,
            zoom: 10,
            bearing: 0,
            pitch: 0,
        };
    },
    created() {
        // creating a non reactive map object
        this.map = null;
    },
    mounted() {

        this.initializeMap();
        this.map.on('styledata', () => {
            this.loadLayer();
        })

    },
    methods: {
        initializeMap() {

            this.map = new mapboxgl.Map({
                accessToken: this.accessToken,
                container: this.$refs.map,
                style: this.mapStyle,
                center: [this.longitude, this.latitude],
                zoom: this.zoom,
                pitch: this.pitch,
                bearing: this.bearing,
            });

            // this.map.on("idle", function () {
            //     this.map.resize();
            // }),
            // this.map.on("load", function () {
            //     this.map.resize();
            // });
        },
        loadLayer() {
            // create a new MapboxLayer of type GeoJSON Layer
            const layer = new MapboxLayer({
                id: "geojson-layer",
                type: GeoJsonLayer,
                data: this.mapData,
                filled: true,
                lineWidthScale: 20,
                lineWidthMinPixels: 2,
                getFillColor: (d) => [245, 133, 5, 0],
                getLineColor: (d) => [245, 245, 245],
                getLineWidth: 1,
            });
            // add the layer to map
            this.map.addLayer(layer);
        },
        onMapLoaded(event) {
            event.map.resize();
        },
    },
};
</script>

<style scoped>
.map-container {
    position: fixed;
    top: 0px;
    left: 0;
    z-index: 999;
    width: 100%;
    height: 80vh;
    text-align: center;
    background-color: rgba(0, 0, 0, 0.3);
}
#map {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
}
</style>