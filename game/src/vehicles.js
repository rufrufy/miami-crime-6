// Vehicle factory, driving/drifting/nitro/boat physics, plate tracking, and damage.
import { PROTAGONISTS, VEHICLE_TYPES } from './config.js';
import { isMarshAt, isWaterAt, resolveBuildingCollision } from './world.js';

let nextVehId = 1;

export function generatePlate(rng = Math.random) {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const a = letters[Math.floor(rng() * letters.length)];
  const b = letters[Math.floor(rng() * letters.length)];
  const c = letters[Math.floor(rng() * letters.length)];
  const num = 100 + Math.floor(rng() * 899);
  return `${a}${b}${c}-${num}`;
}

export function createVehicle(typeKey, x, y, angle = 0, opts = {}) {
  const spec = VEHICLE_TYPES[typeKey] || VEHICLE_TYPES.coupe;
  const color = opts.color || spec.colors[Math.floor(Math.random() * spec.colors.length)];
  return {
    id: nextVehId++,
    type: typeKey,
    name: spec.name,
    x,
    y,
    vx: 0,
    vy: 0,
    speed: 0,
    angle,
    w: spec.w,
    h: spec.h,
    maxSpeed: spec.maxSpeed,
    accel: spec.accel,
    brake: spec.brake,
    turn: spec.turn,
    drift: spec.drift,
    hp: spec.hp,
    maxHp: spec.hp,
    color,
    boat: Boolean(spec.boat),
    offroad: Boolean(spec.offroad),
    siren: Boolean(spec.siren),
    sirenOn: Boolean(opts.sirenOn),
    plate: opts.plate || generatePlate(),
    hotPlate: Boolean(opts.hotPlate),
    turbo: Boolean(opts.turbo),
    nitro: 100,
    nitroActive: false,
    drifting: false,
    driver: null,
    passenger: null,
    isTraffic: Boolean(opts.isTraffic),
    isPolice: Boolean(opts.isPolice),
    aiDir: opts.aiDir || 0,
    aiLane: opts.aiLane || 0,
    dead: false,
    smokeTimer: 0,
    driftAccum: 0,
  };
}

