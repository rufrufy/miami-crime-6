// Main game loop, UI wiring, enterable interiors, protagonist switching & shot bootstrap.
import { createAudio } from './audio.js';
import { addPopup, createCombatState, fireBullet, reloadWeapon, tryPlayerFire, updateCombat } from './combat.js';
import { OUTFITS, PAINT_OPTIONS, PROTAGONISTS, TIME_PHASES, WEAPONS } from './config.js';
import {
  alertWitnesses,
  createHeroes,
  spawnPedestrians,
  spawnWildlife,
  updateActiveHeroOnFoot,
  updatePartnerAI,
  updatePedestrians,
  updateWildlife,
} from './entities.js';
import { createHUD } from './hud.js';
import { createInput } from './input.js';
import { createMissionState, startMission, updateMissionsAndWorld } from './missions.js';
import { addWanted, clearWanted, createPoliceState, updatePolice } from './police.js';
import { renderGame } from './renderer.js';
import { hasSave, loadGame, saveGame } from './save.js';
import { applyShotScene } from './shots.js';
import { createSocial, postSolagram, sayDialogue, updateSocial } from './social.js';
import { spawnInitialVehicles, updateTraffic } from './traffic.js';
import { generatePlate, updatePlayerVehicle, updateVehicleCollisions } from './vehicles.js';
import { createWorld } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const hud = createHUD();
const audio = createAudio();

const params = new URLSearchParams(window.location.search);
const shotParam = params.get('shot');
const seedParam = Number(params.get('seed')) || 1;

const startScreen = document.getElementById('start-screen');
const controlsModal = document.getElementById('controls-modal');
const pauseMenu = document.getElementById('pause-menu');
const interiorModal = document.getElementById('interior-modal');
const btnContinue = document.getElementById('btn-continue');
const saveToast = document.getElementById('save-toast');

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function createInitialState(seed = 1) {
  const world = createWorld(seed);
  const heroes = createHeroes();
  return {
    mode: 'title', // 'title' | 'playing' | 'paused' | 'interior'
    time: 0,
    timeIndex: 0, // 0 sunset, 1 day, 2 night
    world,
    heroes,
    vehicles: spawnInitialVehicles(seed),
    pedestrians: spawnPedestrians(world, seed),
    wildlife: spawnWildlife(seed),
    enemies: [],
    police: createPoliceState(),
    combat: createCombatState(),
    social: createSocial(),
    missions: createMissionState(),
    wanted: { level: 0, heatTimer: 0, lastSpotted: 0 },
    player: {
      activeId: 'marco',
      cash: 2500,
      clout: 1200,
      outfitIndex: 0,
      recognizedOutfit: false,
      weaponIndex: 1,
      mag: [0, 12, 30, 6, 28],
      ammo: [0, 96, 150, 30, 112],
    },
    camera: { x: 2760, y: 1520, shake: 0 },
    input,
    audio,
    activeInterior: null,
  };
}

let state = createInitialState(seedParam);

const ui = {
  showStart(hasSavedOverride = null) {
    startScreen.classList.remove('hidden');
    hud.els.hud.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    interiorModal.classList.add('hidden');
    btnContinue.disabled = hasSavedOverride !== null ? !hasSavedOverride : !hasSave();
  },
  showHUD() {
    startScreen.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    controlsModal.classList.add('hidden');
    interiorModal.classList.add('hidden');
    hud.els.hud.classList.remove('hidden');
  },
  showPause() {
    state.mode = 'paused';
    saveToast.textContent = '';
    const stats = document.getElementById('pause-stats');
    const found = state.world.mysteries.filter((m) => m.discovered).length;
    stats.textContent = `Cash: $${state.player.cash.toLocaleString()} · Viral Clout: ${state.player.clout.toLocaleString()} · Missions: ${state.missions.completed}/6 · Mysteries: ${found}/3`;
    pauseMenu.classList.remove('hidden');
  },
};

