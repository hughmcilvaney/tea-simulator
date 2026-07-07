// Builds the galley kitchen from the reference video with a focus on
// high-fidelity materials and lighting: flagstone floor, stainless worktop
// with inset sink, sage-green splashback, black floating shelf, frosted
// glass-block window band, hob + wooden table on the left, garden door.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  flagstoneSet, plasterSet, greenPaintSet, brushedSteelSet, woodSet,
  ceramicNormal, frostedSet, paintedSet, gardenTexture, labelTexture,
  teaCanisterTexture, barrysTexture, milkTexture, clockTexture,
} from './textures.js';

export const ROOM = {
  minX: -1.35, maxX: 1.35,
  minZ: -5.2, maxZ: 0.3,
  ceil: 2.5,
  counterTop: 0.92,
};

const M = {};

function initMaterials() {
  const steel = brushedSteelSet(512, [2.4, 1.2]);
  M.steelTop = new THREE.MeshPhysicalMaterial({
    map: steel.map, normalMap: steel.normalMap, roughnessMap: steel.roughnessMap,
    metalness: 0.92, roughness: 1.0, envMapIntensity: 0.9,
  });
  const steelV = brushedSteelSet(512, [1.6, 1.6], true);
  M.kettleSteel = new THREE.MeshPhysicalMaterial({
    map: steelV.map, normalMap: steelV.normalMap, roughnessMap: steelV.roughnessMap,
    metalness: 1.0, roughness: 0.85, envMapIntensity: 1.2,
  });
  M.chrome = new THREE.MeshPhysicalMaterial({
    color: 0xe8eaec, metalness: 1.0, roughness: 0.08, envMapIntensity: 1.1,
  });
  M.steelPlain = new THREE.MeshPhysicalMaterial({
    color: 0xc9cbce, metalness: 0.95, roughness: 0.3, envMapIntensity: 0.9,
  });
  M.blackMatte = new THREE.MeshStandardMaterial({ color: 0x1e1e20, roughness: 0.82, envMapIntensity: 0.35 });
  M.blackGloss = new THREE.MeshPhysicalMaterial({
    color: 0x121214, roughness: 0.16, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 0.8,
  });
  const cab = paintedSet(256, [232, 233, 229]);
  M.cabinet = new THREE.MeshPhysicalMaterial({
    map: cab.map, normalMap: cab.normalMap, roughness: 0.4, clearcoat: 0.2,
    clearcoatRoughness: 0.4, envMapIntensity: 0.55,
  });
  M.ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xf6f3ea, roughness: 0.14, clearcoat: 0.7, clearcoatRoughness: 0.2,
    normalMap: ceramicNormal(), envMapIntensity: 0.8,
  });
  const green = paintedSet(256, [158, 173, 122]);
  M.greenCubby = new THREE.MeshStandardMaterial({
    map: green.map, normalMap: green.normalMap, roughness: 0.65, envMapIntensity: 0.4,
  });
  const wood = woodSet(512);
  M.wood = new THREE.MeshStandardMaterial({
    map: wood.map, normalMap: wood.normalMap, roughness: 0.6, envMapIntensity: 0.4,
  });
  const drift = woodSet(512, [186, 162, 128]);
  M.driftwood = new THREE.MeshStandardMaterial({
    map: drift.map, normalMap: drift.normalMap, roughness: 0.8, envMapIntensity: 0.35,
  });
  M.glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.04,
    transmission: 0.95, thickness: 0.02, ior: 1.5,
    transparent: true, opacity: 1, envMapIntensity: 1.0,
  });
  const frost = frostedSet();
  M.frosted = new THREE.MeshPhysicalMaterial({
    map: frost.map, normalMap: frost.normalMap,
    emissive: 0xdde6ec, emissiveIntensity: 0.16,
    roughness: 0.85, transmission: 0.25, thickness: 0.04, transparent: true,
  });
  M.red = new THREE.MeshPhysicalMaterial({
    color: 0xc0271f, roughness: 0.2, clearcoat: 0.9, clearcoatRoughness: 0.15, envMapIntensity: 0.9,
  });
  M.yellow = new THREE.MeshPhysicalMaterial({
    color: 0xe8b400, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.25, envMapIntensity: 0.8,
  });
  M.teal = new THREE.MeshStandardMaterial({ color: 0x2e7f8f, roughness: 0.85, envMapIntensity: 0.3 });
  M.tea = new THREE.MeshPhysicalMaterial({
    color: 0x5a3417, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.0,
  });
  M.hobGlass = new THREE.MeshPhysicalMaterial({
    color: 0x0c0c0e, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2,
  });
  M.mullion = new THREE.MeshStandardMaterial({ color: 0xf1f0eb, roughness: 0.7, envMapIntensity: 0.4 });
}

/* ---------------- geometry helpers ---------------- */

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}
function rbox(w, h, d, r, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat);
  m.position.set(x, y, z);
  return m;
}
function cyl(rTop, rBot, h, mat, x = 0, y = 0, z = 0, seg = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}
function lathe(profile, mat, seg = 40) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.Mesh(new THREE.LatheGeometry(pts, seg), mat);
}
function tube(points, radius, mat, seg = 32) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, 10, false), mat);
}
function shadows(obj, cast = true, receive = true) {
  obj.traverse((o) => {
    if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; }
  });
  return obj;
}

/* ---------------- object factories ---------------- */

function makeKettle() {
  const g = new THREE.Group();
  // curved body via lathe
  const body = lathe([
    [0.0, 0.012], [0.062, 0.012], [0.075, 0.03], [0.079, 0.07],
    [0.072, 0.12], [0.06, 0.165], [0.052, 0.195], [0.0, 0.195],
  ], M.kettleSteel);
  const lid = lathe([[0.0, 0.195], [0.05, 0.195], [0.046, 0.212], [0.02, 0.218], [0.0, 0.219]], M.blackGloss);
  const knob = cyl(0.011, 0.013, 0.014, M.blackGloss, 0, 0.226, 0);
  const spout = tube(
    [[0, 0.15, -0.062], [0, 0.185, -0.085], [0, 0.212, -0.098]],
    0.012, M.kettleSteel
  );
  const spoutTip = cyl(0.011, 0.013, 0.02, M.kettleSteel, 0, 0.214, -0.098);
  spoutTip.rotation.x = -0.5;
  const handle = tube(
    [[0, 0.19, 0.05], [0, 0.215, 0.105], [0, 0.16, 0.125], [0, 0.09, 0.115], [0, 0.06, 0.08]],
    0.011, M.blackMatte
  );
  const base = cyl(0.081, 0.085, 0.018, M.blackMatte, 0, 0.003, 0);
  const switchLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.024, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x2c2c2e, emissive: 0x000000, roughness: 0.5 })
  );
  switchLight.position.set(0.03, 0.045, 0.085);
  switchLight.name = 'switchLight';
  const steamAnchor = new THREE.Object3D();
  steamAnchor.name = 'steamAnchor';
  steamAnchor.position.set(0, 0.225, -0.1);
  g.add(body, lid, knob, spout, spoutTip, handle, base, switchLight, steamAnchor);
  return shadows(g);
}

