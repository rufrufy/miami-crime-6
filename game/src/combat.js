// Weapons, firing, reload, bullet tracers, explosions, particles & hit detection.
import { PROTAGONISTS, WEAPONS } from './config.js';
import { alertWitnesses } from './entities.js';
import { addWanted } from './police.js';
import { pointHitsBuilding } from './world.js';

export function createCombatState() {
  return {
    bullets: [],
    particles: [],
    explosions: [],
    popups: [],
  };
}

export function spawnExplosion(state, x, y, radius = 110) {
  state.combat.explosions.push({ x, y, r: 12, maxR: radius, life: 0.55, maxLife: 0.55 });
  state.camera.shake = Math.max(state.camera.shake, 14);
  if (state.audio) state.audio.playExplosion();

  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 80 + Math.random() * 240;
    state.combat.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      size: 4 + Math.random() * 7,
      color: i % 3 === 0 ? '#fff3b0' : i % 3 === 1 ? '#ff7a3d' : '#ff3864',
      life: 0.35 + Math.random() * 0.4,
      maxLife: 0.75,
    });
  }

  // Splash damage
  for (const e of state.enemies) {
    if (!e.dead && Math.hypot(e.x - x, e.y - y) < radius) {
      e.hp = 0;
      e.dead = true;
    }
  }
  for (const c of state.police.officers) {
    if (!c.dead && Math.hypot(c.x - x, c.y - y) < radius) {
      c.hp = 0;
      c.dead = true;
    }
  }
}

export function addPopup(state, x, y, text, color = '#5ef29d') {
  state.combat.popups.push({ x, y, text, color, life: 1.2 });
}

export function fireBullet(state, x, y, angle, damage, speed, color, team) {
  state.combat.bullets.push({
    x,
    y,
    prevX: x,
    prevY: y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    damage,
    color,
    team,
    life: 0.85,
  });

  // Muzzle flash particle
  state.combat.particles.push({
    x: x + Math.cos(angle) * 16,
    y: y + Math.sin(angle) * 16,
    vx: Math.cos(angle) * 40,
    vy: Math.sin(angle) * 40,
    size: 8,
    color: '#fff2a6',
    life: 0.08,
    maxLife: 0.08,
  });
}

export function tryPlayerFire(state) {
  const hero = state.heroes[state.player.activeId];
  if (hero.fireCd > 0) return;

  const wIdx = state.player.weaponIndex;
  const w = WEAPONS[wIdx];
  const spec = PROTAGONISTS[state.player.activeId];

  // Reload check for guns
  if (!w.melee) {
    if (state.player.mag[wIdx] <= 0) {
      reloadWeapon(state);
      return;
    }
    state.player.mag[wIdx]--;
  }

  hero.fireCd = w.fireRate / spec.fireRateBonus;
  const ox = hero.vehicle ? hero.vehicle.x : hero.x;
  const oy = hero.vehicle ? hero.vehicle.y : hero.y;
  const aimAngle = Math.atan2(state.input.mouse.worldY - oy, state.input.mouse.worldX - ox);
  hero.angle = aimAngle;

  if (state.audio) state.audio.playShot(w.id);

  if (w.melee) {
    // Melee arc hit
    const hitX = ox + Math.cos(aimAngle) * 28;
    const hitY = oy + Math.sin(aimAngle) * 28;
    state.combat.particles.push({
      x: hitX, y: hitY, vx: 0, vy: 0, size: 14, color: '#ffffff', life: 0.12, maxLife: 0.12,
    });
    for (const e of [...state.enemies, ...state.police.officers, ...state.wildlife.gators]) {
      if (!e.dead && Math.hypot(e.x - hitX, e.y - hitY) < 42) {
        e.hp -= w.damage;
        if (e.hp <= 0) e.dead = true;
      }
    }
    return;
  }

  const spread = w.spread / spec.accuracyBonus;
  for (let i = 0; i < w.pellets; i++) {
    const a = aimAngle + (Math.random() - 0.5) * spread;
    fireBullet(state, ox + Math.cos(a) * 16, oy + Math.sin(a) * 16, a, w.damage, w.speed, w.color, 'player');
  }

  state.camera.shake = Math.max(state.camera.shake, w.id === 'shotgun' ? 4.5 : 1.6);
  alertWitnesses(state, ox, oy, 'shootout');
}

export function reloadWeapon(state) {
  const i = state.player.weaponIndex;
  const w = WEAPONS[i];
  if (w.melee || state.player.mag[i] >= w.mag || state.player.ammo[i] <= 0) return;
  const need = w.mag - state.player.mag[i];
  const take = Math.min(need, state.player.ammo[i]);
  state.player.mag[i] += take;
  state.player.ammo[i] -= take;
}

