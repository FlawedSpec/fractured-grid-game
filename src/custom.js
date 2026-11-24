export const CUSTOM_STORAGE_KEY = "fractured-grid-custom-look";

export const DEFAULT_CUSTOM_LOOK = Object.freeze({
  name: "",
  hairstyle: "straight-long",
  hairColor: "#292e3b",
  skinTone: "#bd8461",
  eyeColor: "#65d9d1",
  outfit: "jacket",
  outfitPrimary: "#315b65",
  outfitAccent: "#c7d9d2",
  glowColor: "#67e8d4",
  build: "medium"
});

export const HAIRSTYLE_PRESETS = [
  { id: "crop", label: "Crop" },
  { id: "ponytail", label: "Ponytail" },
  { id: "spiky", label: "Spiky" },
  { id: "afro", label: "Afro" },
  { id: "afro-puff", label: "High puff" },
  { id: "two-puffs", label: "Two puffs" },
  { id: "twa", label: "TWA" },
  { id: "curly", label: "Curly" },
  { id: "locs", label: "Locs" },
  { id: "box-braids", label: "Box braids" },
  { id: "cornrows", label: "Cornrows" },
  { id: "wavy-long", label: "Wavy" },
  { id: "straight-long", label: "Straight" },
  { id: "bob", label: "Bob" }
];

export const HAIR_COLOR_PRESETS = [
  { name: "Jet black", color: "#141210", group: "natural" },
  { name: "Soft black", color: "#2a241f", group: "natural" },
  { name: "Dark brown", color: "#3d2a1c", group: "natural" },
  { name: "Chestnut", color: "#5c3a22", group: "natural" },
  { name: "Auburn", color: "#7a3222", group: "natural" },
  { name: "Copper red", color: "#a34b28", group: "natural" },
  { name: "Honey blonde", color: "#c9a052", group: "natural" },
  { name: "Platinum blonde", color: "#ece4cf", group: "natural" },
  { name: "Ash blonde", color: "#c2b596", group: "natural" },
  { name: "Gray / silver", color: "#c5c4c8", group: "natural" },
  { name: "Neon violet", color: "#c280ff", group: "fantasy" },
  { name: "Hot pink", color: "#ff7fb4", group: "fantasy" },
  { name: "Cyan", color: "#67e8d4", group: "fantasy" },
  { name: "Electric blue", color: "#7dbdff", group: "fantasy" },
  { name: "Mint", color: "#9be08a", group: "fantasy" }
];

export const SKIN_TONE_PRESETS = [
  { name: "Very light, cool", color: "#f6ece8", group: "human" },
  { name: "Very light", color: "#f6dfd2", group: "human" },
  { name: "Very light, warm", color: "#f3d4b8", group: "human" },
  { name: "Light", color: "#edc4aa", group: "human" },
  { name: "Light, cool", color: "#e6c2b4", group: "human" },
  { name: "Light, warm", color: "#dca889", group: "human" },
  { name: "Medium-light", color: "#c9a07a", group: "human" },
  { name: "Medium tan", color: "#bd8461", group: "human" },
  { name: "Medium olive", color: "#a97452", group: "human" },
  { name: "Medium-deep golden", color: "#9a6a48", group: "human" },
  { name: "Brown, warm", color: "#875638", group: "human" },
  { name: "Brown, cool", color: "#7a4e42", group: "human" },
  { name: "Deep brown", color: "#603b2f", group: "human" },
  { name: "Deep, cool", color: "#4a2e2c", group: "human" },
  { name: "Rich dark", color: "#3e2928", group: "human" },
  { name: "Very deep", color: "#261512", group: "human" },
  { name: "Lavender", color: "#c9b6e8", group: "fantasy" },
  { name: "Blue", color: "#9ab9df", group: "fantasy" },
  { name: "Rose", color: "#d6a4b5", group: "fantasy" },
  { name: "Mint", color: "#a9c8b9", group: "fantasy" }
];

const VALID = {
  hairstyle: HAIRSTYLE_PRESETS.map((preset) => preset.id),
  outfit: ["armor", "jacket", "techwear"],
  build: ["slim", "medium", "athletic"]
};

