<template>
  <div>
    <div :id='`perimeter-container-${pid}`' class="canvas"/>
  </div>
</template>

<script>
import * as THREE from 'three'

export default {
  name: 'Perimeter',
  props: {
    pid: String,
    perimeterSample: Array
  },
  data: function() {
    return {
      renderer: null,
      scene: null,
      camera: null,
      cube: null,
      shapeGeom: null,
      mesh: null,
      mouse: new THREE.Vector2(1, 1),
      w: 0,
      h: 0,
      raycaster: null,
      mouseEntered: null,
    }
  },
  mounted() {
    this.init()
    this.animate()
  },
  methods: {
    init() {
      var container = document.getElementById(`perimeter-container-${this.pid}`)
      container.addEventListener('mouseenter', this.onMouseEnter, false)
      container.addEventListener('mouseout', this.onMouseOut, false)
      // TODO use innerwidth instead? 
      // ttps://jsfiddle.net/rpb2n7k8/
      this.w = container.offsetWidth
      this.h = container.offsetHeight
      //const aspect = this.w / this.h

      // raycaster & mouse
      this.raycaster = new THREE.Raycaster();

      // camera      
      // this.camera = new THREE.PerspectiveCamera( 75, aspect, 0.1, 1000 )
      this.camera = new THREE.PerspectiveCamera(75, container.offsetWidth/container.offsetHeight,0.1,1000)
      this.camera.position.z = 2

      // scene
      this.scene = new THREE.Scene()

      // renderer
      this.renderer = new THREE.WebGLRenderer({antialias: true})
      this.renderer.setSize( this.w, this.h )
      container.appendChild( this.renderer.domElement )
      
      // geometry

      // var pointLight = new THREE.PointLight(0xFFFFFF);
      // pointLight.position.x = 10;
      // pointLight.position.y = 50;
      // pointLight.position.z = 130;
  
      // this.scene.add(pointLight);

      var shapeGeom = this.createPolyGeom()
      const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } )

      this.mesh = new THREE.Mesh( shapeGeom, material ) ;
      this.mesh.rotation.x = 1.2

      this.scene.add( this.mesh )
    },
    animate() {

      // TODO use this instead? 
      // renderer.setAnimationLoop( animation );
      // https://github.com/mrdoob/three.js/tree/master

      requestAnimationFrame( this.animate )

      if(this.mouseEntered){
        this.focusPerimeter()
      }
      if(!this.mouseEntered){
        this.defocusPerimeter()
      }

      this.render()
    },
    render() {
      // this.raycaster.setFromCamera( this.mouse, this.camera )
      // var intersects = this.raycaster.intersectObjects( this.scene.children )

      // if(intersects.length > 0) {
      //   console.log(intersects[0])
      // }

      this.renderer.render( this.scene, this.camera )
    },
    onMouseEnter() {
      this.mouseEntered = true
    },
    onMouseOut() {
      this.mouseEntered = false
    },
    test() {
      event.preventDefault();
      this.mouse.x = (event.clientX / this.w) * 2 - 1;
      this.mouse.y = -(event.clientY / this.h) * 2 + 1;



      //this.mesh.rotation.x += 0.01
    },
    createPolyGeom() {
      var pts = []

      // this is the offset
      pts.push(new THREE.Vector2(0, 0))

      // triangle points
      this.perimeterSample.forEach(element => {
        pts.push(new THREE.Vector2(element[0], element[1]))
      });

      // pts.push(new THREE.Vector2(-5, -2));
      // pts.push(new THREE.Vector2(0, 2));
      // pts.push(new THREE.Vector2(5, -2));
      // pts.push(new THREE.Vector2(-5, -2));

      var shape = new THREE.Shape(pts)
      var shapeGeom = new THREE.ShapeGeometry(shape)

      return shapeGeom
    }
  }
}
</script>

<style scoped>
.canvas {
  background-color: grey;
  width: 100px;
  height: 100px;
  margin: 10px;
  position: static; /* fixed or static */
}
</style>