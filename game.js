// Tea-making state machine, scripted animations, steam and feedback.
import * as THREE from 'three';
import { ui } from './ui.js';
import { steamSpriteTexture } from './textures.js';

const STEPS = [
  { id: 'takeKettle',  text: 'Pick up the kettle' },
  { id: 'fillKettle',  text: 'Fill the kettle at the sink' },
  { id: 'placeKettle', text: 'Put the kettle back on its base' },
  { id: 'boil',        text: 'Switch the kettle on and let it boil' },
  { id: 'takeMug',     text: 'Take a mug' },
  { id: 'teabag',      text: "Add a teabag (Barry's, obviously)" },
  { id: 'pour',        text: 'Pour the hot water into the mug' },
  { id: 'extras',      text: 'Milk and/or sugar — optional' },
  { id: 'stir',        text: 'Stir the tea' },
  { id: 'takeTea',     text: 'Pick up your tea. Enjoy.' },
];

const PROMPTS = {
  kettle:      'Kettle',
  kettleBase:  'Kettle base',
  sink:        'Sink',
  mug:         'Mug',
  teaBox:      "Barry's Tea",
  teaCanister: 'Tea canister',
  milk:        'Milk',
  sugar:       'Sugar jar',
  spoon:       'Teaspoon',
  toaster:     'Toaster',
  coffee:      'Coffee machine',
  espresso:    'Espresso machine',
  teapot:      'Teapot',
};

const ease = {
  inOut: (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2,
  out: (k) => 1 - Math.pow(1 - k, 3),
};

/* -------------------- steam particles -------------------- */
class Steam {
  constructor(scene, count = 46) {
    this.scene = scene;
    this.parts = [];
    const tex = steamSpriteTexture();
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
      const s = new THREE.Sprite(mat);
      s.visible = false;
      scene.add(s);
      this.parts.push({ s, life: 0, max: 1, vel: new THREE.Vector3() });
    }
    this._i = 0;
  }
  emit(pos, strength = 1) {
    const p = this.parts[this._i];
    this._i = (this._i + 1) % this.parts.length;
    p.s.visible = true;
    p.s.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.02));
    p.s.scale.setScalar(0.03 + Math.random() * 0.03);
    p.life = 0;
    p.max = 0.9 + Math.random() * 0.8;
    p.vel.set((Math.random() - 0.5) * 0.05, 0.16 + Math.random() * 0.12 * strength, (Math.random() - 0.5) * 0.05);
    p.s.material.opacity = 0.28 * strength;
  }
  update(dt) {
    for (const p of this.parts) {
      if (!p.s.visible) continue;
      p.life += dt;
      if (p.life >= p.max) { p.s.visible = false; continue; }
      const k = p.life / p.max;
      p.s.position.addScaledVector(p.vel, dt);
      p.s.scale.setScalar(p.s.scale.x + dt * 0.09);
      p.s.material.opacity = 0.3 * (1 - k);
    }
  }
}

/* -------------------- water stream mesh -------------------- */
function makeStream(radius = 0.008) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xbfd9e8, roughness: 0.05, transparent: true, opacity: 0.55,
  });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.8, 1, 10, 1, true), mat);
  m.visible = false;
  return m;
}

/* ==================================================================== */
export class TeaGame {
  constructor(scene, camera, world, sfx) {
    this.scene = scene;
    this.camera = camera;
    this.refs = world.refs;
    this.factories = world.factories;
    this.interactables = world.interactables;
    this.sfx = sfx;

    this.stepIdx = 0;
    this.busy = false;
    this.done = false;
    this.hasMilk = false;
    this.sugars = 0;
    this.kettleFilled = false;
    this.kettleBoiled = false;
    this.startTime = null;

    this.tweens = [];
    this.steam = new Steam(scene);
    this.boiling = false;
    this.boilT = 0;
    this.boilDur = 5.5;
    this.steamClock = 0;
    this.mugSteamOn = false;

    this.stream = makeStream();       // kettle → mug / tap → kettle
    scene.add(this.stream);

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 2.4;
    this.hover = null;

    this._tmpV1 = new THREE.Vector3();
    this._tmpV2 = new THREE.Vector3();

    ui.setObjective(1, STEPS.length, STEPS[0].text);
  }