function makeKettleBase() {
  const g = new THREE.Group();
  g.add(cyl(0.08, 0.086, 0.016, M.blackMatte, 0, 0.008, 0));
  g.add(cyl(0.012, 0.012, 0.02, M.blackGloss, 0, 0.02, 0));
  return shadows(g);
}

function makeMug(color = 0xf6f3ea) {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color, roughness: 0.15, clearcoat: 0.7, clearcoatRoughness: 0.2,
    normalMap: ceramicNormal(), envMapIntensity: 0.8, side: THREE.DoubleSide,
  });
  // profile with a lip and inner wall
  const body = lathe([
    [0.036, 0.0], [0.04, 0.004], [0.042, 0.03], [0.0435, 0.07], [0.044, 0.096],
    [0.0415, 0.098], [0.0405, 0.09], [0.039, 0.04], [0.036, 0.012], [0.0, 0.01],
  ], mat);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0075, 12, 24), mat);
  handle.position.set(0.046, 0.052, 0);
  handle.rotation.y = Math.PI / 2;
  g.add(body, handle);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.0385, 0.0385, 0.004, 24), M.tea.clone());
  water.position.y = 0.02;
  water.visible = false;
  water.name = 'water';
  g.add(water);
  return shadows(g);
}

function makeTeapot() {
  const g = new THREE.Group();
  const body = lathe([
    [0.0, 0.0], [0.05, 0.004], [0.072, 0.03], [0.078, 0.07],
    [0.07, 0.11], [0.05, 0.14], [0.034, 0.148],
  ], M.ceramic);
  const lid = lathe([[0.0, 0.148], [0.034, 0.148], [0.028, 0.16], [0.012, 0.166], [0.0, 0.172]], M.ceramic);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 14, 10), M.ceramic);
  knob.position.y = 0.178;
  const spout = tube(
    [[-0.06, 0.06, 0], [-0.095, 0.09, 0], [-0.11, 0.125, 0]],
    0.012, M.ceramic
  );
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.009, 12, 24, Math.PI * 1.25), M.ceramic);
  handle.position.set(0.072, 0.085, 0);
  handle.rotation.z = -0.45;
  g.add(body, lid, knob, spout, handle);
  return shadows(g);
}

function makeToaster() {
  const g = new THREE.Group();
  const body = rbox(0.17, 0.15, 0.26, 0.03, M.chrome, 0, 0.078, 0);
  for (const dz of [-0.055, 0.055]) {
    g.add(box(0.105, 0.008, 0.032, M.blackMatte, 0, 0.155, dz));
  }
  g.add(box(0.17, 0.02, 0.26, M.blackMatte, 0, 0.01, 0));
  const lever = rbox(0.018, 0.035, 0.024, 0.006, M.blackMatte, 0.093, 0.1, -0.08);
  g.add(body, lever);
  return shadows(g);
}

function makeYellowCoffeeMachine() {
  const g = new THREE.Group();
  g.add(rbox(0.3, 0.024, 0.22, 0.008, M.yellow, 0, 0.012, 0));
  g.add(rbox(0.095, 0.35, 0.16, 0.012, M.yellow, -0.09, 0.195, 0));
  const tank = rbox(0.08, 0.2, 0.12, 0.01, new THREE.MeshPhysicalMaterial({
    color: 0x35322e, roughness: 0.25, transmission: 0.35, transparent: true, opacity: 0.9,
  }), -0.088, 0.45, 0);
  g.add(tank);
  g.add(rbox(0.13, 0.06, 0.15, 0.012, M.blackGloss, 0.055, 0.32, 0));
  const carafe = lathe([[0.0, 0.0], [0.05, 0.002], [0.058, 0.05], [0.05, 0.12], [0.044, 0.135]],
    M.glass);
  carafe.position.set(0.06, 0.03, 0);
  g.add(carafe);
  g.add(cyl(0.048, 0.05, 0.014, M.blackGloss, 0.06, 0.175, 0));
  g.add(cyl(0.05, 0.052, 0.01, M.blackMatte, 0.06, 0.029, 0));
  return shadows(g);
}

function makeRedEspressoMachine() {
  const g = new THREE.Group();
  g.add(rbox(0.24, 0.06, 0.2, 0.012, M.red, 0, 0.03, 0));
  g.add(rbox(0.2, 0.25, 0.15, 0.02, M.red, 0, 0.18, -0.01));
  g.add(cyl(0.036, 0.036, 0.05, M.chrome, 0, 0.095, 0.06));
  const porta = cyl(0.03, 0.032, 0.02, M.chrome, 0, 0.07, 0.06);
  const paHandle = cyl(0.009, 0.011, 0.09, M.blackGloss, 0, 0.065, 0.12);
  paHandle.rotation.x = Math.PI / 2;
  g.add(porta, paHandle);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.058, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), M.chrome);
  dome.position.set(0, 0.305, -0.01);
  g.add(dome);
  g.add(cyl(0.02, 0.02, 0.05, M.chrome, 0.09, 0.25, -0.01)); // steam knob
  g.add(box(0.16, 0.005, 0.12, M.steelPlain, 0, 0.062, 0.04)); // drip tray
  return shadows(g);
}

function makeKilnerJar(r, h, fillRatio, fillColor) {
  const g = new THREE.Group();
  const jar = lathe([
    [0.0, 0.002], [r * 0.96, 0.004], [r, h * 0.15], [r, h * 0.85], [r * 0.88, h], [r * 0.86, h + 0.004],
  ], M.glass);
  const lid = cyl(r * 0.9, r * 0.9, 0.014, M.glass, 0, h + 0.01, 0);
  const seal = new THREE.Mesh(new THREE.TorusGeometry(r * 0.88, 0.004, 8, 24), new THREE.MeshStandardMaterial({ color: 0xcc7a3d, roughness: 0.8 }));
  seal.rotation.x = Math.PI / 2;
  seal.position.y = h + 0.002;
  const clip = box(0.008, 0.018, r * 2.15, M.steelPlain, 0, h - 0.004, 0);
  if (fillRatio > 0) {
    const fill = cyl(r * 0.88, r * 0.88, h * fillRatio, new THREE.MeshStandardMaterial({
      color: fillColor, roughness: 0.95, envMapIntensity: 0.2,
    }), 0, h * fillRatio / 2 + 0.004, 0);
    g.add(fill);
  }
  g.add(jar, lid, seal, clip);
  return shadows(g, false, true);
}

