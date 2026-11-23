// 1-5 Star Wanted system, SC-PD Cruisers, SWAT Vans, Officers, Helicopter Searchlight & Plate Recognition.
import { postSolagram, sayDialogue } from './social.js';
import { createVehicle } from './vehicles.js';
import { isWaterAt, resolveBuildingCollision } from './world.js';

export function createPoliceState() {
  return {
    officers: [],
    spawnTimer: 0,
    heli: {
      active: false,
      x: 2200,
      y: 1200,
      angle: 0,
      rotor: 0,
      lightX: 2200,
      lightY: 1200,
    },
  };
}

export function addWanted(state, starsDelta, reason = '') {
  const prev = state.wanted.level;
  state.wanted.level = Math.min(5, Math.max(state.wanted.level, prev + starsDelta));
  state.wanted.heatTimer = 18 + state.wanted.level * 5;
  state.wanted.lastSpotted = state.time;

  // Flag current vehicle plate as HOT PLATE and outfit as recognized!
  const active = state.heroes[state.player.activeId];
  if (active.vehicle && !active.vehicle.hotPlate) {
    active.vehicle.hotPlate = true;
  }
  if (state.wanted.level >= 2) {
    state.player.recognizedOutfit = true;
  }

  if (state.wanted.level > prev) {
    if (state.wanted.level === 3) {
      sayDialogue(state, 'SC-PD DISPATCH', 'All units, 3-star pursuit! Interceptors and roadblocks authorized!');
      if (state.social.cooldown <= 0) {
        postSolagram(state, '3-STAR CHASE tearing up Solara Coast! Sirens everywhere! #SolaraPD', 320, '@coast_scanner');
      }
    } else if (state.wanted.level >= 4) {
      sayDialogue(state, 'SC-PD DISPATCH', 'SWAT tactical vans and Air-One chopper deployed! Lock down Bayside!');
      if (state.social.cooldown <= 0) {
        postSolagram(state, 'SWAT + CHOPPER SEARCHLIGHT OVER BAYSIDE!! This is pure chaos!! #MiamiCrime6', 500, '@solara_live');
      }
    } else if (reason) {
      sayDialogue(state, 'SC-PD DISPATCH', reason);
    }
  }
}

export function clearWanted(state, dropStars = 5) {
  state.wanted.level = Math.max(0, state.wanted.level - dropStars);
  if (state.wanted.level === 0) {
    state.wanted.heatTimer = 0;
    state.police.heli.active = false;
    for (const v of state.vehicles) {
      if (v.isPolice) v.sirenOn = false;
    }
  }
}