const COLOR_KEYS = [
  "hairColor", "skinTone", "eyeColor", "outfitPrimary", "outfitAccent", "glowColor"
];

function validColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function sanitizeCustomLook(value) {
  const output = { ...DEFAULT_CUSTOM_LOOK };
  if (!value || typeof value !== "object" || Array.isArray(value)) return output;

  if (typeof value.name === "string") output.name = value.name.slice(0, 16);
  for (const key of Object.keys(VALID)) {
    let candidate = value[key];
    if (key === "hairstyle" && candidate === "long") candidate = "straight-long";
    if (VALID[key].includes(candidate)) output[key] = candidate;
  }
  for (const key of COLOR_KEYS) {
    if (validColor(value[key])) output[key] = value[key];
  }
  return output;
}

export function loadCustomLook() {
  try {
    const serialized = localStorage.getItem(CUSTOM_STORAGE_KEY);
    return serialized ? sanitizeCustomLook(JSON.parse(serialized)) : { ...DEFAULT_CUSTOM_LOOK };
  } catch {
    return { ...DEFAULT_CUSTOM_LOOK };
  }
}

export function saveCustomLook(look) {
  const safeLook = sanitizeCustomLook(look);
  safeLook.name = safeLook.name.trim();
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(safeLook));
  } catch {
    /* Storage may be blocked; the current session remains usable. */
  }
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
    brows: make("#332820"),
    skin: make("#ffffff"),
    skinShade: make("#8a7780"),
    eyeWhite: make("#fbf8ff"),
    iris: make("#ffffff", { emissive: "#ffffff", emissiveIntensity: 0.7 }),
    pupil: make("#16131d"),
    outline: new THREE.MeshBasicMaterial({ color: "#1c1725", side: THREE.BackSide }),
    shirt: make("#ffffff"),
    primary: make("#ffffff"),
    accent: make("#ffffff"),
    dark: make("#191720"),
    darkLight: make("#302c38"),
    glow: make("#ffffff", { emissive: "#ffffff", emissiveIntensity: 1.25 })
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
  const parent = options.parent || root;
  parent.add(object);
  if (options.outline !== false) addOutline(root, object, options.outlineScale || 1.035);
  return object;
}

function ellipsoid(root, material, position, scale, segments = 24, group = root) {
  const THREE = root.userData.THREE;
  const object = new THREE.Mesh(
    new THREE.SphereGeometry(1, segments, Math.max(16, Math.floor(segments * 0.72))),
    material
  );
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
  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.82, radius, direction.length(), segments),
    material
  );
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
  addOutline(root, object, 1.025);
  return object;
}

function clearGroup(root, group) {
  group.traverse((object) => {
    if (object.isMesh) object.geometry.dispose();
  });
  while (group.children.length) group.remove(group.children[0]);
}

function setMaterialColor(material, color, emissiveColor = null) {
  material.color.set(color);
  if (emissiveColor && material.emissive) material.emissive.set(emissiveColor);
}

export function createCustomFigure(options) {
  const { THREE, toonGradient } = options;
  const root = new THREE.Group();
  root.name = "Custom Character";
  root.userData.THREE = THREE;
  root.userData.toonGradient = toonGradient;
  root.userData.materials = makeMaterials(THREE, toonGradient);
  root.userData.headGroup = new THREE.Group();
  root.userData.headGroup.name = "custom-hair";
  root.userData.clothingGroup = new THREE.Group();
  root.userData.clothingGroup.name = "custom-outfit";
  root.userData.bodyGroup = new THREE.Group();
  root.userData.bodyGroup.name = "custom-body";
  root.add(root.userData.bodyGroup);
  root.add(root.userData.headGroup);
  root.add(root.userData.clothingGroup);

  buildBase(root);
  applyCustomLook(root, DEFAULT_CUSTOM_LOOK);
  return root;
}

