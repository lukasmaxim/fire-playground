<template>
  <div class="container">
    <div :id='`perimeter-container-${pid}`' class="canvas"/>
  </div>
</template>

<script>
import * as THREE from 'three'
import * as d3 from 'd3'
import Stats from 'stats.js'

export default {
  name: 'PerimeterTimelineSingleThree',
  props: {
    pid: String,
    perimeterSample: Array,
    viewScale: Number
  },
  data: function() {
    return {
      renderer: null,
      scene: null,
      camera: null,
      dirLight: null,
      clock: new THREE.Clock(),
      cube: null,
      shapeGeom: null,
      mesh: null,
      mouse: new THREE.Vector2(-0, 0),
      w: 0,
      h: 0,
      raycaster: new THREE.Raycaster(),
      hasFocus: false,
      stats: null,
      oldIntersects: [],
      hoveredPerimeter: null,
      yScaleFactor: 10,
      camFrustrumVert: 1
    }
  },
  mounted() {
    this.init()
    this.animate()
  },
  methods: {
    init() {
      var container = document.getElementById(`perimeter-container-${this.pid}`)
      container.addEventListener('mousemove', this.onMouseMove, false)
      container.addEventListener('mouseout', this.onMouseOut, false)
      container.addEventListener('mouseenter', this.onMouseEnter, false)
      this.w = container.offsetWidth
      this.h = container.offsetHeight
      const aspect = this.w / this.h

      // camera      
      // this.camera = new THREE.PerspectiveCamera( 75, aspect, 0.1, 1000 )
      this.camera = new THREE.OrthographicCamera( -this.camFrustrumVert*aspect, this.camFrustrumVert*aspect, this.camFrustrumVert, -this.camFrustrumVert, 0.1, 2000 )
      this.camera.position.z = 1
      this.camera.position.y = 0

      // scene
      this.scene = new THREE.Scene()
      this.scene.add(this.camera)

      // stats
      this.stats = this.createStats()

      // renderer
      this.renderer = new THREE.WebGLRenderer({antialias: true})
      this.renderer.setSize( this.w, this.h )
      container.appendChild( this.renderer.domElement )
      container.appendChild( this.stats.domElement )
      
      this.dirLight = new THREE.DirectionalLight(0xFFFFFF);
      this.dirLight.intensity = 1;
      this.dirLight.position.x = 0;
      this.dirLight.position.y = this.camera.position.y;
      this.dirLight.position.z = 10;
      this.dirLight.shadow.camera.near = 0.1
      this.dirLight.shadow.camera.far = 2000
      // this.dirLight.shadow.camera.left = -2
      // this.dirLight.shadow.camera.right = 2
      // this.dirLight.shadow.camera.top = 5
      // this.dirLight.shadow.camera.bottom = 0
      this.dirLight.castShadow = true
      this.dirLight.shadow.mapSize.width = 512
      this.dirLight.shadow.mapSize.height = 512


      this.scene.add(this.dirLight);

      let timespan = d3.extent(this.perimeterSample, d => {
        return d.m_date.getTime()
      })
      for(const perimeter of this.perimeterSample)
      {
        perimeter.scale.set(this.viewScale, this.viewScale, this.viewScale)

        let normTimestamp = (perimeter.m_date.getTime() - timespan[0]) / (timespan[1] - timespan[0]) * 2 - 1
        perimeter.position.set(0, normTimestamp * 5, 0)
        perimeter.updateFocusAction()

        this.scene.add( perimeter )
      }

      this.animate()
    },
    updateScroll() {
      this.camera.translateY(this.mouse.y*1.5*this.clock.getDelta())
    },
    animate() {
      requestAnimationFrame( this.animate )


      for (const perimeter of this.perimeterSample) {
        perimeter.animate()  
      }

      // Check if we need to scroll and scroll accordingly
      if (this.hasFocus) {
        this.updateScroll()
      }

      this.render()
    },
    render() {
      this.stats.update()
      this.renderer.render( this.scene, this.camera )
    },
    onMouseEnter(event) {
      this.hasFocus = true
      this.onMouseMove(event)
    },
    onMouseOut() {
      this.hasFocus = false
      if (this.hoveredPerimeter != null)
        this.hoveredPerimeter.defocusPerimeter()
    },
    onMouseMove(event) {
      var rect = event.target.getBoundingClientRect();
      //TODO Fix x calculation
      this.mouse.x = ((event.clientX - rect.left) / this.w) * 2 - 1; 
      this.mouse.y = - (((event.clientY - rect.top) / this.h)*this.camFrustrumVert*2-this.camFrustrumVert); 

      let cp = this.closestPerimeter(this.mouse.y)


      if (this.hoveredPerimeter != cp) {


        this.hoveredPerimeter = cp
        cp.focusPerimeter()

      }

      for (const perimeter of this.perimeterSample) {
        if (perimeter == this.hoveredPerimeter)
          continue
        
        perimeter.defocusPerimeter()
      }

    },
    createStats() {
      var stats = new Stats()
      
      stats.setMode(0);

      stats.domElement.style.position = 'absolute';
      stats.domElement.style.left = '0';
      stats.domElement.style.top = '0';

      return stats;
    },
    closestPerimeter(y) {
      return this.perimeterSample.reduce((prev, curr) => {
        return Math.abs(curr.position.y - y - this.camera.position.y) < Math.abs(prev.position.y - y - this.camera.position.y) ? curr : prev
      })
    }
  }
}
</script>

<style scoped>
.canvas {
  background-color: grey;
  width: 500px;
  height: 1000px;
  margin: 10px;
  position: static; /* fixed or static */
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: grey;
  height: 1000px;
  width: 500px;
}
</style>