function startNewGame() {
  audio.unlock();
  state = createInitialState(seedParam);
  state.mode = 'playing';
  state.camera.x = state.heroes.marco.x;
  state.camera.y = state.heroes.marco.y;
  startMission(state, 0);
  ui.showHUD();
}

function continueSavedGame() {
  audio.unlock();
  const data = loadGame();
  if (!data) {
    startNewGame();
    return;
  }
  state = createInitialState(seedParam);
  state.mode = 'playing';
  state.player.cash = data.cash ?? 2500;
  state.player.clout = data.clout ?? 1200;
  state.player.activeId = data.activeId || 'marco';
  state.player.outfitIndex = data.outfitIndex ?? 0;
  state.player.weaponIndex = data.weaponIndex ?? 1;
  if (Array.isArray(data.ammo)) state.player.ammo = data.ammo;
  if (Array.isArray(data.mag)) state.player.mag = data.mag;
  state.timeIndex = data.timeIndex ?? 0;
  if (data.marco) Object.assign(state.heroes.marco, data.marco);
  if (data.elena) Object.assign(state.heroes.elena, data.elena);
  if (Array.isArray(data.discoveredMysteries)) {
    for (const m of state.world.mysteries) {
      if (data.discoveredMysteries.includes(m.id)) m.discovered = true;
    }
  }
  state.missions.completed = data.missionsCompleted ?? 0;
  startMission(state, data.missionIndex ?? 0);
  const h = state.heroes[state.player.activeId];
  state.camera.x = h.x;
  state.camera.y = h.y;
  ui.showHUD();
}