  get step() { return STEPS[this.stepIdx].id; }

  _advance(toId = null) {
    if (toId) {
      this.stepIdx = STEPS.findIndex((s) => s.id === toId);
    } else {
      this.stepIdx = Math.min(this.stepIdx + 1, STEPS.length - 1);
    }
    ui.setObjective(this.stepIdx + 1, STEPS.length, STEPS[this.stepIdx].text);
  }

  _tween(dur, update, done) {
    this.tweens.push({ t: 0, dur, update, done });
  }

  _err(msg) {
    ui.toast(msg, 'error');
    this.sfx.error();
  }
  _info(msg) {
    ui.toast(msg, 'info');
  }

  /* ---------- held-object helpers ---------- */
  _holdObject(obj, pos = new THREE.Vector3(0.3, -0.34, -0.55), rot = new THREE.Euler(0.15, 0.5, 0)) {
    obj.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    this.camera.add(obj);
    obj.position.copy(pos);
    obj.rotation.copy(rot);
  }
  _releaseObject(obj) {
    this.scene.add(obj);
    obj.traverse((o) => { if (o.isMesh && o.name !== 'switchLight') o.castShadow = true; });
  }

  /* Animate obj (already in scene space) from current transform to target. */
  _flyTo(obj, targetPos, targetRotY, dur, onDone, lift = 0.25) {
    const p0 = obj.position.clone();
    const r0 = obj.rotation.y;
    this._tween(dur, (k) => {
      const e = ease.inOut(k);
      obj.position.lerpVectors(p0, targetPos, e);
      obj.position.y += Math.sin(e * Math.PI) * lift;
      obj.rotation.y = r0 + (targetRotY - r0) * e;
    }, onDone);
  }

  /* ================= interaction dispatch ================= */
  interact(id) {
    if (this.busy || this.done) return;
    const s = this.step;

    switch (id) {
      case 'kettle': return this._onKettle(s);
      case 'kettleBase': return this._onKettleBase(s);
      case 'sink': return this._onSink(s);
      case 'mug': return this._onMug(s);
      case 'teaBox':
      case 'teaCanister': return this._onTea(s, id);
      case 'milk': return this._onMilk(s);
      case 'sugar': return this._onSugar(s);
      case 'spoon': return this._onSpoon(s);
      case 'toaster': return this._info("Not toast o'clock. Tea first.");
      case 'coffee': return this._info("Tempting, but you're on tea duty today.");
      case 'espresso': return this._info('The espresso machine judges you silently. Tea it is.');
      case 'teapot': return this._info('Proper pot of tea another day — mug today.');
    }
  }

  _onKettle(s) {
    const { kettle } = this.refs;
    if (s === 'takeKettle') {
      this.busy = true;
      this.startTime = performance.now();
      const target = new THREE.Vector3();
      this._tween(0.45, (k) => {
        // simple pull toward camera before attaching
        this.camera.getWorldPosition(target);
        kettle.position.lerp(this._tmpV1.set(target.x, target.y - 0.35, target.z), ease.out(k) * 0.3);
      }, () => {
        this._holdObject(kettle);
        this.busy = false;
        this._info('Kettle in hand. Feels light — needs water.');
        this._advance();
      });
      return;
    }
    if (s === 'boil') return this._switchKettleOn();
    if (s === 'pour') return this._pourKettle();
    if (s === 'fillKettle') return this._err("It's in your hand — find the sink.");
    if (s === 'placeKettle') return this._err('Pop it on its base first (the black disc).');
    if (s === 'teabag') return this._err('Teabag in the mug first — then the water.');
    if (s === 'takeMug') return this._err('Grab a mug first — the white one by the teapot.');
    return this._err('The kettle has done its bit.');
  }

