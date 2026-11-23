// 6-Mission Solara Coast Story Campaign, Mission Enemies, Pickups & Hidden Mysteries.
import { addPopup, fireBullet } from './combat.js';
import { WEAPONS } from './config.js';
import { addWanted, clearWanted } from './police.js';
import { postSolagram, sayDialogue } from './social.js';
import { resolveBuildingCollision } from './world.js';

export const MISSION_DEFS = [
  {
    id: 'm1',
    title: 'MISSION 1 · MOTEL STICKUP',
    objective: 'Hit Solara Corner Mart in Solara Flats, then escape to Bayside Safehouse',
    targetX: 2428,
    targetY: 718,
    escapeX: 2145,
    escapeY: 1776,
    rewardCash: 3500,
    rewardClout: 600,
    type: 'rob_escape',
    stars: 2,
    introSpeaker: 'MARCO',
    introLine: 'Quick cash run at Solara Corner Mart up north. Grab the register and burn rubber back to Bayside!',
  },
  {
    id: 'm2',
    title: 'MISSION 2 · MARINA HOTWIRE',
    objective: 'Race through the 3 Coral Keys Bridge checkpoints in a fast ride',
    checkpoints: [
      { x: 2240, y: 2180 },
      { x: 2960, y: 2420 },
      { x: 3420, y: 2520 },
    ],
    rewardCash: 5000,
    rewardClout: 950,
    type: 'checkpoints',
    introSpeaker: 'ELENA',
    introLine: 'Coral Keys bridge is clear. Steal a Neon Coupe and blast through all 3 checkpoints for our buyer!',
  },
  {
    id: 'm3',
    title: 'MISSION 3 · MARSH CARGO',
    objective: 'Recover 3 smuggled crates in Cypress Marsh — watch for alligators!',
    checkpoints: [
      { x: 1220, y: 2340 },
      { x: 880, y: 2540 },
      { x: 640, y: 2660 },
    ],
    rewardCash: 6500,
    rewardClout: 1100,
    type: 'checkpoints',
    introSpeaker: 'MARCO',
    introLine: 'Grab a speedboat or Marshlander SUV. Three cartel crates went down in Cypress Marsh — gators are hungry.',
  },
  {
    id: 'm4',
    title: 'MISSION 4 · HARBOR AMBUSH',
    objective: 'Clear 6 cartel guards at Harbor Point shipping docks',
    targetX: 740,
    targetY: 1520,
    enemyCount: 6,
    rewardCash: 8500,
    rewardClout: 1400,
    type: 'eliminate',
    introSpeaker: 'ELENA',
    introLine: 'Cartel crew locked down Harbor Point docks. Press Tab anytime to flank with me — let’s take their stash.',
  },
  {
    id: 'm5',
    title: 'MISSION 5 · CLUB MIRAGE INTEL',
    objective: 'Reach Club Mirage on Bayside Strip for the bank blueprint, then shake the tail',
    targetX: 2718,
    targetY: 1772,
    escapeX: 2145,
    escapeY: 1776,
    rewardCash: 10000,
    rewardClout: 1800,
    type: 'rob_escape',
    stars: 3,
    introSpeaker: 'ELENA',
    introLine: 'Vault codes are inside Club Mirage. Hit the neon entrance, grab the drive, and lose the 3-star tail!',
  },
  {
    id: 'm6',
    title: 'MISSION 6 · BAYSIDE VAULT HEIST',
    objective: 'Storm Bayside First Bank, clear guards, crack the vault & escape 4-star heat!',
    targetX: 2450,
    targetY: 1444,
    escapeX: 2145,
    escapeY: 1776,
    enemyCount: 6,
    rewardCash: 50000,
    rewardClout: 5000,
    type: 'heist',
    stars: 4,
    introSpeaker: 'MARCO',
    introLine: 'This is it, Elena — Bayside First Bank. Fifty grand in the vault. Stick together and light ’em up!',
  },
];

export function createMissionState() {
  return {
    index: 0,
    stage: 0, // 0 = reach target/collect, 1 = escape/return
    completed: 0,
    spawnedForMission: -1,
    marker: { x: MISSION_DEFS[0].targetX, y: MISSION_DEFS[0].targetY, label: 'OBJECTIVE' },
  };
}

