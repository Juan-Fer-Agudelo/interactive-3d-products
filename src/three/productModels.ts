import * as THREE from 'three';
import { FINISH_OPTIONS, type FinishId, type ProductModelId } from '../data/products';
import type { StudioTextures } from './textures';

type FinishRole = 'primary' | 'accent' | 'secondary';

function registerPart(
  mesh: THREE.Object3D,
  explodeOffset: THREE.Vector3,
  finishRole?: FinishRole,
) {
  mesh.userData.basePosition = mesh.position.clone();
  mesh.userData.explodeOffset = explodeOffset;
  if (finishRole) {
    mesh.userData.finishRole = finishRole;
  }
  mesh.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
}

function createPrimaryMaterial(textures: StudioTextures): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x1a1a1f,
    roughness: 0.42,
    metalness: 0.72,
    roughnessMap: textures.brushedRoughness,
    anisotropy: 0.65,
    clearcoat: 0.15,
    clearcoatRoughness: 0.35,
  });
}

function createAccentMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xd4a853,
    roughness: 0.2,
    metalness: 0.94,
    anisotropy: 0.8,
  });
}

function createSecondaryDarkMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x0e0e12,
    roughness: 0.78,
    metalness: 0.15,
  });
}

function buildMonolithLamp(
  textures: StudioTextures,
): THREE.Group {
  const group = new THREE.Group();
  const primaryMat = createPrimaryMaterial(textures);
  const accentMat = createAccentMaterial();
  const darkMat = createSecondaryDarkMaterial();

  // 1. Weighted chamfered base disc (bottom sits flush at y = 0)
  const baseProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.72, 0),
    new THREE.Vector2(0.72, 0.045),
    new THREE.Vector2(0.67, 0.08),
    new THREE.Vector2(0.14, 0.085),
    new THREE.Vector2(0.12, 0.24),
    new THREE.Vector2(0, 0.24),
  ];
  const baseGeo = new THREE.LatheGeometry(baseProfile, 64);
  const baseMesh = new THREE.Mesh(baseGeo, primaryMat);
  registerPart(baseMesh, new THREE.Vector3(0, -0.15, 0), 'primary');
  group.add(baseMesh);

  // 2. Signature hollow brass counterweight housing & ring
  const weightGroup = new THREE.Group();
  weightGroup.position.set(0.24, 0.48, 0);

  const outerRingGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.18, 48, 1, true);
  outerRingGeo.rotateX(Math.PI / 2);
  const outerRing = new THREE.Mesh(outerRingGeo, primaryMat);
  outerRing.userData.finishRole = 'primary';

  const torusCapGeo = new THREE.TorusGeometry(0.22, 0.062, 24, 64);
  const innerBrassRing = new THREE.Mesh(torusCapGeo, accentMat);
  innerBrassRing.userData.finishRole = 'accent';

  const sleeveGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.19, 48, 1, true);
  sleeveGeo.rotateX(Math.PI / 2);
  const sleeveMesh = new THREE.Mesh(sleeveGeo, accentMat);
  sleeveMesh.userData.finishRole = 'accent';

  weightGroup.add(outerRing, innerBrassRing, sleeveMesh);
  registerPart(weightGroup, new THREE.Vector3(0.22, 0.05, 0));
  group.add(weightGroup);

  // 3. Lower articulated stem
  const lowerStemGeo = new THREE.CylinderGeometry(0.036, 0.042, 1.15, 32);
  const lowerStem = new THREE.Mesh(lowerStemGeo, primaryMat);
  lowerStem.position.set(0.45, 1.0, 0);
  lowerStem.rotation.z = -0.34;
  registerPart(lowerStem, new THREE.Vector3(0.15, 0.25, 0), 'primary');
  group.add(lowerStem);

  // 4. Upper elbow hinge cap
  const elbowGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.11, 32);
  elbowGeo.rotateX(Math.PI / 2);
  const elbowMesh = new THREE.Mesh(elbowGeo, darkMat);
  elbowMesh.position.set(0.64, 1.54, 0);
  registerPart(elbowMesh, new THREE.Vector3(0.28, 0.42, 0));
  group.add(elbowMesh);

  const elbowAccentGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.125, 32);
  elbowAccentGeo.rotateX(Math.PI / 2);
  const elbowAccent = new THREE.Mesh(elbowAccentGeo, accentMat);
  elbowAccent.position.set(0.64, 1.54, 0);
  registerPart(elbowAccent, new THREE.Vector3(0.28, 0.42, 0.14), 'accent');
  group.add(elbowAccent);

  // 5. Upper cantilevered arm
  const upperArmGeo = new THREE.CylinderGeometry(0.028, 0.034, 1.28, 32);
  const upperArm = new THREE.Mesh(upperArmGeo, primaryMat);
  upperArm.position.set(0.05, 1.38, 0);
  upperArm.rotation.z = 1.29;
  registerPart(upperArm, new THREE.Vector3(-0.08, 0.55, 0), 'primary');
  group.add(upperArm);

  // 6. Lamp cylindrical head & diffuser
  const headGroup = new THREE.Group();
  headGroup.position.set(-0.56, 1.2, 0);

  const shadeProfile = [
    new THREE.Vector2(0, 0.24),
    new THREE.Vector2(0.18, 0.24),
    new THREE.Vector2(0.2, 0.21),
    new THREE.Vector2(0.2, 0),
    new THREE.Vector2(0.175, 0),
    new THREE.Vector2(0.175, 0.06),
    new THREE.Vector2(0, 0.06),
  ];
  const shadeGeo = new THREE.LatheGeometry(shadeProfile, 48);
  const shadeMesh = new THREE.Mesh(shadeGeo, primaryMat);
  shadeMesh.userData.finishRole = 'primary';

  const diffuserMat = new THREE.MeshStandardMaterial({
    color: 0xffe4b8,
    emissive: 0xffb95c,
    emissiveIntensity: 1.85,
    roughness: 0.35,
    metalness: 0.0,
  });
  const diffuserGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.02, 48);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, diffuserMat);
  diffuserMesh.position.y = 0.045;

  const neckJointGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.14, 24);
  neckJointGeo.rotateZ(Math.PI / 2);
  const neckJoint = new THREE.Mesh(neckJointGeo, darkMat);
  neckJoint.position.set(0.22, 0.12, 0);

  headGroup.add(shadeMesh, diffuserMesh, neckJoint);
  registerPart(headGroup, new THREE.Vector3(-0.35, 0.45, 0));
  group.add(headGroup);

  // Subtle warm task glow under lamp head
  const taskGlow = new THREE.PointLight(0xffc978, 1.4, 3.2, 2);
  taskGlow.position.set(-0.56, 1.12, 0);
  group.add(taskGlow);

  return group;
}