function openInterior(interior) {
  state.mode = 'interior';
  state.activeInterior = interior;
  document.getElementById('int-badge').textContent = interior.badge;
  document.getElementById('int-title').textContent = interior.name;
  document.getElementById('int-desc').textContent = interior.desc;
  const actionsEl = document.getElementById('int-actions');
  const fbEl = document.getElementById('int-feedback');
  actionsEl.innerHTML = '';
  fbEl.textContent = '';

  const addAction = (label, cls, onClick) => {
    const b = document.createElement('button');
    b.className = `btn ${cls}`;
    b.textContent = label;
    b.onclick = () => {
      audio.unlock();
      onClick(fbEl);
      hud.update(state);
    };
    actionsEl.appendChild(b);
  };

  const active = state.heroes[state.player.activeId];

  if (interior.id === 'safehouse') {
    addAction('HEAL & FULL ARMOR (FREE)', 'primary', (fb) => {
      state.heroes.marco.hp = 100;
      state.heroes.marco.armor = 100;
      state.heroes.elena.hp = 100;
      state.heroes.elena.armor = 100;
      fb.textContent = 'Both protagonists fully healed & armored!';
    });
    addAction('SAVE GAME TO LOCALSTORAGE', 'secondary', (fb) => {
      fb.textContent = saveGame(state) ? 'Progress saved to Solara Coast!' : 'Save failed.';
    });
    addAction('CHANGE DISGUISE / OUTFIT (CLEARS HEAT)', 'ghost', (fb) => {
      state.player.outfitIndex = (state.player.outfitIndex + 1) % OUTFITS.length;
      state.player.recognizedOutfit = false;
      clearWanted(state, 2);
      fb.textContent = `Switched to ${OUTFITS[state.player.outfitIndex].name} — police recognition cleared!`;
    });
  } else if (interior.id === 'garage') {
    const car = active.vehicle || state.vehicles.find((v) => !v.dead && Math.hypot(v.x - interior.doorX, v.y - interior.doorY) < 160);
    if (!car) {
      fbEl.textContent = 'Drive a vehicle near the Garage bay to customize it!';
    } else {
      addAction(`SWAP HOT LICENSE PLATE ($400) · [${car.plate}]`, 'primary', (fb) => {
        if (state.player.cash < 400) {
          fb.textContent = 'Need $400 to swap plates.';
          return;
        }
        state.player.cash -= 400;
        car.plate = generatePlate();
        car.hotPlate = false;
        clearWanted(state, 2);
        audio.playCash();
        fb.textContent = `Clean plate ${car.plate} installed! Dropped 2 Wanted Stars.`;
      });
      addAction('INSTALL TWIN-TURBO UPGRADE ($1,200)', 'secondary', (fb) => {
        if (car.turbo) {
          fb.textContent = 'Twin-Turbo already installed on this ride!';
          return;
        }
        if (state.player.cash < 1200) {
          fb.textContent = 'Need $1,200 for Twin-Turbo.';
          return;
        }
        state.player.cash -= 1200;
        car.turbo = true;
        car.hp = car.maxHp;
        audio.playCash();
        fb.textContent = 'Twin-Turbo bolted on! +22% top speed & repair complete.';
      });
      for (const p of PAINT_OPTIONS.slice(0, 3)) {
        addAction(`REPAINT: ${p.name} ($${p.cost})`, 'ghost', (fb) => {
          if (state.player.cash < p.cost) {
            fb.textContent = `Need $${p.cost}.`;
            return;
          }
          state.player.cash -= p.cost;
          car.color = p.color;
          car.hotPlate = false;
          audio.playCash();
          fb.textContent = `Fresh ${p.name} coat applied!`;
        });
      }
    }
  } else if (interior.id === 'boutique') {
    for (let i = 0; i < OUTFITS.length; i++) {
      const o = OUTFITS[i];
      addAction(`WEAR ${o.name} ($200)`, i === 0 ? 'primary' : 'ghost', (fb) => {
        if (state.player.cash < 200) {
          fb.textContent = 'Need $200.';
          return;
        }
        state.player.cash -= 200;
        state.player.outfitIndex = i;
        state.player.recognizedOutfit = false;
        clearWanted(state, 1);
        audio.playCash();
        fb.textContent = `Equipped ${o.name}! Police witness profile reset.`;
      });
    }
  } else if (interior.id === 'club') {
    addAction('PARTY & COLLECT VIP INTEL (+500 CLOUT)', 'primary', (fb) => {
      active.hp = Math.min(100, active.hp + 40);
      postSolagram(state, 'VIP booth takeover at Club Mirage! Solara Coast nightlife never sleeps!', 500, '@neon_drift');
      fb.textContent = 'VIP intel collected & +500 Viral Clout!';
    });
  } else if (interior.id === 'bank') {
    addAction('CRACK BAYSIDE VAULT (+$8,000 · 4-STAR HEAT)', 'danger', (fb) => {
      state.player.cash += 8000;
      addWanted(state, 4, 'Bayside First Bank vault breached! All units respond!');
      postSolagram(state, 'VAULT ALARM BLARING AT BAYSIDE FIRST BANK!! #SolaraHeist', 750, '@solara_live');
      audio.playCash();
      fb.textContent = 'Grabbed $8,000 from the vault — SWAT is outside!';
    });
  } else if (interior.id === 'mart') {
    addAction('STICK UP REGISTER (+$1,200 · 2-STAR HEAT)', 'danger', (fb) => {
      state.player.cash += 1200;
      addWanted(state, 2, 'Robbery in progress at Solara Corner Mart!');
      alertWitnesses(state, interior.doorX, interior.doorY, 'heist');
      audio.playCash();
      fb.textContent = 'Cleared the register for $1,200! Patrol cruisers inbound!';
    });
  }

  interiorModal.classList.remove('hidden');
}

