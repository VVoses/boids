import './style.css'
import {Scene, Vector3, PerspectiveCamera, SphereGeometry, MeshBasicMaterial, WebGLRenderer, Mesh} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new Scene();

const camera = new PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000000
);


let boids = []
let prevBoids = []

scene.add(camera)

const canvas = document.querySelector('.webgl');

const renderer = new WebGLRenderer({ antialias: true, canvas });

renderer.setSize(sizes.width, sizes.height);
renderer.setClearColor('black', 1);

function createBoid() {
  const newBoid = new Mesh(new SphereGeometry(Math.random()*10), new MeshBasicMaterial({ color: 'white'}))
  newBoid.velocity = new Vector3(Math.random(), Math.random(), Math.random())
  return newBoid
}

function setupBoids() {
  for(let i = 0; i < 20; i++) {
    const newBoid = createBoid()
    boids[i] = newBoid
  }
  boids.forEach(boid => scene.add(boid))
}

function moveToCenter(boid, sight) {
  let vec = [0, 0, 0]
  boids.forEach(boid2 => {
    if (boid.uuid !== boid2.uuid) {
      if( boid.position.distanceTo(boid2.position) < sight) {
        vec[0] += boid2.position.x
        vec[1] += boid2.position.y
        vec[2] += boid2.position.z
      }
    }
  })
  vec = vec
    .map(scalar => scalar/(boids.length-1))
  result = [
    vec[0] - boid.position.x,
    vec[1] - boid.position.y,
    vec[2] - boid.position.z
  ]
    .map(x => x/2000)
  return result
}

function avoidOtherBoids(boid, distance) {
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

function matchVelocity(boid, factor) {
  let vec = [0, 0, 0]
  boids.forEach((boid2, idx) => {
    if (boid.uuid !== boid2.uuid) {
      vec[0] += boid2.velocity.x
      vec[1] += boid2.velocity.y
      vec[2] += boid2.velocity.z
    }
  })
  vec = vec.map(scalar => scalar/(boids.length-1))
  result = [vec[0] - boid.velocity.x,
            vec[1] - boid.velocity.y,
            vec[2] - boid.velocity.z]
    .map(x => x/factor)
  return result
}

function stayWithinBounds(boid, boundingBoxSize) {
  const halfBoundsSize = boundingBoxSize / 2;
  const positiveBounds = new Vector3(halfBoundsSize, halfBoundsSize, halfBoundsSize);
  const negativeBounds = new Vector3(-halfBoundsSize, -halfBoundsSize, -halfBoundsSize);

  const turnFactor = 1;
  let vec = [0, 0, 0];

  if(boid.position.x > positiveBounds.x) {
    vec[0] -= turnFactor
  }

  if(boid.position.y > positiveBounds.y) {
    vec[1] -= turnFactor
  }

  if(boid.position.z > positiveBounds.z) {
    vec[2] -= turnFactor
  }

  if(boid.position.x < negativeBounds.x) {
    vec[0] += turnFactor
  }

  if(boid.position.y < negativeBounds.y) {
    vec[1] += turnFactor
  }

  if(boid.position.z < negativeBounds.z) {
    vec[2] += turnFactor
  }
  return vec
}

function magnitude(vector) {
  return Math.sqrt(vector[0]**2 + vector[1]**2 + vector[2]**2)
}

const maxSpeed = 0.33


camera.position.x = 1000
camera.position.y = 1000
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

function render() {
  const distance = 150
  const boundingBoxSize = 2000
  const sight = 200
  const factor = 300
  boids.forEach((boid, idx) => {
    vec1 = moveToCenter(boid, sight)
    vec2 = avoidOtherBoids(boid, distance)
    vec3 = matchVelocity(boid, factor)
    vec4 = stayWithinBounds(boid, boundingBoxSize)

    const finalVec = [
      vec1[0] + vec2[0] + vec3[0] + vec4[0],
      vec1[1] + vec2[1] + vec3[1] + vec4[1],
      vec1[2] + vec2[2] + vec3[2] + vec4[2]
    ]

    boid.velocity.x += magnitude(finalVec) < maxSpeed ? finalVec[0] : (finalVec[0] / magnitude(finalVec))*maxSpeed
    boid.velocity.y += magnitude(finalVec) < maxSpeed ? finalVec[1] : (finalVec[1] / magnitude(finalVec))*maxSpeed
    boid.velocity.z += magnitude(finalVec) < maxSpeed ? finalVec[2] : (finalVec[2] / magnitude(finalVec))*maxSpeed

    boid.position.x += boid.velocity.x
    boid.position.y += boid.velocity.y
    boid.position.z += boid.velocity.z
  })

  //const objectPosition = boids[99].getWorldPosition(new Vector3())
  //camera.position.copy(objectPosition).add(cameraOffset)

  controls.update()
  renderer.render(scene, camera);
  requestAnimationFrame(render);

}

window.onload = () => {
  window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  window.addEventListener('click', () => {
    for(let i = 0; i < 10; i++) {
      setTimeout(() => {
        const newBoid = createBoid()
        boids.push(newBoid)
        scene.add(newBoid)
      }, Math.random()*100)
    }
  })

  setupBoids();
  render();
}
