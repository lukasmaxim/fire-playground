import * as THREE from 'three'
import * as d3 from 'd3'

class Perimeter extends THREE.Group {

  constructor(config) {

    super()
    
    this.timescale = 3
    this.clock = new THREE.Clock()
    this.m_centroidCoords = config.centroid.coordinates
    this.m_date = new Date( config.perimeter_date )
    this.createMeshes( config.perimeter.coordinates )
    this.rotation.x = Math.PI/3
    this.mixer = new THREE.AnimationMixer( this )
    
    this.updateFocusAction()

    
    // // UNFOCUS ACTION
    // let xAxis = new THREE.Vector3( 1, 0, 0 )
    // let qInitial = new THREE.Quaternion().setFromAxisAngle( xAxis, this.rotation.x )
    // let qFinal = new THREE.Quaternion().setFromAxisAngle( xAxis, Math.PI/3 )

    // let rotKF = new THREE.QuaternionKeyframeTrack( '.quaternion', [0,1], [ qInitial.x, qInitial.y, qInitial.z, qInitial.w, qFinal.x, qFinal.y, qFinal.z, qFinal.z ] )

    // // create an animation sequence with the tracks
    // const focusClip = new THREE.AnimationClip( 'Action', 1, [ rotKF ] );

   

    
  }

  animate() {
    let delta = this.clock.getDelta()
    this.mixer.update( delta )
  }

  // overwrites Group's raycast
  raycast(raycaster, intersects) {

    for (const child of this.children) {

      let i = []
      child.raycast(raycaster, i)

      if (i.length > 0) {

        intersects.push(this)
        return
        
      }
    }
  }

  createMeshes(polygons) {

    for (const polygon of polygons) {

      var pts = this.calcLocalCoords(polygon[0])
      var shape = new THREE.Shape(pts)
      var shapeGeom = new THREE.ShapeGeometry(shape)
      var mat = new THREE.MeshLambertMaterial({ color: 0x00ff00, opacity: 1, transparent: false})
      var mesh = new THREE.Mesh(shapeGeom, mat)
      mesh.receiveShadow = true;
      mesh.castShadow = true;

      this.add(mesh)
    }

  }

  calcLocalCoords(polygon) {

    var pts = []

    // transform to origin
    polygon = d3.map(polygon, d => {
      return [d[0] - this.m_centroidCoords[0], d[1] - this.m_centroidCoords[1]]
    })

    // subtract min number
    var min = d3.min(polygon, d => {
      return d3.min(d)
    })
    polygon = d3.map(polygon, d => {
      return [d[0] - min, d[1] - min]
    })

    // divide by max and move by .5
    var max = d3.max(polygon, d => {
      return d3.max(d)
    })
    polygon = d3.map(polygon, d => {
      return [d[0] / max - 0.5, d[1] / max - 0.5]
    })

    for (const pt of polygon) {
      pts.push(new THREE.Vector2(pt[0], pt[1]))
    }

    return pts

  }

  focusPerimeter() {

    // console.log('focussing')

    this.focusAction.reset()
    this.focusAction.timeScale = this.timescale;
    this.focusAction.setLoop(THREE.LoopOnce);
    this.focusAction.clampWhenFinished = true;
    this.focusAction.play();

    // for (const child of this.children) {
    //   child.material.color = new THREE.Color(0x00ff00)
    // }

  }

  defocusPerimeter() {

    // console.log('unfocussing')

    this.focusAction.paused = false;
    this.focusAction.timeScale = -this.timescale;
    this.focusAction.setLoop(THREE.LoopOnce);      
    this.focusAction.play();

    // for (const child of this.children) {
    //   child.material.color = new THREE.Color(0x00ffff)
    // }

  }

  updateFocusAction() {
    // FOCUS ACTION
    let xAxis = new THREE.Vector3( 1, 0, 0 )
    let qInitial = new THREE.Quaternion().setFromAxisAngle( xAxis, this.rotation.x )
    let qFinal = new THREE.Quaternion().setFromAxisAngle( xAxis, 0 )

    let rotKF = new THREE.QuaternionKeyframeTrack( '.quaternion', [0,1], [ qInitial.x, qInitial.y, qInitial.z, qInitial.w, qFinal.x, qFinal.y, qFinal.z, qFinal.z ] )
    let positionKF = new THREE.VectorKeyframeTrack( '.position', [0,1], [ this.position.x, this.position.y, this.position.z, this.position.x, this.position.y, this.position.z+0.5] );


    // create an animation sequence with the tracks
    this.focusClip = new THREE.AnimationClip( 'Action', 1, [ rotKF, positionKF ] );
    this.focusAction = this.mixer.clipAction( this.focusClip )
  }

}
export default Perimeter