function buildBase(root) {
  const THREE = root.userData.THREE;
  const m = root.userData.materials;
  const body = root.userData.bodyGroup;

  for (const side of [-1, 1]) {
    const x = side * 0.14;
    objectMesh(root, new THREE.BoxGeometry(0.13, 0.07, 0.29), m.dark, [x, 0.08, 0.07], null, { parent: body });
    ellipsoid(root, m.primary, [x, 0.15, 0.12], [0.09, 0.1, 0.19], 22, body);
    link(root, [x, 0.17, 0], [side * 0.15, 0.68, 0], 0.057, m.darkLight, 18, body);
    ellipsoid(root, m.dark, [side * 0.15, 0.69, 0], [0.07, 0.07, 0.07], 18, body);
    link(root, [side * 0.15, 0.71, 0], [side * 0.17, 1.16, 0], 0.08, m.darkLight, 20, body);
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
  }

  /* Face, eyebrow shapes, ears, and large anime eyes. */
  ellipsoid(root, m.skin, [0, 2.045, 0], [0.195, 0.265, 0.16], 32, body);
  for (const side of [-1, 1]) {
    ellipsoid(root, m.skinShade, [side * 0.197, 2.04, 0], [0.035, 0.06, 0.045], 18, body);
    const x = side * 0.078;

    ellipsoid(root, m.dark, [x, 2.065, 0.139], [0.061, 0.07, 0.03], 22, body);
    ellipsoid(root, m.eyeWhite, [x, 2.06, 0.158], [0.049, 0.055, 0.022], 22, body);
    ellipsoid(root, m.iris, [x, 2.055, 0.176], [0.027, 0.037, 0.014], 20, body);
    ellipsoid(root, m.pupil, [x, 2.057, 0.188], [0.011, 0.025, 0.008], 14, body);
    ellipsoid(root, m.eyeWhite, [x - 0.008, 2.072, 0.194], [0.008, 0.011, 0.005], 10, body);

    objectMesh(root, new THREE.CapsuleGeometry(0.008, 0.035, 3, 8), m.brows, [x, 2.145, 0.15], [1, 1, 0.65], {
      rotation: [0, 0, side * -0.15],
      parent: body,
      outline: false
    });
  }

  objectMesh(root, new THREE.ConeGeometry(0.012, 0.035, 8), m.skinShade, [0, 2.015, 0.158], null, {
    rotation: [Math.PI, 0, 0],
    parent: body,
    outline: false
  });
  objectMesh(root, new THREE.BoxGeometry(0.04, 0.008, 0.008), m.skinShade, [0, 1.975, 0.15], null, {
    parent: body,
    outline: false
  });
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
}

function removeChildren(group) {
  for (const child of [...group.children]) {
    child.traverse((object) => {
      if (object.isMesh) object.geometry.dispose();
    });
    group.remove(child);
  }
}

function addHairOutline(root, object, factor = 1.035) {
  const hull = new root.userData.THREE.Mesh(object.geometry, root.userData.materials.outline);
  hull.position.copy(object.position);
  hull.quaternion.copy(object.quaternion);
  hull.scale.copy(object.scale).multiplyScalar(factor);
  hull.renderOrder = object.renderOrder - 1;
  object.parent.add(hull);
}

function addHairEllipsoid(root, group, material, position, scale, segments = 16, outlined = true) {
  const THREE = root.userData.THREE;
  const object = new THREE.Mesh(new THREE.SphereGeometry(1, segments, Math.max(10, Math.floor(segments * 0.65))), material);
  object.position.set(...position);
  object.scale.set(...scale);
  object.castShadow = true;
  group.add(object);
  if (outlined) addHairOutline(root, object, 1.025);
  return object;
}