export function startMission(state, idx) {
  const m = state.missions;
  m.index = idx;
  m.stage = 0;
  m.spawnedForMission = -1;
  state.enemies = [];

  if (idx >= MISSION_DEFS.length) {
    m.marker = null;
    sayDialogue(state, 'ELENA', 'We own Solara Coast! Explore mysteries, customize cars, or rob stores in Free Roam.');
    return;
  }

  const def = MISSION_DEFS[idx];
  if (def.type === 'checkpoints') {
    m.marker = { x: def.checkpoints[0].x, y: def.checkpoints[0].y, label: 'CHECKPOINT 1/3' };
  } else {
    m.marker = { x: def.targetX, y: def.targetY, label: def.title };
  }
  sayDialogue(state, def.introSpeaker, def.introLine, 5.4);
}

function spawnMissionEnemies(state, cx, cy, count) {
  state.enemies = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = 75 + (i % 2) * 45;
    const col = resolveBuildingCollision(state.world, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 14);
    state.enemies.push({
      id: i + 1,
      x: col.x,
      y: col.y,
      angle: a,
      hp: 65,
      maxHp: 65,
      fireCd: 0.4 + Math.random() * 0.6,
      dead: false,
      walkCycle: 0,
    });
  }
}

export function completeCurrentMission(state) {
  const def = MISSION_DEFS[state.missions.index];
  if (!def) return;
  state.player.cash += def.rewardCash;
  state.missions.completed++;
  if (state.audio) state.audio.playCash();
  const active = state.heroes[state.player.activeId];
  addPopup(state, active.x, active.y - 24, `MISSION COMPLETE +$${def.rewardCash.toLocaleString()}`, '#ffd166');
  postSolagram(state, `BREAKING: ${def.title.split('·')[1].trim()} pulled off in Solara Coast! Legends!`, def.rewardClout, '@solara_live');
  clearWanted(state, 5);
  startMission(state, state.missions.index + 1);
}

