import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

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
  skin: mat("#d9c9f2"),
  skinShadow: mat("#aa91d2"),
  hair: mat("#f6f1ff"),
  hairShadow: mat("#c5b8df"),
  hairDark: mat("#9990b6"),
  armor: mat("#f7f5ff"),
  armorShade: mat("#cfc8e5"),
  black: mat("#171321"),
  blackSoft: mat("#282032"),
  violet: mat("#b14cff", { emissive: "#6d0bd0", emissiveIntensity: 1.5 }),
  magenta: mat("#ff4fc8", { emissive: "#aa146e", emissiveIntensity: 1.1 }),
  eye: mat("#fcf9ff", { emissive: "#b9a5ff", emissiveIntensity: 0.3 }),
  iris: mat("#9b39ff", { emissive: "#7619dc", emissiveIntensity: 0.75 }),
  line: new THREE.MeshBasicMaterial({ color: "#21152f", side: THREE.BackSide })
};

function addOutline(mesh, scale = 1.035) {
  const outline = new THREE.Mesh(mesh.geometry, mats.line);
  outline.position.copy(mesh.position);
  outline.quaternion.copy(mesh.quaternion);
  outline.scale.copy(mesh.scale).multiplyScalar(scale);
  outline.renderOrder = mesh.renderOrder - 1;
  mesh.parent.add(outline);
  return outline;
}

function mesh(geometry, material, parent, position, scale, rotation) {
  const object = new THREE.Mesh(geometry, material);
  if (position) object.position.set(...position);
  if (scale) object.scale.set(...scale);
  if (rotation) object.rotation.set(...rotation);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  addOutline(object);
  return object;
}

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

const pinkRim = new THREE.PointLight("#ff4fc8", 15, 8, 2);
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
platform.position.y = 0;
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
  new THREE.MeshBasicMaterial({ color: "#8f44df", transparent: true, opacity: 0.8 })
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

function sphere(parent, material, position, scale, segments = 24) {
  return mesh(
    new THREE.SphereGeometry(1, segments, Math.max(12, Math.floor(segments * 0.7))),
    material,
    parent,
    position,
    scale
  );
}

function capsuleBetween(parent, a, b, radius, material, radialSegments = 12) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const delta = new THREE.Vector3().subVectors(end, start);
  const geometry = new THREE.CylinderGeometry(radius * 0.82, radius, delta.length(), radialSegments);
  const object = mesh(geometry, material, parent);
  object.position.copy(start).add(end).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  sphere(parent, material, a, [radius, radius, radius], radialSegments);
  sphere(parent, material, b, [radius * 0.82, radius * 0.82, radius * 0.82], radialSegments);
  return object;
}

