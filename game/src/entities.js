// Dual protagonists (Marco & Elena), Partner AI, Pedestrians with NPC Memory, Alligators & Coastal Birds.
import { OUTFITS, PROTAGONISTS, WORLD_H, WORLD_W } from './config.js';
import { postSolagram } from './social.js';
import { isBeachAt, isMarshAt, isOnRoad, isWaterAt, mulberry32, resolveBuildingCollision } from './world.js';

export function createHeroes() {
  return {
    marco: {
      id: 'marco',
      x: 2180,
      y: 1840,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: 100,
      maxHp: 100,
      armor: 75,
      maxArmor: 100,
      vehicle: null,
      fireCd: 0,
      walkCycle: 0,
      hitFlash: 0,
    },
    elena: {
      id: 'elena',
      x: 2145,
      y: 1860,
      vx: 0,
      vy: 0,
      angle: 0,
      hp: 100,
      maxHp: 100,
      armor: 75,
      maxArmor: 100,
      vehicle: null,
      fireCd: 0,
      walkCycle: 0,
      hitFlash: 0,
    },
  };
}

export function spawnPedestrians(world, seed = 1) {
  const rng = mulberry32(seed * 4129 + 33);
  const roles = [
    { role: 'beachgoer', shirts: ['#ff6b9d', '#00e5ff', '#ffd166', '#ff9f1c'], speed: 52 },
    { role: 'shopper', shirts: ['#c77dff', '#72efdd', '#ffadad', '#f8f9fa'], speed: 58 },
    { role: 'jogger', shirts: ['#5ef29d', '#ff595e', '#4cc9f0'], speed: 92 },
    { role: 'clubber', shirts: ['#ff3898', '#b5179e', '#3a86ff'], speed: 62 },
    { role: 'tourist', shirts: ['#ffd166', '#ff7a3d', '#80ed99'], speed: 50 },
  ];
  const peds = [];

  for (let i = 0; i < 62; i++) {
    let x = 520 + rng() * 2820;
    let y = 340 + rng() * 2300;
    if (isWaterAt(x, y) || isOnRoad(x, y, 4)) continue;
    const col = resolveBuildingCollision(world, x, y, 14);
    x = col.x;
    y = col.y;
    const spec = isBeachAt(x, y) ? roles[0] : roles[Math.floor(rng() * roles.length)];
    peds.push({
      id: i + 1,
      x,
      y,
      angle: rng() * Math.PI * 2,
      role: spec.role,
      speed: spec.speed,
      shirt: spec.shirts[Math.floor(rng() * spec.shirts.length)],
      skin: rng() < 0.5 ? '#dfaa84' : rng() < 0.75 ? '#b97a57' : '#f1c6a8',
      hair: rng() < 0.5 ? '#231917' : '#5c3b28',
      hp: 45,
      dead: false,
      homeX: x,
      homeY: y,
      targetX: x + (rng() - 0.5) * 260,
      targetY: y + (rng() - 0.5) * 260,
      waitTimer: rng() * 2,
      walkCycle: rng() * 6,
      memory: { sawCrimeAt: 0, state: 'routine', filmTimer: 0 },
    });
  }
  return peds;
}

export function spawnWildlife(seed = 1) {
  const rng = mulberry32(seed * 7919 + 91);
  const gators = [];
  const gatorSpots = [
    [660, 2480], [840, 2660], [1080, 2560], [1280, 2360],
    [520, 2720], [960, 2340], [1160, 2760], [760, 2260],
  ];
  for (let i = 0; i < gatorSpots.length; i++) {
    const [gx, gy] = gatorSpots[i];
    gators.push({
      id: i + 1,
      x: gx,
      y: gy,
      homeX: gx,
      homeY: gy,
      angle: rng() * Math.PI * 2,
      hp: 95,
      dead: false,
      swimPhase: rng() * Math.PI * 2,
      aggro: false,
      lungeCd: 0,
      hissed: false,
    });
  }

  const birds = [];
  for (let i = 0; i < 14; i++) {
    birds.push({
      x: 2400 + rng() * 1650,
      y: 450 + rng() * 2400,
      angle: rng() * Math.PI * 2,
      speed: 75 + rng() * 45,
      flap: rng() * Math.PI * 2,
      size: 7 + rng() * 5,
    });
  }
  return { gators, birds };
}

export function alertWitnesses(state, cx, cy, crimeType = 'shootout') {
  let filmed = false;
  for (const p of state.pedestrians) {
    if (p.dead) continue;
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < 340) {
      p.memory.sawCrimeAt = state.time;
      // 40% pull out phones to film you for Solagram, 60% flee!
      if (!filmed && d > 110 && Math.random() < 0.42) {
        p.memory.state = 'filming';
        p.memory.filmTimer = 4.5;
        filmed = true;
      } else {
        p.memory.state = 'fleeing';
      }
    }
  }
  if (filmed && state.social.cooldown <= 0) {
    const msg =
      crimeType === 'heist'
        ? 'LIVE STREAMING a wild bank shootout on Bayside Strip!! Stay indoors!! #SolaraCoast'
        : crimeType === 'steal'
          ? 'Someone just boosted a supercar right in front of me on the Strip! #MiamiCrime6'
          : 'Shots fired in Solara Coast! Witnesses filming as sirens close in!';
    postSolagram(state, msg, 180, '@bayside_watch');
  }
}

