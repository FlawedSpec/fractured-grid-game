import * as THREE from "three";
import {
  OrbitControls
} from "three/addons/controls/OrbitControls.js";
import {
  GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";
import {
  VRMLoaderPlugin,
  VRMUtils
} from "@pixiv/three-vrm";
import {
  createEcho7
} from "./echo7.js";
import {
  DEFAULT_CUSTOM_LOOK,
  HAIR_COLOR_PRESETS,
  HAIRSTYLE_PRESETS,
  SKIN_TONE_PRESETS,
  createCustomFigure,
  applyCustomLook,
  loadCustomLook,
  saveCustomLook,
  randomCustomLook
} from "./custom.js";
const canvas = document.querySelector("#scene");
const status = document.querySelector("#status");
const editor = document.querySelector("#editor-panel");
const toggleEditor = document.querySelector("#editor-toggle");
const nameInput = document.querySelector("#name-input");
const bodyElement = document.body;
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
const toonGradient = new THREE.DataTexture(new Uint8Array([72, 65, 100, 255, 126, 116, 157, 255, 190, 183, 211, 255, 245, 242, 255, 255]), 4, 1, THREE.RGBAFormat);
toonGradient.magFilter = THREE.NearestFilter;
toonGradient.minFilter = THREE.NearestFilter;
toonGradient.generateMipmaps = false;
toonGradient.needsUpdate = true;
const makeMaterial = (color, extra = {}) => new THREE.MeshToonMaterial({
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
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({
  color: "#0c0812"
}));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.04;
floor.receiveShadow = true;
scene.add(floor);
const platform = new THREE.Group();
scene.add(platform);
const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.38, 0.18, 96, 1), new THREE.MeshToonMaterial({
  color: "#21152e",
  gradientMap: toonGradient,
  emissive: "#270d3b",
  emissiveIntensity: 0.55
}));
disc.position.y = 0.09;
disc.castShadow = true;
disc.receiveShadow = true;
platform.add(disc);
const discTop = new THREE.Mesh(new THREE.CircleGeometry(1.24, 96), new THREE.MeshBasicMaterial({
  color: "#160f20"
}));
discTop.rotation.x = -Math.PI / 2;
discTop.position.y = 0.185;
platform.add(discTop);
const ring = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.026, 8, 128), new THREE.MeshBasicMaterial({
  color: "#d15cff",
  transparent: true,
  opacity: 0.95
}));
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.205;
platform.add(ring);
const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.008, 6, 128), new THREE.MeshBasicMaterial({
  color: "#8f44df",
  transparent: true,
  opacity: 0.8
}));
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
const figureOptions = {
  THREE,
  toonGradient,
  mats,
  makeMaterial
};
const echo7 = createEcho7(figureOptions);
characterRoot.add(echo7);
const customFigure = createCustomFigure(figureOptions);
const initialLook = loadCustomLook();
applyCustomLook(customFigure, initialLook);
characterRoot.add(customFigure);
customFigure.visible = false;
let currentVrm = null;
let vrmWrapper = null;
let selectedCharacter = "echo7";
let customLook = initialLook;
let statusTimer = 0;
let editorExpanded = false;

function statusForSelection() {
  if (selectedCharacter === "create") {
    const name = customLook.name.trim();
    return `Fractured Grid · ${name || "Custom"}`;
  }
  return "Fractured Grid · ECHO-7";
}

function refreshStatus() {
  status.textContent = statusForSelection();
}

function updateControlState() {
  for (const group of document.querySelectorAll("[data-choice-group]")) {
    const key = group.dataset.choiceGroup;
    group.querySelectorAll("[data-value]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.value === customLook[key] ? "true" : "false");
    });
  }
  const colorFields = [
    ["hair-color", "hairColor"],
    ["eye-color", "eyeColor"],
    ["skin-color", "skinTone"],
    ["outfit-primary", "outfitPrimary"],
    ["outfit-accent", "outfitAccent"],
    ["glow-color", "glowColor"]
  ];
  for (const [id, key] of colorFields) {
    document.getElementById(id).value = customLook[key];
  }
  nameInput.value = customLook.name;
  document.querySelectorAll("[data-swatch-type]").forEach((button) => {
    const key = button.dataset.swatchType === "hair" ? "hairColor" : "skinTone";
    button.setAttribute("aria-pressed", button.dataset.color.toLowerCase() === customLook[key].toLowerCase() ? "true" : "false");
  });
}

function createChoiceButtons(container, presets) {
  for (const preset of presets) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.dataset.value = preset.id;
    button.textContent = preset.label;
    container.append(button);
  }
}
createChoiceButtons(document.querySelector("#hairstyle-choices"), HAIRSTYLE_PRESETS);

function createSwatches(container, presets, type) {
  for (const preset of presets) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch";
    button.dataset.color = preset.color;
    button.dataset.swatchType = type;
    button.style.setProperty("--swatch", preset.color);
    button.setAttribute("aria-label", preset.name);
    button.title = preset.name;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      const key = type === "hair" ? "hairColor" : "skinTone";
      customLook[key] = preset.color;
      updateControlState();
      persistLook();
    });
    container.append(button);
  }
}
createSwatches(document.querySelector("#hair-swatches"), HAIR_COLOR_PRESETS, "hair");
createSwatches(document.querySelector("#skin-swatches"), SKIN_TONE_PRESETS, "skin");