export function updatePolice(state, dt, fireBulletFn) {
  const active = state.heroes[state.player.activeId];
  const px = active.vehicle ? active.vehicle.x : active.x;
  const py = active.vehicle ? active.vehicle.y : active.y;
  const wanted = state.wanted.level;

  // Detection range scales with HOT PLATE and recognized outfit!
  const hotPlate = Boolean(active.vehicle && active.vehicle.hotPlate);
  const detectRange = 360 + (hotPlate ? 170 : 0) + (state.player.recognizedOutfit ? 110 : 0);

  let spotted = false;
  let activePoliceCars = 0;

  for (const v of state.vehicles) {
    if (!v.isPolice || v.dead || v.driver === active) continue;
    activePoliceCars++;

    const dx = px - v.x;
    const dy = py - v.y;
    const dist = Math.hypot(dx, dy);

    if (wanted === 0) {
      v.sirenOn = false;
      v.speed *= Math.pow(0.4, dt);
      v.vx = Math.cos(v.angle) * v.speed;
      v.vy = Math.sin(v.angle) * v.speed;
      v.x += v.vx * dt;
      v.y += v.vy * dt;
      continue;
    }

    v.sirenOn = true;
    if (dist < detectRange) spotted = true;

    // Pursue player if on land
    const targetAngle = Math.atan2(dy, dx);
    let diff = targetAngle - v.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    v.angle += Math.max(-2.7 * dt, Math.min(2.7 * dt, diff));

    const desiredSpd = dist < 130 ? 40 : Math.min(v.maxSpeed * (0.72 + wanted * 0.05), 360 + wanted * 28);
    v.speed += (desiredSpd - v.speed) * Math.min(1, dt * 3.2);
    const nx = v.x + Math.cos(v.angle) * v.speed * dt;
    const ny = v.y + Math.sin(v.angle) * v.speed * dt;
    if (!isWaterAt(nx, ny)) {
      const col = resolveBuildingCollision(state.world, nx, ny, 24);
      v.x = col.x;
      v.y = col.y;
      if (col.hit) v.angle += 0.9 * dt;
    }
    v.vx = Math.cos(v.angle) * v.speed;
    v.vy = Math.sin(v.angle) * v.speed;

    // Deploy on-foot officer when close to player on foot
    if (!active.vehicle && dist < 210 && state.police.officers.filter((o) => !o.dead).length < wanted * 2 + 1) {
      if (Math.random() < 0.018) {
        state.police.officers.push({
          x: v.x + (Math.random() - 0.5) * 40,
          y: v.y + (Math.random() - 0.5) * 40,
          angle: targetAngle,
          hp: v.type === 'swat' ? 85 : 55,
          maxHp: v.type === 'swat' ? 85 : 55,
          swat: v.type === 'swat',
          fireCd: 0.6,
          dead: false,
          walkCycle: 0,
        });
      }
    }
  }

  // Spawn police reinforcements based on Wanted Level
  if (wanted > 0) {
    state.police.spawnTimer -= dt;
    const maxCars = Math.min(6, wanted + 1);
    if (state.police.spawnTimer <= 0 && activePoliceCars < maxCars) {
      state.police.spawnTimer = Math.max(2.5, 6.2 - wanted * 0.75);
      const ang = Math.random() * Math.PI * 2;
      const sx = Math.max(260, Math.min(state.world.width - 260, px + Math.cos(ang) * 620));
      const sy = Math.max(260, Math.min(state.world.height - 260, py + Math.sin(ang) * 620));
      if (!isWaterAt(sx, sy)) {
        const col = resolveBuildingCollision(state.world, sx, sy, 32);
        const type = wanted >= 4 && Math.random() < 0.45 ? 'swat' : 'police';
        state.vehicles.push(
          createVehicle(type, col.x, col.y, Math.atan2(py - col.y, px - col.x), {
            isPolice: true,
            sirenOn: true,
          }),
        );
      }
    }
  }

  // Update on-foot police officers
  for (const cop of state.police.officers) {
    if (cop.dead) continue;
    const dx = px - cop.x;
    const dy = py - cop.y;
    const dist = Math.hypot(dx, dy);
    if (dist < detectRange) spotted = true;
    cop.angle = Math.atan2(dy, dx);
    if (cop.fireCd > 0) cop.fireCd -= dt;

    if (dist > 175 && dist < 850) {
      const spd = cop.swat ? 115 : 132;
      const col = resolveBuildingCollision(state.world, cop.x + (dx / dist) * spd * dt, cop.y + (dy / dist) * spd * dt, 12);
      cop.x = col.x;
      cop.y = col.y;
      cop.walkCycle += dt * 9;
    }

    if (wanted > 0 && dist < 390 && cop.fireCd <= 0 && fireBulletFn) {
      cop.fireCd = cop.swat ? 0.55 : 0.92;
      const spread = (Math.random() - 0.5) * 0.14;
      fireBulletFn(state, cop.x, cop.y, cop.angle + spread, cop.swat ? 11 : 8, 760, '#ff5c8a', 'enemy');
    }
  }

  // 4-5 Star Police Helicopter with sweeping searchlight
  const heli = state.police.heli;
  if (wanted >= 4) {
    heli.active = true;
    heli.rotor += dt * 24;
    const orbitX = px + Math.cos(state.time * 0.65) * 180;
    const orbitY = py + Math.sin(state.time * 0.65) * 150;
    heli.x += (orbitX - heli.x) * Math.min(1, dt * 1.8);
    heli.y += (orbitY - heli.y) * Math.min(1, dt * 1.8);
    heli.angle = Math.atan2(py - heli.y, px - heli.x);
    heli.lightX += (px - heli.lightX) * Math.min(1, dt * 3.5);
    heli.lightY += (py - heli.lightY) * Math.min(1, dt * 3.5);
    spotted = true;
  } else {
    heli.active = false;
  }

  // Heat cooldown when out of sight
  if (wanted > 0) {
    if (spotted) {
      state.wanted.heatTimer = Math.max(state.wanted.heatTimer, 10 + wanted * 2);
      state.wanted.lastSpotted = state.time;
    } else {
      const decayMult = !hotPlate && !state.player.recognizedOutfit ? 1.85 : 1.0;
      state.wanted.heatTimer -= dt * decayMult;
      if (state.wanted.heatTimer <= 0) {
        clearWanted(state, 5);
        sayDialogue(state, state.player.activeId === 'marco' ? 'MARCO' : 'ELENA', 'Heat is off us. Good driving.');
      }
    }
  }
}
