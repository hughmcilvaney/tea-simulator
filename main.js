// Entry point: renderer, environment, post pipeline, world, player, game loop.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { TeaGame } from './game.js';
import { Sfx } from './audio.js';
import { ui } from './ui.js';

const canvas = document.getElementById('scene');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe8ec);

// image-based lighting so metals, ceramics and glass read as real
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.6;

const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.05, 40);
scene.add(camera); // held objects are camera children

const world = buildWorld(scene);
const player = new Player(camera, canvas, world.colliders);
const sfx = new Sfx();
const game = new TeaGame(scene, camera, world, sfx);

/* ---------- post-processing (AO + bloom), with graceful fallback ---------- */
let composer = null;
try {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
  gtao.updateGtaoMaterial({
    radius: 0.28, distanceExponent: 1.2, thickness: 1.0,
    scale: 1.4, samples: 12, distanceFallOff: 1.0, screenSpaceRadius: false,
  });
  gtao.blendIntensity = 0.9;
  composer.addPass(gtao);
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), 0.12, 0.6, 0.92
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
} catch (err) {
  console.warn('Post-processing unavailable, falling back to direct render:', err);
  composer = null;
}

/* ---------- input: interact ---------- */
function tryInteract() {
  if (!player.locked || !player.enabled) return;
  if (game.hover) game.interact(game.hover);
}
document.addEventListener('mousedown', (e) => {
  if (e.button === 0 && player.locked) tryInteract();
});
document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyE') tryInteract();
});

/* ---------- overlays ---------- */
const intro = document.getElementById('intro');
document.getElementById('start-btn').addEventListener('click', () => {
  intro.classList.add('hidden');
  ui.showHud();
  player.enabled = true;
  player.lock();
  sfx._ensure();
});

canvas.addEventListener('click', () => {
  if (player.enabled && !player.locked && !game.done) player.lock();
});

document.getElementById('reset-btn').addEventListener('click', () => location.reload());
document.getElementById('again-btn').addEventListener('click', () => location.reload());

/* ---------- resize ---------- */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- loop ---------- */
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  player.update(dt);
  game.update(dt, player.locked);
  if (composer) composer.render();
  else renderer.render(scene, camera);
}
loop();
