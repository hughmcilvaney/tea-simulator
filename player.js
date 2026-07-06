// First-person controller: pointer-lock look, WASD move, AABB collision.
import * as THREE from 'three';
import { ROOM } from './world.js';

const EYE_HEIGHT = 1.62;
const RADIUS = 0.24;
const SPEED = 1.9;
const LOOK_SENS = 0.0021;

export class Player {
  constructor(camera, canvas, colliders) {
    this.camera = camera;
    this.canvas = canvas;
    this.colliders = colliders;
    this.pos = new THREE.Vector3(0.05, EYE_HEIGHT, -0.55);
    this.yaw = Math.PI;      // face down the galley toward the garden door
    this.pitch = 0;
    this.keys = new Set();
    this.enabled = false;
    this.locked = false;
    this.baseFov = camera.fov;
    this.zooming = false;
    this._bob = 0;

    document.addEventListener('keydown', (e) => {
      if (e.code === 'KeyW' || e.code === 'KeyA' || e.code === 'KeyS' || e.code === 'KeyD'
        || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        this.keys.add(e.code);
      }
    });
    document.addEventListener('keyup', (e) => this.keys.delete(e.code));

    document.addEventListener('mousemove', (e) => {
      if (!this.locked || !this.enabled) return;
      this.yaw -= e.movementX * LOOK_SENS;
      this.pitch -= e.movementY * LOOK_SENS;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
    });

    // right-click hold to inspect (zoom)
    document.addEventListener('mousedown', (e) => {
      if (e.button === 2 && this.locked) this.zooming = true;
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.zooming = false;
    });
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  lock() {
    this.canvas.requestPointerLock();
  }

  update(dt) {
    if (!this.enabled) return;

    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const rightDir = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const move = new THREE.Vector3();
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) move.add(fwd);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) move.sub(fwd);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) move.add(rightDir);
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) move.sub(rightDir);

    const moving = move.lengthSq() > 0;
    if (moving) {
      move.normalize().multiplyScalar(SPEED * dt);
      this._tryMove(move.x, 0);
      this._tryMove(0, move.z);
      this._bob += dt * 9;
    } else {
      this._bob *= 0.9;
    }

    // camera transform
    const bobY = Math.sin(this._bob) * 0.012 * (moving ? 1 : 0);
    this.camera.position.set(this.pos.x, this.pos.y + bobY, this.pos.z);
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotateY(this.yaw);
    this.camera.rotateX(this.pitch);

    // inspect zoom
    const targetFov = this.zooming ? 38 : this.baseFov;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 10);
    this.camera.updateProjectionMatrix();
  }

  _tryMove(dx, dz) {
    const nx = this.pos.x + dx;
    const nz = this.pos.z + dz;
    // room bounds
    const cx = Math.min(ROOM.maxX - RADIUS, Math.max(ROOM.minX + RADIUS, nx));
    const cz = Math.min(ROOM.maxZ - RADIUS, Math.max(ROOM.minZ + RADIUS, nz));
    // furniture AABBs (expand by radius)
    for (const b of this.colliders) {
      if (cx > b.minX - RADIUS && cx < b.maxX + RADIUS &&
          cz > b.minZ - RADIUS && cz < b.maxZ + RADIUS) {
        return; // blocked — skip this axis
      }
    }
    this.pos.x = cx;
    this.pos.z = cz;
  }
}
