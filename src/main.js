import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { createEcho7 } from "./echo7.js";

const canvas = document.querySelector("#scene");
const status = document.querySelector("#status");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#090610");
scene.fog = new THREE.FogExp2("#11091b", 0.035);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
camera.position.set(0, 2.35, 7.2);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.enableZoom = true;
controls.zoomSpeed = 0.8;
controls.rotateSpeed = 0.65;
controls.minDistance = 4.1;
controls.maxDistance = 10.5;
controls.minPolarAngle = 0.42;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0, 1.55, 0);
controls.touches.ONE = THREE.TOUCH.ROTATE;
controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;

const toonGradient = new THREE.DataTexture(
  new Uint8Array([
    72, 65, 100, 255,
    126, 116, 157, 255,
    190, 183, 211, 255,
    245, 242, 255, 255
  ]),
  4,
  1,
  THREE.RGBAFormat
);
toonGradient.magFilter = THREE.NearestFilter;
toonGradient.minFilter = THREE.NearestFilter;
toonGradient.generateMipmaps = false;
toonGradient.needsUpdate = true;

const mat = (color, extra = {}) => new THREE.MeshToonMaterial({
  color,
  gradientMap: toonGradient,
  ...extra
});

const mats = {
  line: new THREE.MeshBasicMaterial({
    color: "#21152f",
    side: THREE.BackSide
  })
};

const hemi = new THREE.HemisphereLight("#e9ddff", "#21152c", 2.0);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight("#fff4ff", 3.0);
keyLight.position.set(-3.5, 6, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -4;
keyLight.shadow.camera.right = 4;
keyLight.shadow.camera.top = 6;
keyLight.shadow.camera.bottom = -3;
scene.add(keyLight);

const violetFill = new THREE.PointLight("#9d35ff", 22, 9, 2);
violetFill.position.set(3, 2.1, -2.2);
scene.add(violetFill);

const pinkRim = new THREE.PointLight("#c646ff", 15, 8, 2);
pinkRim.position.set(-2.5, 3.2, -2.5);
scene.add(pinkRim);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshBasicMaterial({ color: "#0c0812" })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.04;
floor.receiveShadow = true;
scene.add(floor);

const platform = new THREE.Group();
scene.add(platform);

const disc = new THREE.Mesh(
  new THREE.CylinderGeometry(1.28, 1.38, 0.18, 96, 1),
  new THREE.MeshToonMaterial({
    color: "#21152e",
    gradientMap: toonGradient,
    emissive: "#270d3b",
    emissiveIntensity: 0.55
  })
);
disc.position.y = 0.09;
disc.castShadow = true;
disc.receiveShadow = true;
platform.add(disc);

const discTop = new THREE.Mesh(
  new THREE.CircleGeometry(1.24, 96),
  new THREE.MeshBasicMaterial({ color: "#160f20" })
);
discTop.rotation.x = -Math.PI / 2;
discTop.position.y = 0.185;
platform.add(discTop);

const ringMat = new THREE.MeshBasicMaterial({
  color: "#d15cff",
  transparent: true,
  opacity: 0.95
});
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.026, 8, 128), ringMat);
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.205;
platform.add(ring);

const innerRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.08, 0.008, 6, 128),
  new THREE.MeshBasicMaterial({
    color: "#8f44df",
    transparent: true,
    opacity: 0.8
  })
);
innerRing.rotation.x = Math.PI / 2;
innerRing.position.y = 0.198;
platform.add(innerRing);

const grid = new THREE.GridHelper(28, 56, "#542c73", "#241a31");
grid.position.y = -0.03;
grid.material.transparent = true;
grid.material.opacity = 0.18;
scene.add(grid);

const characterRoot = new THREE.Group();
characterRoot.position.y = 0.2;
scene.add(characterRoot);

const echo7 = createEcho7({
  THREE,
  toonGradient,
  mats,
  makeMaterial: mat
});
characterRoot.add(echo7);

let currentVrm = null;
let activeFigure = echo7;

function disposeTree(root) {
  root.traverse((object) => {
    if (object.isMesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose());
      } else if (object.material) {
        object.material.dispose();
      }
    }
  });
}

function fitVrm(vrm) {
  const model = vrm.scene;
  model.position.set(0, 0, 0);

  const box = new THREE.Box3().setFromObject(model);
  const height = Math.max(box.max.y - box.min.y, 0.1);
  model.scale.setScalar(2.3 / height);

  const scaledBox = new THREE.Box3().setFromObject(model);
  model.position.y -= scaledBox.min.y;

  /* VRM 1.0 faces +Z; rotate only VRM 0.0 models. */
  if (vrm.meta?.metaVersion === "0") {
    VRMUtils.rotateVRM0(vrm);
  }

  const wrapper = new THREE.Group();
  wrapper.add(model);
  characterRoot.add(wrapper);
  activeFigure = wrapper;
}

async function loadVrmFromQuery() {
  const vrmUrl = new URLSearchParams(window.location.search).get("vrm");
  if (!vrmUrl) return false;

  try {
    status.textContent = "Loading character";
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const gltf = await loader.loadAsync(vrmUrl);
    currentVrm = gltf.userData.vrm;
    if (!currentVrm) {
      throw new Error("The file did not contain a VRM avatar.");
    }

    fitVrm(currentVrm);
    status.textContent = "Fractured Grid · ECHO-7";
    return true;
  } catch (error) {
    console.warn("Could not load the VRM model:", error);
    status.textContent = "Using ECHO-7";
    return false;
  }
}

const loadedVrm = await loadVrmFromQuery();
if (loadedVrm) {
  characterRoot.remove(echo7);
  disposeTree(echo7);
}

const buttons = [...document.querySelectorAll(".character-button")];
let statusTimer = 0;

for (const button of buttons) {
  button.addEventListener("click", () => {
    const character = button.dataset.character;
    if (character === "echo7") {
      buttons.forEach((item) => item.setAttribute("aria-pressed", item === button ? "true" : "false"));
      status.textContent = currentVrm ? "Fractured Grid · VRM" : "Fractured Grid · ECHO-7";
      window.clearTimeout(statusTimer);
      return;
    }

    status.textContent = "Coming soon";
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => {
      status.textContent = currentVrm ? "Fractured Grid · VRM" : "Fractured Grid · ECHO-7";
    }, 1300);
  });
}

const clock = new THREE.Clock();
const initialY = characterRoot.position.y;

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize, { passive: true });
resize();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  if (currentVrm) {
    currentVrm.update(delta);
    activeFigure.position.y = Math.sin(time * 1.35) * 0.025;
    activeFigure.rotation.y = Math.sin(time * 0.55) * 0.025;
  } else {
    characterRoot.position.y = initialY + Math.sin(time * 1.5) * 0.018;
    echo7.rotation.y = Math.sin(time * 0.55) * 0.018;
    echo7.rotation.z = Math.sin(time * 0.75) * 0.006;
  }

  ring.material.opacity = 0.72 + Math.sin(time * 2.1) * 0.2;
  controls.update();
  renderer.render(scene, camera);
}
animate();