  _onKettleBase(s) {
    const { kettle, kettleHome } = this.refs;
    if (s === 'placeKettle') {
      this.busy = true;
      // detach from camera, keep world transform
      kettle.updateMatrixWorld(true);
      const wp = new THREE.Vector3();
      kettle.getWorldPosition(wp);
      this._releaseObject(kettle);
      kettle.position.copy(wp);
      kettle.rotation.set(0, this.camera.rotation.y, 0);
      this._flyTo(kettle, kettleHome, Math.PI / 2 + 0.35, 0.7, () => {
        kettle.position.copy(kettleHome);
        this.busy = false;
        this.sfx.plop();
        this._advance();
      }, 0.12);
      return;
    }
    if (s === 'takeKettle') return this._onKettle(s); // clicking the base grabs the kettle
    if (s === 'fillKettle') return this._err('Water first — over at the sink.');
    if (s === 'boil') return this._switchKettleOn();
    return this._info('The kettle base hums quietly to itself.');
  }

  _onSink(s) {
    if (s === 'fillKettle') {
      const { kettle, tapSpoutWorld, sinkPos } = this.refs;
      this.busy = true;
      // detach kettle from hand → under the tap
      kettle.updateMatrixWorld(true);
      const wp = new THREE.Vector3();
      kettle.getWorldPosition(wp);
      this._releaseObject(kettle);
      kettle.position.copy(wp);
      kettle.rotation.set(0, Math.PI / 2, 0);
      const under = new THREE.Vector3(sinkPos.x - 0.04, sinkPos.y - 0.06, sinkPos.z - 0.02);
      this._flyTo(kettle, under, Math.PI / 2, 0.6, () => {
        // run the tap
        this.sfx.tapOn();
        const top = under.clone().add(new THREE.Vector3(0, 0.21, 0));
        this._showStream(tapSpoutWorld, top, 0.006);
        this._tween(2.3, () => {}, () => {
          this.sfx.tapOff();
          this.stream.visible = false;
          this.kettleFilled = true;
          // back to hand
          this._holdObject(kettle);
          this.busy = false;
          this._info('Filled. Nice and heavy now.');
          this._advance();
        });
      }, 0.15);
      return;
    }
    if (s === 'takeKettle') return this._err("You'll need the kettle in hand before the sink is any use.");
    return this._info('The washing up can wait. It always does.');
  }

  _onMug(s) {
    const { mug, mugPrep } = this.refs;
    if (s === 'takeMug') {
      this.busy = true;
      this._flyTo(mug, mugPrep, 0.2, 0.7, () => {
        mug.position.copy(mugPrep);
        this.busy = false;
        this.sfx.plop();
        this._info('Good mug, that one.');
        this._advance();
      }, 0.18);
      return;
    }
    if (s === 'takeTea') return this._finishTea();
    if (s === 'takeKettle' || s === 'fillKettle' || s === 'placeKettle' || s === 'boil') {
      return this._err('One thing at a time — sort the kettle first.');
    }
    return this._info("The mug's ready and waiting.");
  }

  _onTea(s, sourceId) {
    if (s === 'teabag') {
      const src = this.refs[sourceId === 'teaBox' ? 'teaBox' : 'teaCanister'];
      const { mug } = this.refs;
      this.busy = true;
      const bag = this.factories.makeTeabag();
      const start = new THREE.Vector3();
      src.getWorldPosition(start);
      start.y += 0.06;
      bag.position.copy(start);
      this.scene.add(bag);
      const end = mug.position.clone().add(new THREE.Vector3(0, 0.12, 0));
      this._tween(0.9, (k) => {
        const e = ease.inOut(k);
        bag.position.lerpVectors(start, end, e);
        bag.position.y += Math.sin(e * Math.PI) * 0.25;
        bag.rotation.z = e * 1.2;
      }, () => {
        // sink into the mug
        this._tween(0.35, (k) => {
          bag.position.y = end.y - k * 0.09;
          bag.scale.setScalar(1 - k * 0.55);
        }, () => {
          this.scene.remove(bag);
          this.sfx.plop();
          this.busy = false;
          this._info(sourceId === 'teaBox' ? 'One Barry\'s teabag in.' : 'A teabag from the tin. In it goes.');
          this._advance();
        });
      });
      return;
    }
    if (s === 'takeMug') return this._err('No mug yet — the teabag would just sit on the counter.');
    if (s === 'pour' || s === 'extras' || s === 'stir') return this._info('One bag is plenty. This is tea, not soup.');
    return this._err('Kettle business first — teabag later.');
  }