function spawnSparks(state, x, y, color = '#ffd166', count = 6) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 50 + Math.random() * 140;
    state.combat.particles.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, size: 3, color, life: 0.22, maxLife: 0.22,
    });
  }
}

export function updateCombat(state, dt) {
  const active = state.heroes[state.player.activeId];
  if (active.fireCd > 0) active.fireCd -= dt;

  // Update bullets
  for (let i = state.combat.bullets.length - 1; i >= 0; i--) {
    const b = state.combat.bullets[i];
    b.prevX = b.x;
    b.prevY = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    let hit = b.life <= 0;

    if (!hit && pointHitsBuilding(state.world, b.x, b.y)) {
      spawnSparks(state, b.x, b.y, '#ffe680', 4);
      hit = true;
    }

    if (!hit && b.team === 'player') {
      // Hit mission enemies
      for (const e of state.enemies) {
        if (e.dead) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) < 18) {
          e.hp -= b.damage;
          spawnSparks(state, b.x, b.y, '#ff5c8a', 5);
          if (e.hp <= 0) {
            e.dead = true;
            state.player.cash += 150;
            addPopup(state, e.x, e.y - 12, '+$150', '#5ef29d');
          }
          hit = true;
          break;
        }
      }
      // Hit police officers
      if (!hit) {
        for (const cop of state.police.officers) {
          if (cop.dead) continue;
          if (Math.hypot(cop.x - b.x, cop.y - b.y) < 18) {
            cop.hp -= b.damage;
            spawnSparks(state, b.x, b.y, '#ff5c8a', 5);
            addWanted(state, 1);
            if (cop.hp <= 0) {
              cop.dead = true;
              addPopup(state, cop.x, cop.y - 12, 'OFFICER DOWN', '#ff7092');
            }
            hit = true;
            break;
          }
        }
      }
      // Hit alligators
      if (!hit) {
        for (const g of state.wildlife.gators) {
          if (g.dead) continue;
          if (Math.hypot(g.x - b.x, g.y - b.y) < 26) {
            g.hp -= b.damage;
            spawnSparks(state, b.x, b.y, '#70e000', 5);
            if (g.hp <= 0) {
              g.dead = true;
              addPopup(state, g.x, g.y - 14, '+300 CLOUT', '#ff79c6');
              state.player.clout += 300;
            }
            hit = true;
            break;
          }
        }
      }
      // Hit vehicles (non-player)
      if (!hit) {
        for (const v of state.vehicles) {
          if (v.dead || v === active.vehicle) continue;
          if (Math.hypot(v.x - b.x, v.y - b.y) < 26) {
            v.hp -= b.damage;
            spawnSparks(state, b.x, b.y, '#ffd166', 6);
            if (v.isPolice) addWanted(state, 1);
            if (v.hp <= 0) {
              v.dead = true;
              spawnExplosion(state, v.x, v.y, 120);
              addWanted(state, 1);
            }
            hit = true;
            break;
          }
        }
      }
    } else if (!hit && b.team === 'enemy') {
      const px = active.vehicle ? active.vehicle.x : active.x;
      const py = active.vehicle ? active.vehicle.y : active.y;
      if (Math.hypot(px - b.x, py - b.y) < (active.vehicle ? 26 : 16)) {
        if (active.vehicle) {
          active.vehicle.hp = Math.max(10, active.vehicle.hp - b.damage * 0.6);
          spawnSparks(state, b.x, b.y, '#ffd166', 4);
        } else {
          let dmg = b.damage;
          if (active.armor > 0) {
            const absorb = Math.min(active.armor, dmg * 0.7);
            active.armor -= absorb;
            dmg -= absorb;
          }
          active.hp = Math.max(0, active.hp - dmg);
          active.hitFlash = 0.22;
          spawnSparks(state, b.x, b.y, '#ff3864', 4);
        }
        hit = true;
      }
    }

    if (hit) state.combat.bullets.splice(i, 1);
  }

  // Update particles
  for (let i = state.combat.particles.length - 1; i >= 0; i--) {
    const p = state.combat.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= dt;
    if (p.life <= 0) state.combat.particles.splice(i, 1);
  }

  // Update explosions
  for (let i = state.combat.explosions.length - 1; i >= 0; i--) {
    const ex = state.combat.explosions[i];
    ex.life -= dt;
    ex.r = ex.maxR * (1 - ex.life / ex.maxLife);
    if (ex.life <= 0) state.combat.explosions.splice(i, 1);
  }

  // Update floating popups
  for (let i = state.combat.popups.length - 1; i >= 0; i--) {
    const pop = state.combat.popups[i];
    pop.y -= 28 * dt;
    pop.life -= dt;
    if (pop.life <= 0) state.combat.popups.splice(i, 1);
  }
}
