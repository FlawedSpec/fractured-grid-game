export function createWorld({
  THREE,
  scene,
  camera,
  controls,
  toonGradient,
  makeMaterial,
  characterRoot,
  creatorObjects,
  ui
}) {
  const group = new THREE.Group();
  group.name = "Neon Plaza · Fractured Grid";
  group.visible = false;
  scene.add(group);
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: "#160d22",
    side: THREE.BackSide
  });
  const toon = (color, extra = {}) => makeMaterial(color, extra);
  const materials = {
    floor: toon("#21152e", {
      emissive: "#170b29",
      emissiveIntensity: 0.45
    }),
    building: toon("#171221"),
    buildingAlt: toon("#21152e"),
    trim: toon("#38224d", {
      emissive: "#742dba",
      emissiveIntensity: 0.55
    }),
    violet: toon("#b64cff", {
      emissive: "#922de9",
      emissiveIntensity: 1.5
    }),
    cyan: toon("#48e8ec", {
      emissive: "#13b7cb",
      emissiveIntensity: 1.5
    }),
    magenta: toon("#ef50cf", {
      emissive: "#aa238c",
      emissiveIntensity: 1.4
    }),
    pylon: toon("#302044", {
      emissive: "#56218c",
      emissiveIntensity: 0.8
    })
  };

  function outlinedMesh(geometry, material, position, scale, outline = true) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    if (scale) mesh.scale.set(...scale);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add(mesh);
    if (outline) {
      const hull = new THREE.Mesh(geometry, outlineMaterial);
      hull.position.copy(mesh.position);
      hull.scale.copy(mesh.scale).multiplyScalar(1.025);
      hull.renderOrder = -1;
      group.add(hull);
    }
    return mesh;
  }
  /* A 30-unit walkable pad with emissive lines over a toon-shaded base. */
  const plazaFloor = outlinedMesh(new THREE.PlaneGeometry(30, 30), materials.floor, [0, -0.08, 0], null);
  plazaFloor.rotation.x = -Math.PI / 2;
  const plazaFloorHull = group.children[group.children.length - 1];
  if (plazaFloorHull !== plazaFloor) plazaFloorHull.rotation.x = -Math.PI / 2;
  const grid = new THREE.GridHelper(30, 60, "#a844e8", "#432757");
  grid.position.y = -0.035;
  grid.material.transparent = true;
  grid.material.opacity = 0.52;
  group.add(grid);
  const floorRing = new THREE.Mesh(new THREE.TorusGeometry(13.8, 0.035, 6, 128), new THREE.MeshBasicMaterial({
    color: "#a947ee",
    transparent: true,
    opacity: 0.8
  }));
  floorRing.rotation.x = Math.PI / 2;
  floorRing.position.y = -0.025;
  group.add(floorRing);
  /* Perimeter towers, with their repeated window slits instanced in one draw call. */
  const buildings = [
    [-12, 2.6, -10, 3.3, 5.2, 3.2],
    [-7, 3.5, -12, 3.6, 7, 3],
    [0, 2.4, -12, 4.2, 4.8, 3],
    [7, 3.1, -12, 3.4, 6.2, 3.5],
    [12, 2.5, -9, 3.4, 5, 3.2],
    [-12, 2.8, 10, 3.6, 5.5, 3.2],
    [-7, 3.3, 12, 4.2, 6.5, 3.2],
    [1, 2.5, 12, 3.6, 4.8, 3],
    [8, 2.8, 12, 4.2, 5.6, 3.4],
    [12, 2.5, 8, 3.2, 4.7, 3]
  ];
  buildings.forEach(([x, z, depth, width, height, length], index) => {
    const body = outlinedMesh(boxGeometry, index % 2 ? materials.buildingAlt : materials.building, [x, height / 2 - 0.06, depth], [width, height, length]);
    body.rotation.y = (index % 3) * 0.08;
    outlinedMesh(boxGeometry, materials.trim, [x, height - 0.12, depth], [width + 0.08, 0.12, length + 0.08], false);
  });
  const windowGeometry = new THREE.BoxGeometry(0.11, 0.48, 0.035);
  const windowMaterials = [materials.violet, materials.cyan, materials.magenta];
  const windowInstances = windowMaterials.map((material) => {
    const instance = new THREE.InstancedMesh(windowGeometry, material, 120);
    instance.count = 0;
    instance.frustumCulled = false;
    group.add(instance);
    return instance;
  });
  const temp = new THREE.Object3D();
  const counts = [0, 0, 0];
  buildings.forEach(([x, z, depth, width, height, length], buildingIndex) => {
    const columns = Math.max(2, Math.floor(width / 0.55));
    const rows = Math.max(2, Math.floor((height - 1) / 0.82));
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if ((row + column + buildingIndex) % 3 === 0) continue;
        const colorIndex = (row + column + buildingIndex) % 3;
        const instance = windowInstances[colorIndex];
        const index = counts[colorIndex]++;
        if (index >= instance.instanceMatrix.count) continue;
        temp.position.set(x - width / 2 + 0.28 + column * 0.48, 0.55 + row * 0.78, depth + length / 2 + 0.035);
        temp.scale.set(1, 1, 1);
        temp.updateMatrix();
        instance.setMatrixAt(index, temp.matrix);
      }
    }
  });
  windowInstances.forEach((instance, index) => {
    instance.count = counts[index];
    instance.instanceMatrix.needsUpdate = true;
  });
  /* Holo-pylon and concentric rings. */
  outlinedMesh(new THREE.CylinderGeometry(0.9, 1.2, 0.24, 8), materials.trim, [0, 0.04, 0], null);
  outlinedMesh(new THREE.CylinderGeometry(0.16, 0.34, 3.6, 6), materials.pylon, [0, 1.92, 0], null);
  const pylonCore = outlinedMesh(new THREE.OctahedronGeometry(0.48, 0), materials.violet, [0, 3.2, 0], null);
  const pylonRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.025, 8, 48), new THREE.MeshBasicMaterial({
    color: "#49edf2"
  }));
  pylonRing.position.y = 3.15;
  pylonRing.rotation.x = Math.PI / 2.8;
  group.add(pylonRing);
  /* Floating shards share geometry and material through InstancedMesh. */
  const shardGeometry = new THREE.OctahedronGeometry(0.24, 0);
  const shardMaterial = new THREE.MeshToonMaterial({
    color: "#c56aff",
    gradientMap: toonGradient,
    emissive: "#8a32ca",
    emissiveIntensity: 1.2
  });
  const shardPositions = [
    [-3.5, 2.0, -2],
    [3.2, 2.6, -1.5],
    [-4.2, 1.6, 3],
    [4.4, 2.1, 3],
    [-2.2, 3.1, 4],
    [2.1, 2.8, 4.6],
    [-5.2, 2.4, -4.2],
    [5.1, 1.7, -4]
  ];
  const shards = new THREE.InstancedMesh(shardGeometry, shardMaterial, shardPositions.length);
  shards.frustumCulled = false;
  shardPositions.forEach((position, index) => {
    temp.position.set(...position);
    temp.rotation.set(index * 0.3, index * 0.7, index * 0.2);
    temp.updateMatrix();
    shards.setMatrixAt(index, temp.matrix);
  });
  group.add(shards);
  const worldLights = [new THREE.PointLight("#9d35ff", 45, 24, 2), new THREE.PointLight("#40e6ec", 30, 20, 2), new THREE.PointLight("#f244d2", 28, 18, 2)];
  worldLights[0].position.set(-7, 5, 1);
  worldLights[1].position.set(7, 4, -4);
  worldLights[2].position.set(2, 3, 8);
  worldLights.forEach((light) => group.add(light));
  const colliders = [{
    x: 0,
    z: 0,
    r: 1.35
  }, ...buildings.map(([x, , z, width, , length]) => ({
    x,
    z,
    hx: width / 2 + 0.25,
    hz: length / 2 + 0.25
  }))];
  let active = false;
  let figure = null;
  let moveX = 0;
  let moveY = 0;
  let yaw = 0;
  let walkAmount = 0;
  let joystickPointer = null;
  const keys = new Set();
  const playerRadius = 0.42;
  const bounds = 14.1;
  const joystick = ui.joystick;
  const stick = ui.stick;
  const joystickBase = ui.joystickBase;
  const saved = {};
  const savedCameraPosition = new THREE.Vector3();
  const desiredTarget = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const desiredCamera = new THREE.Vector3();
  const cameraOffset = new THREE.Vector3();
  const joystickRange = 42;

  function keyDown(event) {
    if (!active) return;
    const target = event.target;
    if (target?.matches?.("input, textarea, select, [contenteditable='true']")) return;
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(key)) {
      event.preventDefault();
      keys.add(key);
    }
  }

  function keyUp(event) {
    keys.delete(event.key.toLowerCase());
  }
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", () => keys.clear());

  function setStick(event) {
    const rect = joystickBase.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(dx, dy);
    const scale = Math.min(1, joystickRange / Math.max(length, 1));
    moveX = dx * scale / joystickRange;
    moveY = -dy * scale / joystickRange;
    stick.style.transform = `translate(${moveX * joystickRange}px, ${-moveY * joystickRange}px)`;
  }
  joystick.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    joystickPointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    setStick(event);
  });
  joystick.addEventListener("pointermove", (event) => {
    if (event.pointerId !== joystickPointer) return;
    event.preventDefault();
    event.stopPropagation();
    setStick(event);
  });
  const releaseStick = (event) => {
    if (event.pointerId !== joystickPointer) return;
    joystickPointer = null;
    moveX = 0;
    moveY = 0;
    stick.style.transform = "translate(0, 0)";
  };
  joystick.addEventListener("pointerup", releaseStick);
  joystick.addEventListener("pointercancel", releaseStick);
  joystick.addEventListener("lostpointercapture", releaseStick);

  function collides(x, z) {
    for (const collider of colliders) {
      if (collider.r) {
        if (Math.hypot(x - collider.x, z - collider.z) < collider.r + playerRadius) return true;
      } else if (Math.abs(x - collider.x) < collider.hx + playerRadius && Math.abs(z - collider.z) < collider.hz + playerRadius) return true;
    }
    return false;
  }

  function saveControls() {
    savedCameraPosition.copy(camera.position);
    saved.target = controls.target.clone();
    saved.minDistance = controls.minDistance;
    saved.maxDistance = controls.maxDistance;
    saved.minPolarAngle = controls.minPolarAngle;
    saved.maxPolarAngle = controls.maxPolarAngle;
    saved.fog = scene.fog;
  }

  function enter({
    figure: selectedFigure
  }) {
    if (active) return;
    saveControls();
    active = true;
    figure = selectedFigure;
    group.visible = true;
    creatorObjects.forEach((object) => {
      object.visible = false;
    });
    ui.bottomUI.hidden = true;
    ui.editor.hidden = true;
    ui.enterButton.hidden = true;
    ui.backButton.hidden = false;
    ui.hud.hidden = false;
    joystick.hidden = !window.matchMedia("(pointer: coarse)").matches;
    ui.hudHint.textContent = matchMedia("(pointer: coarse)").matches ? "Use the joystick" : "WASD to move";
    ui.hudHint.classList.remove("fade");
    window.clearTimeout(ui.hudHint.fadeTimer);
    ui.hudHint.fadeTimer = window.setTimeout(() => ui.hudHint.classList.add("fade"), 4200);
    characterRoot.position.set(2.6, 0.2, 3.1);
    characterRoot.rotation.set(0, 0, 0);
    if (figure) {
      figure.rotation.set(0, 0, 0);
      figure.scale.set(1, 1, 1);
      figure.visible = true;
    }
    scene.fog = new THREE.FogExp2("#13091e", 0.026);
    controls.target.set(2.6, 1.5, 3.1);
    controls.minDistance = 4.3;
    controls.maxDistance = 10;
    controls.minPolarAngle = 0.55;
    controls.maxPolarAngle = Math.PI * 0.48;
    camera.position.set(2.6, 3.8, 9.5);
    controls.update();
    cameraOffset.copy(camera.position).sub(controls.target);
  }

  function exit() {
    if (!active) return;
    active = false;
    keys.clear();
    moveX = 0;
    moveY = 0;
    joystickPointer = null;
    stick.style.transform = "translate(0, 0)";
    group.visible = false;
    creatorObjects.forEach((object) => {
      object.visible = true;
    });
    ui.bottomUI.hidden = false;
    ui.editor.hidden = false;
    ui.enterButton.hidden = false;
    ui.backButton.hidden = true;
    ui.hud.hidden = true;
    joystick.hidden = true;
    characterRoot.position.set(0, 0.2, 0);
    characterRoot.rotation.set(0, 0, 0);
    if (figure) {
      figure.rotation.set(0, 0, 0);
      figure.scale.set(1, 1, 1);
    }
    scene.fog = saved.fog;
    camera.position.copy(savedCameraPosition);
    controls.target.copy(saved.target);
    controls.minDistance = saved.minDistance;
    controls.maxDistance = saved.maxDistance;
    controls.minPolarAngle = saved.minPolarAngle;
    controls.maxPolarAngle = saved.maxPolarAngle;
    controls.update();
    figure = null;
  }

  function update(delta, time) {
    if (!active) return;
    const keyX = (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
    const keyY = (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
    const inputX = keyX || moveX;
    const inputY = keyY || moveY;
    const inputLength = Math.hypot(inputX, inputY);
    const moving = inputLength > 0.08;
    controls.update();
    forward.set(controls.target.x - camera.position.x, 0, controls.target.z - camera.position.z);
    if (forward.lengthSq() < 0.001) forward.set(0, 0, -1);
    forward.normalize();
    right.set(-forward.z, 0, forward.x).normalize();
    const run = keys.has("shift") || (joystickPointer !== null && inputLength > 0.7);
    const speed = run ? 6.3 : 3.7;
    if (moving) {
      const nx = inputX / inputLength;
      const ny = inputY / inputLength;
      const dx = (right.x * nx + forward.x * ny) * speed * delta;
      const dz = (right.z * nx + forward.z * ny) * speed * delta;
      const px = characterRoot.position.x;
      const pz = characterRoot.position.z;
      const nextX = THREE.MathUtils.clamp(px + dx, -bounds, bounds);
      const nextZ = THREE.MathUtils.clamp(pz + dz, -bounds, bounds);
      if (!collides(nextX, pz)) characterRoot.position.x = nextX;
      if (!collides(characterRoot.position.x, nextZ)) characterRoot.position.z = nextZ;
      const facingX = dx;
      const facingZ = dz;
      const targetYaw = Math.atan2(facingX, facingZ);
      let difference = targetYaw - yaw;
      difference = Math.atan2(Math.sin(difference), Math.cos(difference));
      yaw += difference * (1 - Math.exp(-9 * delta));
      characterRoot.rotation.y = yaw;
      walkAmount = Math.min(1, walkAmount + delta * (run ? 5 : 3.2));
    } else {
      walkAmount *= Math.exp(-5 * delta);
    }
    const bob = moving ? Math.abs(Math.sin(time * (run ? 12 : 8))) * 0.055 : Math.sin(time * 1.5) * 0.018;
    characterRoot.position.y = 0.2 + bob;
    if (figure) {
      figure.rotation.x = moving ? -0.035 * walkAmount : 0;
      figure.rotation.z = moving ? Math.sin(time * 8) * 0.012 * walkAmount : 0;
    }
    desiredTarget.set(characterRoot.position.x, 1.48, characterRoot.position.z);
    controls.target.lerp(desiredTarget, 1 - Math.exp(-5 * delta));
    cameraOffset.copy(camera.position).sub(controls.target);
    if (cameraOffset.length() < 4) cameraOffset.set(0, 1.6, 6);
    desiredCamera.copy(controls.target).add(cameraOffset);
    camera.position.lerp(desiredCamera, 1 - Math.exp(-5 * delta));
    pylonRing.rotation.z = time * 0.35;
    pylonCore.rotation.y = time * 0.5;
    shards.rotation.y = time * 0.045;
    floorRing.material.opacity = 0.62 + Math.sin(time * 1.7) * 0.16;
  }
  return {
    enter,
    exit,
    isActive: () => active,
    update,
    resize() {}
  };
}
