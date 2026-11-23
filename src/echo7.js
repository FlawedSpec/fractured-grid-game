export function createEcho7(options) {
  const { THREE, toonGradient } = options;
  const lineMaterial = options.mats?.line || new THREE.MeshBasicMaterial({
    color: "#21152f",
    side: THREE.BackSide
  });

  const material = (color, extra = {}) => options.makeMaterial
    ? options.makeMaterial(color, extra)
    : new THREE.MeshToonMaterial({
      color,
      gradientMap: toonGradient,
      ...extra
    });

  const materials = {
    skin: material("#d5c6ed"),
    skinShade: material("#a99aca"),
    hair: material("#f4f1ff"),
    hairLight: material("#fffaff"),
    hairShade: material("#aaa1bf"),
    armor: material("#f5f2ff"),
    armorShade: material("#cbc4df"),
    black: material("#17131f"),
    blackLight: material("#30283a"),
    violet: material("#b84cff", {
      emissive: "#8c24ef",
      emissiveIntensity: 1.35
    }),
    violetBright: material("#d889ff", {
      emissive: "#a742ff",
      emissiveIntensity: 2
    }),
    eyeWhite: material("#fbf9ff", {
      emissive: "#c4a6ff",
      emissiveIntensity: 0.2
    }),
    iris: material("#bc8cff", {
      emissive: "#852bff",
      emissiveIntensity: 1.05
    }),
    pupil: material("#30213f")
  };

  const root = new THREE.Group();
  root.name = "ECHO-7";

  function outline(meshObject, factor = 1.035) {
    const hull = new THREE.Mesh(meshObject.geometry, lineMaterial);
    hull.position.copy(meshObject.position);
    hull.quaternion.copy(meshObject.quaternion);
    hull.scale.copy(meshObject.scale).multiplyScalar(factor);
    hull.renderOrder = meshObject.renderOrder - 1;
    hull.castShadow = false;
    hull.receiveShadow = false;
    meshObject.parent.add(hull);
  }

  function addMesh(geometry, mat, position, scale, rotation, options = {}) {
    const object = new THREE.Mesh(geometry, mat);
    if (position) object.position.set(...position);
    if (scale) object.scale.set(...scale);
    if (rotation) object.rotation.set(...rotation);
    object.castShadow = true;
    object.receiveShadow = true;
    root.add(object);
    if (options.outline !== false) outline(object, options.outlineScale || 1.035);
    return object;
  }

  function ellipsoid(mat, position, scale, segments = 24) {
    return addMesh(
      new THREE.SphereGeometry(1, segments, Math.max(16, Math.floor(segments * 0.72))),
      mat,
      position,
      scale
    );
  }

  function taperedLink(start, end, radius, mat, segments = 16, tipRadius = radius * 0.82) {
    const a = new THREE.Vector3(...start);
    const b = new THREE.Vector3(...end);
    const direction = new THREE.Vector3().subVectors(b, a);
    const length = direction.length();
    const part = addMesh(
      new THREE.CylinderGeometry(tipRadius, radius, length, segments, 1),
      mat,
      null,
      null,
      null
    );
    part.position.copy(a).add(b).multiplyScalar(0.5);
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    ellipsoid(mat, start, [radius, radius, radius], segments);
    ellipsoid(mat, end, [tipRadius, tipRadius, tipRadius], segments);
    return part;
  }

  function plate(points, depth, mat, bevel = 0.04) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) {
      shape.lineTo(points[i][0], points[i][1]);
    }
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 12
    });
    return addMesh(geometry, mat, [0, 0, -depth * 0.45], null, null);
  }

  function ring(position, radius, tube, color, rotation = [Math.PI / 2, 0, 0]) {
    const object = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 10, 40),
      new THREE.MeshBasicMaterial({ color })
    );
    object.position.set(...position);
    object.rotation.set(...rotation);
    object.renderOrder = 2;
    root.add(object);
    return object;
  }

  function light(position, color, intensity, distance) {
    const object = new THREE.PointLight(color, intensity, distance, 2);
    object.position.set(...position);
    root.add(object);
    return object;
  }

  /* Boots, heels and slim armored lower legs. */
  for (const side of [-1, 1]) {
    const x = side * 0.13;

    addMesh(
      new THREE.BoxGeometry(0.13, 0.08, 0.31),
      materials.black,
      [x, 0.09, 0.055],
      null,
      null
    );
    addMesh(
      new THREE.ConeGeometry(0.035, 0.15, 12),
      materials.armorShade,
      [x, 0.105, -0.085],
      [1, 1, 1],
      [Math.PI, 0, 0]
    );
    ellipsoid(materials.armor, [x, 0.16, 0.12], [0.105, 0.12, 0.22], 24);
    taperedLink([x, 0.18, 0], [side * 0.15, 0.66, 0], 0.065, materials.black, 18, 0.052);
    ellipsoid(materials.armorShade, [side * 0.15, 0.69, 0.025], [0.078, 0.105, 0.085], 24);
    taperedLink([side * 0.15, 0.69, 0], [side * 0.17, 1.12, 0], 0.095, materials.black, 20, 0.072);

    /* Shin armor shells with pointed, fitted profiles. */
    const shin = plate([
      [side * 0.095, 0.29],
      [side * 0.195, 0.31],
      [side * 0.205, 0.59],
      [side * 0.15, 0.68],
      [side * 0.105, 0.58]
    ], 0.055, materials.armor, 0.018);
    shin.position.z = 0.075;

    addMesh(
      new THREE.BoxGeometry(0.16, 0.035, 0.055),
      materials.violet,
      [side * 0.15, 0.38, 0.135],
      null,
      null
    );
    ellipsoid(materials.blackLight, [side * 0.17, 0.99, 0], [0.12, 0.19, 0.105], 24);
  }

  /* Compact waist and fitted pelvic armor, without skirt-like flares. */
  ellipsoid(materials.black, [0, 1.2, 0], [0.205, 0.14, 0.145], 28);
  addMesh(
    new THREE.CylinderGeometry(0.175, 0.19, 0.105, 24, 1),
    materials.armorShade,
    [0, 1.2, 0],
    [1, 1, 0.82],
    null
  );
  plate([
    [-0.18, 1.29],
    [0, 1.33],
    [0.18, 1.29],
    [0.145, 1.15],
    [0, 1.1],
    [-0.145, 1.15]
  ], 0.05, materials.armor);
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.BoxGeometry(0.12, 0.16, 0.09),
      materials.armorShade,
      [side * 0.19, 1.2, 0],
      null,
      [0, 0, side * -0.1]
    );
  }

  /* Fitted black body suit and sculpted, segmented chest armor. */
  taperedLink([0, 1.26, 0], [0, 1.77, 0], 0.18, materials.black, 24, 0.23);
  ellipsoid(materials.blackLight, [0, 1.43, 0], [0.185, 0.23, 0.135], 28);
  ellipsoid(materials.blackLight, [0, 1.67, 0], [0.235, 0.16, 0.13], 28);

  for (const side of [-1, 1]) {
    plate([
      [side * 0.02, 1.76],
      [side * 0.17, 1.79],
      [side * 0.29, 1.68],
      [side * 0.235, 1.51],
      [side * 0.105, 1.47],
      [side * 0.035, 1.57]
    ], 0.075, materials.armor, 0.025);
  }
  addMesh(
    new THREE.ConeGeometry(0.095, 0.31, 6),
    materials.armorShade,
    [0, 1.57, 0.145],
    [0.78, 1, 0.45],
    [Math.PI, 0, 0]
  );
  addMesh(
    new THREE.TorusGeometry(0.045, 0.012, 8, 24),
    materials.violetBright,
    [0, 1.62, 0.205],
    null,
    [Math.PI / 2, 0, 0],
    { outline: false }
  );
  addMesh(
    new THREE.BoxGeometry(0.035, 0.11, 0.018),
    materials.violetBright,
    [0, 1.49, 0.212],
    null,
    null,
    { outline: false }
  );

  /* Slim arms, dark elbow joints and pearl-white forearm armor. */
  for (const side of [-1, 1]) {
    const shoulder = [side * 0.29, 1.77, 0];
    const elbow = [side * 0.39, 1.48, 0.005];
    const wrist = [side * 0.42, 1.22, 0.035];

    ellipsoid(materials.armorShade, shoulder, [0.125, 0.115, 0.12], 24);
    taperedLink(shoulder, elbow, 0.067, materials.black, 16, 0.055);
    ellipsoid(materials.violet, elbow, [0.073, 0.064, 0.071], 20);
    taperedLink(elbow, wrist, 0.06, materials.black, 16, 0.045);
    ellipsoid(materials.skin, [side * 0.42, 1.17, 0.04], [0.052, 0.09, 0.046], 18);

    plate([
      [side * 0.34, 1.45],
      [side * 0.445, 1.46],
      [side * 0.47, 1.28],
      [side * 0.405, 1.22],
      [side * 0.36, 1.29]
    ], 0.05, materials.armor, 0.017);
    addMesh(
      new THREE.BoxGeometry(0.08, 0.025, 0.025),
      materials.violet,
      [side * 0.41, 1.33, 0.09],
      null,
      null,
      { outline: false }
    );

    /* Shoulder rings are deliberately both electric violet. */
    const emblem = ring([side * 0.31, 1.79, 0.055], 0.105, 0.015, "#a83cff");
    emblem.rotation.set(0, 0, Math.PI / 2);
    light([side * 0.31, 1.79, 0.08], "#9535ff", 1.4, 1.2);
  }

  /* Collar, neck and a narrow, adult anime face. */
  addMesh(
    new THREE.CylinderGeometry(0.072, 0.09, 0.15, 20),
    materials.skin,
    [0, 1.86, 0],
    null,
    null
  );
  addMesh(
    new THREE.TorusGeometry(0.095, 0.012, 8, 28),
    materials.violetBright,
    [0, 1.82, 0],
    null,
    [Math.PI / 2, 0, 0],
    { outline: false }
  );

  ellipsoid(materials.skin, [0, 2.045, 0.005], [0.205, 0.27, 0.17], 32);
  ellipsoid(materials.skinShade, [0, 1.91, 0.045], [0.13, 0.075, 0.12], 24);

  /* Eyes with luminous lavender irises, dark pupils and catchlights. */
  for (const side of [-1, 1]) {
    const x = side * 0.083;

    ellipsoid(materials.black, [x, 2.066, 0.151], [0.067, 0.074, 0.032], 24);
    ellipsoid(materials.eyeWhite, [x, 2.06, 0.17], [0.052, 0.058, 0.023], 24);
    ellipsoid(materials.iris, [x, 2.055, 0.188], [0.028, 0.038, 0.014], 20);
    ellipsoid(materials.pupil, [x, 2.057, 0.2], [0.012, 0.026, 0.008], 16);
    ellipsoid(materials.eyeWhite, [x - 0.009, 2.073, 0.208], [0.009, 0.012, 0.006], 12);

    addMesh(
      new THREE.ConeGeometry(0.011, 0.12, 8),
      materials.black,
      [x, 2.13, 0.148],
      [1, 1, 0.75],
      [0, 0, side * -0.13]
    );
  }

  addMesh(
    new THREE.ConeGeometry(0.014, 0.043, 8),
    materials.skinShade,
    [0, 2.015, 0.172],
    [0.7, 1, 0.6],
    [Math.PI, 0, 0],
    { outline: false }
  );
  addMesh(
    new THREE.BoxGeometry(0.045, 0.009, 0.008),
    materials.skinShade,
    [0, 1.973, 0.161],
    null,
    null,
    { outline: false }
  );

  /* Tousled silver crop: layered crown, broken side locks and swept fringe. */
  ellipsoid(materials.hairShade, [0, 2.245, -0.015], [0.228, 0.115, 0.19], 28);
  ellipsoid(materials.hair, [0, 2.27, -0.025], [0.22, 0.105, 0.185], 28);
  ellipsoid(materials.hairLight, [-0.12, 2.29, 0.015], [0.13, 0.075, 0.12], 22);
  ellipsoid(materials.hair, [0.12, 2.28, -0.015], [0.12, 0.075, 0.12], 22);

  const locks = [
    { p: [-0.15, 2.19, 0.105], s: [0.08, 0.19, 0.065], r: [0, 0, 0.25] },
    { p: [-0.045, 2.18, 0.14], s: [0.07, 0.18, 0.06], r: [0, 0, 0.06] },
    { p: [0.07, 2.19, 0.13], s: [0.07, 0.16, 0.06], r: [0, 0, -0.26] },
    { p: [0.17, 2.14, 0.045], s: [0.07, 0.14, 0.08], r: [0, 0, -0.25] },
    { p: [-0.195, 2.12, 0.01], s: [0.07, 0.15, 0.08], r: [0, 0, 0.18] },
    { p: [-0.1, 2.32, -0.015], s: [0.07, 0.12, 0.08], r: [0, 0, 0.55] },
    { p: [0.04, 2.34, -0.035], s: [0.07, 0.11, 0.08], r: [0, 0, 0.12] },
    { p: [0.17, 2.31, -0.02], s: [0.055, 0.1, 0.07], r: [0, 0, -0.45] }
  ];

  for (let index = 0; index < locks.length; index += 1) {
    const lock = locks[index];
    const strand = addMesh(
      new THREE.ConeGeometry(0.075, 0.24, 9),
      index % 3 === 0 ? materials.hairLight : materials.hair,
      lock.p,
      lock.s,
      lock.r
    );
    strand.rotation.x = index % 2 === 0 ? 0.08 : -0.12;
  }

  /* One-sided right-temple casing and stacked concentric ports.
     The character faces +Z, so her right temple appears at image-left. */
  const moduleX = -0.19;
  addMesh(
    new THREE.BoxGeometry(0.14, 0.2, 0.08),
    materials.black,
    [moduleX, 2.145, 0.015],
    null,
    [0, 0, -0.18]
  );
  addMesh(
    new THREE.BoxGeometry(0.095, 0.16, 0.045),
    materials.armorShade,
    [moduleX, 2.15, 0.069],
    null,
    [0, 0, -0.18]
  );

  for (let index = 0; index < 3; index += 1) {
    const y = 2.205 - index * 0.055;
    const port = ring([moduleX, y, 0.101], 0.022, 0.006, "#a93cff");
    port.rotation.set(0, 0, 0);
    addMesh(
      new THREE.CircleGeometry(0.012, 16),
      materials.violetBright,
      [moduleX, y, 0.1],
      null,
      null,
      { outline: false }
    );
  }

  /* Single luminous ear port under the casing; no matching module on the other side. */
  const earPort = ring([moduleX, 2.015, 0.045], 0.047, 0.009, "#a93cff");
  earPort.rotation.set(0, 0, 0);
  ellipsoid(materials.black, [moduleX, 2.015, 0.025], [0.062, 0.072, 0.04], 20);

  /* Subtle lit joint seams and a small shoulder glow. */
  for (const side of [-1, 1]) {
    addMesh(
      new THREE.TorusGeometry(0.047, 0.008, 7, 20),
      materials.violetBright,
      [side * 0.15, 0.69, 0.06],
      null,
      [Math.PI / 2, 0, 0],
      { outline: false }
    );
  }
  light([0, 1.62, 0.28], "#a843ff", 0.8, 1.6);

  root.userData.idleGlow = materials.violetBright;
  root.userData.shoulderGlow = materials.violet;
  return root;
}