function buildHair(root, style) {
  const THREE = root.userData.THREE;
  const group = root.userData.headGroup;
  const m = root.userData.materials;
  removeChildren(group);

  const add = (x, y, z, sx, sy, sz, material = m.hair, segments = 16, outlined = true) =>
    addHairEllipsoid(root, group, material, [x, y, z], [sx, sy, sz], segments, outlined);

  const strand = (start, end, radius, material = m.hair, segments = 8, outlined = false) => {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const axis = new THREE.Vector3().subVectors(b, a);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.78, radius, axis.length(), segments), material);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
    mesh.castShadow = true;
    group.add(mesh);
    if (outlined) addHairOutline(root, mesh);
    return mesh;
  };

  const coneLock = (x, y, z, radius, height, angle = 0, material = m.hair) => {
    const lock = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 9), material);
    lock.position.set(x, y, z);
    lock.rotation.z = angle;
    lock.castShadow = true;
    group.add(lock);
    addHairOutline(root, lock, 1.025);
  };

  const cap = (sx = 0.205, sy = 0.105, sz = 0.18) => {
    add(0, 2.245, -0.025, sx, sy, sz, m.hairShade, 24, true);
    add(0, 2.265, -0.018, sx * 0.96, sy * 0.92, sz * 0.96, m.hair, 24, true);
  };

  const fringe = () => {
    coneLock(-0.11, 2.185, 0.11, 0.07, 0.2, 0.4);
    coneLock(-0.025, 2.18, 0.13, 0.065, 0.17, 0.12, m.hairShade);
    coneLock(0.075, 2.19, 0.11, 0.06, 0.16, -0.27);
  };

  const occludesFace = (px, py, pz, r = 0.04) => {
    /* Eyes, nose, mouth, and cheeks sit around (0, 2.045, 0.16). Never let hair enter that volume. */
    if (py - r < 2.24 && pz + r > 0.04 && Math.abs(px) < 0.20 + r) return true;
    const dx = px / (0.22 + r);
    const dy = (py - 2.045) / (0.28 + r);
    const dz = pz / (0.20 + r);
    return dx * dx + dy * dy + dz * dz < 1 && pz + r > 0.02 && py - r < 2.26;
  };

  const coilField = (centerX, centerY, centerZ, rx, ry, rz, count, seed = 0, radius = 0.037, shaded = true) => {
    for (let index = 0; index < count; index += 1) {
      const u = (index + 0.5) / count;
      const y = 1 - 2 * u;
      const radial = Math.sqrt(Math.max(0, 1 - y * y));
      const angle = index * 2.399963 + seed;
      const x = Math.cos(angle) * radial;
      const z = Math.sin(angle) * radial;
      const px = centerX + x * rx;
      const py = centerY + y * ry;
      const pz = centerZ + z * rz;
      const pr = radius * (0.88 + (index % 4) * 0.06);
      if (occludesFace(px, py, pz, Math.max(pr, radius))) continue;
      add(
        px,
        py,
        pz,
        pr,
        radius,
        radius * (0.82 + (index % 3) * 0.07),
        shaded && index % 5 === 0 ? m.hairShade : m.hair,
        12,
        false
      );
    }
  };

  if (style === "afro" || style === "twa") {
    const isAfro = style === "afro";
    cap(isAfro ? 0.22 : 0.20, isAfro ? 0.11 : 0.10, isAfro ? 0.18 : 0.17);
    if (isAfro) {
      /* Solid shaded core so jet-black afro reads as a lush silhouette, not sparse dots. */
      add(0, 2.36, -0.08, 0.30, 0.25, 0.22, m.hairShade, 24, true);
      coilField(0, 2.34, -0.05, 0.34, 0.26, 0.26, 90, 0.4, 0.048);
    } else {
      add(0, 2.30, -0.06, 0.18, 0.14, 0.16, m.hairShade, 20, true);
      coilField(0, 2.30, -0.05, 0.22, 0.15, 0.19, 52, 0.4, 0.030);
    }
    return;
  }

  if (style === "afro-puff" || style === "two-puffs") {
    cap(0.205, 0.1, 0.18);
    const positions = style === "afro-puff"
      ? [[0, 2.50, -0.03, 0.24, 0.22, 0.22]]
      : [[-0.22, 2.42, -0.03, 0.19, 0.19, 0.18], [0.22, 2.42, -0.03, 0.19, 0.19, 0.18]];
    for (let p = 0; p < positions.length; p += 1) {
      const [cx, cy, cz, rx, ry, rz] = positions[p];
      /* Outlined hair core is the silhouette; coils sit on the surface so gaps never show background. */
      add(cx, cy, cz, rx, ry, rz, m.hair, 22, true);
      coilField(cx, cy, cz, rx * 0.95, ry * 0.95, rz * 0.95, 80, p * 1.7, 0.045, false);
      const bandY = style === "afro-puff" ? 2.30 : 2.28;
      add(cx, bandY, -0.01, 0.105, 0.035, 0.105, m.accent, 16, true);
    }
    return;
  }

  if (style === "curly") {
    cap();
    fringe();
    for (const side of [-1, 1]) {
      for (let row = 0; row < 5; row += 1) {
        const y = 2.18 - row * 0.105;
        const x = side * (0.18 + (row > 2 ? 0.015 : 0));
        add(x, y, 0.015, 0.075, 0.09, 0.09, row % 2 ? m.hair : m.hairShade, 14, true);
        add(x + side * 0.035, y - 0.04, 0.02, 0.035, 0.038, 0.04, m.hair, 12, false);
      }
    }
    for (let i = 0; i < 5; i += 1) {
      add(-0.16 + i * 0.08, 1.88 + (i % 2) * 0.035, 0.025, 0.045, 0.07, 0.055, i % 2 ? m.hairShade : m.hair, 12, false);
    }
    return;
  }

  if (style === "locs" || style === "box-braids") {
    cap(0.21, 0.1, 0.18);
    if (style === "locs") fringe();
    const isLocs = style === "locs";
    const width = isLocs ? 0.026 : 0.019;
    const roots = [];

    const hang = (x0, y0, z0, x1, y1, z1, material) => {
      /* Front-facing strands must stay outside the face; back strands stay behind the head. */
      if (z0 > -0.04 && Math.abs(x0) < 0.155) return;
      if (z1 > -0.04 && Math.abs(x1) < 0.16) {
        x1 = Math.sign(x1 || x0 || 1) * 0.18;
      }
      if (z0 <= -0.05 && z1 > -0.05) z1 = -0.06;
      strand([x0, y0, z0], [x1, y1, z1], width, material, 7, false);
      add(x1, y1, z1, width * 0.78, width * 0.85, width * 0.78, m.hair, 10, false);
      roots.push([x0, y0, z0]);
    };

    const frontXs = isLocs
      ? [-0.23, -0.185, 0.185, 0.23]
      : [-0.25, -0.21, -0.175, 0.175, 0.21, 0.25];
    for (let i = 0; i < frontXs.length; i += 1) {
      const x = frontXs[i];
      const variation = (i % 5) * 0.045;
      const length = (isLocs ? 0.62 : 0.78) + variation;
      const xEnd = Math.sign(x) * Math.max(Math.abs(x), 0.18);
      hang(x, 2.28, 0.05, xEnd, 2.28 - length, -0.02, i % 6 === 0 ? m.hairShade : m.hair);
    }

    const midXs = isLocs ? [-0.20, 0.20] : [-0.22, -0.18, 0.18, 0.22];
    for (const x of midXs) {
      const length = isLocs ? 0.64 : 0.80;
      const xEnd = Math.sign(x) * (Math.abs(x) + 0.02);
      hang(x, 2.26, -0.02, xEnd, 2.26 - length, -0.05, m.hair);
    }

    const backCols = isLocs ? 7 : 8;
    const backRows = isLocs ? 2 : 3;
    for (let row = 0; row < backRows; row += 1) {
      for (let column = 0; column < backCols; column += 1) {
        const x = (column / (backCols - 1) - 0.5) * 0.36;
        const yStart = 2.27 - row * 0.03;
        const z = -0.08 - row * 0.055;
        const variation = ((column * 7 + row * 3) % 5) * 0.045;
        const length = (isLocs ? 0.62 : 0.78) + variation;
        const sideShift = isLocs ? ((column % 3) - 1) * 0.03 : Math.sign(x || 1) * 0.01;
        hang(x, yStart, z, x + sideShift, yStart - length, z - 0.02, column % 6 === 0 ? m.hairShade : m.hair);
      }
    }

    if (!isLocs) {
      for (const [x, y, z] of roots) {
        add(x, y, z, 0.012, 0.012, 0.012, m.hairShade, 8, false);
      }
    }
    return;
  }

  if (style === "cornrows") {
    cap(0.21, 0.105, 0.19);
    const rowCount = 7;
    for (let row = 0; row < rowCount; row += 1) {
      const x = (row / (rowCount - 1) - 0.5) * 0.30;
      for (let segment = 0; segment < 6; segment += 1) {
        const z = 0.10 - segment * 0.058;
        const front = segment < 2;
        const y = (front ? 2.325 : 2.305) - Math.abs(x) * 0.14 + segment * 0.003;
        add(x, y, z, 0.027, front ? 0.042 : 0.032, 0.052, front || segment % 2 ? m.hair : m.hairShade, 12, false);
      }
    }
    for (const side of [-1, 0, 1]) {
      add(side * 0.09, 2.10, -0.22, 0.045, 0.10, 0.05, side === 0 ? m.hair : m.hairShade, 14, true);
      add(side * 0.10, 1.94, -0.23, 0.038, 0.10, 0.045, m.hair, 12, true);
    }
    return;
  }

  if (style === "ponytail") {
    cap();
    fringe();
    add(-0.19, 2.17, -0.02, 0.07, 0.19, 0.11, m.hairShade, 16, true);
    add(0.19, 2.17, -0.02, 0.07, 0.19, 0.11, m.hair, 16, true);
    add(0.08, 2.18, -0.21, 0.12, 0.1, 0.13, m.hair, 16, true);
    add(0.17, 2.02, -0.26, 0.095, 0.22, 0.11, m.hair, 16, true);
    add(0.21, 1.83, -0.28, 0.075, 0.17, 0.085, m.hairShade, 16, true);
    add(0.22, 1.68, -0.25, 0.055, 0.13, 0.065, m.hair, 16, true);
    return;
  }

  if (style === "spiky") {
    cap();
    fringe();
    for (const spike of [
      [-0.16, 2.34, -0.02, 0.075, 0.24, -0.34],
      [-0.055, 2.37, -0.035, 0.07, 0.27, -0.12],
      [0.055, 2.36, -0.025, 0.075, 0.26, 0.14],
      [0.16, 2.32, -0.015, 0.07, 0.23, 0.36],
      [-0.2, 2.16, -0.045, 0.065, 0.21, -0.58],
      [0.2, 2.15, -0.04, 0.065, 0.2, 0.58]
    ]) coneLock(spike[0], spike[1], spike[2], spike[3], spike[4], spike[5]);
    return;
  }

  if (style === "wavy-long") {
    cap();
    fringe();
    for (const side of [-1, 1]) {
      for (let strandIndex = 0; strandIndex < 4; strandIndex += 1) {
        const x = side * (0.15 + strandIndex * 0.035);
        const offset = (strandIndex % 2) * 0.045;
        add(x, 2.02, -0.005, 0.055, 0.22, 0.075, strandIndex % 2 ? m.hair : m.hairShade, 16, true);
        add(x + side * 0.018, 1.82, -0.025 + offset, 0.055, 0.22, 0.075, m.hair, 16, true);
        add(x - side * 0.018, 1.61, -0.015 - offset, 0.055, 0.2, 0.075, m.hairShade, 16, true);
      }
    }
    add(-0.16, 2.04, 0.07, 0.05, 0.28, 0.055, m.hair, 16, true);
    add(0.15, 2.04, 0.07, 0.05, 0.28, 0.055, m.hairShade, 16, true);
    return;
  }

  if (style === "bob") {
    cap();
    fringe();
    add(-0.19, 2.04, -0.01, 0.07, 0.22, 0.1, m.hairShade, 18, true);
    add(0.19, 2.04, -0.01, 0.07, 0.22, 0.1, m.hair, 18, true);
    add(-0.2, 1.91, 0.015, 0.065, 0.1, 0.09, m.hair, 16, true);
    add(0.2, 1.91, 0.015, 0.065, 0.1, 0.09, m.hairShade, 16, true);
    return;
  }

  /* Crop and straight-long (including migrated session 3 "long"). */
  cap();
  fringe();

  if (style === "straight-long") {
    for (const side of [-1, 1]) {
      const x = side * 0.19;
      add(x, 1.97, -0.01, 0.07, 0.31, 0.105, side < 0 ? m.hair : m.hairShade, 18, true);
      add(x, 1.71, -0.015, 0.067, 0.24, 0.09, m.hair, 18, true);
      add(side * 0.17, 2.02, 0.075, 0.052, 0.31, 0.055, m.hair, 16, true);
    }
  } else {
    add(-0.19, 2.15, -0.01, 0.07, 0.18, 0.1, m.hairShade, 16, true);
    add(0.19, 2.15, -0.01, 0.07, 0.18, 0.1, m.hair, 16, true);
    coneLock(-0.19, 2.07, 0.035, 0.055, 0.18, 0.2, m.hairShade);
    coneLock(0.18, 2.08, 0.04, 0.055, 0.17, -0.24);
  }
}

