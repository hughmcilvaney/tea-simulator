// Builds the galley kitchen from the reference video:
// stone flagstone floor, stainless worktop + sink on the right with white
// cabinets, sage-green splashback, black floating shelf (Kilner jars, red Tea
// canister, Barry's Tea, rainbow cups...), frosted glass-block window above,
// hob + wooden table on the left, garden door at the far end.
import * as THREE from 'three';
import {
  flagstoneTexture, plasterTexture, greenPaintTexture, brushedMetalTexture,
  woodTexture, cabinetTexture, gardenTexture, labelTexture, teaCanisterTexture,
  barrysTexture, milkTexture, frostedTexture, clockTexture,
} from './textures.js';

export const ROOM = {
  minX: -1.35, maxX: 1.35,
  minZ: -5.2, maxZ: 0.3,
  ceil: 2.5,
  counterTop: 0.92,
};

const M = {}; // shared materials

function initMaterials() {
  M.steel = new THREE.MeshStandardMaterial({ map: brushedMetalTexture([2, 1]), metalness: 0.85, roughness: 0.35 });
  M.steelPlain = new THREE.MeshStandardMaterial({ color: 0xc8c9cb, metalness: 0.9, roughness: 0.3 });
  M.chrome = new THREE.MeshStandardMaterial({ color: 0xd8dadc, metalness: 1.0, roughness: 0.18 });
  M.blackMatte = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.7 });
  M.blackGloss = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.25 });
  M.cabinet = new THREE.MeshStandardMaterial({ map: cabinetTexture(), roughness: 0.55 });
  M.ceramic = new THREE.MeshStandardMaterial({ color: 0xf5f2ea, roughness: 0.22 });
  M.greenCubby = new THREE.MeshStandardMaterial({ color: 0x9fae7a, roughness: 0.7 });
  M.wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.65 });
  M.driftwood = new THREE.MeshStandardMaterial({ map: woodTexture([1, 1], [190, 165, 130]), roughness: 0.8 });
  M.glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.08,
    transmission: 0.92, thickness: 0.01, transparent: true, opacity: 0.55,
  });
  M.frosted = new THREE.MeshStandardMaterial({
    map: frostedTexture(), emissive: 0xdfe8ee, emissiveIntensity: 0.55, roughness: 0.9,
  });
  M.red = new THREE.MeshStandardMaterial({ color: 0xc8322b, roughness: 0.25 });
  M.yellow = new THREE.MeshStandardMaterial({ color: 0xe8b400, roughness: 0.35 });
  M.teal = new THREE.MeshStandardMaterial({ color: 0x2e7f8f, roughness: 0.8 });
  M.water = new THREE.MeshStandardMaterial({ color: 0x9fc4d8, roughness: 0.1, transparent: true, opacity: 0.75 });
  M.tea = new THREE.MeshStandardMaterial({ color: 0x5a3417, roughness: 0.15 });
}

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}
function cyl(rTop, rBot, h, mat, x = 0, y = 0, z = 0, seg = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.position.set(x, y, z);
  return m;
}
function shadows(obj, cast = true, receive = true) {
  obj.traverse((o) => {
    if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; }
  });
  return obj;
}

/* ------------------------------------------------------------------ */
/* Small object factories                                              */
/* ------------------------------------------------------------------ */

function makeKettle() {
  const g = new THREE.Group();
  const body = cyl(0.052, 0.074, 0.175, M.steel, 0, 0.105, 0);
  const lid = cyl(0.05, 0.054, 0.02, M.blackGloss, 0, 0.2, 0);
  const knob = cyl(0.012, 0.012, 0.015, M.blackGloss, 0, 0.217, 0);
  // spout: angled cone at the front (-z side)
  const spout = cyl(0.011, 0.02, 0.075, M.steel, 0, 0.165, -0.075);
  spout.rotation.x = -0.7;
  spout.name = 'spout';
  // handle arc at the back
  const handleTop = box(0.024, 0.02, 0.075, M.blackMatte, 0, 0.195, 0.085);
  const handleBack = box(0.024, 0.13, 0.02, M.blackMatte, 0, 0.135, 0.115);
  const switchLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.025, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x333333, emissive: 0x000000 })
  );
  switchLight.position.set(0, 0.05, 0.09);
  switchLight.name = 'switchLight';
  const steamAnchor = new THREE.Object3D();
  steamAnchor.name = 'steamAnchor';
  steamAnchor.position.set(0, 0.215, -0.1);
  g.add(body, lid, knob, spout, handleTop, handleBack, switchLight, steamAnchor);
  return shadows(g);
}

function makeKettleBase() {
  const g = new THREE.Group();
  g.add(cyl(0.078, 0.082, 0.02, M.blackMatte, 0, 0.01, 0));
  return shadows(g);
}

