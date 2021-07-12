<template>
  <div class="container">
    <div class="canvas" id="playground" />
  </div>
</template>

<script>
import * as THREE from "three";
import { Vector2, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as d3 from "d3";
import * as util from "../../util.js";

export default {
  props: {
    perimeterSample: Array,
    globalScale: Number
  },
  data: function() {
    return {
      scene: null,
      renderer: null,
      camera: null,
      canvas: null
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    // https://codepen.io/prisoner849/pen/pOPBYM
    generateTexture() {
      let perim = this.perimeterSample[2];
      let perimPowers = perim.powerData;

      let canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;

      // scale perim coords between canvas width and height
      let coordExtent = util.findCoordinateExtent(perimPowers);
      let minLong = coordExtent[0];
      let maxLong = coordExtent[1];
      let minLat = coordExtent[2];
      let maxLat = coordExtent[3];
      perimPowers.forEach(function(perimPower, i) {
        perimPower.longitude = Math.floor(
          ((perimPower.longitude - minLong) / (maxLong - minLong)) *
            canvas.width
        );
        perimPower.latitude = Math.floor(
          ((perimPower.latitude - minLat) / (maxLat - minLat)) * canvas.height
        );
        perimPowers[i] = perimPower;
      });

      let ctx = canvas.getContext("2d");
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 256, 256);

        perimPowers.forEach(perimPower => {
          let x = perimPower.longitude;
          let y = perimPower.latitude;
          let radius = perimPower.avg_power * 0.3;
          let grd = ctx.createRadialGradient(x, y, 1, x, y, radius);
          let h8 = perimPower.avg_power;

          console.log(perimPower.avg_power);

          grd.addColorStop(0, "rgb(" + h8 + "," + h8 + "," + h8 + ")");
          grd.addColorStop(1, "transparent");
          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, 256, 256);
        });

    //   for (let i = 0; i < 10; i++) {
    //     var x = Math.floor(Math.random() * 255);
    //     var y = Math.floor(Math.random() * 255);
    //     var radius = 50;
    //     var grd = ctx.createRadialGradient(x, y, 1, x, y, radius);
    //     var h8 = Math.floor(Math.random() * 255);
    //     grd.addColorStop(0, "rgb(" + h8 + "," + h8 + "," + h8 + ")");
    //     grd.addColorStop(1, "transparent");
    //     ctx.fillStyle = grd;
    //     ctx.fillRect(0, 0, 256, 256);
    //   }

      return new THREE.CanvasTexture(canvas);
    },
    init() {
      // container
      this.container = document.getElementById("playground");
      this.w = this.container.offsetWidth;
      this.h = this.container.offsetHeight;

      // renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.shadowMap.enabled = true;
      this.renderer.setSize(this.w, this.h);
      this.container.appendChild(this.renderer.domElement);

      // scene
      this.scene = new THREE.Scene();

      // cam & orbit control & grid helper
      this.camera = new THREE.PerspectiveCamera(40, this.w / this.h, 1, 1000);
      this.camera.position.set(0, 34, 55);
      this.camera.lookAt(this.scene.position);
      const controls = new OrbitControls(this.camera, this.renderer.domElement);
      controls.update();
      const gridHelper = new THREE.GridHelper(50, 25, 0x000040, 0x000040);

      // light
      let light = new THREE.PointLight(0xffffff, 1, 100);
      light.position.set(-5, 10, 10);
      light.castShadow = true;
      light.shadow.camera.near = 1;
      light.shadow.camera.far = 60;
      light.shadow.bias = -0.005; // reduces self-shadowing on double-sided objects

      // plane
      const planeGeometry = new THREE.PlaneBufferGeometry(50, 50, 1000, 1000);
      planeGeometry.rotateX(-Math.PI / 2);

      var heatmap = this.generateTexture();

      var heatVertex = `
            uniform sampler2D heightMap;
            uniform float heightRatio;
            varying vec2 vUv;
            varying float hValue;
            
            void main() {
                vUv = uv;
                vec3 pos = position;
                hValue = texture2D(heightMap, vUv).r;
                pos.y = hValue * heightRatio;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
            }
        `;

      var heatFragment = `
            varying float hValue;
            
            // honestly stolen from https://www.shadertoy.com/view/4dsSzr
            vec3 heatmapGradient(float t) {
                return clamp((pow(t, 1.5) * 0.8 + 0.2) * vec3(smoothstep(0.0, 0.35, t) + t * 0.5, smoothstep(0.5, 1.0, t), max(1.0 - t * 1.7, t * 7.0 - 6.0)), 0.0, 1.0);
            }

            void main() {
                float v = abs(hValue - 1.);
                gl_FragColor = vec4(heatmapGradient(hValue), 1. - v * v) ;
            }
        `;

      var planeMesh = new THREE.Mesh(
        planeGeometry,
        new THREE.ShaderMaterial({
          uniforms: {
            heightMap: { value: heatmap },
            heightRatio: { value: 1 }
          },

          vertexShader: heatVertex,

          fragmentShader: heatFragment,

          transparent: true
        })
      );

      // scene
      this.scene.add(planeMesh);
      this.scene.add(light);
      this.scene.add(gridHelper);

      this.animate();
    },
    animate() {
      requestAnimationFrame(this.animate);
      this.render();
    },
    render() {
      this.renderer.render(this.scene, this.camera);
    },
  }
};
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
