<template>
    <div id="app">
        <!-- <PerimeterTimeline
            :perimeterSample="this.perimMeshes"
            :globalScale="this.globalScale"
        /> -->
        <HexMap
        />
        <!-- <HeatmapFromShader
            :perimeterSample="this.perimMeshes"
            :globalScale="this.globalScale"
        /> -->
        <!-- <Delaunay
            :perimeterSample="this.perimMeshes"
            :globalScale="this.globalScale"
            :config="this.configs[0]"
        /> -->
        <!-- <Interpolation
            :perimeterSample="this.perimMeshes"
            :globalScale="this.globalScale"
            :config="this.configs[0]"
        /> -->
        <!-- <Texture
            :perimeterSample="this.perimMeshes"
            :globalScale="this.globalScale"
            :config="this.configs[2]"
        /> -->
        <!-- <HeatmapFromHeatmapjs
            :perimeterSample="this.perimMeshes"
            :globalScale="this.globalScale"
        /> -->
    </div>
</template>

<script>
import HexMap from "./components/HexMap.vue";
import PerimeterTimeline from "./components/PerimeterTimeline.vue";
import HeatmapFromShader from "./components/playground/HeatmapFromShader.vue";
// import HeatmapFromHeatmapjs from "./components/playground/HeatmapFromHeatmapjs.vue";
import Delaunay from "./components/playground/Delaunay.vue";
import Interpolation from "./components/playground/Interpolation.vue";
import Texture from "./components/playground/Texture.vue";

import perimData from "./test_perimeter.json";
import powerData from "./test_power.json";

import * as d3 from "d3";
import Perimeter from "./perimeter.js";

export default {
    name: "App",
    components: {
        HexMap,
        // PerimeterTimeline,
        // HeatmapFromShader,
        // HeatmapFromHeatmapjs,
        // Delaunay,
        // Interpolation,
        // Texture
    },
    computed: {
        configs() {
            return perimData.data.fire_perimeter
        },
        perimMeshes() {
            // stores all temporally different perimeters of a singular fire
            let firePerims = [];

            let perimEntries = perimData.data.fire_perimeter;
            let powerEntries =
                powerData.data.fire_avg_pow_and_conf_per_coord_per_hour;

            // console.log(this.findRanges(perimEntries));

            for (let perimEntry of perimEntries) {
                var perim = new Perimeter(perimEntry);

                var perimPowerData = powerEntries.filter((powerEntry) => {
                    let powerDate = new Date(powerEntry.date_trunc);
                    let diffTime = perim.date - powerDate;
                    let diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

                    return diffHours <= 6 && diffHours >= 0;
                });

                perim.powerData = perimPowerData;

                perim.init()

                firePerims.push(perim);
            }

            //TODO delete me
            // firePerims.length = 3

            //TODO enable again
            this.omitSimilarParams(firePerims);

            return firePerims;
        },
        // calculate the global scale, so that the biggest perimeter is then 1
        globalScale() {
            let globalMax = this.findGlobalMax(perimData.data.fire_perimeter);
            return 1 / globalMax;
        },
    },
    mounted() {
        // console.log(this.meshes)
    },
    methods: {
        // exludes similar parameters (currently if change in acres is small)
        omitSimilarParams(firePerims) {
            for (let index = 1; index < firePerims.length; index++) {
                const element = firePerims[index];
                let prevElem = firePerims[index - 1];

                let hourDif =
                    (element.date.getTime() - prevElem.date.getTime()) /
                    1000 /
                    60 /
                    60;
                let acreDif =
                    (Math.abs(prevElem.acres - element.acres) /
                        prevElem.acres) *
                    100;

                // if acre difference was < 10%
                if (acreDif < 10) {
                    // if hour difference was < 10
                    if (hourDif < 10) {
                        firePerims.splice(index, 1);
                    }
                }
            }
        },
        findGlobalMin(perimEntries) {
            let globalMin = Number.MAX_VALUE;

            for (let perimEntry of perimEntries) {
                let polygons = perimEntry.perimeter.coordinates;
                let centroid = perimEntry.centroid.coordinates;
                for (let polygon of polygons) {
                    var min = d3.min(polygon, (d) => {
                        return d3.min(d, (e) => {
                            return e[0] - centroid[0];
                        });
                    });
                    if (min < globalMin) globalMin = min;
                }
            }
            return globalMin;
        },
        findGlobalMax(perimEntries) {
            let globalMax = Number.MIN_VALUE;

            for (let perimEntry of perimEntries) {
                let polygons = perimEntry.perimeter.coordinates;
                let centroid = perimEntry.centroid.coordinates;
                for (let polygon of polygons) {
                    var max = d3.max(polygon, (d) => {
                        return d3.max(d, (e) => {
                            return e[0] - centroid[0];
                        });
                    });
                    if (max > globalMax) globalMax = max;
                }
            }
            return globalMax;
        },
        findRanges(perimEntries) {
            let globalMaxY = -Number.MAX_VALUE;
            let globalMinY = Number.MAX_VALUE;
            let globalMaxX = -Number.MAX_VALUE;
            let globalMinX = Number.MAX_VALUE;

            for (let perimEntry of perimEntries) {
                let polygons = perimEntry.perimeter.coordinates;
                let centroid = perimEntry.centroid.coordinates;
                for (let polygon of polygons) {
                    var maxY = d3.max(polygon, (d) => {
                        return d3.max(d, (e) => {
                            return e[0]; // - centroid[0]
                        });
                    });

                    var minY = d3.min(polygon, (d) => {
                        return d3.min(d, (e) => {
                            return e[0];
                        });
                    });

                    var maxX = d3.max(polygon, (d) => {
                        return d3.max(d, (e) => {
                            return e[1];
                        });
                    });

                    var minX = d3.min(polygon, (d) => {
                        return d3.min(d, (e) => {
                            return e[1];
                        });
                    });

                    if (minY < globalMinY) globalMinY = minY;
                    if (maxY > globalMaxY) globalMaxY = maxY;
                    if (minX < globalMinX) globalMinX = minX;
                    if (maxX > globalMaxX) globalMaxX = maxX;
                }
            }
            return [globalMinY, globalMaxY, globalMinX, globalMaxX];
        },
    },
};
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