function makeMug(color = 0xf5f2ea) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.22 });
  const bodyGeo = new THREE.CylinderGeometry(0.042, 0.038, 0.098, 24, 1, true);
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.22, side: THREE.DoubleSide }));
  body.position.y = 0.049;
  const bottom = cyl(0.038, 0.038, 0.006, mat, 0, 0.003, 0);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.007, 10, 20), mat);
  handle.position.set(0.045, 0.05, 0);
  handle.rotation.y = Math.PI / 2;
  g.add(body, bottom, handle);
  // water surface (hidden until poured)
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.0395, 0.0395, 0.004, 20), M.tea.clone());
  water.position.y = 0.02;
  water.visible = false;
  water.name = 'water';
  g.add(water);
  return shadows(g);
}

function makeTeapot() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 18), M.ceramic);
  body.scale.y = 0.85;
  body.position.y = 0.075;
  const lid = cyl(0.032, 0.045, 0.02, M.ceramic, 0, 0.145, 0);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 10), M.ceramic);
  knob.position.y = 0.163;
  const spout = cyl(0.011, 0.02, 0.09, M.ceramic, -0.085, 0.1, 0);
  spout.rotation.z = 0.9;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.009, 10, 20, Math.PI * 1.2), M.ceramic);
  handle.position.set(0.075, 0.085, 0);
  handle.rotation.z = -0.4;
  g.add(body, lid, knob, spout, handle);
  return shadows(g);
}

function makeToaster() {
  const g = new THREE.Group();
  const body = box(0.16, 0.14, 0.24, M.chrome, 0, 0.07, 0);
  for (const dz of [-0.05, 0.05]) {
    g.add(box(0.1, 0.006, 0.03, M.blackMatte, 0, 0.142, dz));
  }
  const lever = box(0.015, 0.03, 0.02, M.blackMatte, 0.085, 0.09, -0.08);
  g.add(body, lever);
  return shadows(g);
}

function makeYellowCoffeeMachine() {
  const g = new THREE.Group();
  g.add(box(0.3, 0.02, 0.22, M.yellow, 0, 0.01, 0));                 // base
  g.add(box(0.09, 0.34, 0.16, M.yellow, -0.09, 0.19, 0));            // tower
  const tank = box(0.08, 0.2, 0.12, new THREE.MeshStandardMaterial({
    color: 0x2a2a2a, roughness: 0.3, transparent: true, opacity: 0.85,
  }), -0.09, 0.44, 0);
  g.add(tank);
  g.add(box(0.12, 0.06, 0.14, M.blackMatte, 0.06, 0.31, 0));         // brew head
  const carafe = cyl(0.05, 0.058, 0.14, M.glass, 0.06, 0.09, 0);
  g.add(carafe);
  g.add(cyl(0.05, 0.05, 0.015, M.blackMatte, 0.06, 0.17, 0));
  return shadows(g);
}

function makeRedEspressoMachine() {
  const g = new THREE.Group();
  g.add(box(0.24, 0.055, 0.2, M.red, 0, 0.028, 0));
  g.add(box(0.2, 0.24, 0.14, M.red, 0, 0.17, -0.01));
  g.add(cyl(0.035, 0.035, 0.05, M.chrome, 0, 0.09, 0.06));           // group head
  g.add(cyl(0.045, 0.045, 0.02, M.chrome, 0, 0.3, -0.01));           // top cap
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.chrome);
  bowl.position.set(0.0, 0.3, -0.01);
  g.add(bowl);
  return shadows(g);
}

function makeKilnerJar(r, h, fillRatio, fillColor) {
  const g = new THREE.Group();
  const jar = cyl(r, r, h, M.glass, 0, h / 2, 0);
  const lidH = 0.018;
  const lid = cyl(r * 0.92, r * 0.92, lidH, M.glass, 0, h + lidH / 2, 0);
  const clip = box(0.01, 0.02, r * 2.1, M.steelPlain, 0, h - 0.005, 0);
  if (fillRatio > 0) {
    const fill = cyl(r * 0.9, r * 0.9, h * fillRatio, new THREE.MeshStandardMaterial({ color: fillColor, roughness: 0.9 }), 0, h * fillRatio / 2 + 0.003, 0);
    g.add(fill);
  }
  g.add(jar, lid, clip);
  return shadows(g, false, true);
}

function makeRainbowCupStand() {
  const g = new THREE.Group();
  const colors = [0xc0392b, 0xe67e22, 0xf1c40f, 0x27ae60, 0x2980b9, 0x8e44ad];
  const pole = cyl(0.004, 0.004, 0.24, M.chrome, 0, 0.12, 0);
  g.add(pole);
  colors.forEach((c, i) => {
    const cup = cyl(0.02, 0.016, 0.028, new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 }), 0, 0.215 - i * 0.032, 0);
    g.add(cup);
  });
  // stack of saucers beside
  colors.forEach((c, i) => {
    const s = cyl(0.026, 0.026, 0.005, new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 }), 0.055, 0.0075 + i * 0.0055, 0);
    g.add(s);
  });
  return shadows(g);
}