function makePlaceholder() {
  const figure = new THREE.Group();
  characterRoot.add(figure);

  // Legs: tapered armored boots and dark articulated under-suit.
  capsuleBetween(figure, [-0.24, 0.22, 0], [-0.29, 0.88, 0.02], 0.12, mats.blackSoft);
  capsuleBetween(figure, [0.24, 0.22, 0], [0.29, 0.88, 0.02], 0.12, mats.blackSoft);
  mesh(new THREE.CapsuleGeometry(0.11, 0.34, 5, 12), mats.armor, figure, [-0.29, 0.43, 0.1], [0.86, 1, 1.15]);
  mesh(new THREE.CapsuleGeometry(0.11, 0.34, 5, 12), mats.armor, figure, [0.29, 0.43, 0.1], [0.86, 1, 1.15]);
  sphere(figure, mats.black, [0, 1.02, 0], [0.49, 0.24, 0.3]);
  sphere(figure, mats.armor, [-0.23, 0.96, 0.03], [0.22, 0.16, 0.31]);
  sphere(figure, mats.armor, [0.23, 0.96, 0.03], [0.22, 0.16, 0.31]);

  // Torso silhouette with a fitted black suit and sculpted breastplate panels.
  mesh(new THREE.CapsuleGeometry(0.28, 0.48, 8, 20), mats.black, figure, [0, 1.45, 0], [1.25, 1.02, 0.76]);
  sphere(figure, mats.armor, [-0.17, 1.54, 0.185], [0.22, 0.22, 0.13]);
  sphere(figure, mats.armor, [0.17, 1.54, 0.185], [0.22, 0.22, 0.13]);
  mesh(new THREE.ConeGeometry(0.11, 0.43, 5), mats.armorShade, figure, [0, 1.36, 0.28], [0.9, 1, 0.55]);
  sphere(figure, mats.violet, [0, 1.47, 0.31], [0.055, 0.075, 0.045], 16);

  // Waist belt and layered hip plates.
  mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.16, 12), mats.armor, figure, [0, 1.13, 0], [1, 1, 0.82], [0, 0.1, 0]);
  const hipL = mesh(new THREE.ConeGeometry(0.2, 0.48, 5), mats.armorShade, figure, [-0.32, 0.95, 0.03], [1, 0.7, 0.65], [0, 0, -0.3]);
  const hipR = mesh(new THREE.ConeGeometry(0.2, 0.48, 5), mats.armorShade, figure, [0.32, 0.95, 0.03], [1, 0.7, 0.65], [0, 0, 0.3]);

  // Neck, shoulders and arms with white armor caps.
  mesh(new THREE.CylinderGeometry(0.105, 0.13, 0.22, 16), mats.skin, figure, [0, 1.85, 0]);
  capsuleBetween(figure, [-0.42, 1.68, 0], [-0.62, 1.27, 0.02], 0.095, mats.blackSoft);
  capsuleBetween(figure, [0.42, 1.68, 0], [0.62, 1.27, 0.02], 0.095, mats.blackSoft);
  sphere(figure, mats.armor, [-0.47, 1.69, 0], [0.2, 0.17, 0.19]);
  sphere(figure, mats.armor, [0.47, 1.69, 0], [0.2, 0.17, 0.19]);
  capsuleBetween(figure, [-0.62, 1.27, 0.02], [-0.63, 1.02, 0.08], 0.075, mats.skin);
  capsuleBetween(figure, [0.62, 1.27, 0.02], [0.63, 1.02, 0.08], 0.075, mats.skin);
  sphere(figure, mats.armor, [-0.63, 1.13, 0.02], [0.1, 0.16, 0.12]);
  sphere(figure, mats.armor, [0.63, 1.13, 0.02], [0.1, 0.16, 0.12]);

  // Head, face, ears and anime eyes.
  sphere(figure, mats.skin, [0, 2.12, 0.02], [0.29, 0.37, 0.27], 32);
  sphere(figure, mats.skinShadow, [-0.29, 2.12, 0.02], [0.055, 0.09, 0.08], 16);
  sphere(figure, mats.skinShadow, [0.29, 2.12, 0.02], [0.055, 0.09, 0.08], 16);
  sphere(figure, mats.eye, [-0.115, 2.15, 0.257], [0.071, 0.09, 0.03], 20);
  sphere(figure, mats.eye, [0.115, 2.15, 0.257], [0.071, 0.09, 0.03], 20);
  sphere(figure, mats.iris, [-0.108, 2.14, 0.282], [0.036, 0.057, 0.016], 18);
  sphere(figure, mats.iris, [0.122, 2.14, 0.282], [0.036, 0.057, 0.016], 18);
  sphere(figure, mats.black, [-0.108, 2.142, 0.294], [0.016, 0.036, 0.009], 12);
  sphere(figure, mats.black, [0.122, 2.142, 0.294], [0.016, 0.036, 0.009], 12);
  sphere(figure, mats.eye, [-0.12, 2.17, 0.3], [0.014, 0.018, 0.008], 10);
  sphere(figure, mats.eye, [0.11, 2.17, 0.3], [0.014, 0.018, 0.008], 10);

  // Nose and subtle mouth.
  mesh(new THREE.ConeGeometry(0.025, 0.07, 5), mats.skinShadow, figure, [0, 2.06, 0.29], [0.65, 1, 0.55], [Math.PI, 0, 0]);
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.038, 0.008, 5, 14, Math.PI),
    new THREE.MeshBasicMaterial({ color: "#7a416d" })
  );
  mouth.position.set(0, 1.985, 0.275);
  mouth.rotation.z = Math.PI;
  figure.add(mouth);

  // Short white bob haircut, separate sculpted locks and swept fringe.
  sphere(figure, mats.hair, [0, 2.31, -0.015], [0.32, 0.25, 0.29], 24);
  sphere(figure, mats.hair, [-0.255, 2.15, -0.01], [0.105, 0.25, 0.22], 18);
  sphere(figure, mats.hair, [0.255, 2.15, -0.01], [0.105, 0.25, 0.22], 18);
  mesh(new THREE.ConeGeometry(0.17, 0.44, 6), mats.hair, figure, [-0.17, 2.28, 0.18], [0.75, 1, 0.45], [0, 0, -0.45]);
  mesh(new THREE.ConeGeometry(0.16, 0.4, 6), mats.hair, figure, [0.015, 2.3, 0.2], [0.72, 1, 0.42], [0, 0, -0.08]);
  mesh(new THREE.ConeGeometry(0.14, 0.36, 6), mats.hair, figure, [0.17, 2.27, 0.16], [0.7, 1, 0.44], [0, 0, 0.36]);
  for (const x of [-0.29, 0.29]) {
    mesh(new THREE.ConeGeometry(0.09, 0.34, 5), mats.hairShadow, figure, [x, 2.03, -0.01], [0.85, 1, 0.8], [0, 0, x < 0 ? 0.2 : -0.2]);
  }

  // Violet temple rings and shoulder halo rings.
  for (const side of [-1, 1]) {
    const temple = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.018, 8, 28),
      new THREE.MeshBasicMaterial({ color: "#d35cff" })
    );
    temple.position.set(side * 0.29, 2.18, 0.015);
    temple.rotation.y = side * 0.35;
    figure.add(temple);

    const shoulderRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.018, 8, 32),
      new THREE.MeshBasicMaterial({ color: side < 0 ? "#c74dff" : "#ff4fc8" })
    );
    shoulderRing.position.set(side * 0.47, 1.69, 0);
    shoulderRing.rotation.x = Math.PI / 2;
    figure.add(shoulderRing);

    const shoulderGlow = new THREE.PointLight(side < 0 ? "#a23dff" : "#ff49cb", 2.5, 1.5, 2);
    shoulderGlow.position.set(side * 0.47, 1.69, 0.12);
    figure.add(shoulderGlow);
  }

  return figure;
}