// Button listeners
document.getElementById('btn-new-game').onclick = startNewGame;
document.getElementById('btn-continue').onclick = continueSavedGame;
document.getElementById('btn-controls').onclick = () => controlsModal.classList.remove('hidden');
document.getElementById('btn-close-controls').onclick = () => controlsModal.classList.add('hidden');
document.getElementById('btn-resume').onclick = () => {
  state.mode = 'playing';
  pauseMenu.classList.add('hidden');
};
document.getElementById('btn-save').onclick = () => {
  saveToast.textContent = saveGame(state) ? 'Game saved to browser storage!' : 'Could not save.';
};
document.getElementById('btn-load').onclick = continueSavedGame;
document.getElementById('btn-time').onclick = () => {
  state.timeIndex = (state.timeIndex + 1) % TIME_PHASES.length;
  saveToast.textContent = `Time set to ${TIME_PHASES[state.timeIndex].label}`;
};
document.getElementById('btn-pause-controls').onclick = () => controlsModal.classList.remove('hidden');
document.getElementById('btn-restart').onclick = startNewGame;
document.getElementById('btn-close-interior').onclick = () => {
  interiorModal.classList.add('hidden');
  state.mode = 'playing';
};

function toggleEnterExitVehicle() {
  const hero = state.heroes[state.player.activeId];
  if (hero.vehicle) {
    const v = hero.vehicle;
    v.driver = null;
    hero.vehicle = null;
    hero.x = v.x - Math.sin(v.angle) * (v.w * 0.9 + 14);
    hero.y = v.y + Math.cos(v.angle) * (v.w * 0.9 + 14);
    return;
  }

  let best = null;
  let bestD = 76;
  for (const v of state.vehicles) {
    if (v.dead) continue;
    const d = Math.hypot(v.x - hero.x, v.y - hero.y);
    if (d < bestD) {
      bestD = d;
      best = v;
    }
  }
  if (best) {
    best.isTraffic = false;
    best.driver = hero;
    hero.vehicle = best;
    if (best.isPolice) {
      addWanted(state, 2, 'Suspect hijacked a police cruiser!');
    } else {
      alertWitnesses(state, best.x, best.y, 'steal');
    }
  }
}

function getNearestContextPrompt() {
  const hero = state.heroes[state.player.activeId];
  const px = hero.vehicle ? hero.vehicle.x : hero.x;
  const py = hero.vehicle ? hero.vehicle.y : hero.y;

  for (const it of state.world.interiors) {
    if (Math.hypot(px - it.doorX, py - it.doorY) < 76) {
      return { text: `[E] Enter ${it.name}`, interior: it };
    }
  }

  if (!hero.vehicle) {
    for (const v of state.vehicles) {
      if (!v.dead && Math.hypot(px - v.x, py - v.y) < 72) {
        return { text: `[F] Steal / Drive ${v.name}`, interior: null };
      }
    }
  }
  return { text: '', interior: null };
}