function makeCoffeeGrinder() {
  const g = new THREE.Group();
  g.add(cyl(0.022, 0.026, 0.14, M.steelPlain, 0, 0.07, 0));
  g.add(cyl(0.024, 0.024, 0.03, M.blackMatte, 0, 0.155, 0));
  const arm = cyl(0.005, 0.005, 0.07, M.steelPlain, 0.03, 0.185, 0);
  arm.rotation.z = Math.PI / 2 - 0.4;
  g.add(arm);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), M.driftwood);
  ball.position.set(0.058, 0.2, 0);
  g.add(ball);
  return shadows(g);
}

function makeSpiceRail(parent, z0, z1, y, xWall) {
  const rail = cyl(0.007, 0.007, Math.abs(z1 - z0), M.blackMatte, xWall - 0.05, y, (z0 + z1) / 2);
  rail.rotation.x = Math.PI / 2;
  parent.add(shadows(rail, false));
  const n = 5;
  for (let i = 0; i < n; i++) {
    const z = z0 + ((i + 0.5) / n) * (z1 - z0);
    const tube = cyl(0.012, 0.012, 0.075, M.glass, xWall - 0.05, y - 0.055, z);
    const cap = cyl(0.013, 0.013, 0.02, M.blackMatte, xWall - 0.05, y - 0.012, z);
    const spice = cyl(0.009, 0.009, 0.025, new THREE.MeshStandardMaterial({
      color: [0xa0522d, 0xdeb887, 0x8b0000, 0x556b2f, 0x3d2b1f][i], roughness: 0.9,
    }), xWall - 0.05, y - 0.078, z);
    parent.add(shadows(tube, false), shadows(cap, false), shadows(spice, false));
  }
}

function makeBottle(color, r, h) {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.1, transmission: 0.4, transparent: true, opacity: 0.9 });
  g.add(cyl(r, r, h * 0.72, mat, 0, h * 0.36, 0));
  g.add(cyl(r * 0.35, r * 0.9, h * 0.2, mat, 0, h * 0.8, 0));
  g.add(cyl(r * 0.35, r * 0.35, h * 0.1, mat, 0, h * 0.93, 0));
  return shadows(g, false);
}

function makeSpoon() {
  const g = new THREE.Group();
  const handle = cyl(0.004, 0.005, 0.11, M.steelPlain, 0, 0, 0);
  handle.rotation.x = Math.PI / 2;
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), M.steelPlain);
  bowl.scale.set(1, 0.35, 1.3);
  bowl.position.set(0, 0, -0.065);
  g.add(handle, bowl);
  return shadows(g);
}

function makeTeabag() {
  const g = new THREE.Group();
  const bagMat = new THREE.MeshStandardMaterial({ color: 0xd9c9a3, roughness: 0.95 });
  g.add(box(0.034, 0.05, 0.009, bagMat, 0, 0, 0));
  const string = cyl(0.0012, 0.0012, 0.07, new THREE.MeshBasicMaterial({ color: 0xeeeeee }), 0, 0.06, 0);
  const tag = box(0.014, 0.018, 0.001, new THREE.MeshStandardMaterial({ color: 0x3e8f3e }), 0, 0.1, 0);
  g.add(string, tag);
  return shadows(g);
}

/* ------------------------------------------------------------------ */
/* World assembly                                                      */
/* ------------------------------------------------------------------ */