function persistLook() {
  customLook.name = nameInput.value.slice(0, 16).trim();
  customLook = saveCustomLook(customLook);
  applyCustomLook(customFigure, customLook);
  updateControlState();
  if (selectedCharacter === "create") refreshStatus();
}
updateControlState();
for (const group of document.querySelectorAll("[data-choice-group]")) {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("[data-value]");
    if (!button) return;
    customLook[group.dataset.choiceGroup] = button.dataset.value;
    persistLook();
  });
}
for (const [id, key] of [
    ["hair-color", "hairColor"],
    ["eye-color", "eyeColor"],
    ["skin-color", "skinTone"],
    ["outfit-primary", "outfitPrimary"],
    ["outfit-accent", "outfitAccent"],
    ["glow-color", "glowColor"]
  ]) {
  document.getElementById(id).addEventListener("input", (event) => {
    customLook[key] = event.target.value;
    persistLook();
  });
}
nameInput.addEventListener("input", () => {
  customLook.name = nameInput.value.slice(0, 16);
  saveCustomLook(customLook);
  if (selectedCharacter === "create") refreshStatus();
});
nameInput.addEventListener("change", persistLook);
document.querySelector("#randomize").addEventListener("click", () => {
  customLook = randomCustomLook(customLook.name);
  nameInput.value = customLook.name;
  persistLook();
});
document.querySelector("#reset-look").addEventListener("click", () => {
  customLook = {
    ...DEFAULT_CUSTOM_LOOK
  };
  nameInput.value = customLook.name;
  persistLook();
});

function setEditorExpanded(expanded) {
  editorExpanded = expanded;
  editor.dataset.open = expanded ? "true" : "false";
  toggleEditor.textContent = expanded ? "Collapse" : "Customize";
  toggleEditor.setAttribute("aria-expanded", expanded ? "true" : "false");
  bodyElement.classList.toggle("editor-expanded", expanded);
  bodyElement.classList.toggle("editor-collapsed", !expanded);
}
toggleEditor.addEventListener("click", () => setEditorExpanded(!editorExpanded));
const characterButtons = [...document.querySelectorAll(".character-button")];

function setSelectedCharacter(character) {
  selectedCharacter = character;
  const showingCustom = character === "create";
  echo7.visible = !showingCustom;
  customFigure.visible = showingCustom;
  if (vrmWrapper) vrmWrapper.visible = false;
  for (const button of characterButtons) {
    const selected = button.dataset.character === character;
    button.setAttribute("aria-pressed", selected ? "true" : "false");
    const note = button.querySelector(".character-note");
    if (button.dataset.character === "trynix") {
      note.textContent = "Coming soon";
      button.classList.add("coming-soon");
    } else {
      note.textContent = selected ? "Selected" : (button.dataset.character === "create" ? "Customize" : "");
      button.classList.remove("coming-soon");
    }
  }
  const visible = showingCustom;
  editor.dataset.visible = visible ? "true" : "false";
  editor.setAttribute("aria-hidden", visible ? "false" : "true");
  if (visible) {
    const wide = window.matchMedia("(min-width: 700px)").matches;
    setEditorExpanded(wide ? true : editorExpanded);
  } else {
    setEditorExpanded(false);
  }
  window.clearTimeout(statusTimer);
  refreshStatus();
  try {
    localStorage.setItem("fractured-grid-selected-character", character);
  } catch {
    /* Storage may be blocked; the current session still works. */
  }
}
for (const button of characterButtons) {
  button.addEventListener("click", () => {
    const character = button.dataset.character;
    if (character === "trynix") {
      window.clearTimeout(statusTimer);
      status.textContent = "Coming soon";
      statusTimer = window.setTimeout(refreshStatus, 1200);
      return;
    }
    setSelectedCharacter(character);
  });
}

function fitVrm(vrm) {
  const model = vrm.scene;
  model.position.set(0, 0, 0);
  const bounds = new THREE.Box3().setFromObject(model);
  const height = Math.max(bounds.max.y - bounds.min.y, 0.1);
  model.scale.setScalar(2.3 / height);
  const scaledBounds = new THREE.Box3().setFromObject(model);
  model.position.y -= scaledBounds.min.y;
  if (vrm.meta?.metaVersion === "0") VRMUtils.rotateVRM0(vrm);
  vrmWrapper = new THREE.Group();
  vrmWrapper.add(model);
  characterRoot.add(vrmWrapper);
  vrmWrapper.visible = false;
}
async function loadVrmFromQuery() {
  const vrmUrl = new URLSearchParams(window.location.search).get("vrm");
  if (!vrmUrl) return;
  try {
    status.textContent = "Loading character";
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    const gltf = await loader.loadAsync(vrmUrl);
    currentVrm = gltf.userData.vrm;
    if (!currentVrm) throw new Error("The file did not contain a VRM avatar.");
    fitVrm(currentVrm);
    refreshStatus();
  } catch (error) {
    console.warn("Could not load the VRM model:", error);
    refreshStatus();
  }
}
const remembered = (() => {
  try {
    return localStorage.getItem("fractured-grid-selected-character");
  } catch {
    return null;
  }
})();
setSelectedCharacter(remembered === "create" ? "create" : "echo7");
await loadVrmFromQuery();
const clock = new THREE.Clock();
const initialY = characterRoot.position.y;

function resize() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize, {
  passive: true
});
resize();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  if (currentVrm && vrmWrapper?.visible) currentVrm.update(delta);
  const visibleFigure = selectedCharacter === "create" ? customFigure : echo7;
  characterRoot.position.y = initialY + Math.sin(time * 1.5) * 0.018;
  visibleFigure.rotation.y = Math.sin(time * 0.55) * 0.018;
  visibleFigure.rotation.z = Math.sin(time * 0.75) * 0.006;
  visibleFigure.scale.y = 1 + Math.sin(time * 2.1) * 0.003;
  ring.material.opacity = 0.72 + Math.sin(time * 2.1) * 0.2;
  controls.update();
  renderer.render(scene, camera);
}
animate();