  _switchKettleOn() {
    const { kettle } = this.refs;
    if (!this.kettleFilled) return this._err("There's no water in it. Sink first.");
    this.busy = true;
    this.sfx.click();
    const light = kettle.getObjectByName('switchLight');
    if (light) {
      light.material.emissive.setHex(0xff5a1f);
      light.material.emissiveIntensity = 1.6;
    }
    this.sfx.boilOn(this.boilDur);
    this.boiling = true;
    this.boilT = 0;
    ui.setObjective(this.stepIdx + 1, STEPS.length, 'Boiling…');
  }

  _pourKettle() {
    if (!this.kettleBoiled) return this._err("Not boiled yet — patience. Lukewarm tea is a crime.");
    const { kettle, mug, kettleHome } = this.refs;
    this.busy = true;
    const above = mug.position.clone().add(new THREE.Vector3(0.02, 0.3, 0.1));
    const p0 = kettle.position.clone();
    this._tween(0.8, (k) => {
      const e = ease.inOut(k);
      kettle.position.lerpVectors(p0, above, e);
      kettle.rotation.z = e * -0.95; // tilt to pour
    }, () => {
      this.sfx.pourOn();
      const spoutTip = new THREE.Vector3();
      const anchor = kettle.getObjectByName('steamAnchor');
      const mugTop = mug.position.clone().add(new THREE.Vector3(0, 0.11, 0));
      const water = mug.getObjectByName('water');
      water.visible = true;
      water.material.color.setHex(0x6b3f1d);
      water.material.opacity = 0.96;
      this._tween(2.4, (k) => {
        kettle.updateMatrixWorld(true);
        anchor.getWorldPosition(spoutTip);
        this._showStream(spoutTip, mugTop, 0.007);
        water.position.y = 0.02 + k * 0.052;
        if (Math.random() < 0.5) this.steam.emit(mugTop, 0.8);
      }, () => {
        this.sfx.pourOff();
        this.stream.visible = false;
        this.mugSteamOn = true;
        // kettle back to base
        this._tween(0.8, (k) => {
          const e = ease.inOut(k);
          kettle.position.lerpVectors(above, kettleHome, e);
          kettle.rotation.z = (1 - e) * -0.95;
        }, () => {
          kettle.position.copy(kettleHome);
          kettle.rotation.set(0, Math.PI / 2 + 0.35, 0);
          this.busy = false;
          this._info('Lovely. Let it draw for a moment.');
          this._advance(); // → extras
        });
      });
    });
  }

  _onMilk(s) {
    if (s !== 'extras' && s !== 'stir') {
      if (s === 'pour') return this._err('Water before milk. We are not animals.');
      return this._err('Milk comes after the tea is poured.');
    }
    if (this.hasMilk) return this._info('That\'s plenty of milk.');
    const { milk, mug } = this.refs;
    this.busy = true;
    const home = milk.position.clone();
    const homeRot = milk.rotation.y;
    const above = mug.position.clone().add(new THREE.Vector3(-0.03, 0.28, 0.05));
    this._flyTo(milk, above, homeRot, 0.6, () => {
      this._tween(0.9, (k) => {
        milk.rotation.z = Math.sin(Math.min(k * 1.4, 1) * Math.PI) * 0.9;
        if (k > 0.15 && k < 0.85) {
          const lip = milk.position.clone().add(new THREE.Vector3(0.03, -0.02, 0));
          this._showStream(lip, mug.position.clone().add(new THREE.Vector3(0, 0.11, 0)), 0.004, 0xffffff);
        } else {
          this.stream.visible = false;
        }
        const water = mug.getObjectByName('water');
        water.material.color.lerp(new THREE.Color(0xb9835a), 0.02);
      }, () => {
        this.stream.visible = false;
        this.hasMilk = true;
        this._flyTo(milk, home, homeRot, 0.5, () => {
          milk.position.copy(home);
          milk.rotation.set(0, homeRot, 0);
          this.busy = false;
          this._info('Splash of milk in. Builder\'s brew.');
        }, 0.1);
      });
    }, 0.2);
  }