function makeRainbowCupStand() {
  const g = new THREE.Group();
  const colors = [0xc0392b, 0xe67e22, 0xf1c40f, 0x27ae60, 0x2980b9, 0x8e44ad];
  g.add(cyl(0.0045, 0.0045, 0.24, M.chrome, 0, 0.12, 0));
  g.add(cyl(0.035, 0.04, 0.006, M.chrome, 0, 0.003, 0));
  colors.forEach((c, i) => {
    const mat = new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.2, clearcoat: 0.6, envMapIntensity: 0.8 });
    const cup = lathe([[0.0, 0.0], [0.014, 0.002], [0.02, 0.012], [0.021, 0.026], [0.019, 0.028]], mat);
    cup.position.set(0, 0.208 - i * 0.033, 0);
    g.add(cup);
    const s = cyl(0.027, 0.024, 0.005, mat, 0.058, 0.0075 + i * 0.0058, 0);
    g.add(s);
  });
  return shadows(g);
}

function makeCoffeeGrinder() {
  const g = new THREE.Group();
  g.add(lathe([[0.0, 0.0], [0.026, 0.002], [0.023, 0.07], [0.021, 0.135], [0.0, 0.137]], M.steelPlain));
  g.add(cyl(0.024, 0.023, 0.03, M.blackGloss, 0, 0.152, 0));
  const arm = cyl(0.005, 0.005, 0.07, M.steelPlain, 0.03, 0.183, 0);
  arm.rotation.z = Math.PI / 2 - 0.4;
  g.add(arm);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.015, 12, 10), M.driftwood);
  ball.position.set(0.057, 0.197, 0);
  g.add(ball);
  return shadows(g);
}

function makeBottle(color, r, h, { rough = 0.05 } = {}) {
  const mat = new THREE.MeshPhysicalMaterial({
    color, roughness: rough, transmission: 0.55, thickness: 0.03,
    transparent: true, opacity: 0.96, envMapIntensity: 0.9,
  });
  const g = new THREE.Group();
  const body = lathe([
    [0.0, 0.002], [r * 0.96, 0.004], [r, h * 0.08], [r, h * 0.62],
    [r * 0.45, h * 0.82], [r * 0.34, h * 0.9], [r * 0.34, h],
  ], mat);
  const cap = cyl(r * 0.36, r * 0.36, h * 0.06, M.blackMatte, 0, h * 1.0, 0);
  g.add(body, cap);
  return shadows(g, false);
}

function makeSpoon() {
  const g = new THREE.Group();
  const handle = cyl(0.0035, 0.0045, 0.11, M.chrome);
  handle.rotation.x = Math.PI / 2;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.014, 14, 10), M.chrome);
  bowl.scale.set(1, 0.3, 1.35);
  bowl.position.set(0, 0, -0.065);
  g.add(handle, bowl);
  return shadows(g);
}

function makeTeabag() {
  const g = new THREE.Group();
  const bagMat = new THREE.MeshStandardMaterial({ color: 0xd9c9a3, roughness: 0.98 });
  g.add(rbox(0.034, 0.05, 0.01, 0.004, bagMat, 0, 0, 0));
  const string = cyl(0.0012, 0.0012, 0.07, new THREE.MeshBasicMaterial({ color: 0xeeeeee }), 0, 0.06, 0);
  const tag = box(0.014, 0.018, 0.001, new THREE.MeshStandardMaterial({ color: 0x37953c }), 0, 0.1, 0);
  g.add(string, tag);
  return shadows(g);
}

function makeFruitBowl() {
  const g = new THREE.Group();
  const bowl = lathe([[0.0, 0.0], [0.05, 0.004], [0.11, 0.03], [0.13, 0.07], [0.128, 0.075], [0.1, 0.045], [0.04, 0.015], [0.0, 0.012]], M.wood);
  g.add(bowl);
  const fruits = [
    [0xc23b22, 0.032, -0.04, 0.055, 0.01],   // apple
    [0x7fb040, 0.03, 0.04, 0.055, -0.03],    // apple
    [0xe8940a, 0.03, 0.0, 0.058, 0.045],     // orange
    [0xe8c50a, 0.028, -0.055, 0.06, -0.045], // lemon
  ];
  for (const [c, r, x, y, z] of fruits) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14),
      new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.45, clearcoat: 0.4, envMapIntensity: 0.6 }));
    f.position.set(x, y, z);
    f.scale.y = 0.92;
    g.add(f);
  }
  return shadows(g);
}

function makeTowel(color = 0xd8dde2, checks = true) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8ecef';
  ctx.fillRect(0, 0, size, size);
  if (checks) {
    ctx.strokeStyle = 'rgba(60,70,90,0.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i < size; i += 22) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide });
  // draped: curved plane
  const geo = new THREE.PlaneGeometry(0.22, 0.3, 8, 10);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i), x = pos.getX(i);
    pos.setZ(i, Math.sin(x * 9) * 0.008 + Math.abs(y) * -0.02);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat);
  return shadows(m, true, true);
}

function makeChoppingBoard(w, h, mat) {
  const g = new THREE.Group();
  const b = rbox(w, h, 0.014, 0.006, mat);
  const hole = cyl(0.012, 0.012, 0.02, new THREE.MeshBasicMaterial({ color: 0x30281e }), 0, h / 2 - 0.03, 0);
  hole.rotation.x = Math.PI / 2;
  g.add(b, hole);
  return shadows(g);
}

function makeCookbooks() {
  const g = new THREE.Group();
  const colors = [0x8a4a3a, 0x3a5a7a, 0x707a4a, 0xd8cfc0];
  colors.forEach((c, i) => {
    const b = rbox(0.16 - i * 0.012, 0.028, 0.21 - i * 0.01, 0.004,
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }), 0, 0.016 + i * 0.029, 0);
    b.rotation.y = (Math.random() - 0.5) * 0.18;
    g.add(b);
  });
  return shadows(g);
}

function makeSaucepan() {
  const g = new THREE.Group();
  const body = lathe([[0.0, 0.002], [0.075, 0.004], [0.078, 0.01], [0.078, 0.07], [0.074, 0.072]], M.steelPlain);
  const handle = cyl(0.009, 0.011, 0.14, M.blackMatte, 0.14, 0.06, 0);
  handle.rotation.z = Math.PI / 2;
  g.add(body, handle);
  return shadows(g);
}

/* ==================================================================== */

