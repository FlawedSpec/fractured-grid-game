export const CUSTOM_STORAGE_KEY = "fractured-grid-custom-look";
export const DEFAULT_CUSTOM_LOOK = Object.freeze({
  name: "",
  hairstyle: "long",
  hairColor: "#292e3b",
  skinTone: "#bd8461",
  eyeColor: "#65d9d1",
  outfit: "jacket",
  outfitPrimary: "#315b65",
  outfitAccent: "#c7d9d2",
  glowColor: "#67e8d4",
  build: "medium"
});
const VALID = {
  hairstyle: ["crop", "long", "ponytail", "spiky"],
  outfit: ["armor", "jacket", "techwear"],
  build: ["slim", "medium", "athletic"]
};
const COLOR_KEYS = ["hairColor", "skinTone", "eyeColor", "outfitPrimary", "outfitAccent", "glowColor"];
const SKIN_TONES = ["#f6dfd2", "#edc4aa", "#dca889", "#bd8461", "#a97452", "#875638", "#603b2f", "#3e2928", "#c9b6e8", "#9ab9df", "#d6a4b5", "#a9c8b9"];

function validColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}
export function sanitizeCustomLook(value) {
  const output = {
    ...DEFAULT_CUSTOM_LOOK
  };
  if (!value || typeof value !== "object" || Array.isArray(value)) return output;
  if (typeof value.name === "string") output.name = value.name.slice(0, 16);
  for (const key of Object.keys(VALID)) {
    if (VALID[key].includes(value[key])) output[key] = value[key];
  }
  for (const key of COLOR_KEYS) {
    if (validColor(value[key])) output[key] = value[key];
  }
  return output;
}
export function loadCustomLook() {
  try {
    const serialized = localStorage.getItem(CUSTOM_STORAGE_KEY);
    return serialized ? sanitizeCustomLook(JSON.parse(serialized)) : {
      ...DEFAULT_CUSTOM_LOOK
    };
  } catch {
    return {
      ...DEFAULT_CUSTOM_LOOK
    };
  }
}
export function saveCustomLook(look) {
  const safeLook = sanitizeCustomLook(look);
  safeLook.name = safeLook.name.trim();
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(safeLook));
  } catch {
    /* Storage may be blocked; changes remain active for this session. */ }
  return safeLook;
}

function makeMaterials(THREE, gradient) {
  const make = (color, extra = {}) => new THREE.MeshToonMaterial({
    color,
    gradientMap: gradient,
    ...extra
  });
  return {
    hair: make("#ffffff"),
    hairShade: make("#bbc0cc"),
    skin: make("#ffffff"),
    skinShade: make("#8a7780"),
    eyeWhite: make("#fbf8ff"),
    iris: make("#ffffff", {
      emissive: "#ffffff",
      emissiveIntensity: 0.7
    }),
    pupil: make("#16131d"),
    outline: new THREE.MeshBasicMaterial({
      color: "#1c1725",
      side: THREE.BackSide
    }),
    shirt: make("#ffffff"),
    primary: make("#ffffff"),
    accent: make("#ffffff"),
    dark: make("#191720"),
    darkLight: make("#302c38"),
    glow: make("#ffffff", {
      emissive: "#ffffff",
      emissiveIntensity: 1.25
    })
  };
}

function addOutline(root, object, factor = 1.035) {
  const outline = new root.userData.THREE.Mesh(object.geometry, root.userData.materials.outline);
  outline.position.copy(object.position);
  outline.quaternion.copy(object.quaternion);
  outline.scale.copy(object.scale).multiplyScalar(factor);
  outline.renderOrder = object.renderOrder - 1;
  object.parent.add(outline);
  return outline;
}

function objectMesh(root, geometry, material, position, scale, options = {}) {
  const THREE = root.userData.THREE;
  const object = new THREE.Mesh(geometry, material);
  if (position) object.position.set(...position);
  if (scale) object.scale.set(...scale);
  if (options.rotation) object.rotation.set(...options.rotation);
  object.castShadow = true;
  object.receiveShadow = true;
  root.add(object);
  if (options.outline !== false) addOutline(root, object, options.outlineScale || 1.035);
  return object;
}

function ellipsoid(root, material, position, scale, segments = 24, group = root) {
  const THREE = root.userData.THREE;
  const object = new THREE.Mesh(new THREE.SphereGeometry(1, segments, Math.max(16, Math.floor(segments * 0.72))), material);
  object.position.set(...position);
  object.scale.set(...scale);
  object.castShadow = true;
  object.receiveShadow = true;
  group.add(object);
  if (group === root) addOutline(root, object);
  return object;
}