function buildOutfit(root, style) {
  const THREE = root.userData.THREE;
  const group = root.userData.clothingGroup;
  const m = root.userData.materials;
  removeChildren(group);

  const panel = (points, depth, material) => plate(root, points, depth, material, group, 0.018);
  const torso = (material) => addHairEllipsoid(root, group, material, [0, 1.48, 0.015], [0.22, 0.24, 0.145], 28, true);

  if (style === "armor") {
    torso(m.dark);
    for (const side of [-1, 1]) {
      panel([
        [side * 0.025, 1.76], [side * 0.16, 1.78], [side * 0.27, 1.66],
        [side * 0.22, 1.51], [side * 0.08, 1.48], [side * 0.035, 1.58]
      ], 0.065, m.primary);
      panel([
        [side * 0.085, 1.44], [side * 0.2, 1.46], [side * 0.225, 1.3], [side * 0.14, 1.27]
      ], 0.055, m.accent);
      panel([
        [side * 0.3, 1.75], [side * 0.4, 1.78], [side * 0.43, 1.68], [side * 0.33, 1.63]
      ], 0.05, m.accent);
      panel([
        [side * 0.1, 0.31], [side * 0.19, 0.33], [side * 0.2, 0.59],
        [side * 0.15, 0.68], [side * 0.11, 0.58]
      ], 0.04, m.primary);
    }
    panel([[-0.17, 1.27], [0, 1.31], [0.17, 1.27], [0.13, 1.17], [0, 1.14], [-0.13, 1.17]], 0.05, m.primary);
  } else if (style === "jacket") {
    torso(m.dark);
    for (const side of [-1, 1]) {
      panel([
        [side * 0.025, 1.78], [side * 0.21, 1.76], [side * 0.25, 1.52],
        [side * 0.14, 1.38], [side * 0.045, 1.48]
      ], 0.07, m.primary);
      panel([
        [side * 0.31, 1.74], [side * 0.4, 1.78], [side * 0.43, 1.57], [side * 0.35, 1.5]
      ], 0.05, m.primary);
    }
    panel([[-0.07, 1.74], [0.07, 1.74], [0.08, 1.42], [-0.08, 1.42]], 0.08, m.accent);
    panel([[-0.15, 1.3], [0, 1.34], [0.15, 1.3], [0.13, 1.21], [-0.13, 1.21]], 0.045, m.dark);
  } else {
    torso(m.dark);
    for (const side of [-1, 1]) {
      panel([
        [side * 0.04, 1.75], [side * 0.2, 1.76], [side * 0.24, 1.48],
        [side * 0.14, 1.38], [side * 0.04, 1.49]
      ], 0.07, m.primary);
      panel([
        [side * 0.3, 1.76], [side * 0.41, 1.78], [side * 0.44, 1.52], [side * 0.34, 1.47]
      ], 0.055, m.accent);
      panel([
        [side * 0.12, 1.25], [side * 0.21, 1.28], [side * 0.23, 1.12], [side * 0.15, 1.1]
      ], 0.05, m.accent);
    }
    const hood = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.055, 12, 28, Math.PI), m.primary);
    hood.position.set(0, 1.91, -0.075);
    hood.rotation.z = Math.PI;
    group.add(hood);
    addHairOutline(root, hood, 1.035);
  }

  const seam = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.22, 0.018),
    style === "jacket" ? m.accent : m.glow
  );
  seam.position.set(0, 1.58, 0.17);
  group.add(seam);
  addHairOutline(root, seam, 1.04);

  for (const side of [-1, 1]) {
    const knee = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.035, 0.025),
      style === "armor" ? m.accent : m.primary
    );
    knee.position.set(side * 0.15, 0.69, 0.085);
    group.add(knee);
    addHairOutline(root, knee);
  }
}

