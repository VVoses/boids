import './style.css';
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {FlyControls} from 'three/examples/jsm/controls/FlyControls';


const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// The three.js scene: the 3D world where you put objects
const scene = new THREE.Scene();

// The camera
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000000
);

scene.add(camera)

const canvas = document.querySelector('.webgl');

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

renderer.setSize(sizes.width, sizes.height);
renderer.setClearColor('black', 1);

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

let boids = []
let prevBoids = []
for(let i = 0; i < 100; i++) {
  boids[i] = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshBasicMaterial({ color: 'white'}))
  boids[i].position.x = Math.random()
  boids[i].position.y = Math.random()
  boids[i].position.z = Math.random()
  boids[i].velocity = new THREE.Vector3(Math.random(), Math.random(), Math.random())
}

boids.forEach(boid => scene.add(boid))

camera.position.z = 10

function rule1(boid) {
  let vec = [0, 0, 0]
  boids.forEach(boid2 => {
    if (boid.uuid !== boid2.uuid) {
      vec[0] += boid2.position.x
      vec[1] += boid2.position.y
      vec[2] += boid2.position.z
    }
  })
  vec = vec
    .map(scalar => scalar/(boids.length-1))
  result = [
    vec[0] - boid.position.x,
    vec[1] - boid.position.y,
    vec[2] - boid.position.z
  ]
    .map(x => x/200)
  return result
}

function rule2(boid) {
  distance = 100
  let result = [0, 0, 0]
  boids.forEach(boid2 => {
    if (boid.uuid !== boid2.uuid) {
      if (boid.position.distanceTo(boid2.position) < distance) {
        result[0] -= (boid2.position.x - boid.position.x)
        result[1] -= (boid2.position.y - boid.position.y)
        result[2] -= (boid2.position.z - boid.position.z)
      }
    }
  })
  return result
}

function rule3(boid) {
  let vec = [0, 0, 0]
  let prev = []
  boids.forEach((boid2, idx) => {
    if (boid.uuid !== boid2.uuid) {
      vec[0] += boid2.velocity.x
      vec[1] += boid2.velocity.y
      vec[2] += boid2.velocity.z
    } else {
      prev = boid2
    }
  })
  vec = vec.map(scalar => scalar/(boids.length-1))
  result = [vec[0] - boid.velocity.x,
            vec[1] - boid.velocity.y,
            vec[2] - boid.velocity.z]
    .map(x => x/10)
  return vec
}

function magnitude(vector) {
  return Math.sqrt(vector[0]**2 + vector[1]**2 + vector[2]**2)
}

const maxSpeed = 0.33

const cameraOffset = new THREE.Vector3(1000, 1000, 1000)

const controls = new FlyControls(camera, canvas);
controls.enableDamping = true;

function render() {

  prevBoids = boids

  boids.forEach((boid, idx) => {

    vec1 = rule1(boid)
    vec2 = rule2(boid)
    vec3 = rule3(boid)

    const finalVec = [
      vec1[0] + vec2[0] + vec3[0],
      vec1[1] + vec2[1] + vec3[1],
      vec1[2] + vec2[2] + vec3[2]
    ]

    boid.velocity.x += magnitude(finalVec) < maxSpeed ? finalVec[0] : (finalVec[0] / magnitude(finalVec))*maxSpeed
    boid.velocity.y += magnitude(finalVec) < maxSpeed ? finalVec[1] : (finalVec[1] / magnitude(finalVec))*maxSpeed
    boid.velocity.z += magnitude(finalVec) < maxSpeed ? finalVec[2] : (finalVec[2] / magnitude(finalVec))*maxSpeed

    boid.position.x += boid.velocity.x
    boid.position.y += boid.velocity.y
    boid.position.z += boid.velocity.z
  })

  //const objectPosition = boids[99].getWorldPosition(new THREE.Vector3())
  //camera.position.copy(objectPosition).add(cameraOffset)

  controls.update()
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();