function link(root, a, b, radius, material, segments = 16, group = root) {
  const THREE = root.userData.THREE;
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const direction = new THREE.Vector3().subVectors(end, start);
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.82, radius, direction.length(), segments), material);
  cylinder.position.copy(start).add(end).multiplyScalar(0.5);
  cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  cylinder.castShadow = true;
  group.add(cylinder);
  if (group === root) addOutline(root, cylinder);
  ellipsoid(root, material, a, [radius, radius, radius], segments, group);
  ellipsoid(root, material, b, [radius * 0.82, radius * 0.82, radius * 0.82], segments, group);
  return cylinder;
}

function plate(root, points, depth, material, group = root, bevel = 0.025) {
  const THREE = root.userData.THREE;
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    shape.lineTo(points[index][0], points[index][1]);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 10
  });
  const object = new THREE.Mesh(geometry, material);
  object.position.z = -depth * 0.45;
  object.castShadow = true;
  object.receiveShadow = true;
  group.add(object);
  if (group === root) addOutline(root, object, 1.025);
  return object;
}

function clearGroup(root, group) {
  group.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry.dispose();
  });
  while (group.children.length) group.remove(group.children[0]);
}

function setMaterialColor(material, color, emissiveColor = null) {
  material.color.set(color);
  if (emissiveColor && material.emissive) material.emissive.set(emissiveColor);
}
export function createCustomFigure(options) {
  const {
    THREE,
    toonGradient
  } = options;
  const root = new THREE.Group();
  root.name = "Custom Character";
  root.userData.THREE = THREE;
  root.userData.toonGradient = toonGradient;
  root.userData.materials = makeMaterials(THREE, toonGradient);
  root.userData.styleGroups = {};
  root.userData.rebuildStyle = () => buildStyleGroups(root);
  buildBase(root);
  buildStyleGroups(root);
  applyCustomLook(root, DEFAULT_CUSTOM_LOOK);
  return root;
}

function buildBase(root) {
  const THREE = root.userData.THREE;
  const m = root.userData.materials;
  const body = new THREE.Group();
  body.name = "custom-body";
  root.add(body);
  root.userData.bodyGroup = body;
  const width = 1;
  root.userData.buildWidth = width; /* Feet and long, tapered legs. */
  for (const side of [-1, 1]) {
    const x = side * 0.14;
    objectMesh(root, new THREE.BoxGeometry(0.13, 0.07, 0.29), m.dark, [x, 0.08, 0.07], null, {
      parent: body
    });
    ellipsoid(root, m.primary, [x, 0.15, 0.12], [0.09, 0.1, 0.19], 22, body);
    link(root, [x, 0.17, 0], [side * 0.15, 0.68, 0], 0.057, m.darkLight, 18, body);
    ellipsoid(root, m.dark, [side * 0.15, 0.69, 0], [0.07, 0.07, 0.07], 18, body);
    link(root, [side * 0.15, 0.71, 0], [side * 0.17, 1.16, 0], 0.08, m.darkLight, 20, body);
    ellipsoid(root, m.primary, [side * 0.17, 0.47, 0.065], [0.075, 0.24, 0.055], 24, body);
  }
  ellipsoid(root, m.dark, [0, 1.2, 0], [0.2, 0.13, 0.13], 24, body);
  ellipsoid(root, m.primary, [0, 1.42, 0], [0.2, 0.24, 0.125], 28, body);
  ellipsoid(root, m.primary, [0, 1.67, 0], [0.235, 0.16, 0.13], 28, body);
  link(root, [0, 1.7, 0], [0, 1.84, 0], 0.068, m.skin, 18, body);
  for (const side of [-1, 1]) {
    const shoulder = [side * 0.3, 1.76, 0];
    const elbow = [side * 0.39, 1.49, 0.015];
    const wrist = [side * 0.42, 1.2, 0.03];
    ellipsoid(root, m.primary, shoulder, [0.1, 0.11, 0.1], 22, body);
    link(root, shoulder, elbow, 0.053, m.darkLight, 16, body);
    ellipsoid(root, m.glow, elbow, [0.06, 0.06, 0.06], 16, body);
    link(root, elbow, wrist, 0.047, m.darkLight, 16, body);
    ellipsoid(root, m.skin, [side * 0.42, 1.15, 0.03], [0.045, 0.085, 0.04], 18, body);
  } /* Face, ears, large anime eyes and an understated expression. */
  ellipsoid(root, m.skin, [0, 2.045, 0], [0.195, 0.265, 0.16], 32, body);
  for (const side of [-1, 1]) {
    ellipsoid(root, m.skinShade, [side * 0.197, 2.04, 0], [0.035, 0.06, 0.045], 18, body);
    const x = side * 0.078;
    ellipsoid(root, m.dark, [x, 2.065, 0.139], [0.061, 0.07, 0.03], 22, body);
    ellipsoid(root, m.eyeWhite, [x, 2.06, 0.158], [0.049, 0.055, 0.022], 22, body);
    ellipsoid(root, m.iris, [x, 2.055, 0.176], [0.027, 0.037, 0.014], 20, body);
    ellipsoid(root, m.pupil, [x, 2.057, 0.188], [0.011, 0.025, 0.008], 14, body);
    ellipsoid(root, m.eyeWhite, [x - 0.008, 2.072, 0.194], [0.008, 0.011, 0.005], 10, body);
  }
  objectMesh(root, new THREE.ConeGeometry(0.012, 0.035, 8), m.skinShade, [0, 2.015, 0.158], null, {
    rotation: [Math.PI, 0, 0],
    parent: body,
    outline: false
  });
  objectMesh(root, new THREE.BoxGeometry(0.04, 0.008, 0.008), m.skinShade, [0, 1.975, 0.15], null, {
    parent: body,
    outline: false
  }); /* Neck/collar glow and discreet chest light. */
  objectMesh(root, new THREE.TorusGeometry(0.09, 0.01, 8, 24), m.glow, [0, 1.83, 0.02], null, {
    rotation: [Math.PI / 2, 0, 0],
    parent: body,
    outline: false
  });
  objectMesh(root, new THREE.TorusGeometry(0.035, 0.009, 8, 20), m.glow, [0, 1.6, 0.14], null, {
    rotation: [Math.PI / 2, 0, 0],
    parent: body,
    outline: false
  });
  root.userData.headGroup = new THREE.Group();
  root.userData.headGroup.name = "custom-hair";
  body.add(root.userData.headGroup);
  root.userData.clothingGroup = new THREE.Group();
  root.userData.clothingGroup.name = "custom-outfit";
  body.add(root.userData.clothingGroup);
}