export function updatePlayerVehicle(state, v, dt) {
  const input = state.input;
  const active = PROTAGONISTS[state.player.activeId];
  const turboMult = v.turbo ? 1.22 : 1.0;

  let throttle = 0;
  if (input.isDown('KeyW') || input.isDown('ArrowUp')) throttle += 1;
  if (input.isDown('KeyS') || input.isDown('ArrowDown')) throttle -= 1;

  let steer = 0;
  if (input.isDown('KeyA') || input.isDown('ArrowLeft')) steer -= 1;
  if (input.isDown('KeyD') || input.isDown('ArrowRight')) steer += 1;

  const handbrake = input.isDown('Space');
  const wantNitro = (input.isDown('ShiftLeft') || input.isDown('ShiftRight')) && throttle > 0 && v.nitro > 4;

  const inWater = isWaterAt(v.x, v.y);
  const inMarsh = isMarshAt(v.x, v.y);

  let surfaceMult = 1.0;
  if (v.boat) {
    surfaceMult = inWater ? 1.08 : 0.22;
  } else {
    if (inWater) surfaceMult = 0.24;
    else if (inMarsh && !v.offroad) surfaceMult = 0.72;
  }

  v.nitroActive = wantNitro;
  if (wantNitro) {
    v.nitro = Math.max(0, v.nitro - 38 * dt);
    if (Math.random() < 0.25 && state.audio) state.audio.playNitro();
  } else {
    v.nitro = Math.min(100, v.nitro + 12 * active.nitroRegen * dt);
  }

  const maxSpd = v.maxSpeed * turboMult * surfaceMult * (wantNitro ? 1.32 : 1.0);
  const accel = v.accel * turboMult * (wantNitro ? 1.65 : 1.0);

  const fx = Math.cos(v.angle);
  const fy = Math.sin(v.angle);
  const rx = -fy;
  const ry = fx;

  let forwardVel = v.vx * fx + v.vy * fy;
  let lateralVel = v.vx * rx + v.vy * ry;

  if (throttle > 0) {
    forwardVel += accel * dt;
  } else if (throttle < 0) {
    if (forwardVel > 25) forwardVel -= v.brake * dt;
    else forwardVel -= accel * 0.55 * dt;
  } else {
    forwardVel *= Math.pow(0.25, dt);
  }

  if (handbrake && !v.boat) {
    forwardVel *= Math.pow(0.45, dt);
  }

  forwardVel = Math.max(-maxSpd * 0.42, Math.min(maxSpd, forwardVel));

  // Steering scales with speed
  const speedFactor = Math.min(1, Math.abs(forwardVel) / 140);
  const reverseSign = forwardVel >= -5 ? 1 : -1;
  const turnRate = v.turn * active.handlingBonus * (handbrake ? 1.38 : 1.0);
  v.angle += steer * turnRate * speedFactor * reverseSign * dt;

  // Lateral grip vs drift slip
  const grip = handbrake ? 0.94 : v.boat ? 0.92 : 0.84;
  lateralVel *= Math.pow(grip, dt * 60);

  const nfx = Math.cos(v.angle);
  const nfy = Math.sin(v.angle);
  const nrx = -nfy;
  const nry = nfx;

  v.vx = nfx * forwardVel + nrx * lateralVel;
  v.vy = nfy * forwardVel + nry * lateralVel;
  v.speed = Math.hypot(v.vx, v.vy);

  v.drifting = !v.boat && !inWater && (handbrake || Math.abs(lateralVel) > 65) && v.speed > 130;
  if (v.drifting) {
    v.driftAccum += dt;
    // Drop skidmarks
    const rearX = v.x - nfx * (v.h * 0.34);
    const rearY = v.y - nfy * (v.h * 0.34);
    state.world.skidmarks.push({
      x1: rearX + nrx * (v.w * 0.34),
      y1: rearY + nry * (v.w * 0.34),
      x2: rearX - nrx * (v.w * 0.34),
      y2: rearY - nry * (v.w * 0.34),
      alpha: 0.42,
    });
    if (state.world.skidmarks.length > 260) state.world.skidmarks.shift();
    if (Math.random() < 0.16 && state.audio) state.audio.playDrift();
  } else {
    v.driftAccum = Math.max(0, v.driftAccum - dt * 1.5);
  }

  // Move & collide with buildings
  const nx = v.x + v.vx * dt;
  const ny = v.y + v.vy * dt;
  const col = resolveBuildingCollision(state.world, nx, ny, Math.max(v.w, v.h) * 0.42);
  v.x = col.x;
  v.y = col.y;
  if (col.hit) {
    v.vx *= -0.35;
    v.vy *= -0.35;
    if (v.speed > 260) {
      v.hp = Math.max(10, v.hp - 8);
      state.camera.shake = Math.max(state.camera.shake, 5);
    }
  }
}

export function updateVehicleCollisions(state) {
  const list = state.vehicles;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (a.dead) continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (b.dead) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const minD = (a.w + b.w) * 0.62;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0.01 && d2 < minD * minD) {
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;
        const push = (minD - d) * 0.5;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
        const rel = Math.hypot(a.vx - b.vx, a.vy - b.vy);
        if (rel > 120) {
          a.vx -= nx * rel * 0.25;
          a.vy -= ny * rel * 0.25;
          b.vx += nx * rel * 0.25;
          b.vy += ny * rel * 0.25;
          if (a.driver === state.heroes[state.player.activeId] || b.driver === state.heroes[state.player.activeId]) {
            state.camera.shake = Math.max(state.camera.shake, 4);
          }
        }
      }
    }
  }
}