  _onSugar(s) {
    if (s !== 'extras' && s !== 'stir') return this._err('Sugar goes in after the water.');
    if (this.sugars >= 2) return this._info('Two is the limit. Dentist\'s orders.');
    const { sugarJar, mug } = this.refs;
    this.busy = true;
    const home = sugarJar.position.clone();
    const above = mug.position.clone().add(new THREE.Vector3(0.03, 0.3, -0.04));
    this._flyTo(sugarJar, above, 0, 0.6, () => {
      this._tween(0.7, (k) => {
        sugarJar.rotation.z = Math.sin(Math.min(k * 1.3, 1) * Math.PI) * 1.1;
        if (k > 0.25 && k < 0.75 && Math.random() < 0.6) {
          this.steam.emit(mug.position.clone().add(new THREE.Vector3(0, 0.13, 0)), 0.3);
        }
      }, () => {
        this.sfx.plop();
        this.sugars += 1;
        this._flyTo(sugarJar, home, 0, 0.5, () => {
          sugarJar.position.copy(home);
          sugarJar.rotation.set(0, 0, 0);
          this.busy = false;
          this._info(this.sugars === 1 ? 'One sugar in.' : 'Two sugars. Sweet tooth.');
        }, 0.12);
      });
    }, 0.2);
  }

  _onSpoon(s) {
    if (s !== 'extras' && s !== 'stir') {
      if (s === 'takeTea') return this._info('Already stirred — pick up your tea.');
      return this._err('Nothing to stir yet.');
    }
    const { spoon, mug } = this.refs;
    this.busy = true;
    this._advance('stir');
    const home = spoon.position.clone();
    const homeRot = spoon.rotation.y;
    const centre = mug.position.clone().add(new THREE.Vector3(0, 0.13, 0));
    this._flyTo(spoon, centre, homeRot, 0.5, () => {
      spoon.rotation.x = 0.9;
      let lastClink = 0;
      this._tween(2.1, (k) => {
        const a = k * Math.PI * 6;
        spoon.position.set(centre.x + Math.cos(a) * 0.02, centre.y - 0.03, centre.z + Math.sin(a) * 0.02);
        if (k - lastClink > 0.22) { lastClink = k; this.sfx.clink(); }
        const water = mug.getObjectByName('water');
        water.rotation.y += 0.15;
      }, () => {
        spoon.rotation.x = 0;
        this._flyTo(spoon, home, homeRot, 0.5, () => {
          spoon.position.copy(home);
          this.busy = false;
          this._info('Stirred. It looks perfect.');
          this._advance('takeTea');
        }, 0.15);
      });
    }, 0.2);
  }

