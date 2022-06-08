import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "lil-gui";

const gui = new dat.GUI();

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000000
);

let boids = [];
let prevBoids = [];

const canvas = document.querySelector(".webgl");

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

renderer.setSize(sizes.width, sizes.height);
renderer.setClearColor("black", 1);

const colors = ["yellow", "red", "blue", "orange", "indigo", "purple", "green"];

function getRandomPosition() {
  return Math.random() > 0.6 ? Math.random() * 1000 : Math.random() * -1000;
}

function createBoid() {
  const seed = Math.random();
  const newBoid = new THREE.Mesh(
    new THREE.SphereGeometry(Math.floor(seed * 10)),
    new THREE.MeshBasicMaterial({
      color: colors[Math.floor(seed * colors.length)],
    })
  );
  newBoid.position.x = getRandomPosition();
  newBoid.position.y = getRandomPosition();
  newBoid.position.z = getRandomPosition();
  newBoid.velocity = new THREE.Vector3(
    ...new Array(3).map(() => Math.random())
  );
  return newBoid;
}

function setupBoids() {
  for (let i = 0; i < 20; i++) {
    const newBoid = createBoid();
    boids[i] = newBoid;
  }
  boids.forEach((boid) => scene.add(boid));
}

function moveToCenter(boid, sight, factor) {
  let vec = [0, 0, 0];
  boids.forEach((boid2) => {
    if (boid.uuid !== boid2.uuid) {
      if (boid.position.distanceTo(boid2.position) < sight) {
        vec[0] += boid2.position.x;
        vec[1] += boid2.position.y;
        vec[2] += boid2.position.z;
      }
    }
  });
  vec = vec.map((scalar) => scalar / (boids.length - 1));
  return [
    vec[0] - boid.position.x,
    vec[1] - boid.position.y,
    vec[2] - boid.position.z,
  ].map((x) => x / factor);
}

function avoidOtherBoids(boid, distance) {
  let result = [0, 0, 0];
  boids.forEach((boid2) => {
    if (boid.uuid !== boid2.uuid) {
      if (boid.position.distanceTo(boid2.position) < distance) {
        result[0] -= boid2.position.x - boid.position.x;
        result[1] -= boid2.position.y - boid.position.y;
        result[2] -= boid2.position.z - boid.position.z;
      }
    }
  });
  return result;
}

function matchVelocity(boid, factor) {
  let vec = [0, 0, 0];
  boids.forEach((boid2, idx) => {
    if (boid.uuid !== boid2.uuid) {
      vec[0] += boid2.velocity.x;
      vec[1] += boid2.velocity.y;
      vec[2] += boid2.velocity.z;
    }
  });
  vec = vec.map((scalar) => scalar / (boids.length - 1));

  return [
    vec[0] - boid.velocity.x,
    vec[1] - boid.velocity.y,
    vec[2] - boid.velocity.z,
  ].map((x) => x / factor);
}

function stayWithinBounds(boid, boundingBoxSize) {
  const halfBoundsSize = boundingBoxSize / 2;
  const positiveBounds = new THREE.Vector3(
    halfBoundsSize,
    halfBoundsSize,
    halfBoundsSize
  );
  const negativeBounds = new THREE.Vector3(
    -halfBoundsSize,
    -halfBoundsSize,
    -halfBoundsSize
  );

  const turnFactor = 0.1;
  let vec = [0, 0, 0];

  if (boid.position.x > positiveBounds.x) {
    vec[0] -= turnFactor;
  }

  if (boid.position.y > positiveBounds.y) {
    vec[1] -= turnFactor;
  }

  if (boid.position.z > positiveBounds.z) {
    vec[2] -= turnFactor;
  }

  if (boid.position.x < negativeBounds.x) {
    vec[0] += turnFactor;
  }

  if (boid.position.y < negativeBounds.y) {
    vec[1] += turnFactor;
  }

  if (boid.position.z < negativeBounds.z) {
    vec[2] += turnFactor;
  }
  return vec;
}

function magnitude(vector) {
  return Math.sqrt(vector[0] ** 2 + vector[1] ** 2 + vector[2] ** 2);
}

function getVelocity(vector, scalar) {
  return magnitude(vector) < params.maxSpeed
    ? scalar
    : (scalar / magnitude(vector)) * params.maxSpeed;
}

const params = {
  matchVelocityFactor: 8,
  cohesionFactor: 100,
  distance: 100,
  boundingBoxSize: 500,
  sight: 125,
  maxSpeed: 0.1,
};

gui.add(params, "matchVelocityFactor").max(100).min(-100);
gui.add(params, "cohesionFactor").max(500).min(0);
gui.add(params, "distance").max(1000).min(0);
gui.add(params, "sight").max(1000).min(0);
gui.add(params, "maxSpeed").max(5).min(0);
gui.add(params, "boundingBoxSize").max(1000).min(0);


window.onload = () => {
  window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  window.addEventListener("auxclick", () => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const newBoid = createBoid();
        boids.push(newBoid);
        scene.add(newBoid);
      }, Math.random() * 100);
    }
  });

  const cameraOffset = 1000;

  camera.position.z = cameraOffset;
  camera.position.x = cameraOffset;
  camera.position.y = cameraOffset;
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  scene.add(camera);

  setupBoids();
  render();
};

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

function render() {
  controls.update();
  boids.forEach((boid, idx) => {
    const vecs = [
      moveToCenter(boid, params.sight, params.cohesionFactor),
      avoidOtherBoids(boid, params.distance),
      matchVelocity(boid, params.matchVelocityFactor),
      stayWithinBounds(boid, params.boundingBoxSize),
    ];

    const finalVec = vecs.reduce((curr, prev) => {
      return [curr[0] + prev[0], curr[1] + prev[1], curr[2] + prev[2]];
    });

    boid.velocity.x += getVelocity(finalVec, finalVec[0]);
    boid.velocity.y += getVelocity(finalVec, finalVec[1]);
    boid.velocity.z += getVelocity(finalVec, finalVec[2]);

    boid.translateX(boid.velocity.x);
    boid.translateY(boid.velocity.y);
    boid.translateZ(boid.velocity.z);
  });

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
