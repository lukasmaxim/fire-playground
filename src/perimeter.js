import * as THREE from "three";
import * as d3 from "d3";
import * as util from "./util.js";

class Perimeter extends THREE.Group {
  constructor(config) {
    super();

    this.timescale = 3;
    this.clock = new THREE.Clock();
    this.centroidCoords = config.centroid.coordinates;
    this.date = new Date(config.perimeter_date);
    this.acres = config.acres;
    this.perimCoords = config.perimeter.coordinates

    // rotation, thickness, shadows, material
    this.rotation.x = util.degToRad(10);
    this.thickness = 0.1;
    this.highlightColor = 0x00e1ff;
    // this.receiveShadow = true
    // this.castShadow = true
    this.material = new THREE.MeshToonMaterial({
      color: 0x00ff00
    });

    // animation variables
    this.moveTowardsValue = 0.5;

    this.mixer = new THREE.AnimationMixer(this);

    this.updateFocusAction();
  }

  init()
  {
    this._createMeshes(this.perimCoords);
  }

  setPowerData(powerData) {
    this.powerData = powerData;
  }

  focusPerimeter() {
    this.focusAction.reset();
    this.focusAction.timeScale = this.timescale;
    this.focusAction.setLoop(THREE.LoopOnce);
    this.focusAction.clampWhenFinished = true;
    this.focusAction.play();

    // for (const child of this.children) {
    //   child.material.color = new THREE.Color(0x00ff00)
    // }
  }

  defocusPerimeter() {
    this.focusAction.paused = false;
    this.focusAction.timeScale = -this.timescale;
    this.focusAction.setLoop(THREE.LoopOnce);
    this.focusAction.play();

    // for (const child of this.children) {
    //   child.material.color = new THREE.Color(0x00ffff)
    // }
  }

  animate() {
    let delta = this.clock.getDelta();
    this.mixer.update(delta);
  }

  // overwrites Group's raycast
  _raycast(raycaster, intersects) {
    for (const child of this.children) {
      let i = [];
      child._raycast(raycaster, i);

      if (i.length > 0) {
        intersects.push(this);
        return;
      }
    }
  }

  // creates meshes from each of the polygons given, then adds
  // these meshes to the group which this class extends
  _createMeshes(polygons) {
    for (const polygon of polygons) {
    //   var pts = this._getLocPointsFromPoly(polygon[0]);
    //   var shape = new THREE.Shape(pts);
    //   var shapeGeom = new THREE.ExtrudeGeometry(shape, {
    //     depth: this.thickness,
    //     bevelEnabled: false
    //   }); // note: depth is crucial for the polygons to cast shadows

    //   var mesh = new THREE.Mesh( shapeGeom, this.material );
    // //   mesh.receiveShadow = true;
    // //   mesh.castShadow = true;

    //   console.log(pts)

    var pts = this._getLocPointsFromPoly(polygon[0])
    var shape = new THREE.Shape(pts)
    var shapeGeom = new THREE.ShapeGeometry(shape)
    var mat = new THREE.MeshLambertMaterial({ color: 0x00ff00, opacity: 0, transparent: false})
    var mesh = new THREE.Mesh(shapeGeom, mat)
    mesh.receiveShadow = true;
    mesh.castShadow = true;


      this.add(mesh);

    //   var heatmap = this._generateTexture();

    //   var heatVertex = `
    //         uniform sampler2D heightMap;
    //         uniform float heightRatio;
    //         varying vec2 vUv;
    //         varying float hValue;
            
    //         void main() {
    //             vUv = uv;
    //             vec3 pos = position;
    //             hValue = texture2D(heightMap, vUv).r;
    //             pos.y = hValue * heightRatio;
    //             gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
    //         }
    //     `;

    //   var heatFragment = `
    //         varying float hValue;
            
    //         // honestly stolen from https://www.shadertoy.com/view/4dsSzr
    //         vec3 heatmapGradient(float t) {
    //             return clamp((pow(t, 1.5) * 0.8 + 0.2) * vec3(smoothstep(0.0, 0.35, t) + t * 0.5, smoothstep(0.5, 1.0, t), max(1.0 - t * 1.7, t * 7.0 - 6.0)), 0.0, 1.0);
    //         }

    //         void main() {
    //             float v = abs(hValue - 1.);
    //             gl_FragColor = vec4(heatmapGradient(hValue), 1. - v * v) ;
    //         }
    //     `;

    //   var planeMesh = new THREE.Mesh(
    //     shapeGeom,
    //     new THREE.ShaderMaterial({
    //       uniforms: {
    //         heightMap: { value: heatmap },
    //         heightRatio: { value: 1 }
    //       },

    //       vertexShader: heatVertex,

    //       fragmentShader: heatFragment,

    //       transparent: false
    //     })
    //   );

    //   this.add(planeMesh)
    }
  }