export function buildWorld(scene) {
  initMaterials();
  const refs = {};
  const interactables = [];
  const colliders = [];

  const world = new THREE.Group();
  scene.add(world);

  const { minX, maxX, minZ, maxZ, ceil, counterTop } = ROOM;
  const W = maxX - minX, L = maxZ - minZ;
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

  /* ---- Shell: floor, walls, ceiling ---- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(W, L),
    new THREE.MeshStandardMaterial({ map: flagstoneTexture([1.4, 2.6]), roughness: 0.85 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0, cz);
  floor.receiveShadow = true;
  world.add(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshStandardMaterial({ color: 0xf6f5f0, roughness: 0.95 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(cx, ceil, cz);
  world.add(ceiling);

  const plaster = new THREE.MeshStandardMaterial({ map: plasterTexture(), roughness: 0.9 });

  // near wall (behind player)
  const nearWall = new THREE.Mesh(new THREE.PlaneGeometry(W, ceil), plaster);
  nearWall.rotation.y = Math.PI;
  nearWall.position.set(cx, ceil / 2, maxZ);
  world.add(nearWall);

  // left wall
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(L, ceil), plaster);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(minX, ceil / 2, cz);
  leftWall.receiveShadow = true;
  world.add(leftWall);

  // right wall — split around the glass-block window band and green splashback
  const rightWallMat = plaster.clone();
  const rw = new THREE.Group();
  // below counter to counter height handled by cabinets; wall behind everything:
  const rwFull = new THREE.Mesh(new THREE.PlaneGeometry(L, ceil), rightWallMat);
  rwFull.rotation.y = -Math.PI / 2;
  rwFull.position.set(maxX, ceil / 2, cz);
  rwFull.receiveShadow = true;
  rw.add(rwFull);
  // sage green splashback strip
  const splash = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 0.62),
    new THREE.MeshStandardMaterial({ map: greenPaintTexture(), roughness: 0.85 })
  );
  splash.rotation.y = -Math.PI / 2;
  splash.position.set(maxX - 0.005, counterTop + 0.31, -2.55);
  splash.receiveShadow = true;
  rw.add(splash);
  world.add(rw);

  // glass block window band on right wall
  const blocks = new THREE.Group();
  const bw = 0.42, bh = 0.235;
  const bandY0 = 1.72, rows = 3;
  const bandZ0 = -0.5, bandZ1 = -4.9;
  const cols = Math.floor(Math.abs(bandZ1 - bandZ0) / bw);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(bw - 0.05, bh - 0.05), M.frosted);
      pane.rotation.y = -Math.PI / 2;
      pane.position.set(maxX - 0.01, bandY0 + bh / 2 + r * bh, bandZ0 - bw / 2 - c * bw);
      blocks.add(pane);
    }
  }
  // white mullion frame
  const mullMat = new THREE.MeshStandardMaterial({ color: 0xf2f1ec, roughness: 0.8 });
  for (let r = 0; r <= rows; r++) {
    const bar = box(0.02, 0.05, Math.abs(bandZ1 - bandZ0), mullMat, maxX - 0.015, bandY0 + r * bh, (bandZ0 + bandZ1) / 2);
    blocks.add(bar);
  }
  for (let c = 0; c <= cols; c++) {
    const bar = box(0.02, rows * bh + 0.05, 0.05, mullMat, maxX - 0.015, bandY0 + rows * bh / 2, bandZ0 - c * bw);
    blocks.add(bar);
  }
  world.add(blocks);

  /* ---- Garden door at the far end ---- */
  const doorG = new THREE.Group();
  const farWall = new THREE.Mesh(new THREE.PlaneGeometry(W, ceil), plaster);
  farWall.position.set(cx, ceil / 2, minZ);
  farWall.receiveShadow = true;
  doorG.add(farWall);
  const doorW = 0.9, doorH = 2.08, doorX = 0.12;
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf6f5f0, roughness: 0.6 });
  doorG.add(box(doorW + 0.12, 0.08, 0.1, frameMat, doorX, doorH + 0.04, minZ + 0.02));
  doorG.add(box(0.08, doorH, 0.1, frameMat, doorX - doorW / 2 - 0.04, doorH / 2, minZ + 0.02));
  doorG.add(box(0.08, doorH, 0.1, frameMat, doorX + doorW / 2 + 0.04, doorH / 2, minZ + 0.02));
  // door slab: white with big glass pane
  doorG.add(box(doorW, 0.28, 0.05, frameMat, doorX, 0.14, minZ + 0.03));
  doorG.add(box(0.09, doorH, 0.05, frameMat, doorX - doorW / 2 + 0.045, doorH / 2, minZ + 0.03));
  doorG.add(box(0.09, doorH, 0.05, frameMat, doorX + doorW / 2 - 0.045, doorH / 2, minZ + 0.03));
  doorG.add(box(doorW, 0.09, 0.05, frameMat, doorX, doorH - 0.045, minZ + 0.03));
  // glazing bars
  doorG.add(box(0.03, doorH - 0.4, 0.045, M.blackMatte, doorX, doorH / 2 + 0.1, minZ + 0.035));
  doorG.add(box(doorW - 0.15, 0.03, 0.045, M.blackMatte, doorX, doorH * 0.62, minZ + 0.035));
  // garden view (emissive so it reads as daylight)
  const garden = new THREE.Mesh(
    new THREE.PlaneGeometry(doorW - 0.16, doorH - 0.4),
    new THREE.MeshBasicMaterial({ map: gardenTexture() })
  );
  garden.position.set(doorX, doorH / 2 + 0.09, minZ + 0.028);
  doorG.add(garden);
  const handle = cyl(0.012, 0.012, 0.13, M.chrome, doorX + doorW / 2 - 0.09, 1.02, minZ + 0.06);
  doorG.add(handle);
  world.add(doorG);
  refs.gardenPlane = garden;

  /* ---- Right run: cabinets, worktop, sink ---- */
  const right = new THREE.Group();
  const cabX0 = 0.68, cabX1 = maxX;
  const cabW = cabX1 - cabX0, cabCX = (cabX0 + cabX1) / 2;
  const runZ0 = -0.35, runZ1 = -4.95;

  // cabinet carcass
  const carc = box(cabW, counterTop - 0.1, Math.abs(runZ1 - runZ0), M.cabinet, cabCX, (counterTop - 0.1) / 2 + 0.1, (runZ0 + runZ1) / 2);
  carc.receiveShadow = true; carc.castShadow = true;
  right.add(carc);
  // plinth
  right.add(box(cabW - 0.06, 0.1, Math.abs(runZ1 - runZ0) - 0.04, M.blackMatte, cabCX - 0.03, 0.05, (runZ0 + runZ1) / 2));
  // door gaps + bar handles
  const doorZs = [-0.75, -1.55, -2.35, -3.15];
  for (const dz of doorZs) {
    const front = box(0.012, counterTop - 0.16, 0.74, M.cabinet, cabX0 - 0.006, (counterTop - 0.1) / 2 + 0.1, dz);
    right.add(front);
    const bar = cyl(0.007, 0.007, 0.3, M.steelPlain, cabX0 - 0.03, counterTop - 0.18, dz - 0.18);
    bar.rotation.x = Math.PI / 2;
    right.add(bar);
  }
  // dishwasher front at the far (door) end
  const dwFront = box(0.015, counterTop - 0.18, 0.62, M.steel, cabX0 - 0.008, (counterTop - 0.12) / 2 + 0.1, -4.6);
  right.add(dwFront);
  const dwBar = cyl(0.009, 0.009, 0.5, M.steelPlain, cabX0 - 0.035, counterTop - 0.14, -4.6);
  dwBar.rotation.x = Math.PI / 2;
  right.add(dwBar);

  // stainless worktop
  const top = box(cabW + 0.04, 0.035, Math.abs(runZ1 - runZ0) + 0.04, M.steel, cabCX - 0.01, counterTop + 0.0175, (runZ0 + runZ1) / 2);
  top.receiveShadow = true; top.castShadow = true;
  right.add(top);
  // upstand
  right.add(box(0.02, 0.05, Math.abs(runZ1 - runZ0), M.steel, cabX1 - 0.02, counterTop + 0.06, (runZ0 + runZ1) / 2));

  // sink basin (recess) — visual: dark inset + rim
  const sinkZ = -3.0, sinkCX = 0.98;
  const basinOuter = box(0.46, 0.02, 0.56, M.steel, sinkCX, counterTop + 0.037, sinkZ);
  right.add(basinOuter);
  const basinCavity = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.17, 0.46),
    new THREE.MeshStandardMaterial({ color: 0x8f9294, metalness: 0.85, roughness: 0.4, side: THREE.BackSide })
  );
  basinCavity.position.set(sinkCX, counterTop - 0.05, sinkZ);
  right.add(basinCavity);
  // tap
  const tapG = new THREE.Group();
  const tapBase = cyl(0.018, 0.022, 0.05, M.chrome, 0, 0.025, 0);
  const tapRiser = cyl(0.011, 0.011, 0.22, M.chrome, 0, 0.15, 0);
  const tapArm = cyl(0.01, 0.01, 0.17, M.chrome, 0, 0.26, -0.075);
  tapArm.rotation.x = Math.PI / 2 - 0.25;
  const tapHead = cyl(0.014, 0.011, 0.05, M.chrome, 0, 0.235, -0.155);
  const lever = cyl(0.006, 0.006, 0.09, M.chrome, 0.05, 0.28, 0);
  lever.rotation.z = Math.PI / 2 - 0.5;
  tapG.add(tapBase, tapRiser, tapArm, tapHead, lever);
  tapG.position.set(sinkCX + 0.13, counterTop + 0.045, sinkZ + 0.19);
  shadows(tapG);
  right.add(tapG);
  refs.tap = tapG;
  refs.tapSpoutWorld = new THREE.Vector3(sinkCX + 0.13, counterTop + 0.045 + 0.21, sinkZ + 0.19 - 0.155);
  // glass splash guards behind sink
  for (const dz of [-0.14, 0.14]) {
    const guard = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), M.glass);
    guard.rotation.y = -Math.PI / 2;
    guard.position.set(cabX1 - 0.06, counterTop + 0.22, sinkZ + dz * 1.6);
    right.add(guard);
  }

  world.add(right);
  colliders.push({ minX: cabX0 - 0.05, maxX: cabX1, minZ: runZ1, maxZ: runZ0 + 0.05 });

  /* ---- Black floating shelf + items ---- */
  const shelfY = 1.5, shelfZ0 = -0.45, shelfZ1 = -4.5;
  const shelf = box(0.26, 0.16, Math.abs(shelfZ1 - shelfZ0), M.blackMatte, maxX - 0.14, shelfY - 0.08, (shelfZ0 + shelfZ1) / 2);
  shelf.castShadow = true; shelf.receiveShadow = true;
  world.add(shelf);
  const onShelf = (obj, z, x = maxX - 0.15) => {
    obj.position.set(x, shelfY, z);
    world.add(obj);
    return obj;
  };

  // near end → door end
  const floralTin = cyl(0.045, 0.045, 0.17, new THREE.MeshStandardMaterial({ map: labelTexture(['❀', 'TEA'], '#e8e3d5', '#7a6a8a', { font: 'bold 44px Georgia, serif' }), roughness: 0.4 }), 0, 0.085, 0);
  onShelf(shadows(floralTin), -0.62);
  const teaBoxDark = box(0.05, 0.16, 0.11, M.blackGloss, 0, 0.08, 0);
  onShelf(shadows(teaBoxDark), -0.82);
  const coffeeBag = box(0.06, 0.15, 0.1, new THREE.MeshStandardMaterial({ color: 0xf1ede2, roughness: 0.9 }), 0, 0.075, 0);
  coffeeBag.rotation.y = 0.2;
  onShelf(shadows(coffeeBag), -1.0);
  onShelf(makeRainbowCupStand(), -1.25);
  onShelf(makeCoffeeGrinder(), -1.52);

  // red Tea canister — flavour interactable
  const teaCanister = new THREE.Group();
  const canBody = cyl(0.055, 0.05, 0.15, new THREE.MeshStandardMaterial({ map: teaCanisterTexture(), roughness: 0.25 }), 0, 0.075, 0);
  const canLid = cyl(0.052, 0.056, 0.025, M.red, 0, 0.162, 0);
  const canKnob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), M.red);
  canKnob.position.y = 0.182;
  teaCanister.add(canBody, canLid, canKnob);
  shadows(teaCanister);
  onShelf(teaCanister, -1.8);
  teaCanister.userData.interact = 'teaCanister';
  interactables.push(teaCanister);
  refs.teaCanister = teaCanister;

  // Barry's Tea box — the teabag source
  const barrys = new THREE.Group();
  const bMat = new THREE.MeshStandardMaterial({ map: barrysTexture(), roughness: 0.6 });
  const bSide = new THREE.MeshStandardMaterial({ color: 0x3e8f3e, roughness: 0.6 });
  const bBox = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.075, 0.065), [bSide, bSide, bSide, bSide, bMat, bMat]);
  bBox.position.y = 0.0375;
  bBox.rotation.y = Math.PI / 2 + 0.12;
  barrys.add(bBox);
  shadows(barrys);
  onShelf(barrys, -2.12);
  barrys.userData.interact = 'teaBox';
  interactables.push(barrys);
  refs.teaBox = barrys;

  // sugar jar — optional step
  const sugarJar = new THREE.Group();
  const sJar = cyl(0.05, 0.05, 0.13, M.glass, 0, 0.065, 0);
  const sFill = cyl(0.045, 0.045, 0.085, new THREE.MeshStandardMaterial({ color: 0xf3ede0, roughness: 1 }), 0, 0.045, 0);
  const sLid = cyl(0.052, 0.052, 0.02, M.driftwood, 0, 0.14, 0);
  const sLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.045),
    new THREE.MeshStandardMaterial({ map: labelTexture('SUGAR', '#f6f1e4', '#6b5b3e', { font: 'bold 40px Verdana, sans-serif' }) })
  );
  sLabel.position.set(-0.051, 0.06, 0);
  sLabel.rotation.y = -Math.PI / 2;
  sugarJar.add(sJar, sFill, sLid, sLabel);
  shadows(sugarJar, false);
  onShelf(sugarJar, -2.42);
  sugarJar.userData.interact = 'sugar';
  interactables.push(sugarJar);
  refs.sugarJar = sugarJar;

  // tin can + kilner jars + clock
  const tin = cyl(0.04, 0.04, 0.12, new THREE.MeshStandardMaterial({ map: labelTexture(['GOLDEN', 'SYRUP'], '#d8514a', '#f6ecd8', { font: 'bold 34px Georgia, serif' }), roughness: 0.5 }), 0, 0.06, 0);
  onShelf(shadows(tin), -2.64);
  const jarSpecs = [
    [0.05, 0.2, 0.75, 0xe8d9a0], [0.055, 0.24, 0.6, 0xf0e6c8], [0.05, 0.18, 0.8, 0xefe6d0],
    [0.06, 0.22, 0.5, 0xd8c898], [0.05, 0.16, 0.4, 0xe5d5ae],
  ];
  jarSpecs.forEach((s, i) => onShelf(makeKilnerJar(...s), -2.9 - i * 0.32));
  const clockG = new THREE.Group();
  const drift = box(0.06, 0.02, 0.3, M.driftwood, 0, 0.01, 0);
  const slate = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.16, 0.16), new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: 0.9 }));
  slate.position.y = 0.1;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), new THREE.MeshStandardMaterial({ map: clockTexture() }));
  face.position.set(-0.009, 0.1, 0);
  face.rotation.y = -Math.PI / 2;
  clockG.add(drift, slate, face);
  shadows(clockG);
  onShelf(clockG, -4.32);

  makeSpiceRail(world, -1.35, -2.15, 1.32, maxX);

  /* ---- Counter items (right run) ---- */
  const onCounter = (obj, z, x = 0.98) => {
    obj.position.set(x, counterTop + 0.035, z);
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
  refs.kettleHome = new THREE.Vector3(0.97, counterTop + 0.055, -1.52);

  const kettle = makeKettle();
  kettle.position.copy(refs.kettleHome);
  kettle.rotation.y = Math.PI / 2 + 0.35; // spout roughly toward the room
  world.add(kettle);
  kettle.userData.interact = 'kettle';
  interactables.push(kettle);
  refs.kettle = kettle;

  const teapot = makeTeapot();
  onCounter(teapot, -1.9, 1.02);
  teapot.userData.interact = 'teapot';
  interactables.push(teapot);

  // mugs — one is THE mug
  const mug = makeMug();
  mug.rotation.y = -0.6;
  onCounter(mug, -2.14, 0.95);
  mug.userData.interact = 'mug';
  interactables.push(mug);
  refs.mug = mug;
  refs.mugPrep = new THREE.Vector3(0.93, counterTop + 0.035, -1.78); // spot next to kettle
  const mug2 = makeMug(0xdfe3e0);
  mug2.rotation.y = 2.3;
  onCounter(mug2, -2.26, 1.08);

  const spoon = makeSpoon();
  spoon.rotation.y = 0.5;
  onCounter(spoon, -2.02, 0.85);
  spoon.position.y = counterTop + 0.045;
  spoon.userData.interact = 'spoon';
  interactables.push(spoon);
  refs.spoon = spoon;

  // tupperware + bottles near sink
  const tup = box(0.16, 0.055, 0.11, new THREE.MeshPhysicalMaterial({ color: 0xcfc7ae, roughness: 0.3, transmission: 0.3, transparent: true, opacity: 0.9 }), 0, 0.0275, 0);
  onCounter(shadows(tup), -2.5, 1.12);
  const wine = makeBottle(0x2a3d1f, 0.032, 0.28);
  onCounter(wine, -2.62, 0.9);
  const waterB = makeBottle(0xd8e8f0, 0.03, 0.24);
  onCounter(waterB, -2.72, 1.05);

  // milk bottle — optional step
  const milkG = new THREE.Group();
  const milkBody = cyl(0.042, 0.045, 0.19, new THREE.MeshStandardMaterial({ map: milkTexture(), roughness: 0.5 }), 0, 0.095, 0);
  const milkCap = cyl(0.02, 0.02, 0.025, new THREE.MeshStandardMaterial({ color: 0x2f7fb8, roughness: 0.4 }), 0, 0.2, 0);
  milkG.add(milkBody, milkCap);
  shadows(milkG);
  onCounter(milkG, -2.38, 0.88);
  milkG.userData.interact = 'milk';
  interactables.push(milkG);
  refs.milk = milkG;

  // sink interactable proxy (invisible box over basin)
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

  // washing-up: bowl + utensils + washing liquid behind sink
  const wubowl = cyl(0.07, 0.05, 0.06, M.wood, 0, 0.03, 0);
  onCounter(shadows(wubowl), -3.42, 1.15);
  const washUp = makeBottle(0x3f7a38, 0.022, 0.2);
  onCounter(washUp, -3.35, 1.2);
  const flask = cyl(0.03, 0.03, 0.17, new THREE.MeshStandardMaterial({ color: 0xaed581, roughness: 0.5 }), 0, 0.085, 0);
  onCounter(shadows(flask), -3.5, 1.22);

  const toaster = makeToaster();
  toaster.rotation.y = 0.06;
  onCounter(toaster, -3.85, 1.02);
  toaster.userData.interact = 'toaster';
  interactables.push(toaster);

  // teal chopping board on the dishwasher end
  const board = box(0.3, 0.012, 0.42, M.teal, 0, 0.006, 0);
  board.rotation.y = 0.15;
  onCounter(shadows(board), -4.55, 0.95);

  /* ---- Left side: hob counter, table, cubbies ---- */
  const left = new THREE.Group();
  // hob counter (black worktop)
  const hobX0 = -1.35, hobX1 = -0.68;
  left.add(box(hobX1 - hobX0, counterTop - 0.1, 1.5, M.cabinet, (hobX0 + hobX1) / 2, (counterTop - 0.1) / 2 + 0.1, -1.0));
  const hobTop = box(hobX1 - hobX0 + 0.04, 0.04, 1.54, M.blackGloss, (hobX0 + hobX1) / 2 + 0.01, counterTop + 0.02, -1.0);
  hobTop.receiveShadow = true;
  left.add(hobTop);
  // hob rings
  for (const [dx, dz] of [[-0.13, -0.75], [0.12, -0.75], [-0.13, -1.2], [0.12, -1.2]]) {
    left.add(cyl(0.085, 0.085, 0.004, new THREE.MeshStandardMaterial({ color: 0x2b2b2d, roughness: 0.4 }), -1.01 + dx, counterTop + 0.043, dz));
  }
  // teal cloth + knives
  left.add(box(0.28, 0.006, 0.36, M.teal, -1.0, counterTop + 0.045, -0.42));
  const knife = makeSpoon(); // repurpose shape? no — quick knife:
  knife.clear();
  const blade = box(0.015, 0.003, 0.16, M.steelPlain, 0, 0, 0);
  const khandle = box(0.02, 0.02, 0.09, M.blackMatte, 0, 0.005, 0.12);
  knife.add(blade, khandle);
  knife.position.set(-1.02, counterTop + 0.05, -0.42);
  knife.rotation.y = 0.4;
  left.add(shadows(knife));

  // wooden table
  left.add(box(0.62, 0.04, 0.95, M.wood, -1.02, 0.86, -2.4));
  for (const [dx, dz] of [[-0.26, -0.42], [0.26, -0.42], [-0.26, 0.42], [0.26, 0.42]]) {
    left.add(box(0.05, 0.84, 0.05, M.wood, -1.02 + dx, 0.42, -2.4 + dz));
  }
  // condiment clutter on table
  const ketchup = makeBottle(0xb33a2e, 0.022, 0.16);
  ketchup.position.set(-1.1, 0.88, -2.2);
  left.add(ketchup);
  const soy = makeBottle(0x2a1d14, 0.02, 0.18);
  soy.position.set(-1.0, 0.88, -2.32);
  left.add(soy);
  const chutney = makeKilnerJar(0.035, 0.09, 0.7, 0xa0522d);
  chutney.position.set(-1.14, 0.88, -2.5);
  left.add(chutney);
  const breadBag = box(0.16, 0.09, 0.11, new THREE.MeshStandardMaterial({ color: 0xe8d47a, roughness: 0.95 }), -0.95, 0.925, -2.62);
  breadBag.rotation.y = 0.5;
  left.add(shadows(breadBag));

  // green cubby unit (floor, near door on the left) with bottles
  const cub = new THREE.Group();
  cub.add(box(0.34, 1.15, 1.0, M.greenCubby, 0, 0.575, 0));
  const cubbyHoleMat = new THREE.MeshStandardMaterial({ color: 0x77875d, roughness: 0.9 });
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      cub.add(box(0.05, 0.28, 0.26, cubbyHoleMat, 0.15, 0.24 + r * 0.34, -0.34 + c * 0.34));
      if (Math.random() > 0.35) {
        const b = makeBottle([0x2a3d1f, 0x3d2b1f, 0x556b2f][Math.floor(Math.random() * 3)], 0.026, 0.2 + Math.random() * 0.06);
        b.position.set(0.13, 0.1 + r * 0.34, -0.34 + c * 0.34);
        cub.add(b);
      }
    }
  }
  cub.position.set(-1.16, 0, -4.05);
  shadows(cub);
  left.add(cub);

  // upper green cubby shelf on left wall (pots & bits)
  const upper = new THREE.Group();
  upper.add(box(0.3, 0.9, 1.2, M.greenCubby, 0, 0, 0));
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      upper.add(box(0.05, 0.36, 0.34, cubbyHoleMat, 0.13, -0.22 + r * 0.44, -0.4 + c * 0.4));
    }
  }
  const pot = cyl(0.06, 0.05, 0.09, M.steelPlain, 0.12, 0.28, -0.4);
  upper.add(pot);
  const eggs = box(0.12, 0.05, 0.1, new THREE.MeshStandardMaterial({ color: 0xd9c9a3, roughness: 1 }), 0.12, -0.34, 0);
  upper.add(eggs);
  upper.position.set(-1.2, 1.75, -0.9);
  shadows(upper);
  left.add(upper);

  world.add(left);
  colliders.push({ minX: -1.35, maxX: -0.64, minZ: -1.78, maxZ: -0.22 });
  colliders.push({ minX: -1.35, maxX: -0.68, minZ: -2.9, maxZ: -1.9 });
  colliders.push({ minX: -1.35, maxX: -0.96, minZ: -4.6, maxZ: -3.52 });

  /* ---- Lighting ---- */
  const hemi = new THREE.HemisphereLight(0xe8f0f2, 0x55503f, 0.55);
  scene.add(hemi);

  // daylight through the garden door
  const sun = new THREE.DirectionalLight(0xfff2dc, 2.2);
  sun.position.set(0.6, 2.6, -7.5);
  sun.target.position.set(-0.2, 0.2, -1.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 14;
  sun.shadow.camera.left = -3; sun.shadow.camera.right = 3;
  sun.shadow.camera.top = 3; sun.shadow.camera.bottom = -3;
  sun.shadow.bias = -0.002;
  scene.add(sun, sun.target);

  // soft fill from the glass-block window band
  const windowFill = new THREE.SpotLight(0xdfe8ee, 18, 8, Math.PI / 3, 0.6, 1.6);
  windowFill.position.set(1.25, 2.1, -2.6);
  windowFill.target.position.set(-0.5, 0.6, -2.6);
  scene.add(windowFill, windowFill.target);

  // warm ceiling bounce
  const ceilLamp = new THREE.PointLight(0xfff0dd, 10, 7, 1.8);
  ceilLamp.position.set(0, 2.35, -2.4);
  scene.add(ceilLamp);

  return { refs, interactables, colliders, factories: { makeTeabag, makeMug } };
}