  _finishTea() {
    const { mug } = this.refs;
    this.busy = true;
    this._tween(0.6, (k) => {
      const target = this._tmpV1;
      this.camera.getWorldPosition(target);
      mug.position.lerp(this._tmpV2.set(target.x, target.y - 0.3, target.z), ease.out(k) * 0.25);
    }, () => {
      this._holdObject(mug, new THREE.Vector3(0.24, -0.3, -0.48), new THREE.Euler(0.1, -0.6, 0));
      this.done = true;
      this.busy = false;
      this.sfx.chime();
      const secs = Math.round((performance.now() - this.startTime) / 1000);
      const extras = this.hasMilk
        ? (this.sugars ? `Milk, ${this.sugars === 1 ? 'one sugar' : 'two sugars'}.` : 'Milk, no sugar.')
        : (this.sugars ? `Black, ${this.sugars === 1 ? 'one sugar' : 'two sugars'}.` : 'Black, no sugar. Bold.');
      setTimeout(() => {
        document.exitPointerLock();
        ui.showSuccess(`Lovely. ${extras}`, `Brewed in ${secs} seconds.`);
      }, 900);
    });
  }

  /* ---------- stream helper ---------- */
  _showStream(from, to, radius = 0.007, color = 0xbfd9e8) {
    const s = this.stream;
    s.visible = true;
    s.material.color.setHex(color);
    const mid = this._tmpV1.copy(from).add(to).multiplyScalar(0.5);
    const len = from.distanceTo(to);
    s.position.copy(mid);
    s.scale.set(radius / 0.008, len, radius / 0.008);
    s.lookAt(to);
    s.rotateX(Math.PI / 2);
  }

  /* ================= per-frame update ================= */
  update(dt, playerLocked) {
    // tweens
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      tw.update(k);
      if (k >= 1) {
        this.tweens.splice(i, 1);
        if (tw.done) tw.done();
      }
    }

    // boiling
    if (this.boiling) {
      this.boilT += dt;
      const kettle = this.refs.kettle;
      const anchor = kettle.getObjectByName('steamAnchor');
      const p = this._tmpV1;
      kettle.updateMatrixWorld(true);
      anchor.getWorldPosition(p);
      this.steamClock += dt;
      const rate = 0.02 + 0.1 * (1 - this.boilT / this.boilDur); // emit faster as it heats
      if (this.steamClock > Math.max(0.02, rate)) {
        this.steamClock = 0;
        this.steam.emit(p, Math.min(1, this.boilT / this.boilDur + 0.2));
      }
      if (this.boilT >= this.boilDur) {
        this.boiling = false;
        this.kettleBoiled = true;
        this.sfx.boilOff();
        this.sfx.click();
        const light = kettle.getObjectByName('switchLight');
        if (light) light.material.emissive.setHex(0x000000);
        this.busy = false;
        this._info('Click. Boiled.');
        this._advance(); // → takeMug
      }
    }

    // gentle steam from the mug once poured
    if (this.mugSteamOn && !this.done) {
      this.steamClock += dt;
      if (this.steamClock > 0.22) {
        this.steamClock = 0;
        const mug = this.refs.mug;
        this.steam.emit(mug.position.clone().add(new THREE.Vector3(0, 0.12, 0)), 0.5);
      }
    }
    if (this.done) {
      // steam from the held mug
      this.steamClock += dt;
      if (this.steamClock > 0.3) {
        this.steamClock = 0;
        const p = this._tmpV1;
        this.refs.mug.updateMatrixWorld(true);
        this.refs.mug.getWorldPosition(p);
        p.y += 0.12;
        this.steam.emit(p, 0.4);
      }
    }

    this.steam.update(dt);

    // hover raycast + prompt
    if (playerLocked && !this.busy && !this.done) {
      this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
      const hits = this.raycaster.intersectObjects(this.interactables, true);
      let id = null;
      if (hits.length) {
        let o = hits[0].object;
        while (o && !o.userData.interact) o = o.parent;
        if (o) id = o.userData.interact;
      }
      // held kettle shouldn't be hoverable
      if (id === 'kettle' && this.refs.kettle.parent === this.camera) id = null;
      this.hover = id;
      if (id) {
        ui.reticleHot(true);
        ui.prompt(`<b>E</b> · ${PROMPTS[id] || id}`);
      } else {
        ui.reticleHot(false);
        ui.prompt(null);
      }
    } else {
      this.hover = null;
      ui.reticleHot(false);
      ui.prompt(null);
    }
  }
}