  // takes a polygon, translates it into the origin and returns an array of
  // Vector2 points for each point in the translated array
  _getLocPointsFromPoly(polygon) {
    var pts = [];

    // transform to origin
    let originPolygon = d3.map(polygon, d => {
      return [d[0] - this.centroidCoords[0], d[1] - this.centroidCoords[1]];
    });

    // add x and y of a point to points array
    for (const pt of originPolygon) {
      pts.push(new THREE.Vector2(pt[0], pt[1]));
    }

    return pts;
  }

  updateFocusAction() {
    // define axis, initial and final quarternion
    let xAxis = new THREE.Vector3(1, 0, 0);
    let qInitial = new THREE.Quaternion().setFromAxisAngle(
      xAxis,
      this.rotation.x
    );
    let qFinal = new THREE.Quaternion().setFromAxisAngle(xAxis, 0);

    // define keyframes
    let rotKF = new THREE.QuaternionKeyframeTrack(
      ".quaternion",
      [0, 1],
      [
        qInitial.x,
        qInitial.y,
        qInitial.z,
        qInitial.w,
        qFinal.x,
        qFinal.y,
        qFinal.z,
        qFinal.z
      ]
    );
    let positionKF = new THREE.VectorKeyframeTrack(
      ".position",
      [0, 1],
      [
        this.position.x,
        this.position.y,
        this.position.z,
        this.position.x,
        this.position.y,
        this.position.z + this.moveTowardsValue
      ]
    );

    // create an animation sequence with the tracks
    this.focusClip = new THREE.AnimationClip("Action", 1, [rotKF, positionKF]);
    this.focusAction = this.mixer.clipAction(this.focusClip);
  }

  _generateTexture() {
    let perimPowers = this.powerData;

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
        ((perimPower.longitude - minLong) / (maxLong - minLong)) * canvas.width
      );
      perimPower.latitude = Math.floor(
        ((perimPower.latitude - minLat) / (maxLat - minLat)) * canvas.height
      );
      perimPowers[i] = perimPower;
    });

    let ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 256, 256);

    // perimPowers.forEach(perimPower => {
    //   let x = perimPower.longitude;
    //   let y = perimPower.latitude;
    //   let radius = perimPower.avg_power * 0.3;
    //   let grd = ctx.createRadialGradient(x, y, 1, x, y, radius);
    //   let h8 = perimPower.avg_power;

    //   console.log(perimPower.avg_power);

    //   grd.addColorStop(0, "rgb(" + h8 + "," + h8 + "," + h8 + ")");
    //   grd.addColorStop(1, "transparent");
    //   ctx.fillStyle = grd;
    //   ctx.fillRect(0, 0, 256, 256);
    // });

      for (let i = 0; i < 100; i++) {
        var x = Math.floor(Math.random() * 255);
        var y = Math.floor(Math.random() * 255);
        var radius = 50;
        var grd = ctx.createRadialGradient(x, y, 1, x, y, radius);
        var h8 = Math.floor(Math.random() * 255);
        grd.addColorStop(0, "rgb(" + h8 + "," + h8 + "," + h8 + ")");
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 256, 256);
      }

    return new THREE.CanvasTexture(canvas);
  }
}
export default Perimeter;