function buildChronographWatch(
  textures: StudioTextures,
  isSoftwareGl: boolean,
  floating = false,
): THREE.Group {
  const group = new THREE.Group();
  const primaryMat = createPrimaryMaterial(textures);
  const accentMat = createAccentMaterial();
  const darkMat = createSecondaryDarkMaterial();

  // 1. Display slate plinth stand (bottom at y = 0) — omitted in floating hero mode
  if (!floating) {
    const standGeo = new THREE.BoxGeometry(1.15, 0.14, 0.92);
    const standMesh = new THREE.Mesh(standGeo, darkMat);
    standMesh.position.set(0, 0.07, 0);
    registerPart(standMesh, new THREE.Vector3(0, -0.22, 0));
    group.add(standMesh);
  }

  // Angled watch assembly container
  const watchAssembly = new THREE.Group();
  watchAssembly.position.set(0, floating ? 0 : 0.94, 0);
  watchAssembly.rotation.x = floating ? -0.14 : -0.28;

  // 2. Brushed bracelet collar / display cradle
  const strapGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.48, 48, 1, true);
  strapGeo.rotateZ(Math.PI / 2);
  const strapMat = primaryMat.clone();
  strapMat.side = THREE.DoubleSide;
  const strapMesh = new THREE.Mesh(strapGeo, strapMat);
  strapMesh.position.set(0, -0.08, -0.14);
  strapMesh.userData.finishRole = 'primary';
  registerPart(strapMesh, new THREE.Vector3(0, -0.2, -0.35), 'primary');
  watchAssembly.add(strapMesh);

  // 3. Machined watch case + stepped bezel (LatheGeometry rotated to face +Z)
  const caseProfile = [
    new THREE.Vector2(0, -0.16),
    new THREE.Vector2(0.7, -0.16),
    new THREE.Vector2(0.76, -0.06),
    new THREE.Vector2(0.76, 0.08),
    new THREE.Vector2(0.72, 0.14),
    new THREE.Vector2(0.66, 0.18),
    new THREE.Vector2(0.61, 0.18),
    new THREE.Vector2(0.61, 0.04),
    new THREE.Vector2(0, 0.04),
  ];
  const caseGeo = new THREE.LatheGeometry(caseProfile, 64);
  caseGeo.rotateX(Math.PI / 2);
  const caseMesh = new THREE.Mesh(caseGeo, primaryMat);
  registerPart(caseMesh, new THREE.Vector3(0, 0, -0.12), 'primary');
  watchAssembly.add(caseMesh);

  // 4. Sculpted lugs (4 corners)
  const lugGeo = new THREE.BoxGeometry(0.14, 0.34, 0.18);
  const lugPositions = [
    [-0.36, 0.72, -0.02],
    [0.36, 0.72, -0.02],
    [-0.36, -0.72, -0.02],
    [0.36, -0.72, -0.02],
  ];
  const lugGroup = new THREE.Group();
  lugPositions.forEach(([x, y, z]) => {
    const lug = new THREE.Mesh(lugGeo, primaryMat);
    lug.position.set(x, y, z);
    lug.userData.finishRole = 'primary';
    lugGroup.add(lug);
  });
  registerPart(lugGroup, new THREE.Vector3(0, 0, -0.22));
  watchAssembly.add(lugGroup);

  // 5. Dial plane with procedural high-DPI dial texture
  const dialGeo = new THREE.CircleGeometry(0.605, 64);
  const dialMat = new THREE.MeshStandardMaterial({
    map: textures.dial,
    roughness: 0.65,
    metalness: 0.12,
  });
  const dialMesh = new THREE.Mesh(dialGeo, dialMat);
  dialMesh.position.z = 0.045;
  registerPart(dialMesh, new THREE.Vector3(0, 0, 0.12));
  watchAssembly.add(dialMesh);

  // 6. 3D sculpted hands & center pinion
  const handsGroup = new THREE.Group();
  handsGroup.position.z = 0.075;

  const hourHandGeo = new THREE.BoxGeometry(0.036, 0.34, 0.015);
  hourHandGeo.translate(0, 0.13, 0);
  const hourHand = new THREE.Mesh(hourHandGeo, accentMat);
  hourHand.rotation.z = 0.9;
  hourHand.userData.finishRole = 'accent';

  const minHandGeo = new THREE.BoxGeometry(0.026, 0.48, 0.015);
  minHandGeo.translate(0, 0.2, 0.014);
  const minHand = new THREE.Mesh(minHandGeo, accentMat);
  minHand.rotation.z = -0.65;
  minHand.userData.finishRole = 'accent';

  const centerPinGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.04, 24);
  centerPinGeo.rotateX(Math.PI / 2);
  const centerPin = new THREE.Mesh(centerPinGeo, accentMat);
  centerPin.userData.finishRole = 'accent';

  handsGroup.add(hourHand, minHand, centerPin);
  registerPart(handsGroup, new THREE.Vector3(0, 0, 0.32));
  watchAssembly.add(handsGroup);

  // 7. Crown & Chronograph pushers
  const crownGroup = new THREE.Group();
  const crownGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.12, 24);
  crownGeo.rotateZ(Math.PI / 2);
  const crown = new THREE.Mesh(crownGeo, accentMat);
  crown.position.set(0.81, 0, 0);
  crown.userData.finishRole = 'accent';

  const pusherGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.11, 20);
  pusherGeo.rotateZ(Math.PI / 2);
  const topPusher = new THREE.Mesh(pusherGeo, primaryMat);
  topPusher.position.set(0.74, 0.34, 0);
  topPusher.rotation.z = 0.4;
  topPusher.userData.finishRole = 'primary';

  const botPusher = new THREE.Mesh(pusherGeo, primaryMat);
  botPusher.position.set(0.74, -0.34, 0);
  botPusher.rotation.z = -0.4;
  botPusher.userData.finishRole = 'primary';

  crownGroup.add(crown, topPusher, botPusher);
  registerPart(crownGroup, new THREE.Vector3(0.32, 0, 0));
  watchAssembly.add(crownGroup);

  // 8. Sapphire crystal dome
  const crystalGeo = new THREE.SphereGeometry(0.62, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.24);
  crystalGeo.rotateX(Math.PI / 2);
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.04,
    transmission: isSoftwareGl ? 0 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.28 : 1,
    ior: 1.77,
    thickness: 0.35,
    clearcoat: 1.0,
    depthWrite: false,
  });
  const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
  crystalMesh.position.z = -0.34;
  crystalMesh.renderOrder = 2;
  crystalMesh.castShadow = false;
  registerPart(crystalMesh, new THREE.Vector3(0, 0, 0.56));
  watchAssembly.add(crystalMesh);

  group.add(watchAssembly);
  return group;
}

