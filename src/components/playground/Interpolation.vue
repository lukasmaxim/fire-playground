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
    data: function () {
        return {
            scene: null,
            renderer: null,
            camera: null,
            canvas: null,
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
            this.camera = new THREE.PerspectiveCamera(
                60,
                this.w / this.h,
                1,
                1000
            );
            this.camera.position.setScalar(150);
            this.camera.lookAt(this.scene.position);
            const controls = new OrbitControls(
                this.camera,
                this.renderer.domElement
            );
            controls.update();
            const gridHelper = new THREE.GridHelper(50, 25, 0x000040, 0x000040);
            this.scene.add(gridHelper);

            let light;
            light = new THREE.DirectionalLight(0xffffff, 1.5);
            light.position.setScalar(100);
            this.scene.add(light);
            this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

            const geometry = new THREE.PlaneGeometry(50, 50, 2, 2);

            const count = geometry.attributes.position.count;
            geometry.setAttribute(
                "color",
                new THREE.BufferAttribute(new Float32Array(count * 3), 3)
            );

            const radius = 1;

            const color = new THREE.Color();
            const positions = geometry.attributes.position;
            const colors1 = geometry.attributes.color;

            color.setRGB(1,0,0);
            colors1.setXYZ(0, color.r, color.g, color.b);

            // for (let i = 0; i < count; i++) {
            //     // color.setHSL((positions1.getY(i) / radius + 1) / 2, 1.0, 0.5);
            //     // colors1.setXYZ(i, color.r, color.g, color.b);

            //     console.log("asdf")
            //     color.setHSL(0, positions.getY(i), 0.5);
            //     // color.setRGB(get, 1, 1);
            //     colors1.setXYZ(i, color.r, color.g, color.b);

            //     // color.setRGB(1, 0.8 - (positions3.getY(i) / radius + 1) / 2, 0);
            //     // colors3.setXYZ(i, color.r, color.g, color.b);
            // }

            // this material causes a mesh to use colors assigned to vertices
            const meshMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                flatShading: true,
                vertexColors: true,
                shininess: 0,
            });

            const wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0x000000,
                wireframe: true,
                transparent: true,
            });

            let wireframe = new THREE.Mesh(
                geometry,
                wireframeMaterial
            );
            let mesh = new THREE.Mesh(geometry, meshMaterial);
            mesh.add(wireframe);
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
    },
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
