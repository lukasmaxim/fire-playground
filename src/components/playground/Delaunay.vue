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
import Delaunator from "delaunator";

export default {
  props: {
    perimeterSample: Array,
    globalScale: Number,
    config: Object,
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
      this.camera = new THREE.PerspectiveCamera(60, 1, 1, 1000);
      this.camera.position.setScalar(150);
      this.camera.lookAt(this.scene.position);
      const controls = new OrbitControls(this.camera, this.renderer.domElement);
      controls.update();
      const gridHelper = new THREE.GridHelper(50, 25, 0x000040, 0x000040);
      this.scene.add(gridHelper);

      // light
      var light = new THREE.DirectionalLight(0xffffff, 1.5);
      light.position.setScalar(100);
      this.scene.add(light);
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

      // var size = { x: 200, z: 200 };
      // var pointsCount = 1000;
      // var points3d = [];
      // for (let i = 0; i < pointsCount; i++) {
      //   let x = THREE.Math.randFloatSpread(size.x);
      //   let z = THREE.Math.randFloatSpread(size.z);
      //   // let y = noise.perlin2(x / size.x * 5, z / size.z * 5) * 50;
      //   let y = Math.random((x / size.x) * 5, (z / size.z) * 5) * 50;
      //   points3d.push(new THREE.Vector3(x, y, z));
      // }

      var polygons = this.config.perimeter.coordinates;
      var points3d = this._getLocPointsFromPoly(polygons[0][0]);

      var geom = new THREE.BufferGeometry().setFromPoints(points3d);
      var cloud = new THREE.Points(
        geom,
        new THREE.PointsMaterial({ color: 0x99ccff, size: 2 })
      );
      this.scene.add(cloud);

      // triangulate x, z
      var indexDelaunay = Delaunator.from(
        points3d.map(v => {
          return [v.x, v.z];
        })
      );

      var meshIndex = []; // delaunay index => three.js index
      for (let i = 0; i < indexDelaunay.triangles.length; i++) {
        meshIndex.push(indexDelaunay.triangles[i]);
      }

      geom.setIndex(meshIndex); // add three.js index to the existing geometry
      geom.computeVertexNormals();
      var mesh = new THREE.Mesh(
        geom, // re-use the existing geometry
        new THREE.MeshLambertMaterial({ color: "purple", wireframe: true })
      );
      this.scene.add(mesh);

      this.animate();
    },
    animate() {
      requestAnimationFrame(this.animate);
      this.render();
    },
    render() {
      this.renderer.render(this.scene, this.camera);
    },
    _getLocPointsFromPoly(polygon) {
      var pts = [];

      // transform to origin
      let originPolygon = d3.map(polygon, d => {
        return [d[0] - this.config.centroid.coordinates[0], d[1] - this.config.centroid.coordinates[1]];
      });


      // add x and y of a point to points array
      for (const pt of originPolygon) {
        pts.push(new THREE.Vector3(pt[0]*500, 1, pt[1]*500));
      }

      return pts;
    }
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