export function buildWorld(scene) {
  initMaterials();
  RectAreaLightUniformsLib.init();

  const refs = {};
  const interactables = [];
  const colliders = [];
  const world = new THREE.Group();
  scene.add(world);

  const { minX, maxX, minZ, maxZ, ceil, counterTop } = ROOM;
  const W = maxX - minX, L = maxZ - minZ;
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

  /* ---- shell ---- */
  const flag = flagstoneSet(1024, [2.1, 4.0]);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, L),
    new THREE.MeshStandardMaterial({
      map: flag.map, normalMap: flag.normalMap, roughnessMap: flag.roughnessMap,
      roughness: 1.0, envMapIntensity: 0.5,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0, cz);
  floor.receiveShadow = true;
  world.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, L),
    new THREE.MeshStandardMaterial({ color: 0xf7f6f1, roughness: 0.95 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(cx, ceil, cz);
  world.add(ceiling);

  const plas = plasterSet(512, [243, 241, 234], [3, 1.4]);
  const plaster = new THREE.MeshStandardMaterial({
    map: plas.map, normalMap: plas.normalMap, roughness: 0.9, envMapIntensity: 0.35,
  });

  const nearWall = new THREE.Mesh(new THREE.PlaneGeometry(W, ceil), plaster);
  nearWall.rotation.y = Math.PI;
  nearWall.position.set(cx, ceil / 2, maxZ);
  world.add(nearWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(L, ceil), plaster);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(minX, ceil / 2, cz);
  leftWall.receiveShadow = true;
  world.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(L, ceil), plaster);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(maxX, ceil / 2, cz);
  rightWall.receiveShadow = true;
  world.add(rightWall);

  // skirting boards
  for (const [x, rot] of [[minX + 0.01, Math.PI / 2], [maxX - 0.01, -Math.PI / 2]]) {
    const sk = box(0.02, 0.1, L, M.mullion, x, 0.05, cz);
    sk.rotation.y = 0;
    world.add(sk);
  }
  world.add(box(W, 0.1, 0.02, M.mullion, cx, 0.05, maxZ - 0.01));

  // sage-green splashback (right wall between worktop and shelf)
  const greenSet = greenPaintSet(512, [4, 1]);
  const splash = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 0.62),
    new THREE.MeshStandardMaterial({
      map: greenSet.map, normalMap: greenSet.normalMap, roughness: 0.75, envMapIntensity: 0.4,
    })
  );
  splash.rotation.y = -Math.PI / 2;
  splash.position.set(maxX - 0.006, counterTop + 0.31, -2.55);
  splash.receiveShadow = true;
  world.add(splash);

  /* ---- glass-block window band ---- */
  const blocks = new THREE.Group();
  const bw = 0.27, bh = 0.25, rows = 3;
  const bandY0 = 1.7, bandZ0 = -0.5, bandZ1 = -4.9;
  const cols = Math.floor(Math.abs(bandZ1 - bandZ0) / bw);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pane = rbox(0.04, bh - 0.045, bw - 0.045, 0.015, M.frosted,
        maxX - 0.025, bandY0 + bh / 2 + r * bh, bandZ0 - bw / 2 - c * bw);
      blocks.add(pane);
    }
  }
  for (let r = 0; r <= rows; r++) {
    blocks.add(box(0.055, 0.045, Math.abs(bandZ1 - bandZ0), M.mullion,
      maxX - 0.028, bandY0 + r * bh, (bandZ0 + bandZ1) / 2));
  }
  for (let c = 0; c <= cols; c++) {
    blocks.add(box(0.055, rows * bh + 0.045, 0.045, M.mullion,
      maxX - 0.028, bandY0 + rows * bh / 2, bandZ0 - c * bw));
  }
  shadows(blocks, false, true);
  world.add(blocks);

  /* ---- garden door ---- */
  const doorG = new THREE.Group();
  const farWall = new THREE.Mesh(new THREE.PlaneGeometry(W, ceil), plaster);
  farWall.position.set(cx, ceil / 2, minZ);
  farWall.receiveShadow = true;
  doorG.add(farWall);
  const doorW = 0.9, doorH = 2.08, doorX = 0.12;
  const frameMat = M.mullion;
  doorG.add(rbox(doorW + 0.16, 0.09, 0.12, 0.01, frameMat, doorX, doorH + 0.045, minZ + 0.03));
  doorG.add(rbox(0.09, doorH + 0.09, 0.12, 0.01, frameMat, doorX - doorW / 2 - 0.045, (doorH + 0.09) / 2, minZ + 0.03));
  doorG.add(rbox(0.09, doorH + 0.09, 0.12, 0.01, frameMat, doorX + doorW / 2 + 0.045, (doorH + 0.09) / 2, minZ + 0.03));
  // door slab
  doorG.add(rbox(doorW, 0.3, 0.055, 0.008, frameMat, doorX, 0.15, minZ + 0.05));
  doorG.add(rbox(0.1, doorH, 0.055, 0.008, frameMat, doorX - doorW / 2 + 0.05, doorH / 2, minZ + 0.05));
  doorG.add(rbox(0.1, doorH, 0.055, 0.008, frameMat, doorX + doorW / 2 - 0.05, doorH / 2, minZ + 0.05));
  doorG.add(rbox(doorW, 0.1, 0.055, 0.008, frameMat, doorX, doorH - 0.05, minZ + 0.05));
  // glazing bars (dark, like the video)
  doorG.add(box(0.035, doorH - 0.42, 0.05, M.blackMatte, doorX, doorH / 2 + 0.1, minZ + 0.055));
  doorG.add(box(doorW - 0.18, 0.035, 0.05, M.blackMatte, doorX, doorH * 0.63, minZ + 0.055));
  // glass
  const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(doorW - 0.18, doorH - 0.42), M.glass);
  doorGlass.position.set(doorX, doorH / 2 + 0.09, minZ + 0.05);
  doorG.add(doorGlass);
  // garden view set back for parallax
  const garden = new THREE.Mesh(
    new THREE.PlaneGeometry(doorW - 0.14, doorH - 0.36),
    new THREE.MeshBasicMaterial({ map: gardenTexture() })
  );
  garden.position.set(doorX, doorH / 2 + 0.08, minZ + 0.02);
  doorG.add(garden);
  refs.gardenPlane = garden;
  const handle = cyl(0.011, 0.011, 0.14, M.chrome, doorX + doorW / 2 - 0.1, 1.02, minZ + 0.085);
  doorG.add(handle);
  const kick = box(doorW + 0.2, 0.02, 0.16, M.steelPlain, doorX, 0.01, minZ + 0.08); // threshold
  doorG.add(kick);
  shadows(doorG, false, true);
  world.add(doorG);

  /* ---- right run: cabinets + worktop + sink ---- */
  const right = new THREE.Group();
  const cabX0 = 0.68, cabX1 = maxX;
  const cabW = cabX1 - cabX0, cabCX = (cabX0 + cabX1) / 2;
  const runZ0 = -0.35, runZ1 = -4.95;
  const runL = Math.abs(runZ1 - runZ0), runCZ = (runZ0 + runZ1) / 2;

  const carc = box(cabW, counterTop - 0.1, runL, M.cabinet, cabCX, (counterTop - 0.1) / 2 + 0.1, runCZ);
  carc.receiveShadow = true; carc.castShadow = true;
  right.add(carc);
  right.add(box(cabW - 0.06, 0.1, runL - 0.04, M.blackMatte, cabCX - 0.03, 0.05, runCZ));

  // door fronts with gaps + long bar handles
  const doorZs = [-0.75, -1.55, -2.35, -3.15, -3.95];
  for (const dz of doorZs) {
    const front = rbox(0.018, counterTop - 0.17, 0.72, 0.006, M.cabinet, cabX0 - 0.009, (counterTop - 0.1) / 2 + 0.1, dz);
    front.castShadow = false;
    right.add(front);
    const bar = cyl(0.006, 0.006, 0.32, M.steelPlain, cabX0 - 0.032, counterTop - 0.16, dz - 0.16);
    bar.rotation.x = Math.PI / 2;
    right.add(bar);
    for (const off of [-0.15, 0.02]) {
      right.add(cyl(0.005, 0.005, 0.025, M.steelPlain, cabX0 - 0.022, counterTop - 0.16, dz - 0.16 + off + 0.15).rotateX(Math.PI / 2));
    }
  }
  // dishwasher front
  const dwSet = brushedSteelSet(256, [1, 1]);
  const dwMat = new THREE.MeshPhysicalMaterial({
    map: dwSet.map, normalMap: dwSet.normalMap, metalness: 0.9, roughness: 0.35, envMapIntensity: 0.8,
  });
  right.add(rbox(0.02, counterTop - 0.18, 0.6, 0.006, dwMat, cabX0 - 0.01, (counterTop - 0.12) / 2 + 0.1, -4.62));
  const dwBar = cyl(0.008, 0.008, 0.5, M.steelPlain, cabX0 - 0.04, counterTop - 0.13, -4.62);
  dwBar.rotation.x = Math.PI / 2;
  right.add(dwBar);

  // worktop
  const top = rbox(cabW + 0.05, 0.04, runL + 0.05, 0.012, M.steelTop, cabCX - 0.012, counterTop + 0.02, runCZ);
  top.receiveShadow = true; top.castShadow = true;
  right.add(top);
  right.add(rbox(0.025, 0.06, runL, 0.008, M.steelTop, cabX1 - 0.02, counterTop + 0.065, runCZ)); // upstand

  /* sink */
  const sinkZ = -3.0, sinkCX = 0.98;
  right.add(box(0.48, 0.012, 0.58, M.steelTop, sinkCX, counterTop + 0.043, sinkZ)); // raised rim
  // basin interior
  const basinD = 0.17;
  const bW = 0.38, bL = 0.46;
  const basinMat = new THREE.MeshPhysicalMaterial({
    color: 0xa9adb1, metalness: 0.9, roughness: 0.32, envMapIntensity: 0.7,
  });
  // floor of basin
  const bFloor = box(bW, 0.008, bL, basinMat, sinkCX, counterTop - basinD + 0.045, sinkZ);
  right.add(bFloor);
  // four sloped walls
  const wallTh = 0.008;
  right.add(box(bW, basinD, wallTh, basinMat, sinkCX, counterTop - basinD / 2 + 0.046, sinkZ - bL / 2));
  right.add(box(bW, basinD, wallTh, basinMat, sinkCX, counterTop - basinD / 2 + 0.046, sinkZ + bL / 2));
  right.add(box(wallTh, basinD, bL, basinMat, sinkCX - bW / 2, counterTop - basinD / 2 + 0.046, sinkZ));
  right.add(box(wallTh, basinD, bL, basinMat, sinkCX + bW / 2, counterTop - basinD / 2 + 0.046, sinkZ));
  // plughole
  right.add(cyl(0.022, 0.022, 0.004, M.blackGloss, sinkCX, counterTop - basinD + 0.05, sinkZ));
  right.add(cyl(0.019, 0.019, 0.005, M.chrome, sinkCX, counterTop - basinD + 0.052, sinkZ));
  // draining grooves
  for (let i = 0; i < 5; i++) {
    right.add(box(0.2, 0.003, 0.012, basinMat, sinkCX - 0.05, counterTop + 0.049, sinkZ - bL / 2 - 0.1 - i * 0.045));
  }
  // tap — curved chrome swan neck
  const tapG = new THREE.Group();
  tapG.add(cyl(0.02, 0.024, 0.045, M.chrome, 0, 0.022, 0));
  tapG.add(tube(
    [[0, 0.02, 0], [0, 0.24, 0], [0, 0.3, -0.03], [0, 0.31, -0.09], [0, 0.27, -0.14], [0, 0.24, -0.155]],
    0.011, M.chrome
  ));
  tapG.add(cyl(0.014, 0.011, 0.03, M.chrome, 0, 0.23, -0.155));
  const lever = cyl(0.007, 0.009, 0.1, M.chrome, 0.045, 0.06, 0.02);
  lever.rotation.z = Math.PI / 2 - 0.35;
  tapG.add(lever);
  tapG.position.set(sinkCX + 0.13, counterTop + 0.045, sinkZ + 0.19);
  shadows(tapG);
  right.add(tapG);
  refs.tap = tapG;
  refs.tapSpoutWorld = new THREE.Vector3(sinkCX + 0.13, counterTop + 0.045 + 0.215, sinkZ + 0.19 - 0.155);
  // glass splash guards
  for (const dz of [-0.24, 0.24]) {
    const guard = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), M.glass);
    guard.rotation.y = -Math.PI / 2;
    guard.position.set(cabX1 - 0.07, counterTop + 0.22, sinkZ + dz);
    right.add(guard);
  }

  world.add(right);
  colliders.push({ minX: cabX0 - 0.05, maxX: cabX1, minZ: runZ1, maxZ: runZ0 + 0.05 });

  /* ---- black floating shelf + items ---- */
  const shelfY = 1.5, shelfZ0 = -0.45, shelfZ1 = -4.5;
  const shelfL = Math.abs(shelfZ1 - shelfZ0);
  const shelf = rbox(0.26, 0.075, shelfL, 0.008, M.blackMatte, maxX - 0.14, shelfY - 0.038, (shelfZ0 + shelfZ1) / 2);
  shelf.castShadow = true; shelf.receiveShadow = true;
  world.add(shelf);

  const onShelf = (obj, z, x = maxX - 0.15) => {
    obj.position.set(x, shelfY + 0.002, z);
    world.add(obj);
    return obj;
  };

  const floralTin = cyl(0.045, 0.045, 0.17,
    new THREE.MeshPhysicalMaterial({
      map: labelTexture(['❀ ✿', 'TEA', '❀ ✿'], '#e9e4d6', '#7a6a8a', { font: 'bold 40px Georgia, serif' }),
      roughness: 0.3, clearcoat: 0.4, envMapIntensity: 0.6,
    }), 0, 0.085, 0);
  onShelf(shadows(floralTin), -0.62);
  const teaBoxDark = rbox(0.05, 0.16, 0.11, 0.006, M.blackGloss, 0, 0.08, 0);
  onShelf(shadows(teaBoxDark), -0.82);
  const coffeeBag = rbox(0.06, 0.15, 0.1, 0.015,
    new THREE.MeshStandardMaterial({ color: 0xf1ede2, roughness: 0.95 }), 0, 0.075, 0);
  coffeeBag.rotation.y = 0.2;
  onShelf(shadows(coffeeBag), -1.0);
  onShelf(makeRainbowCupStand(), -1.25);
  onShelf(makeCoffeeGrinder(), -1.52);

  // red Tea canister
  const teaCanister = new THREE.Group();
  const canBody = cyl(0.055, 0.05, 0.15,
    new THREE.MeshPhysicalMaterial({
      map: teaCanisterTexture(), roughness: 0.15, clearcoat: 0.9, clearcoatRoughness: 0.1, envMapIntensity: 0.9,
    }), 0, 0.075, 0);
  const canLid = lathe([[0.05, 0.15], [0.056, 0.152], [0.052, 0.172], [0.02, 0.178], [0.0, 0.18]], M.red);
  const canKnob = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8), M.red);
  canKnob.position.y = 0.188;
  teaCanister.add(canBody, canLid, canKnob);
  shadows(teaCanister);
  onShelf(teaCanister, -1.8);
  teaCanister.userData.interact = 'teaCanister';
  interactables.push(teaCanister);
  refs.teaCanister = teaCanister;

  // Barry's Tea box
  const barrys = new THREE.Group();
  const bMat = new THREE.MeshStandardMaterial({ map: barrysTexture(), roughness: 0.65 });
  const bSide = new THREE.MeshStandardMaterial({ color: 0x37953c, roughness: 0.65 });
  const bBox = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.075, 0.065), [bSide, bSide, bSide, bSide, bMat, bMat]);
  bBox.position.y = 0.0375;
  bBox.rotation.y = Math.PI / 2 + 0.12;
  barrys.add(bBox);
  shadows(barrys);
  onShelf(barrys, -2.12);
  barrys.userData.interact = 'teaBox';
  interactables.push(barrys);
  refs.teaBox = barrys;

  // sugar jar
  const sugarJar = new THREE.Group();
  const sJar = lathe([[0.0, 0.002], [0.048, 0.004], [0.05, 0.02], [0.05, 0.115], [0.046, 0.13]], M.glass);
  const sFill = cyl(0.044, 0.044, 0.08, new THREE.MeshStandardMaterial({ color: 0xf3ede0, roughness: 1 }), 0, 0.044, 0);
  const sLid = cyl(0.052, 0.052, 0.018, M.driftwood, 0, 0.139, 0);
  const sLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.042),
    new THREE.MeshStandardMaterial({ map: labelTexture('SUGAR', '#f6f1e4', '#6b5b3e', { font: 'bold 42px Verdana, sans-serif' }) })
  );
  sLabel.position.set(-0.0505, 0.062, 0);
  sLabel.rotation.y = -Math.PI / 2;
  sugarJar.add(sJar, sFill, sLid, sLabel);
  shadows(sugarJar, false);
  onShelf(sugarJar, -2.42);
  sugarJar.userData.interact = 'sugar';
  interactables.push(sugarJar);
  refs.sugarJar = sugarJar;

  const tin = cyl(0.04, 0.04, 0.12,
    new THREE.MeshPhysicalMaterial({
      map: labelTexture(['GOLDEN', 'SYRUP'], '#d8514a', '#f6ecd8', { font: 'bold 36px Georgia, serif' }),
      roughness: 0.25, envMapIntensity: 0.7,
    }), 0, 0.06, 0);
  onShelf(shadows(tin), -2.64);

  const jarSpecs = [
    [0.05, 0.2, 0.75, 0xe8d9a0], [0.055, 0.24, 0.6, 0xf0e6c8], [0.05, 0.18, 0.8, 0xefe6d0],
    [0.06, 0.22, 0.5, 0xd8c898], [0.05, 0.16, 0.4, 0xe5d5ae],
  ];
  jarSpecs.forEach((s, i) => onShelf(makeKilnerJar(...s), -2.9 - i * 0.32));

  const clockG = new THREE.Group();
  clockG.add(box(0.06, 0.02, 0.3, M.driftwood, 0, 0.01, 0));
  const slate = rbox(0.016, 0.17, 0.17, 0.004, new THREE.MeshStandardMaterial({ color: 0x383b3e, roughness: 0.9 }), 0, 0.105, 0);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.155, 0.155), new THREE.MeshStandardMaterial({ map: clockTexture() }));
  face.position.set(-0.0095, 0.105, 0);
  face.rotation.y = -Math.PI / 2;
  clockG.add(slate, face);
  shadows(clockG);
  onShelf(clockG, -4.32);

  // spice rail under shelf
  const railZ0 = -1.35, railZ1 = -2.15;
  const rail = cyl(0.006, 0.006, Math.abs(railZ1 - railZ0), M.blackMatte, maxX - 0.06, 1.31, (railZ0 + railZ1) / 2);
  rail.rotation.x = Math.PI / 2;
  world.add(shadows(rail, false));
  for (let i = 0; i < 5; i++) {
    const z = railZ0 + ((i + 0.5) / 5) * (railZ1 - railZ0);
    const tubeJar = cyl(0.012, 0.012, 0.075, M.glass, maxX - 0.06, 1.255, z);
    const cap = cyl(0.013, 0.013, 0.018, M.blackMatte, maxX - 0.06, 1.298, z);
    const spice = cyl(0.009, 0.009, 0.024, new THREE.MeshStandardMaterial({
      color: [0xa0522d, 0xdeb887, 0x8b0000, 0x556b2f, 0x3d2b1f][i], roughness: 0.95,
    }), maxX - 0.06, 1.232, z);
    world.add(shadows(tubeJar, false), shadows(cap, false), shadows(spice, false));
  }

  /* ---- counter items (right run) ---- */
  const onCounter = (obj, z, x = 0.98) => {
    obj.position.set(x, counterTop + 0.04, z);
    world.add(obj);
    return obj;
  };

  const espresso = makeRedEspressoMachine();
  espresso.rotation.y = -Math.PI / 2;
  onCounter(espresso, -0.62, 1.05);
  espresso.userData.interact = 'espresso';
  interactables.push(espresso);

  const yellowMachine = makeYellowCoffeeMachine();
  yellowMachine.rotation.y = -Math.PI / 2;
  onCounter(yellowMachine, -1.08, 1.06);
  yellowMachine.userData.interact = 'coffee';
  interactables.push(yellowMachine);

  const kettleBase = makeKettleBase();
  onCounter(kettleBase, -1.52, 0.97);
  kettleBase.userData.interact = 'kettleBase';
  interactables.push(kettleBase);
  refs.kettleBase = kettleBase;
  refs.kettleHome = new THREE.Vector3(0.97, counterTop + 0.052, -1.52);

  const kettle = makeKettle();
  kettle.position.copy(refs.kettleHome);
  kettle.rotation.y = Math.PI / 2 + 0.35;
  world.add(kettle);
  kettle.userData.interact = 'kettle';
  interactables.push(kettle);
  refs.kettle = kettle;

  const teapot = makeTeapot();
  teapot.rotation.y = 0.4;
  onCounter(teapot, -1.9, 1.04);
  teapot.userData.interact = 'teapot';
  interactables.push(teapot);

  const mug = makeMug();
  mug.rotation.y = -0.6;
  onCounter(mug, -2.14, 0.95);
  mug.userData.interact = 'mug';
  interactables.push(mug);
  refs.mug = mug;
  refs.mugPrep = new THREE.Vector3(0.93, counterTop + 0.04, -1.78);
  const mug2 = makeMug(0xdfe3e0);
  mug2.rotation.y = 2.3;
  onCounter(mug2, -2.26, 1.08);

  const spoon = makeSpoon();
  spoon.rotation.y = 0.5;
  onCounter(spoon, -2.02, 0.85);
  spoon.position.y = counterTop + 0.048;
  spoon.userData.interact = 'spoon';
  interactables.push(spoon);
  refs.spoon = spoon;

  // butter dish + bottles near sink
  const tup = rbox(0.16, 0.055, 0.11, 0.012, new THREE.MeshPhysicalMaterial({
    color: 0xd8d0b8, roughness: 0.2, transmission: 0.4, transparent: true, opacity: 0.92,
  }), 0, 0.0275, 0);
  onCounter(shadows(tup), -2.5, 1.12);
  onCounter(makeBottle(0x2a3d1f, 0.032, 0.28), -2.62, 0.9);
  onCounter(makeBottle(0xd8e8f0, 0.03, 0.24, { rough: 0.15 }), -2.72, 1.05);
  onCounter(makeBottle(0x3d2b14, 0.028, 0.3), -0.85, 0.88); // olive oil by espresso

  // milk bottle
  const milkG = new THREE.Group();
  const milkBody = lathe([
    [0.0, 0.002], [0.04, 0.004], [0.044, 0.03], [0.044, 0.13],
    [0.03, 0.16], [0.021, 0.175], [0.021, 0.195],
  ], new THREE.MeshPhysicalMaterial({
    map: milkTexture(), roughness: 0.4, clearcoat: 0.3, envMapIntensity: 0.5,
  }));
  const milkCap = cyl(0.022, 0.022, 0.016, new THREE.MeshStandardMaterial({ color: 0x2f7fb8, roughness: 0.4 }), 0, 0.202, 0);
  milkG.add(milkBody, milkCap);
  shadows(milkG);
  onCounter(milkG, -2.38, 0.88);
  milkG.userData.interact = 'milk';
  interactables.push(milkG);
  refs.milk = milkG;

  // sink interaction proxy
  const sinkProxy = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.3, 0.6),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  sinkProxy.position.set(sinkCX, counterTop + 0.1, sinkZ);
  world.add(sinkProxy);
  sinkProxy.userData.interact = 'sink';
  interactables.push(sinkProxy);
  refs.sink = sinkProxy;
  refs.sinkPos = new THREE.Vector3(sinkCX, counterTop, sinkZ);

  // washing-up area
  const wubowl = lathe([[0.0, 0.0], [0.045, 0.003], [0.07, 0.03], [0.075, 0.058], [0.07, 0.06], [0.05, 0.032], [0.02, 0.012], [0.0, 0.01]], M.wood);
  onCounter(shadows(wubowl), -3.42, 1.15);
  onCounter(makeBottle(0x3f7a38, 0.022, 0.2), -3.35, 1.22);
  const flask = cyl(0.03, 0.03, 0.17, new THREE.MeshPhysicalMaterial({ color: 0xaed581, roughness: 0.4, clearcoat: 0.4 }), 0, 0.085, 0);
  onCounter(shadows(flask), -3.52, 1.2);

  const toaster = makeToaster();
  toaster.rotation.y = 0.06;
  onCounter(toaster, -3.85, 1.02);
  toaster.userData.interact = 'toaster';
  interactables.push(toaster);

  // chopping boards leaning on splashback + teal board on dishwasher
  const board1 = makeChoppingBoard(0.26, 0.34, M.wood);
  board1.position.set(1.24, counterTop + 0.21, -4.15);
  board1.rotation.z = 0.16;
  board1.rotation.y = -Math.PI / 2;
  world.add(board1);
  const tealBoard = rbox(0.3, 0.014, 0.42, 0.006, M.teal, 0, 0.007, 0);
  tealBoard.rotation.y = 0.15;
  onCounter(shadows(tealBoard), -4.55, 0.95);

  // cookbooks at the near end
  const books = makeCookbooks();
  onCounter(books, -0.45, 1.1);

  // fruit bowl mid-counter
  onCounter(makeFruitBowl(), -2.88, 0.82);

  // kitchen roll
  const kr = new THREE.Group();
  kr.add(cyl(0.05, 0.05, 0.02, M.wood, 0, 0.01, 0));
  kr.add(cyl(0.008, 0.008, 0.3, M.wood, 0, 0.15, 0));
  kr.add(cyl(0.052, 0.052, 0.24, new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.95 }), 0, 0.15, 0));
  onCounter(shadows(kr), -4.05, 1.15);

  // tea towel over the dishwasher bar
  const towel = makeTowel();
  towel.position.set(cabX0 - 0.045, counterTop - 0.05, -4.45);
  towel.rotation.y = Math.PI / 2;
  world.add(towel);

  /* ---- left side ---- */
  const left = new THREE.Group();
  const hobX0 = -1.35, hobX1 = -0.68;
  left.add(box(hobX1 - hobX0, counterTop - 0.1, 1.5, M.cabinet, (hobX0 + hobX1) / 2, (counterTop - 0.1) / 2 + 0.1, -1.0));
  const hobTop = rbox(hobX1 - hobX0 + 0.04, 0.045, 1.54, 0.01, M.hobGlass, (hobX0 + hobX1) / 2 + 0.01, counterTop + 0.02, -1.0);
  hobTop.receiveShadow = true;
  left.add(hobTop);
  for (const [dx, dz] of [[-0.13, -0.75], [0.12, -0.75], [-0.13, -1.2], [0.12, -1.2]]) {
    left.add(cyl(0.085, 0.085, 0.002, new THREE.MeshStandardMaterial({
      color: 0x35353a, roughness: 0.35, envMapIntensity: 0.6,
    }), -1.01 + dx, counterTop + 0.044, dz));
    left.add(cyl(0.06, 0.06, 0.0025, new THREE.MeshStandardMaterial({
      color: 0x2a2a2e, roughness: 0.3,
    }), -1.01 + dx, counterTop + 0.0445, dz));
  }
  // saucepan on the back ring
  const pan = makeSaucepan();
  pan.position.set(-1.14, counterTop + 0.045, -1.2);
  pan.rotation.y = -0.5;
  left.add(pan);
  // oven front below hob
  const ovenSet = brushedSteelSet(256, [1.2, 0.8]);
  const ovenMat = new THREE.MeshPhysicalMaterial({
    map: ovenSet.map, normalMap: ovenSet.normalMap, metalness: 0.9, roughness: 0.4, envMapIntensity: 0.7,
  });
  left.add(rbox(0.02, 0.5, 0.62, 0.006, ovenMat, hobX1 - 0.01, 0.5, -1.0));
  left.add(box(0.015, 0.26, 0.44, new THREE.MeshPhysicalMaterial({
    color: 0x151515, roughness: 0.1, clearcoat: 1, envMapIntensity: 0.9,
  }), hobX1 - 0.002, 0.48, -1.0));
  const ovenBar = cyl(0.009, 0.009, 0.5, M.steelPlain, hobX1 + 0.035, 0.72, -1.0);
  ovenBar.rotation.x = Math.PI / 2;
  left.add(ovenBar);
  const ovenTowel = makeTowel(0xd8dde2);
  ovenTowel.position.set(hobX1 + 0.035, 0.57, -1.15);
  ovenTowel.rotation.y = -Math.PI / 2;
  left.add(ovenTowel);
  // knives + teal cloth on hob counter end
  left.add(rbox(0.28, 0.008, 0.36, 0.004, M.teal, -1.0, counterTop + 0.048, -0.42));
  const knife = new THREE.Group();
  knife.add(box(0.015, 0.0025, 0.16, M.chrome, 0, 0, 0));
  knife.add(rbox(0.02, 0.018, 0.09, 0.006, M.blackMatte, 0, 0.004, 0.125));
  knife.position.set(-1.02, counterTop + 0.055, -0.42);
  knife.rotation.y = 0.4;
  left.add(shadows(knife));

  // wooden prep table
  left.add(rbox(0.62, 0.045, 0.95, 0.01, M.wood, -1.02, 0.865, -2.4));
  for (const [dx, dz] of [[-0.26, -0.42], [0.26, -0.42], [-0.26, 0.42], [0.26, 0.42]]) {
    left.add(box(0.05, 0.84, 0.05, M.wood, -1.02 + dx, 0.42, -2.4 + dz));
  }
  const ketchup = makeBottle(0xb33a2e, 0.022, 0.16);
  ketchup.position.set(-1.1, 0.89, -2.2);
  left.add(ketchup);
  const soy = makeBottle(0x2a1d14, 0.02, 0.18);
  soy.position.set(-1.0, 0.89, -2.32);
  left.add(soy);
  const chutney = makeKilnerJar(0.035, 0.09, 0.7, 0xa0522d);
  chutney.position.set(-1.14, 0.89, -2.5);
  left.add(chutney);
  const breadBoard = makeChoppingBoard(0.3, 0.2, M.driftwood);
  breadBoard.rotation.x = -Math.PI / 2;
  breadBoard.position.set(-0.95, 0.895, -2.62);
  left.add(breadBoard);
  const loaf = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.07, 0.2, 4, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xc89a58, roughness: 0.9 }));
  loaf.position.set(-0.95, 0.93, -2.62);
  left.add(shadows(loaf));

  // green cubby bottle unit near door
  const cubbyHoleMat = new THREE.MeshStandardMaterial({ color: 0x77875d, roughness: 0.9 });
  const cub = new THREE.Group();
  cub.add(rbox(0.34, 1.15, 1.0, 0.01, M.greenCubby, 0, 0.575, 0));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      cub.add(box(0.05, 0.28, 0.26, cubbyHoleMat, 0.15, 0.24 + r * 0.34, -0.34 + c * 0.34));
      if ((r * 3 + c) % 3 !== 1) {
        const b = makeBottle([0x2a3d1f, 0x3d2b1f, 0x556b2f][(r + c) % 3], 0.026, 0.2 + ((r * c) % 3) * 0.02);
        b.position.set(0.13, 0.1 + r * 0.34, -0.34 + c * 0.34);
        cub.add(b);
      }
    }
  }
  cub.position.set(-1.16, 0, -4.05);
  shadows(cub);
  left.add(cub);

  // upper green cubby shelf
  const upper = new THREE.Group();
  upper.add(rbox(0.3, 0.9, 1.2, 0.01, M.greenCubby, 0, 0, 0));
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      upper.add(box(0.05, 0.36, 0.34, cubbyHoleMat, 0.13, -0.22 + r * 0.44, -0.4 + c * 0.4));
    }
  }
  const pot = lathe([[0.0, 0.0], [0.055, 0.003], [0.06, 0.05], [0.058, 0.085], [0.05, 0.088]], M.steelPlain);
  pot.position.set(0.12, 0.22, -0.4);
  upper.add(pot);
  const eggs = rbox(0.12, 0.05, 0.1, 0.01, new THREE.MeshStandardMaterial({ color: 0xd9c9a3, roughness: 1 }), 0.12, -0.34, 0);
  upper.add(eggs);
  const jamJar = makeKilnerJar(0.03, 0.08, 0.6, 0xa03030);
  jamJar.position.set(0.12, -0.4, 0.4);
  upper.add(jamJar);
  upper.position.set(-1.2, 1.75, -0.9);
  shadows(upper);
  left.add(upper);

  world.add(left);
  colliders.push({ minX: -1.35, maxX: -0.64, minZ: -1.78, maxZ: -0.22 });
  colliders.push({ minX: -1.35, maxX: -0.68, minZ: -2.9, maxZ: -1.9 });
  colliders.push({ minX: -1.35, maxX: -0.96, minZ: -4.6, maxZ: -3.52 });

  /* ---- lighting: soft overcast daylight ---- */
  const hemi = new THREE.HemisphereLight(0xe3ebf0, 0x5f5a4c, 0.3);
  scene.add(hemi);

  // key light through the garden door — cool, soft
  const sun = new THREE.DirectionalLight(0xeef3f6, 3.2);
  sun.position.set(0.5, 2.4, -8.0);
  sun.target.position.set(-0.15, 0.3, -1.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 15;
  sun.shadow.camera.left = -3; sun.shadow.camera.right = 3;
  sun.shadow.camera.top = 3.2; sun.shadow.camera.bottom = -3;
  sun.shadow.bias = -0.0015;
  sun.shadow.radius = 7;
  scene.add(sun, sun.target);

  // area glow from the door opening
  const doorArea = new THREE.RectAreaLight(0xe9f0f2, 3.2, 0.85, 1.75);
  doorArea.position.set(0.12, 1.15, minZ + 0.06);
  doorArea.lookAt(0.12, 1.0, 0);
  scene.add(doorArea);

  // long soft area light along the glass-block band
  const windowArea = new THREE.RectAreaLight(0xe6edf1, 2.6, 4.3, 0.72);
  windowArea.position.set(maxX - 0.05, 2.07, -2.7);
  windowArea.lookAt(minX, 0.8, -2.7);
  scene.add(windowArea);

  // faint warm interior bounce
  const ceilLamp = new THREE.PointLight(0xffedd8, 2.2, 6.5, 1.9);
  ceilLamp.position.set(-0.2, 2.28, -2.2);
  scene.add(ceilLamp);
  const nearFill = new THREE.PointLight(0xfff4e4, 1.0, 4, 2);
  nearFill.position.set(0, 2.15, -0.5);
  scene.add(nearFill);

  return { refs, interactables, colliders, factories: { makeTeabag, makeMug } };
}