export function updateActiveHeroOnFoot(state, hero, dt) {
  const input = state.input;
  let fwd = 0;
  let right = 0;
  if (input.isDown('KeyW') || input.isDown('ArrowUp')) fwd += 1;
  if (input.isDown('KeyS') || input.isDown('ArrowDown')) fwd -= 1;
  if (input.isDown('KeyA') || input.isDown('ArrowLeft')) right -= 1;
  if (input.isDown('KeyD') || input.isDown('ArrowRight')) right += 1;

  const yaw = state.camera.yaw ?? -Math.PI * 0.5;
  const mx = Math.cos(yaw) * fwd - Math.sin(yaw) * right;
  const my = Math.sin(yaw) * fwd + Math.cos(yaw) * right;

  const mag = Math.hypot(mx, my);
  const inWater = isWaterAt(hero.x, hero.y);
  const sprint = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
  const baseSpd = inWater ? 95 : sprint ? 215 : 160;

  if (mag > 0.01) {
    hero.vx = (mx / mag) * baseSpd;
    hero.vy = (my / mag) * baseSpd;
    hero.walkCycle += dt * (sprint ? 12 : 8.5);
  } else {
    hero.vx *= 0.7;
    hero.vy *= 0.7;
  }

  const col = resolveBuildingCollision(state.world, hero.x + hero.vx * dt, hero.y + hero.vy * dt, 13);
  hero.x = col.x;
  hero.y = col.y;

  // Aim toward 3D mouse raycast target in world space
  hero.angle = Math.atan2(input.mouse.worldY - hero.y, input.mouse.worldX - hero.x);
  if (hero.hitFlash > 0) hero.hitFlash = Math.max(0, hero.hitFlash - dt);
}

export function updatePartnerAI(state, dt, fireBulletFn) {
  const activeId = state.player.activeId;
  const partnerId = activeId === 'marco' ? 'elena' : 'marco';
  const active = state.heroes[activeId];
  const partner = state.heroes[partnerId];
  if (partner.hitFlash > 0) partner.hitFlash = Math.max(0, partner.hitFlash - dt);
  if (partner.fireCd > 0) partner.fireCd -= dt;

  // Board or exit active player's vehicle automatically
  if (active.vehicle && partner.vehicle !== active.vehicle) {
    partner.vehicle = active.vehicle;
    active.vehicle.passenger = partner;
  } else if (!active.vehicle && partner.vehicle) {
    if (partner.vehicle.passenger === partner) partner.vehicle.passenger = null;
    partner.x = active.x - Math.cos(active.angle) * 32;
    partner.y = active.y - Math.sin(active.angle) * 32;
    partner.vehicle = null;
  }

  if (partner.vehicle) {
    partner.x = partner.vehicle.x;
    partner.y = partner.vehicle.y;
    partner.angle = partner.vehicle.angle;
  } else {
    // Follow active protagonist while keeping combat spacing
    const dx = active.x - partner.x;
    const dy = active.y - partner.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 460) {
      partner.x = active.x - 42;
      partner.y = active.y + 24;
    } else if (dist > 62) {
      const spd = dist > 150 ? 205 : 152;
      const nx = partner.x + (dx / dist) * spd * dt;
      const ny = partner.y + (dy / dist) * spd * dt;
      const col = resolveBuildingCollision(state.world, nx, ny, 13);
      partner.x = col.x;
      partner.y = col.y;
      partner.walkCycle += dt * 9;
      partner.angle = Math.atan2(dy, dx);
    }
  }

  // Partner fires back at nearest hostile (mission enemy or attacking cop)
  if (partner.fireCd <= 0 && fireBulletFn) {
    let best = null;
    let bestD = 380;
    for (const e of state.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - partner.x, e.y - partner.y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    if (!best && state.wanted.level >= 2) {
      for (const cop of state.police.officers) {
        if (cop.dead) continue;
        const d = Math.hypot(cop.x - partner.x, cop.y - partner.y);
        if (d < bestD) {
          bestD = d;
          best = cop;
        }
      }
    }
    if (best) {
      partner.angle = Math.atan2(best.y - partner.y, best.x - partner.x);
      const spec = PROTAGONISTS[partnerId];
      partner.fireCd = 0.42 / spec.fireRateBonus;
      fireBulletFn(state, partner.x, partner.y, partner.angle, 18, 920, '#6df2ff', 'player');
    }
  }
}

