<template>
    <div class="container">
        <div :id="`perimeter-container-${pid}`" class="canvas" />
    </div>
</template>

<script>
import * as THREE from "three";
import * as d3 from "d3";
import Stats from "stats.js";
import * as util from "../util.js";

export default {
    name: "PerimeterTimeline",
    props: {
        pid: String,
        perimeterSample: Array,
        globalScale: Number,
    },
    data: function () {
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
            aspect: 0,
            raycaster: new THREE.Raycaster(),
            hasFocus: false,
            stats: null,
            oldIntersects: [],
            hoveredPerimeter: null,
            camFrustrumVert: 1,
        };
    },
    mounted() {
        this.init();
    },
    methods: {
        init() {
            var container = document.getElementById(
                `perimeter-container-${this.pid}`
            );
            // TODO reenable
            container.addEventListener("mousemove", this.onMouseMove, false);
            container.addEventListener("mouseout", this.onMouseOut, false);
            container.addEventListener("mouseenter", this.onMouseEnter, false);
            this.w = container.offsetWidth;
            this.h = container.offsetHeight;
            this.aspect = this.w / this.h;
            const yScaleFactor = 10;

            // scene
            const scene = new THREE.Scene();
            scene.background = 0xffffff;
            // scene.background = 0xff00ff
            this.scene = scene;

            // stats
            this.stats = this.createStats();

            // orthographic camera
            let orthoCam = new THREE.OrthographicCamera(
                -this.camFrustrumVert * this.aspect,
                this.camFrustrumVert * this.aspect,
                this.camFrustrumVert,
                -this.camFrustrumVert,
                0.1,
                1000
            );
            // TODO delete
            orthoCam.position.y = 2;
            orthoCam.zoom = 0.1;
            orthoCam.position.z = 10;
            orthoCam.updateProjectionMatrix();
            orthoCam.rotation.x = util.degToRad(-20);
            this.camera = orthoCam;

            // perspective camera
            //   let perspCam = new THREE.PerspectiveCamera( 75, this.aspect, 0.1, 1000 )
            //   perspCam.position.z = 10
            //   perspCam.rotation.x = util.degToRad(-30)
            //   this.camera = perspCam

            this.scene.add(this.camera);

            // renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(this.w, this.h);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.shadowMap.renderReverseSided = false;
            this.renderer.shadowMap.renderSingleSided = false;
            container.appendChild(this.renderer.domElement);
            container.appendChild(this.stats.domElement);

            // hull light
            let hemLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
            hemLight.position.set(0, 15, 5);
            // this.scene.add(hemLight)

            // directional light
            this.dirLight = new THREE.DirectionalLight(0xffffff, 1);
            this.dirLight.position.x = 0;
            this.dirLight.position.y = this.camera.position.y;
            this.dirLight.position.z = 10;
            this.dirLight.shadow.camera.near = 0.001;
            this.dirLight.shadow.camera.far = 50;
            this.dirLight.shadow.mapSize.width = 4096;
            this.dirLight.shadow.mapSize.height = 4096;
            this.dirLight.shadow.camera.left = -40;
            this.dirLight.shadow.camera.right = 40;
            this.dirLight.shadow.camera.top = -40;
            this.dirLight.shadow.camera.bottom = 40;
            this.dirLight.castShadow = true;
            this.dirLight.shadow.bias = -0.01;

            // const geometry = new THREE.BoxGeometry(1, 1, 1);
            // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            // const cube = new THREE.Mesh(geometry, material);
            // cube.castShadow=true;
            // cube.receiveShadow=true;
            // this.scene.add(cube);

            this.scene.add(this.dirLight);
            // this.scene.add(new THREE.PointLightHelper(this.dirLight, 1));
            // this.scene.add(
            //     new THREE.CameraHelper(this.dirLight.shadow.camera, 1)
            // );

            let timespan = d3.extent(this.perimeterSample, (d) => {
                return d.date.getTime();
            });
            for (const perimeter of this.perimeterSample) {
                perimeter.scale.setScalar(
                    this.globalScale
                );

                let normTimestamp =
                    ((perimeter.date.getTime() - timespan[0]) /
                        (timespan[1] - timespan[0])) *
                        2 -
                    1;
                let yPos = normTimestamp * yScaleFactor;

                console.log(yPos);

                perimeter.position.set(0, yPos, 0);
                perimeter.updateFocusAction();

                this.scene.add(perimeter);
            }

            this.animate();
        },
        updateScroll() {
            // const rot1 = new THREE.Matrix4().makeRotationX(util.degToRad(-45))
            const speedFactor = Math.abs(this.mouse.y) * 5 + 1;
            const trans = new THREE.Matrix4().makeTranslation(
                0,
                this.mouse.y * speedFactor * this.clock.getDelta(),
                0
            );
            // const rot2 = new THREE.Matrix4().makeRotationX(util.degToRad(45))
            // const mt = rot2.multiply(trans.multiply(rot1))

            // rest area in the middle of the screen
            if (Math.abs(this.mouse.y) > 0.2) this.camera.applyMatrix4(trans);
            // this.dirLight.applyMatrix4(trans)
        },
        animate() {
            requestAnimationFrame(this.animate);

            for (const perimeter of this.perimeterSample) {
                perimeter.animate();
            }

            // Check if we need to scroll and scroll accordingly
            if (this.hasFocus) {
                this.updateScroll();
            }

            this.render();
        },
        render() {
            this.stats.update();
            this.renderer.render(this.scene, this.camera);
        },
        onMouseEnter(event) {
            this.hasFocus = true;
            this.onMouseMove(event);
        },
        onMouseOut() {
            this.hasFocus = false;
            if (this.hoveredPerimeter != null)
                this.hoveredPerimeter.defocusPerimeter();
        },
        onMouseMove(event) {
            var rect = event.target.getBoundingClientRect();
            this.mouse.x =
                (((event.clientX - rect.left) / this.w) *
                    this.camFrustrumVert *
                    this.aspect -
                    this.camFrustrumVert * this.aspect) *
                    4 +
                1;
            this.mouse.y = -(
                ((event.clientY - rect.top) / this.h) *
                    this.camFrustrumVert *
                    2 -
                this.camFrustrumVert
            );

            let mouse = new THREE.Vector2(this.mouse.x, this.mouse.y);

            // TODO renable

            // this.raycaster.setFromCamera(mouse, this.camera);
            // var intersects = this.raycaster.intersectObjects(
            //     this.scene.children,
            //     true
            // );

            // if (intersects.length != 0) {
            //     let parameter = intersects[0].object.parent;

            //     if (parameter != this.hoveredPerimeter) {
            //         this.hoveredPerimeter = parameter;
            //         parameter.focusPerimeter();
            //         console.log(
            //             "date: " +
            //                 parameter.date +
            //                 ", acres: " +
            //                 parameter.acres
            //         );
            //     }
            // }

            // var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0);
            // var projector = new THREE.Projector();
            // projector.unprojectVector(vector, this.camera);

            // let cp = this.closestPerimeter(this.mouse.y)

            // if (this.hoveredPerimeter != cp) {

            //   this.hoveredPerimeter = cp
            //   cp.focusPerimeter()

            // }

            // TODO renanble
            // for (const perimeter of this.perimeterSample) {
            //     if (perimeter == this.hoveredPerimeter) continue;

            //     perimeter.defocusPerimeter();
            // }
        },
        createStats() {
            var stats = new Stats();

            stats.setMode(0);

            stats.domElement.style.position = "absolute";
            stats.domElement.style.left = "0";
            stats.domElement.style.top = "0";

            return stats;
        },
        closestPerimeter(y) {
            return this.perimeterSample.reduce((prev, curr) => {
                return Math.abs(curr.position.y - y - this.camera.position.y) <
                    Math.abs(prev.position.y - y - this.camera.position.y)
                    ? curr
                    : prev;
            });
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