let currentVrm = null;
let figureGroup = null;
let mixer = null;
let placeholder = null;

function fitVrm(vrm) {
  const model = vrm.scene;
  model.position.set(0, 0, 0);
  const box = new THREE.Box3().setFromObject(model);
  const height = Math.max(box.max.y - box.min.y, 0.1);
  const scale = 2.25 / height;
  model.scale.setScalar(scale);

  const scaledBox = new THREE.Box3().setFromObject(model);
  model.position.y -= scaledBox.min.y;
  // VRM 1.0 already faces +Z (toward the default camera). Only VRM 0.0 needs a 180 flip.
  if (typeof VRMUtils.rotateVRM0 === "function") {
    VRMUtils.rotateVRM0(vrm);
  }

  const wrapper = new THREE.Group();
  wrapper.add(model);
  characterRoot.add(wrapper);
  figureGroup = wrapper;
}

async function loadVrmFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const vrmUrl = params.get("vrm");
  if (!vrmUrl) return false;

  try {
    status.textContent = "Loading character";
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const gltf = await loader.loadAsync(vrmUrl);
    currentVrm = gltf.userData.vrm;
    if (!currentVrm) throw new Error("The file did not contain a VRM avatar.");
    fitVrm(currentVrm);
    status.textContent = "Fractured Grid · Character Creator";
    return true;
  } catch (error) {
    console.warn("Could not load the VRM model:", error);
    status.textContent = "Using Grid placeholder";
    return false;
  }
}

placeholder = makePlaceholder();
figureGroup = placeholder;

await loadVrmFromQuery().then((loaded) => {
  if (loaded) {
    characterRoot.remove(placeholder);
    placeholder.traverse((object) => {
      if (object.isMesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material.dispose();
      }
    });
  }
});

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
  const t = clock.elapsedTime;

  if (currentVrm) {
    currentVrm.update(delta);
    if (figureGroup) {
      figureGroup.position.y = Math.sin(t * 1.35) * 0.025;
      figureGroup.rotation.y = Math.sin(t * 0.55) * 0.025;
    }
  } else {
    characterRoot.position.y = initialY + Math.sin(t * 1.5) * 0.025;
    characterRoot.rotation.y = Math.sin(t * 0.55) * 0.025;
    if (placeholder) {
      placeholder.scale.y = 1 + Math.sin(t * 2.1) * 0.006;
      placeholder.rotation.z = Math.sin(t * 0.75) * 0.008;
    }
  }

  ring.material.opacity = 0.72 + Math.sin(t * 2.1) * 0.2;
  controls.update();
  renderer.render(scene, camera);
}
animate();
