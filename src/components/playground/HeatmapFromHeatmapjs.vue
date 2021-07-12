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
import * as heatmap from 'heatmap.js';

export default {
    props: {
        perimeterSample: Array,
        globalScale: Number,
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
            });

            let ctx = canvas.getContext("2d");
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, 256, 256);

            perimPowers.forEach((perimPower) => {
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
            console.log(heatmap)

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
                40,
                this.w / this.h,
                1,
                1000
            );
            this.camera.position.set(0, 34, 55);
            this.camera.lookAt(this.scene.position);
            const controls = new OrbitControls(
                this.camera,
                this.renderer.domElement
            );
            controls.update();
            const gridHelper = new THREE.GridHelper(50, 25, 0x000040, 0x000040);

            // light
            let light = new THREE.PointLight(0xffffff, 1, 100);
            light.position.set(-5, 10, 10);
            light.castShadow = true;
            light.shadow.camera.near = 1;
            light.shadow.camera.far = 60;
            light.shadow.bias = -0.005; // reduces self-shadowing on double-sided objects

            let texture = new THREE.TextureLoader().load(this.createHeatmap());
            let grayTexture = new THREE.TextureLoader().load(this.createHeatmap({}));

            let w, h = 500

            let geometry = new THREE.PlaneBufferGeometry(w, h, 500, 500);

            var vertexShader = `
                varying vec2 v_uv;
                uniform sampler2D grayTexture;
                attribute float ran;
                void main() 
                {
                vec4 color = texture2D(grayTexture, uv);
                v_uv = uv;
                gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position[0], position[1], -color.a * 3000.0 ,1.0); 
                }
            `;

            var fragmentShader = `
                varying vec2 v_uv;
                uniform sampler2D texture;
                void main()
                {
                vec4 color = texture2D(texture, v_uv);
                if(color.a == 0.0) {
                    discard;
                }
                else {
                    gl_FragColor = vec4(color.r, color.g, color.b, color.a);
                }
                }
            `;

            let material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    texture: { value: texture },
                    grayTexture: { value: grayTexture },
                },
                side: THREE.DoubleSide,
                transparent: true,
                wireframe: true,
            });

            var mesh = new THREE.Mesh(geometry, material);

            // scene
            this.scene.add(mesh);
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
        createHeatmap(gradient) {
            let container = document.getElementById("playground");
            var div = document.createElement("div");

            var heatmap = gradient
                ? heatmap.create({
                      container: div,
                      width: size,
                      height: size,
                      radius: 20,
                      gradient,
                  })
                : heatmap.create({
                      container: div,
                      width: size,
                      height: size,
                      radius: 20,
                  });

            let coords = data.map((_) => {
                let coord = map
                    .coordinateToContainerPoint({
                        x: _.lng,
                        y: _.lat,
                    })
                    .round();
                coord.value = _.count;

                return {
                    x: coord.x,
                    y: size - coord.y,
                    value: coord.value,
                };
            });

            heatmap.setData({
                max: 100,
                data: coords,
            });

            let canvas = div.getElementsByTagName("canvas")[0];
            return canvas.toDataURL();
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