function buildAcousticSpeaker(textures: StudioTextures): THREE.Group {
  const group = new THREE.Group();
  const primaryMat = createPrimaryMaterial(textures);
  const darkMat = createSecondaryDarkMaterial();

  // Warm brushed copper acoustic horn material
  const copperMat = new THREE.MeshPhysicalMaterial({
    color: 0xc97b4b,
    roughness: 0.2,
    metalness: 0.94,
    anisotropy: 0.85,
  });

  // 1. 4 machined steel isolation feet (bottom at y = 0)
  const feetGroup = new THREE.Group();
  const footGeo = new THREE.CylinderGeometry(0.055, 0.025, 0.08, 24);
  const footOffsets = [
    [0.34, 0.04, 0.34],
    [-0.34, 0.04, 0.34],
    [0.34, 0.04, -0.34],
    [-0.34, 0.04, -0.34],
  ];
  footOffsets.forEach(([x, y, z]) => {
    const foot = new THREE.Mesh(footGeo, copperMat);
    foot.position.set(x, y, z);
    foot.userData.finishRole = 'accent';
    feetGroup.add(foot);
  });
  registerPart(feetGroup, new THREE.Vector3(0, -0.22, 0));
  group.add(feetGroup);

  // 2. Main cylindrical acoustic enclosure
  const bodyProfile = [
    new THREE.Vector2(0, 0.08),
    new THREE.Vector2(0.52, 0.08),
    new THREE.Vector2(0.55, 0.12),
    new THREE.Vector2(0.55, 1.62),
    new THREE.Vector2(0.51, 1.66),
    new THREE.Vector2(0, 1.66),
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyProfile, 64);
  const bodyMesh = new THREE.Mesh(bodyGeo, primaryMat);
  registerPart(bodyMesh, new THREE.Vector3(0, 0, -0.15), 'primary');
  group.add(bodyMesh);

  // 3. Top capacitive brass/copper ring inlay
  const topRingGeo = new THREE.TorusGeometry(0.42, 0.015, 16, 64);
  topRingGeo.rotateX(Math.PI / 2);
  const topRing = new THREE.Mesh(topRingGeo, copperMat);
  topRing.position.y = 1.665;
  registerPart(topRing, new THREE.Vector3(0, 0.38, 0), 'accent');
  group.add(topRing);

  // 4. Lower woven acoustic grille module
  const grilleGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.09, 48);
  grilleGeo.rotateX(Math.PI / 2);
  const grilleMat = new THREE.MeshStandardMaterial({
    map: textures.speakerMesh,
    roughness: 0.88,
    metalness: 0.05,
  });
  const grilleMesh = new THREE.Mesh(grilleGeo, grilleMat);
  grilleMesh.position.set(0, 0.72, 0.515);
  registerPart(grilleMesh, new THREE.Vector3(0, -0.05, 0.32));
  group.add(grilleMesh);

  // 5. Signature exponential copper waveguide horn
  const hornProfile = [
    new THREE.Vector2(0.08, 0.0),
    new THREE.Vector2(0.11, 0.03),
    new THREE.Vector2(0.18, 0.08),
    new THREE.Vector2(0.32, 0.13),
    new THREE.Vector2(0.36, 0.14),
    new THREE.Vector2(0.36, 0.09),
    new THREE.Vector2(0.1, 0.0),
  ];
  const hornGeo = new THREE.LatheGeometry(hornProfile, 64);
  hornGeo.rotateX(Math.PI / 2);
  const hornMesh = new THREE.Mesh(hornGeo, copperMat);
  hornMesh.position.set(0, 1.24, 0.43);
  registerPart(hornMesh, new THREE.Vector3(0, 0.15, 0.45), 'accent');
  group.add(hornMesh);

  // 6. Central phase plug dome
  const plugGeo = new THREE.SphereGeometry(0.085, 32, 24);
  const plugMesh = new THREE.Mesh(plugGeo, darkMat);
  plugMesh.position.set(0, 1.24, 0.48);
  registerPart(plugMesh, new THREE.Vector3(0, 0.15, 0.64));
  group.add(plugMesh);

  // 7. Tactile front indicator pins
  const pinGroup = new THREE.Group();
  const pinGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.03, 16);
  pinGeo.rotateX(Math.PI / 2);
  [-0.07, 0, 0.07].forEach((x) => {
    const pin = new THREE.Mesh(pinGeo, copperMat);
    pin.position.set(x, 0.25, 0.545);
    pin.userData.finishRole = 'accent';
    pinGroup.add(pin);
  });
  registerPart(pinGroup, new THREE.Vector3(0, -0.1, 0.28));
  group.add(pinGroup);

  return group;
}

