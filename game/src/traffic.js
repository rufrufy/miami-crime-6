// Ambient road traffic AI + parked stealable vehicles & docked speedboats.
import { createVehicle } from './vehicles.js';
import { H_ROADS, V_ROADS, mulberry32 } from './world.js';

export function spawnInitialVehicles(seed = 1) {
  const rng = mulberry32(seed * 3313 + 7);
  const vehicles = [];

  // Hero starter Neon Coupe right outside Bayside Safehouse
  vehicles.push(createVehicle('coupe', 2240, 1815, -Math.PI / 2, { color: '#ff3b8d', plate: 'VGA-606' }));

  // Parked stealable vehicles across the 6 districts
  const parked = [
    ['muscle', 2445, 765, 0, '#ffca3a'],
    ['moto', 2690, 1785, Math.PI, '#00f5d4'],
    ['suv', 1590, 1980, Math.PI / 2, '#2a9d8f'],
    ['coupe', 2840, 2410, 0, '#00e5ff'],
    ['muscle', 1120, 1135, 0, '#ff595e'],
    ['suv', 780, 520, Math.PI / 2, '#e76f51'],
    ['taxi', 2520, 1490, 0, '#ffd166'],
    ['coupe', 2920, 1520, -Math.PI / 2, '#b967ff'],
    // Boats docked at Coral Keys Marina & Cypress Marsh!
    ['boat', 2370, 2480, Math.PI, '#00e5ff'],
    ['boat', 1320, 2320, Math.PI, '#ffffff'],
    ['boat', 3180, 2240, 0, '#ff6b6b'],
  ];
  for (const [type, x, y, ang, color] of parked) {
    vehicles.push(createVehicle(type, x, y, ang, { color }));
  }

  // Ambient traffic cars cruising avenues
  const trafficTypes = ['taxi', 'coupe', 'muscle', 'suv', 'moto'];
  for (const rx of V_ROADS) {
    for (let i = 0; i < 4; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      const laneX = rx + dir * 24;
      const y = 360 + i * 540 + rng() * 140;
      const type = trafficTypes[Math.floor(rng() * trafficTypes.length)];
      vehicles.push(
        createVehicle(type, laneX, y, dir > 0 ? Math.PI / 2 : -Math.PI / 2, {
          isTraffic: true,
          aiDir: dir,
          aiLane: 'v',
        }),
      );
    }
  }
  for (const ry of H_ROADS) {
    for (let i = 0; i < 4; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      const laneY = ry + dir * 24;
      const x = 620 + i * 620 + rng() * 120;
      if (ry === 2520 && x < 1850) continue;
      const type = trafficTypes[Math.floor(rng() * trafficTypes.length)];
      vehicles.push(
        createVehicle(type, x, laneY, dir > 0 ? 0 : Math.PI, {
          isTraffic: true,
          aiDir: dir,
          aiLane: 'h',
        }),
      );
    }
  }

  return vehicles;
}

export function updateTraffic(state, dt) {
  const active = state.heroes[state.player.activeId];
  const px = active.vehicle ? active.vehicle.x : active.x;
  const py = active.vehicle ? active.vehicle.y : active.y;

  for (const v of state.vehicles) {
    if (!v.isTraffic || v.driver || v.dead) continue;

    // Check if another vehicle or player is directly ahead
    const fx = Math.cos(v.angle);
    const fy = Math.sin(v.angle);
    let blocked = false;
    const dPlayer = Math.hypot(px - v.x, py - v.y);
    if (dPlayer < 95 && (px - v.x) * fx + (py - v.y) * fy > 20) blocked = true;

    if (!blocked) {
      for (const o of state.vehicles) {
        if (o === v || o.dead) continue;
        const dx = o.x - v.x;
        const dy = o.y - v.y;
        const d = Math.hypot(dx, dy);
        if (d < 105 && dx * fx + dy * fy > 30) {
          blocked = true;
          break;
        }
      }
    }

    const targetSpd = blocked ? 0 : 155;
    v.speed += (targetSpd - v.speed) * Math.min(1, dt * 3.5);
    v.vx = fx * v.speed;
    v.vy = fy * v.speed;
    v.x += v.vx * dt;
    v.y += v.vy * dt;

    // Wrap cleanly along avenues
    if (v.aiLane === 'v') {
      if (v.y > 2660) v.y = 260;
      if (v.y < 240) v.y = 2640;
    } else {
      if (v.x > 3060) v.x = 520;
      if (v.x < 500) v.x = 3040;
    }
  }
}