function derivedBrowColor(THREE, hairColor, skinTone) {
  const hair = String(hairColor).toLowerCase();
  const fantasy = new Set(
    HAIR_COLOR_PRESETS
      .filter((preset) => preset.group === "fantasy")
      .map((preset) => preset.color.toLowerCase())
  );
  const color = new THREE.Color(hair);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  const highSaturation = hsl.s > 0.35 && (hsl.h > 0.58 || hsl.h < 0.13 || hsl.h > 0.82);
  if (!fantasy.has(hair) && !highSaturation) return hairColor;

  const skin = new THREE.Color(skinTone);
  const skinHsl = { h: 0, s: 0, l: 0 };
  skin.getHSL(skinHsl);
  const brow = skin.clone();
  brow.offsetHSL(0.025, -0.12, skinHsl.l > 0.6 ? -0.42 : -0.22);
  return `#${brow.getHexString()}`;
}

export function applyCustomLook(figure, lookInput) {
  const look = sanitizeCustomLook(lookInput);
  const m = figure.userData.materials;
  const previous = figure.userData.look;
  const THREE = figure.userData.THREE;

  m.hair.color.set(look.hairColor);
  m.hairShade.color.set(look.hairColor);
  m.hairShade.color.offsetHSL(0, -0.08, -0.16);
  m.brows.color.set(derivedBrowColor(THREE, look.hairColor, look.skinTone));
  m.skin.color.set(look.skinTone);
  m.skinShade.color.set(look.skinTone);
  m.skinShade.color.offsetHSL(0, -0.1, -0.18);
  m.iris.color.set(look.eyeColor);
  m.iris.emissive.set(look.glowColor);
  m.primary.color.set(look.outfitPrimary);
  m.accent.color.set(look.outfitAccent);
  m.glow.color.set(look.glowColor);
  m.glow.emissive.set(look.glowColor);

  const bodyChanged = !previous || previous.build !== look.build;
  const hairChanged = !previous || previous.hairstyle !== look.hairstyle;
  const outfitChanged = !previous || previous.outfit !== look.outfit;

  if (bodyChanged) {
    const factor = look.build === "slim" ? 0.9 : look.build === "athletic" ? 1.1 : 1;
    figure.userData.bodyGroup.scale.set(factor, 1, look.build === "athletic" ? 1.05 : 1);
  }
  if (hairChanged) buildHair(figure, look.hairstyle);
  if (outfitChanged) buildOutfit(figure, look.outfit);

  figure.userData.look = look;
  figure.userData.name = look.name.trim() || "Custom";
  return figure;
}