export function updatePedestrians(state, dt) {
  const active = state.heroes[state.player.activeId];
  const px = active.vehicle ? active.vehicle.x : active.x;
  const py = active.vehicle ? active.vehicle.y : active.y;

  for (const p of state.pedestrians) {
    if (p.dead) continue;
    const dxP = p.x - px;
    const dyP = p.y - py;
    const distP = Math.hypot(dxP, dyP);

    // NPC Memory decays after 20s
    if (p.memory.state !== 'routine' && state.time - p.memory.sawCrimeAt > 20) {
      p.memory.state = 'routine';
    }

    if (p.memory.state === 'filming') {
      p.angle = Math.atan2(py - p.y, px - p.x);
      p.memory.filmTimer -= dt;
      if (p.memory.filmTimer <= 0 || distP < 75) p.memory.state = 'fleeing';
      continue;
    }

    if (p.memory.state === 'fleeing') {
      const ang = Math.atan2(dyP, dxP);
      p.angle = ang;
      const col = resolveBuildingCollision(state.world, p.x + Math.cos(ang) * 125 * dt, p.y + Math.sin(ang) * 125 * dt, 10);
      p.x = col.x;
      p.y = col.y;
      p.walkCycle += dt * 11;
      continue;
    }

    // Routine stroll
    if (p.waitTimer > 0) {
      p.waitTimer -= dt;
      continue;
    }
    const tx = p.targetX - p.x;
    const ty = p.targetY - p.y;
    const td = Math.hypot(tx, ty);
    if (td < 16) {
      p.waitTimer = 1.2 + Math.random() * 2.5;
      p.targetX = Math.max(200, Math.min(WORLD_W - 200, p.homeX + (Math.random() - 0.5) * 320));
      p.targetY = Math.max(200, Math.min(WORLD_H - 200, p.homeY + (Math.random() - 0.5) * 320));
    } else {
      const nx = p.x + (tx / td) * p.speed * dt;
      const ny = p.y + (ty / td) * p.speed * dt;
      if (!isWaterAt(nx, ny)) {
        const col = resolveBuildingCollision(state.world, nx, ny, 10);
        p.x = col.x;
        p.y = col.y;
        p.angle = Math.atan2(ty, tx);
        p.walkCycle += dt * 6.5;
      } else {
        p.targetX = p.homeX;
        p.targetY = p.homeY;
      }
    }
  }
}

export function updateWildlife(state, dt) {
  const active = state.heroes[state.player.activeId];
  const px = active.vehicle ? active.vehicle.x : active.x;
  const py = active.vehicle ? active.vehicle.y : active.y;

  // Alligators patrolling Cypress Marsh
  for (const g of state.wildlife.gators) {
    if (g.dead) continue;
    g.swimPhase += dt * (g.aggro ? 8 : 3.5);
    if (g.lungeCd > 0) g.lungeCd -= dt;

    const dx = px - g.x;
    const dy = py - g.y;
    const d = Math.hypot(dx, dy);

    if (d < 230 && isMarshAt(px, py)) {
      g.aggro = true;
      if (!g.hissed) {
        g.hissed = true;
        if (state.audio) state.audio.playGator();
        if (state.social.cooldown <= 0) {
          postSolagram(state, 'GIANT ALLIGATOR chasing someone through Cypress Marsh! Classic Solara Coast! #MarshWatch', 220, '@marsh_hunter');
        }
      }
      const targetAng = Math.atan2(dy, dx);
      g.angle = targetAng;
      const spd = d < 95 ? 145 : 95;
      g.x += Math.cos(g.angle) * spd * dt;
      g.y += Math.sin(g.angle) * spd * dt;

      if (d < 34 && g.lungeCd <= 0) {
        g.lungeCd = 1.25;
        if (active.vehicle) {
          active.vehicle.hp = Math.max(15, active.vehicle.hp - 10);
        } else {
          active.hp = Math.max(0, active.hp - 16);
          active.hitFlash = 0.25;
        }
        state.camera.shake = Math.max(state.camera.shake, 6);
        if (state.audio) state.audio.playGator();
      }
    } else {
      g.aggro = false;
      g.hissed = false;
      // Patrol circle around home lagoon
      const hx = g.homeX + Math.cos(state.time * 0.35 + g.id) * 110;
      const hy = g.homeY + Math.sin(state.time * 0.28 + g.id) * 85;
      const ang = Math.atan2(hy - g.y, hx - g.x);
      g.angle = ang;
      g.x += Math.cos(ang) * 34 * dt;
      g.y += Math.sin(ang) * 34 * dt;
    }
  }

  // Coastal birds gliding over ocean & beach
  for (const b of state.wildlife.birds) {
    b.flap += dt * 7.5;
    b.angle += Math.sin(state.time * 0.6 + b.size) * 0.25 * dt;
    b.x += Math.cos(b.angle) * b.speed * dt;
    b.y += Math.sin(b.angle) * b.speed * dt;
    if (b.x > WORLD_W + 80) b.x = 2200;
    if (b.x < 2000) b.x = WORLD_W - 60;
    if (b.y > WORLD_H + 80) b.y = 200;
    if (b.y < 80) b.y = WORLD_H - 120;
  }
}
