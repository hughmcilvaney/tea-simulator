// Entry point: renderer, world, player, game loop.
import * as THREE from 'three';
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
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe8ec);

const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.05, 40);
scene.add(camera); // so held objects (children of the camera) render

const world = buildWorld(scene);
const player = new Player(camera, canvas, world.colliders);
const sfx = new Sfx();
const game = new TeaGame(scene, camera, world, sfx);

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
  sfx._ensure(); // unlock audio on user gesture
});

// clicking the canvas re-locks the pointer after Esc
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
});

/* ---------- loop ---------- */
const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  player.update(dt);
  game.update(dt, player.locked);
  renderer.render(scene, camera);
}
loop();
