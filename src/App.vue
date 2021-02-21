<template>
  <div id="app">
    <!-- <PerimeterTimeline :perimeterSample='this.points'/> -->
    <!-- <PerimeterTimelineSingleThree :perimeterSample='this.perimMeshes' :viewScale='this.viewScale'/> -->
    <ThreeJSPlayground/>
  </div>
</template>

<script>
import PerimeterTimelineSingleThree from './components/PerimeterTimelineSingleThree.vue'
import PerimeterTimeline from './components/PerimeterTimeline.vue'
import ThreeJSPlayground from './components/ThreeJSPlayground.vue'
import perimData from './test_perimeter.json'
import * as d3 from 'd3'
import Perimeter from './perimeter.js'

export default {
  name: 'App',
  components: {
    // PerimeterTimelineSingleThree,
    //PerimeterTimeline
    ThreeJSPlayground
  },
  computed: {
    perimMeshes() {
      // stores all temporally different perimeters of a singular fire
      let firePerims = []

      let perimEntries = perimData.data.fire_perimeter

      // let globalMin = this.findGlobalMin(perimEntries)
      let globalMax = this.findGlobalMax(perimEntries)

      for(let perimEntry of perimEntries)
      {
        var perim = new Perimeter(perimEntry)
        firePerims.push(perim)
      }

      return firePerims
    },
    viewScale() {
      let globalMax = this.findGlobalMax(perimData.data.fire_perimeter)
      return 1/(globalMax*5)
    }
  },
  mounted() {
    // console.log(this.meshes)
  },
  methods: {
    findGlobalMin(perimEntries) {
      let globalMin = Infinity

      for(let perimEntry of perimEntries)
      {
        let polygons = perimEntry.perimeter.coordinates

        for (let polygon of polygons){
          
          var min = d3.min(polygon, d => {
            return d3.min(d)
          })
          if(min < globalMin)
            globalMin = min
        }
      }
      return globalMin
    },
    findGlobalMax(perimEntries) {
      let globalMax = Number.MIN_VALUE

      for(let perimEntry of perimEntries)
      {
        let polygons = perimEntry.perimeter.coordinates
        let centroid = perimEntry.centroid.coordinates
        for (let polygon of polygons){
          
          var max = d3.max(polygon, d => {
            return d3.max(d, e => {
              return e[0] - centroid[0]
            })
          })
          if(max > globalMax)
            globalMax = max
        }
      }
      return globalMax
    }
  }
}
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