function buildCeramicVessel(
  textures: StudioTextures,
  isSoftwareGl: boolean,
): THREE.Group {
  const group = new THREE.Group();
  const primaryMat = createPrimaryMaterial(textures);
  const accentMat = createAccentMaterial();

  // Stoneware matte ceramic body material (high roughness contrast vs brass)
  const stonewareMat = new THREE.MeshStandardMaterial({
    color: 0x1d1e22,
    roughness: 0.88,
    metalness: 0.06,
  });

  // 1. Lathe-turned stoneware vessel body (bottom at y = 0)
  const vesselProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.36, 0),
    new THREE.Vector2(0.46, 0.12),
    new THREE.Vector2(0.54, 0.38),
    new THREE.Vector2(0.56, 0.72),
    new THREE.Vector2(0.53, 0.94),
    new THREE.Vector2(0.44, 0.94),
    new THREE.Vector2(0.44, 0.78),
    new THREE.Vector2(0, 0.78),
  ];
  const vesselGeo = new THREE.LatheGeometry(vesselProfile, 64);
  const vesselMesh = new THREE.Mesh(vesselGeo, stonewareMat);
  registerPart(vesselMesh, new THREE.Vector3(0, -0.18, 0), 'primary');
  group.add(vesselMesh);

  // 2. Precision brushed brass collar ring
  const collarProfile = [
    new THREE.Vector2(0.46, 0),
    new THREE.Vector2(0.555, 0),
    new THREE.Vector2(0.555, 0.075),
    new THREE.Vector2(0.48, 0.075),
    new THREE.Vector2(0.46, 0.02),
  ];
  const collarGeo = new THREE.LatheGeometry(collarProfile, 64);
  const collarMesh = new THREE.Mesh(collarGeo, accentMat);
  collarMesh.position.y = 0.935;
  registerPart(collarMesh, new THREE.Vector3(0, 0.16, 0), 'accent');
  group.add(collarMesh);

  // 3. Inner ultrasonic diffuser chimney
  const coreGeo = new THREE.CylinderGeometry(0.14, 0.22, 0.36, 36);
  const coreMesh = new THREE.Mesh(coreGeo, primaryMat);
  coreMesh.position.y = 0.96;
  registerPart(coreMesh, new THREE.Vector3(0, 0.35, 0), 'primary');
  group.add(coreMesh);

  // 4. Smoked optical glass dome top
  const domeGeo = new THREE.SphereGeometry(
    0.525,
    64,
    32,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.5,
  );
  const domeMat = new THREE.MeshPhysicalMaterial({
    color: 0x2f2b26,
    metalness: 0.05,
    roughness: 0.06,
    transmission: isSoftwareGl ? 0 : 0.86,
    transparent: true,
    opacity: isSoftwareGl ? 0.52 : 1,
    ior: 1.52,
    thickness: 0.8,
    attenuationColor: new THREE.Color(0x524536),
    attenuationDistance: 1.2,
    clearcoat: 1.0,
    depthWrite: false,
  });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.position.y = 1.0;
  domeMesh.renderOrder = 2;
  domeMesh.castShadow = false;
  registerPart(domeMesh, new THREE.Vector3(0, 0.58, 0));
  group.add(domeMesh);

  return group;
}