function buildStyleGroups(root) {
  const THREE = root.userData.THREE;
  const m = root.userData.materials;
  const hairGroup = root.userData.headGroup;
  const outfitGroup = root.userData.clothingGroup;
  clearGroup(root, hairGroup);
  clearGroup(root, outfitGroup);
  const look = root.userData.look || DEFAULT_CUSTOM_LOOK;
  buildHair(root, hairGroup, look.hairstyle);
  buildOutfit(root, outfitGroup, look.outfit);

  function buildHair(rootRef, group, style) {
    const material = m.hair;
    const shade = m.hairShade;
    const crown = (x, y, z, sx, sy, sz, mat = material) => ellipsoid(rootRef, mat, [x, y, z], [sx, sy, sz], 24, group);
    crown(0, 2.245, -0.025, 0.205, 0.105, 0.18, shade);
    crown(0, 2.265, -0.018, 0.2, 0.095, 0.18, material);
    const lock = (x, y, z, width, height, depth, angle = 0, mat = material) => {
      const shape = new THREE.ConeGeometry(width, height, 10);
      const item = new THREE.Mesh(shape, mat);
      item.position.set(x, y, z);
      item.scale.set(1, 1, depth / width);
      item.rotation.z = angle;
      item.castShadow = true;
      group.add(item);
      addOutline(rootRef, item);
    }; /* Side-swept fringe is shared, while the rear silhouette changes by preset. */
    lock(-0.11, 2.185, 0.11, 0.07, 0.2, 0.06, 0.4);
    lock(-0.025, 2.18, 0.13, 0.065, 0.17, 0.055, 0.12);
    lock(0.075, 2.19, 0.11, 0.06, 0.16, 0.05, -0.27);
    if (style === "long") {
      crown(-0.19, 1.96, -0.01, 0.075, 0.32, 0.11, material);
      crown(0.19, 1.96, -0.01, 0.075, 0.32, 0.11, shade);
      crown(-0.19, 1.72, -0.015, 0.07, 0.25, 0.09, material);
      crown(0.19, 1.72, -0.015, 0.07, 0.25, 0.09, material);
      lock(-0.18, 2.02, 0.07, 0.055, 0.35, 0.05, 0.12);
      lock(0.17, 2.01, 0.07, 0.052, 0.34, 0.048, -0.16);
    } else if (style === "ponytail") {
      crown(-0.19, 2.17, -0.02, 0.07, 0.19, 0.11, shade);
      crown(0.19, 2.17, -0.02, 0.07, 0.19, 0.11, material);
      crown(0.08, 2.18, -0.21, 0.12, 0.1, 0.13, material);
      crown(0.17, 2.02, -0.26, 0.095, 0.22, 0.11, material);
      crown(0.21, 1.83, -0.28, 0.075, 0.17, 0.085, shade);
      crown(0.22, 1.68, -0.25, 0.055, 0.13, 0.065, material);
      lock(0.17, 1.92, -0.25, 0.08, 0.48, 0.07, -0.14);
    } else if (style === "spiky") {
      for (const spike of [
          [-0.16, 2.34, -0.02, 0.075, 0.24, -0.34],
          [-0.055, 2.37, -0.035, 0.07, 0.27, -0.12],
          [0.055, 2.36, -0.025, 0.075, 0.26, 0.14],
          [0.16, 2.32, -0.015, 0.07, 0.23, 0.36],
          [-0.2, 2.16, -0.045, 0.065, 0.21, -0.58],
          [0.2, 2.15, -0.04, 0.065, 0.2, 0.58]
        ]) {
        lock(spike[0], spike[1], spike[2], spike[3], spike[4], 0.06, spike[5], material);
      }
    } else {
      crown(-0.19, 2.15, -0.01, 0.07, 0.18, 0.1, shade);
      crown(0.19, 2.15, -0.01, 0.07, 0.18, 0.1, material);
      lock(-0.19, 2.07, 0.035, 0.055, 0.18, 0.05, 0.2, shade);
      lock(0.18, 2.08, 0.04, 0.055, 0.17, 0.05, -0.24);
      lock(-0.11, 2.31, -0.02, 0.06, 0.14, 0.055, 0.42, shade);
      lock(0.12, 2.31, -0.025, 0.055, 0.14, 0.05, -0.4);
    }
  }

  function buildOutfit(rootRef, group, style) {
    const primary = m.primary;
    const accent = m.accent;
    const dark = m.dark;
    const glow = m.glow;
    const platePart = (points, depth, mat) => {
      const obj = plate(rootRef, points, depth, mat, group, 0.018);
      addOutline(rootRef, obj, 1.025);
      return obj;
    };
    const torsoShell = (mat) => ellipsoid(rootRef, mat, [0, 1.47, 0.015], [0.22, 0.24, 0.145], 28, group);
    if (style === "armor") {
      torsoShell(dark);
      for (const side of [-1, 1]) {
        platePart([
          [side * 0.025, 1.76],
          [side * 0.16, 1.78],
          [side * 0.27, 1.66],
          [side * 0.22, 1.51],
          [side * 0.08, 1.48],
          [side * 0.035, 1.58]
        ], 0.065, primary);
        platePart([
          [side * 0.085, 1.44],
          [side * 0.2, 1.46],
          [side * 0.225, 1.3],
          [side * 0.14, 1.27]
        ], 0.055, accent);
        platePart([
          [side * 0.3, 1.75],
          [side * 0.4, 1.78],
          [side * 0.43, 1.68],
          [side * 0.33, 1.63]
        ], 0.05, accent);
      }
      platePart([
        [-0.17, 1.27],
        [0, 1.31],
        [0.17, 1.27],
        [0.13, 1.17],
        [0, 1.14],
        [-0.13, 1.17]
      ], 0.05, primary);
      for (const side of [-1, 1]) {
        platePart([
          [side * 0.1, 0.31],
          [side * 0.19, 0.33],
          [side * 0.2, 0.59],
          [side * 0.15, 0.68],
          [side * 0.11, 0.58]
        ], 0.04, primary);
      }
    } else if (style === "jacket") {
      torsoShell(dark);
      for (const side of [-1, 1]) {
        platePart([
          [side * 0.025, 1.78],
          [side * 0.21, 1.76],
          [side * 0.25, 1.52],
          [side * 0.14, 1.38],
          [side * 0.045, 1.48]
        ], 0.07, primary);
      }
      platePart([
        [-0.07, 1.74],
        [0.07, 1.74],
        [0.08, 1.42],
        [-0.08, 1.42]
      ], 0.08, accent);
      platePart([
        [-0.15, 1.3],
        [0, 1.34],
        [0.15, 1.3],
        [0.13, 1.21],
        [-0.13, 1.21]
      ], 0.045, dark);
      for (const side of [-1, 1]) {
        platePart([
          [side * 0.31, 1.74],
          [side * 0.4, 1.78],
          [side * 0.43, 1.57],
          [side * 0.35, 1.5]
        ], 0.05, primary);
      }
    } else {
      torsoShell(dark);
      for (const side of [-1, 1]) {
        platePart([
          [side * 0.04, 1.75],
          [side * 0.2, 1.76],
          [side * 0.24, 1.48],
          [side * 0.14, 1.38],
          [side * 0.04, 1.49]
        ], 0.07, primary);
        platePart([
          [side * 0.3, 1.76],
          [side * 0.41, 1.78],
          [side * 0.44, 1.52],
          [side * 0.34, 1.47]
        ], 0.055, accent);
        platePart([
          [side * 0.12, 1.25],
          [side * 0.21, 1.28],
          [side * 0.23, 1.12],
          [side * 0.15, 1.1]
        ], 0.05, accent);
      } /* Hood rests behind the head and stays clear of the face. */
      const hood = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.055, 12, 28, Math.PI), primary);
      hood.position.set(0, 1.91, -0.075);
      hood.rotation.z = Math.PI;
      group.add(hood);
      addOutline(rootRef, hood, 1.035);
    } /* Accent chest zip / center seam, outfit-dependent but consistently fitted. */
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.22, 0.018), style === "jacket" ? accent : glow);
    seam.position.set(0, 1.58, 0.17);
    group.add(seam);
    if (style !== "jacket") addOutline(rootRef, seam, 1.04);
    for (const side of [-1, 1]) {
      const knee = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.035, 0.025), style === "armor" ? accent : primary);
      knee.position.set(side * 0.15, 0.69, 0.085);
      group.add(knee);
      addOutline(rootRef, knee);
    }
  }
}

