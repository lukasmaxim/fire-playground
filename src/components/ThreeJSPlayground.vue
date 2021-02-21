<template>
  <div class="container">
    <div class="canvas" id="threejsplayground"/>
  </div>
</template>

<script>
import * as THREE from 'three'

export default {
  data: function() {
    return {
      scene: null,
      renderer: null,
      camera: null,
      mixer: null,
      clock: null,
    }
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {

      this.clock = new THREE.Clock()

      // container
      var container = document.getElementById("threejsplayground")
      container.addEventListener('mousemove', this.onMouseMove, false)
      this.w = container.offsetWidth
      this.h = container.offsetHeight

      this.scene = new THREE.Scene()

      // light
      let light = new THREE.PointLight( 0xffffff, 1, 100 )
      light.position.set(0, 1, 10)
      light.castShadow = true
      light.shadow.camera.near = 1;
      light.shadow.camera.far = 60;
      light.shadow.bias = - 0.005; // reduces self-shadowing on double-sided objects

      // cam
      this.camera = new THREE.PerspectiveCamera( 40, this.w / this.h, 1, 1000 );
      this.camera.position.set( 25, 25, 50 );
      this.camera.lookAt( this.scene.position );

      // cube
      const cubeGeometry = new THREE.BoxGeometry( 5, 5, 5 );
      const cubeMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00, transparent: true } );
      const cubeMesh = new THREE.Mesh( cubeGeometry, cubeMaterial );
      light.add(cubeMesh)

      // plane
      const planeGeometry = new THREE.PlaneGeometry(50, 50)
      const planeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) 
      const planeMesh = new THREE.Mesh( planeGeometry, planeMaterial )
      planeMesh.translateY(-2.5)
      planeMesh.rotateX(-Math.PI/2)
      light.add(planeMesh)

      // scene
      this.scene.add( cubeMesh )
      this.scene.add( planeMesh )
      this.scene.add( light )

      // renderer
      this.renderer = new THREE.WebGLRenderer({antialias: true})
      this.renderer.shadowMap.enabled = true
			this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.renderer.setSize( this.w, this.h )
      container.appendChild( this.renderer.domElement )

      this.animate()
    },
    animate() {

      requestAnimationFrame( this.animate )
      this.render()

    },
    render() {

      const delta = this.clock.getDelta();

      if ( this.mixer ) {

        //this.mixer.update( delta );

      }

      this.renderer.render( this.scene, this.camera );

    }
  }
}
</script>

<style>
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