export function buildProductModel(
  modelId: ProductModelId,
  textures: StudioTextures,
  isSoftwareGl: boolean,
  options?: { floating?: boolean },
): THREE.Group {
  switch (modelId) {
    case 'monolith-lamp':
      return buildMonolithLamp(textures);
    case 'chronograph-watch':
      return buildChronographWatch(textures, isSoftwareGl, Boolean(options?.floating));
    case 'acoustic-speaker':
      return buildAcousticSpeaker(textures);
    case 'ceramic-vessel':
      return buildCeramicVessel(textures, isSoftwareGl);
  }
}

export function applyProductFinish(group: THREE.Group, finishId: FinishId): void {
  const preset = FINISH_OPTIONS.find((f) => f.id === finishId) ?? FINISH_OPTIONS[0];
  group.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    const role = mesh.userData.finishRole as FinishRole | undefined;
    if (!role) return;

    const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
    if (!mat || !mat.color) return;

    if (role === 'primary') {
      mat.color.setHex(preset.primaryHex);
      mat.roughness = Math.max(mat.roughness, preset.primaryRoughness);
      mat.metalness = preset.primaryMetalness;
      mat.needsUpdate = true;
    } else if (role === 'accent') {
      mat.color.setHex(preset.accentHex);
      mat.roughness = preset.accentRoughness;
      mat.metalness = preset.accentMetalness;
      mat.needsUpdate = true;
    }
  });
}

export function setProductExplodeFactor(group: THREE.Group, factor: number): void {
  group.traverse((child) => {
    const base = child.userData.basePosition as THREE.Vector3 | undefined;
    const offset = child.userData.explodeOffset as THREE.Vector3 | undefined;
    if (base && offset) {
      child.position.copy(base).addScaledVector(offset, factor);
    }
  });
}

export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material?.dispose();
      }
    }
  });
}