export function randomCustomLook(name = "") {
  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  const outfitColors = ["#273447", "#315b65", "#68435d", "#555b38", "#654c3d", "#d8c7aa", "#b94a58", "#5d61a7", "#c8d5d2", "#344f73"];
  const humanTones = SKIN_TONE_PRESETS.filter((preset) => preset.group === "human");
  const fantasyTones = SKIN_TONE_PRESETS.filter((preset) => preset.group === "fantasy");
  const skinTone = Math.random() < 0.84 ? pick(humanTones).color : pick(fantasyTones).color;
  const eyeColors = ["#65d9d1", "#79a9ff", "#c286ff", "#83c777", "#cc8b67", "#b6d7ef"];
  const glowColors = ["#67e8d4", "#7dbdff", "#bd85ff", "#ff7fb4", "#c0ea8a"];

  return sanitizeCustomLook({
    ...DEFAULT_CUSTOM_LOOK,
    name: String(name).slice(0, 16),
    hairstyle: pick(HAIRSTYLE_PRESETS).id,
    hairColor: pick(HAIR_COLOR_PRESETS).color,
    skinTone,
    eyeColor: pick(eyeColors),
    outfit: pick(VALID.outfit),
    outfitPrimary: pick(outfitColors),
    outfitAccent: pick(outfitColors),
    glowColor: pick(glowColors),
    build: pick(VALID.build)
  });
}