export function applyCustomLook(figure, lookInput) {
  const look = sanitizeCustomLook(lookInput);
  const m = figure.userData.materials;
  const previous = figure.userData.look;
  setMaterialColor(m.hair, look.hairColor);
  setMaterialColor(m.hairShade, look.hairColor);
  m.hairShade.color.offsetHSL(0, -0.08, -0.16);
  setMaterialColor(m.skin, look.skinTone);
  setMaterialColor(m.skinShade, look.skinTone);
  m.skinShade.color.offsetHSL(0, -0.1, -0.18);
  setMaterialColor(m.iris, look.eyeColor, look.glowColor);
  setMaterialColor(m.primary, look.outfitPrimary);
  setMaterialColor(m.accent, look.outfitAccent);
  setMaterialColor(m.glow, look.glowColor, look.glowColor);
  const bodyChanged = !previous || previous.build !== look.build;
  const styleChanged = !previous || previous.hairstyle !== look.hairstyle || previous.outfit !== look.outfit;
  if (bodyChanged) {
    const body = figure.userData.bodyGroup;
    const factor = look.build === "slim" ? 0.9 : look.build === "athletic" ? 1.1 : 1;
    body.scale.x = factor;
    body.scale.z = look.build === "athletic" ? 1.05 : 1;
  }
  if (styleChanged) {
    figure.userData.look = look;
    buildStyleGroups(figure);
  }
  figure.userData.look = look;
  figure.userData.name = look.name.trim() || "Custom";
  return figure;
}
export function randomCustomLook(name = "") {
  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  const colors = ["#273447", "#315b65", "#68435d", "#555b38", "#654c3d", "#d8c7aa", "#b94a58", "#5d61a7", "#c8d5d2", "#344f73"];
  const hairColors = ["#292e3b", "#f1e8d8", "#694a3b", "#7a303d", "#d2b36f", "#4d6073", "#25252a"];
  const eyeColors = ["#65d9d1", "#79a9ff", "#c286ff", "#83c777", "#cc8b67", "#b6d7ef"];
  const glowColors = ["#67e8d4", "#7dbdff", "#bd85ff", "#ff7fb4", "#c0ea8a"];
  const skinTones = ["#f6dfd2", "#edc4aa", "#dca889", "#bd8461", "#a97452", "#875638", "#603b2f", "#3e2928", "#c9b6e8", "#9ab9df", "#d6a4b5"];
  return sanitizeCustomLook({
    ...DEFAULT_CUSTOM_LOOK,
    name: String(name).slice(0, 16),
    hairstyle: pick(VALID.hairstyle),
    hairColor: pick(hairColors),
    skinTone: pick(skinTones),
    eyeColor: pick(eyeColors),
    outfit: pick(VALID.outfit),
    outfitPrimary: pick(colors),
    outfitAccent: pick(colors),
    glowColor: pick(glowColors),
    build: pick(VALID.build)
  });
}