export function updateMissionsAndWorld(state, dt) {
  const active = state.heroes[state.player.activeId];
  const px = active.vehicle ? active.vehicle.x : active.x;
  const py = active.vehicle ? active.vehicle.y : active.y;

  // Update Pickups
  for (const p of state.world.pickups) {
    if (!p.active) {
      p.respawn -= dt;
      if (p.respawn <= 0) p.active = true;
      continue;
    }
    if (Math.hypot(px - p.x, py - p.y) < 34) {
      p.active = false;
      p.respawn = 35;
      if (p.kind === 'health') {
        active.hp = Math.min(active.maxHp, active.hp + p.value);
        addPopup(state, p.x, p.y, '+HEALTH', '#5ef29d');
      } else if (p.kind === 'armor') {
        active.armor = Math.min(active.maxArmor, active.armor + p.value);
        addPopup(state, p.x, p.y, '+ARMOR', '#00e5ff');
      } else if (p.kind === 'cash') {
        state.player.cash += p.value;
        addPopup(state, p.x, p.y, `+$${p.value}`, '#5ef29d');
        if (state.audio) state.audio.playCash();
      } else if (p.kind === 'weapon') {
        state.player.weaponIndex = p.weaponIndex;
        state.player.ammo[p.weaponIndex] += WEAPONS[p.weaponIndex].mag * 3;
        state.player.mag[p.weaponIndex] = WEAPONS[p.weaponIndex].mag;
        addPopup(state, p.x, p.y, `+${p.label}`, '#ffd166');
      }
    }
  }

  // Update Hidden Mysteries
  for (const mys of state.world.mysteries) {
    if (mys.discovered) continue;
    if (Math.hypot(px - mys.x, py - mys.y) < mys.r) {
      mys.discovered = true;
      state.player.cash += mys.rewardCash;
      addPopup(state, mys.x, mys.y - 20, `MYSTERY FOUND: ${mys.name}!`, '#00e5ff');
      postSolagram(state, mys.caption, mys.rewardClout, '@marsh_hunter');
      sayDialogue(state, state.player.activeId === 'marco' ? 'MARCO' : 'ELENA', `Whoa... did you just see that ${mys.name}? Solagram is blowing up!`);
      if (state.audio) state.audio.playCash();
    }
  }

  // Update Mission Enemies
  for (const e of state.enemies) {
    if (e.dead) continue;
    const dx = px - e.x;
    const dy = py - e.y;
    const d = Math.hypot(dx, dy);
    e.angle = Math.atan2(dy, dx);
    if (e.fireCd > 0) e.fireCd -= dt;
    if (d > 170 && d < 620) {
      const col = resolveBuildingCollision(state.world, e.x + (dx / d) * 105 * dt, e.y + (dy / d) * 105 * dt, 12);
      e.x = col.x;
      e.y = col.y;
      e.walkCycle += dt * 8;
    }
    if (d < 420 && e.fireCd <= 0) {
      e.fireCd = 0.85;
      fireBullet(state, e.x, e.y, e.angle + (Math.random() - 0.5) * 0.14, 10, 740, '#ff8f5c', 'enemy');
    }
  }

  // Active Story Mission progression
  const def = MISSION_DEFS[state.missions.index];
  if (!def) return;

  if (def.type === 'rob_escape') {
    if (state.missions.stage === 0) {
      if (Math.hypot(px - def.targetX, py - def.targetY) < 70) {
        state.missions.stage = 1;
        state.missions.marker = { x: def.escapeX, y: def.escapeY, label: 'SAFEHOUSE ESCAPE' };
        addWanted(state, def.stars, 'Alarm tripped! Armed suspects fleeing the scene!');
        sayDialogue(state, 'MARCO', 'Got the goods! Floor it back to Bayside Safehouse!');
      }
    } else if (Math.hypot(px - def.escapeX, py - def.escapeY) < 82) {
      completeCurrentMission(state);
    }
  } else if (def.type === 'checkpoints') {
    const cp = def.checkpoints[state.missions.stage];
    if (cp && Math.hypot(px - cp.x, py - cp.y) < 76) {
      state.missions.stage++;
      if (state.audio) state.audio.playCash();
      if (state.missions.stage >= def.checkpoints.length) {
        completeCurrentMission(state);
      } else {
        const next = def.checkpoints[state.missions.stage];
        state.missions.marker = {
          x: next.x,
          y: next.y,
          label: `CHECKPOINT ${state.missions.stage + 1}/${def.checkpoints.length}`,
        };
        addPopup(state, cp.x, cp.y, `CHECKPOINT ${state.missions.stage}/3`, '#ffd166');
      }
    }
  } else if (def.type === 'eliminate') {
    if (state.missions.spawnedForMission !== state.missions.index && Math.hypot(px - def.targetX, py - def.targetY) < 520) {
      state.missions.spawnedForMission = state.missions.index;
      spawnMissionEnemies(state, def.targetX, def.targetY, def.enemyCount);
      sayDialogue(state, 'ELENA', 'Cartel guards spotted! Take them all out!');
    }
    if (state.missions.spawnedForMission === state.missions.index) {
      const alive = state.enemies.filter((e) => !e.dead).length;
      if (alive === 0) completeCurrentMission(state);
    }
  } else if (def.type === 'heist') {
    if (state.missions.stage === 0) {
      if (state.missions.spawnedForMission !== state.missions.index && Math.hypot(px - def.targetX, py - def.targetY) < 460) {
        state.missions.spawnedForMission = state.missions.index;
        spawnMissionEnemies(state, def.targetX, def.targetY + 35, def.enemyCount);
        addWanted(state, 3, 'Silent alarm at Bayside First Bank! Heavy response!');
      }
      if (state.missions.spawnedForMission === state.missions.index) {
        const alive = state.enemies.filter((e) => !e.dead).length;
        if (alive === 0 && Math.hypot(px - def.targetX, py - def.targetY) < 88) {
          state.missions.stage = 1;
          state.missions.marker = { x: def.escapeX, y: def.escapeY, label: 'ESCAPE WITH $50K' };
          addWanted(state, 4);
          sayDialogue(state, 'ELENA', 'Vault cracked! Fifty grand in the bags — get to Bayside Safehouse NOW!');
        }
      }
    } else if (Math.hypot(px - def.escapeX, py - def.escapeY) < 86) {
      completeCurrentMission(state);
    }
  }
}

export function getMissionBanner(state) {
  const def = MISSION_DEFS[state.missions.index];
  if (!def) {
    return {
      title: 'SOLARA COAST · FREE ROAM',
      obj: 'Explore 6 districts, find 3 Hidden Mysteries, or visit Auto Mod Garage & Club Mirage',
    };
  }
  if (def.type === 'rob_escape' && state.missions.stage === 1) {
    return { title: def.title, obj: 'Escape to Bayside Safehouse (follow gold marker)!' };
  }
  if (def.type === 'checkpoints') {
    return { title: def.title, obj: `${def.objective} (${state.missions.stage}/${def.checkpoints.length})` };
  }
  if (def.type === 'eliminate' && state.missions.spawnedForMission === state.missions.index) {
    const alive = state.enemies.filter((e) => !e.dead).length;
    return { title: def.title, obj: `Eliminate cartel guards at Harbor Point (${alive} remaining)` };
  }
  if (def.type === 'heist' && state.missions.stage === 1) {
    return { title: def.title, obj: 'Vault cracked! Escape 4-star police heat to Bayside Safehouse!' };
  }
  return { title: def.title, obj: def.objective };
}