function updatePlaying(dt) {
  state.time += dt;

  // Global hotkeys
  if (input.consumePress('Escape')) {
    ui.showPause();
    return;
  }
  if (input.consumePress('KeyM')) {
    audio.cycleRadio();
  }
  if (input.consumePress('KeyT')) {
    state.timeIndex = (state.timeIndex + 1) % TIME_PHASES.length;
  }
  if (input.consumePress('Tab')) {
    state.player.activeId = state.player.activeId === 'marco' ? 'elena' : 'marco';
    const spec = PROTAGONISTS[state.player.activeId];
    sayDialogue(
      state,
      spec.short,
      state.player.activeId === 'marco' ? 'Taking the wheel — watch this drift.' : 'I’ve got point. Let’s move smart.',
      3.2,
    );
  }
  if (input.consumePress('KeyF')) {
    toggleEnterExitVehicle();
  }
  if (input.consumePress('KeyR')) {
    reloadWeapon(state);
  }
  for (let i = 0; i < WEAPONS.length; i++) {
    if (input.consumePress(`Digit${i + 1}`)) state.player.weaponIndex = i;
  }

  const ctxPrompt = getNearestContextPrompt();
  if (input.consumePress('KeyE') && ctxPrompt.interior) {
    openInterior(ctxPrompt.interior);
    return;
  }

  const active = state.heroes[state.player.activeId];

  // Update world mouse coordinates
  input.mouse.worldX = state.camera.x - window.innerWidth * 0.5 + input.mouse.screenX;
  input.mouse.worldY = state.camera.y - window.innerHeight * 0.5 + input.mouse.screenY;

  // Player movement or driving
  if (active.vehicle) {
    updatePlayerVehicle(state, active.vehicle, dt);
    active.x = active.vehicle.x;
    active.y = active.vehicle.y;
    active.angle = active.vehicle.angle;
    // Long drift viral Solagram post!
    if (active.vehicle.driftAccum > 1.8 && state.social.cooldown <= 0) {
      active.vehicle.driftAccum = 0;
      postSolagram(state, `Insane neon drift in a ${active.vehicle.name} down Solara Coast! #NeonDrift`, 260, '@neon_drift');
    }
  } else {
    updateActiveHeroOnFoot(state, active, dt);
  }

  // Firing
  if (input.mouse.down) {
    audio.unlock();
    tryPlayerFire(state);
  }

  // Partner AI, Traffic, Police, Pedestrians, Wildlife, Combat, Missions, Social, Audio
  updatePartnerAI(state, dt, fireBullet);
  updateTraffic(state, dt);
  updateVehicleCollisions(state);
  updatePolice(state, dt, fireBullet);
  updatePedestrians(state, dt);
  updateWildlife(state, dt);
  updateCombat(state, dt);
  updateMissionsAndWorld(state, dt);
  updateSocial(state, dt);
  audio.update(dt, state.wanted.level, true);

  // Respawn at Safehouse if wasted
  if (active.hp <= 0) {
    active.hp = 100;
    active.armor = 50;
    active.vehicle = null;
    active.x = 2145;
    active.y = 1790;
    state.player.cash = Math.max(0, state.player.cash - 500);
    clearWanted(state, 5);
    addPopup(state, active.x, active.y - 24, 'RECOVERED AT SAFEHOUSE (-$500)', '#ff7092');
    sayDialogue(state, state.player.activeId === 'marco' ? 'ELENA' : 'MARCO', 'Patched you up at Bayside Safehouse. Take it easy.');
  }

  // Smooth camera with lookahead
  const targetX = active.x + (active.vehicle ? active.vehicle.vx * 0.22 : 0);
  const targetY = active.y + (active.vehicle ? active.vehicle.vy * 0.22 : 0);
  state.camera.x += (targetX - state.camera.x) * Math.min(1, dt * 6.5);
  state.camera.y += (targetY - state.camera.y) * Math.min(1, dt * 6.5);
  state.camera.shake = Math.max(0, state.camera.shake - dt * 24);

  hud.update(state, ctxPrompt.text);
}

// Initialize Title Screen or Deterministic Shot Mode
if (shotParam) {
  applyShotScene(state, shotParam, ui);
  hud.update(state, '');
  renderGame(ctx, state, window.innerWidth, window.innerHeight);
} else {
  // Live animated neon city panorama on Start Screen
  state.timeIndex = 2;
  ui.showStart();
}

let lastTs = performance.now();
function loop(ts) {
  const dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
  lastTs = ts;

  if (!shotParam) {
    if (state.mode === 'title') {
      state.time += dt;
      updateTraffic(state, dt);
      state.camera.x = 2760 + Math.sin(state.time * 0.14) * 140;
      state.camera.y = 1520 + Math.cos(state.time * 0.11) * 120;
    } else if (state.mode === 'playing') {
      updatePlaying(dt);
    } else if (state.mode === 'interior' || state.mode === 'paused') {
      if (input.consumePress('Escape')) {
        interiorModal.classList.add('hidden');
        pauseMenu.classList.add('hidden');
        state.mode = 'playing';
      }
    }
    renderGame(ctx, state, window.innerWidth, window.innerHeight);
    input.endFrame();
  } else {
    renderGame(ctx, state, window.innerWidth, window.innerHeight);
  }
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
