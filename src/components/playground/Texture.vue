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
        globalScale: Number,
        config: Object,
    },
    data: function () {
        return {
            scene: null,
            renderer: null,
            camera: null,
            canvas: null,
            centroidCoords: null,
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
            this.aspect = this.w / this.h;

            // renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.shadowMap.enabled = true;
            this.renderer.setSize(this.w, this.h);
            this.container.appendChild(this.renderer.domElement);

            // scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color("white")

            // cam & orbit control & grid helper
            this.camera = new THREE.PerspectiveCamera(
                60,
                this.aspect,
                0.01,
                1000
            );
            this.camera.position.setScalar(0.5);
            this.camera.lookAt(this.scene.position);
            const controls = new OrbitControls(
                this.camera,
                this.renderer.domElement
            );
            controls.update();
            const gridHelper = new THREE.GridHelper(50, 50, 0xffffff, 0xffffff);
            const axisHelper = new THREE.AxesHelper(5)
            this.scene.add(gridHelper);
            this.scene.add(axisHelper);

            let light;
            light = new THREE.DirectionalLight(0xffffff, 1.5);
            light.position.setScalar(100);
            light.shadow.camera.near = 0.001
            light.shadow.camera.far = 50
            light.shadow.mapSize.width = 4096 // default
            light.shadow.mapSize.height = 4096 // default
            light.shadow.camera.left = -40
            light.shadow.camera.right = 40
            light.shadow.camera.top = -40
            light.shadow.camera.bottom = 40
            light.castShadow = true
            light.shadow.bias = -0.01
            this.scene.add(light);
            this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

            // CUSTOM
            this.centroidCoords = new Vector2(
                this.config.centroid.coordinates[0],
                this.config.centroid.coordinates[1]
            );

            let texture = this.generateTexture();
            // let texture = this.generateTestTexture();
            // let texture = this.generateImgTexture();

            // imageTexture.wrapS = imageTexture.wrapT = THREE.RepeatWrapping;
            // texture.repeat.set(this.globalScale, this.globalScale);
            texture.repeat.set(10, 10);
            texture.offset.set(0.5, 0.5);

            let meshes = this.createMeshes(
                this.config.perimeter.coordinates,
                texture
            );

            this.scene.add(meshes);

            // const planeGeometry = new THREE.PlaneBufferGeometry(
            //     50,
            //     50,
            //     1000,
            //     1000
            // );
            // planeGeometry.rotateX(-Math.PI / 2);

            // let heatmap = this.generateTexture();

            // var planeMesh = new THREE.Mesh(
            //     planeGeometry,
            //     new THREE.ShaderMaterial({
            //         uniforms: {
            //             heightMap: { value: heatmap },
            //             heightRatio: { value: 1 },
            //         },

            //         vertexShader: this.getHeatVertexShader(),

            //         fragmentShader: this.getHeatFragmentShader(),

            //         transparent: true,
            //     })
            // );

            // this.scene.add(planeMesh);

            this.animate();
        },
        generateImgTexture() {
            return new THREE.TextureLoader().load(
                "https://live.staticflickr.com/3461/3368933347_380a739ddf_b.jpg"
            );
        },
        generateTestTexture() {
            let canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 256;
            let ctx = canvas.getContext("2d");
            ctx.fillStyle = "red";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        },
        createMeshes(polygons, texture) {
            let polygonGroup = new THREE.Group();
            for (const polygon of polygons) {
                var pts = this.getLocPointsFromPoly(polygon[0]);
                var shape = new THREE.Shape(pts);
                var shapeGeom = new THREE.ExtrudeGeometry(shape, {
                    depth: 0.001,
                    bevelEnabled: false,
                }); // note: depth is crucial for the polygons to cast shadows

                let material = new THREE.MeshToonMaterial({
                    color: 0x00b4cc,
                    map: texture,
                });

                var mesh = new THREE.Mesh(shapeGeom, material);
                mesh.rotateX(util.degToRad(-90));

                // mesh.receiveShadow = true;
                // mesh.castShadow = true;

                polygonGroup.add(mesh);
            }
            polygonGroup.scale.setScalar(this.globalScale);
            //polygonGroup.scale.setScalar(300);
            return polygonGroup;
        },
        getHeatVertexShader() {
            return `
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
        },
        getHeatFragmentShader() {
            return `
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
        },
        generateTexture() {
            let perim = this.perimeterSample[2];
            let perimPowers = perim.powerData;
            
            let canvas = document.createElement("canvas");
            canvas.width = 256;
            canvas.height = 256;

            let maxIntensity = Number.MIN_VALUE;

            // scale perim coords between canvas width and height
            // calculate max intensity value
            let coordExtent = util.findCoordinateExtent(perimPowers);
            let minLong = coordExtent[0];
            let maxLong = coordExtent[1];
            let minLat = coordExtent[2];
            let maxLat = coordExtent[3];
            perimPowers.forEach(function (perimPower, i) {
                perimPower.longitude = Math.floor(
                    ((perimPower.longitude - minLong) / (maxLong - minLong)) *
                        canvas.width
                );
                perimPower.latitude = Math.floor(
                    ((perimPower.latitude - minLat) / (maxLat - minLat)) *
                        canvas.height
                );
                perimPowers[i] = perimPower;

                if(perimPower.avg_power > maxIntensity)
                    maxIntensity = perimPower.avg_power;
            });

            let ctx = canvas.getContext("2d");
            ctx.fillStyle = "rgba(255,255,204)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            console.log(maxIntensity)

            perimPowers.forEach((perimPower) => {
                let x = perimPower.longitude;
                let y = perimPower.latitude;
                let radius = perimPower.avg_power * 0.2;
                let grd = ctx.createRadialGradient(x, y, 1, x, y, radius);
                let h8 = 255 * (perimPower.avg_power/maxIntensity);
                grd.addColorStop(0, `rgba( ${h8}, ${h8*0.3}, ${0}, 1)`);
                grd.addColorStop(0.5, `rgba( ${h8}, ${h8*0.5}, ${0}, 0.5)`);
                grd.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });

            return new THREE.CanvasTexture(canvas);
        },
        getLocPointsFromPoly(polygon) {
            var pts = [];

            // transform to origin
            let originPolygon = d3.map(polygon, (d) => {
                return [
                    d[0] - this.centroidCoords.x,
                    d[1] - this.centroidCoords.y,
                ];
            });

            // add x and y of a point to points array
            for (const pt of originPolygon) {
                pts.push(new THREE.Vector2(pt[0], pt[1]));
            }

            return pts;
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
