// Procedural + handcrafted Solara Coast open-world map (4200 x 3200).
import { DISTRICTS, ROAD_W, WORLD_H, WORLD_W } from './config.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Primary road grid coordinates
export const V_ROADS = [740, 1520, 2240, 2960];
export const H_ROADS = [480, 1180, 1840, 2520];

// Coral Keys islands (south-east archipelago)
export const ISLANDS = [
  { x: 2450, y: 2300, w: 680, h: 480, r: 90 },
  { x: 3260, y: 2420, w: 560, h: 430, r: 85 },
];

// Bridges connecting mainland to Coral Keys & across waterways
export const BRIDGES = [
  { x: 2240 - ROAD_W / 2, y: 2050, w: ROAD_W, h: 320, dir: 'v' },
  { x: 2960 - ROAD_W / 2, y: 2050, w: ROAD_W, h: 300, dir: 'v' },
  { x: 3050, y: 2520 - ROAD_W / 2, w: 300, h: ROAD_W, dir: 'h' },
];

export function isOnBridge(x, y) {
  for (const b of BRIDGES) {
    if (x >= b.x - 6 && x <= b.x + b.w + 6 && y >= b.y - 6 && y <= b.y + b.h + 6) return true;
  }
  return false;
}

export function isOnRoad(x, y, pad = 0) {
  const hw = ROAD_W * 0.5 + pad;
  for (const rx of V_ROADS) {
    const maxY = rx === 740 ? 2040 : rx === 2960 ? 2700 : 2850;
    if (Math.abs(x - rx) <= hw && y > 180 && y < maxY) {
      return true;
    }
  }
  for (const ry of H_ROADS) {
    if (Math.abs(y - ry) <= hw && x > 380 && x < 3120) {
      if (ry === 2520 && x < 1400) continue;
      return true;
    }
  }
  if (isOnBridge(x, y)) return true;
  return false;
}

export function isMarshAt(x, y) {
  return x < 1680 && y > 2020;
}

export function isWaterAt(x, y) {
  if (isOnBridge(x, y)) return false;

  // Eastern Ocean (Bayside Strip beach ends around x = 3360)
  const coastWave = Math.sin(y * 0.0045) * 42 + Math.cos(y * 0.011) * 18;
  if (x > 3380 + coastWave && y < 2180) return true;

  // Southern Coral Keys Ocean (y > 2140 and x > 1760)
  if (y > 2140 && x > 1760) {
    // Check if inside one of the Coral Keys islands
    for (const isl of ISLANDS) {
      if (x >= isl.x && x <= isl.x + isl.w && y >= isl.y && y <= isl.y + isl.h) {
        return false;
      }
    }
    return true;
  }

  // Harbor Point western shipping basin
  if (x < 420 && y > 1020 && y < 2060) return true;

  // Cypress Marsh navigable waterways (curvy channels + central lagoon)
  if (isMarshAt(x, y)) {
    const dx = x - 940;
    const dy = y - 2580;
    if ((dx * dx) / (520 * 520) + (dy * dy) / (300 * 300) < 1) return true;
    if (Math.abs(y - (2320 + Math.sin(x * 0.007) * 90)) < 75 && x < 1680) return true;
    if (x < 340) return true;
  }

  return false;
}

export function isBeachAt(x, y) {
  if (isWaterAt(x, y)) return false;
  const coastWave = Math.sin(y * 0.0045) * 42 + Math.cos(y * 0.011) * 18;
  if (x > 3140 + coastWave && x <= 3390 + coastWave && y > 400 && y < 2160) return true;
  for (const isl of ISLANDS) {
    const pad = 34;
    if (
      x >= isl.x && x <= isl.x + isl.w &&
      y >= isl.y && y <= isl.y + isl.h &&
      (x < isl.x + pad || x > isl.x + isl.w - pad || y < isl.y + pad || y > isl.y + isl.h - pad)
    ) {
      return true;
    }
  }
  return false;
}

export function getDistrictAt(x, y) {
  for (const d of DISTRICTS) {
    if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  }
  return DISTRICTS[3];
}

export function createWorld(seed = 1) {
  const rng = mulberry32(seed * 9973 + 17);
  const buildings = [];
  const trees = [];
  const props = [];
  const streetlights = [];
  const lilyPads = [];
  const pickups = [];

  // Handcrafted Landmarks & Enterable Interiors
  const interiors = [
    {
      id: 'safehouse',
      name: 'BAYSIDE SAFEHOUSE',
      badge: 'HIDEOUT',
      desc: 'Heal up, restock armor, save your game, or change disguises to shake police recognition.',
      x: 2070, y: 1650, w: 150, h: 110, doorX: 2145, doorY: 1776,
      wall: '#f5b79c', roof: '#3c2c4d', neon: '#ff9e6d', height: 68, style: 'pool',
    },
    {
      id: 'garage',
      name: 'SOLARA AUTO MOD GARAGE',
      badge: 'CUSTOMS & PLATES',
      desc: 'Repaint your ride, swap hot license plates to clear police tags, or bolt on a Twin-Turbo.',
      x: 1650, y: 1295, w: 185, h: 125, doorX: 1742, doorY: 1438,
      wall: '#7bdff2', roof: '#24314a', neon: '#00e5ff', height: 54, style: 'ac',
    },
    {
      id: 'boutique',
      name: 'DECO CHIC BOUTIQUE',
      badge: 'DISGUISES',
      desc: 'Switch outfits between Streetwear, Resort Suit, Club Neon, and Stealth Ops to drop witness heat.',
      x: 2635, y: 1300, w: 140, h: 110, doorX: 2705, doorY: 1428,
      wall: '#ff99c8', roof: '#46264f', neon: '#ff5eb8', height: 64, style: 'neon_sign',
    },
    {
      id: 'club',
      name: 'CLUB MIRAGE',
      badge: 'NIGHTCLUB',
      desc: 'Bayside Strip neon hotspot. Gather heist intel, boost your Solagram Clout, and slip away from tails.',
      x: 2620, y: 1620, w: 195, h: 135, doorX: 2718, doorY: 1772,
      wall: '#a864fd', roof: '#20133a', neon: '#ff3898', height: 92, style: 'neon_sign',
    },
    {
      id: 'bank',
      name: 'BAYSIDE FIRST BANK',
      badge: 'HIGH-SECURITY VAULT',
      desc: 'Marble Art Deco flagship bank on the Strip. Crack the vault with Marco & Elena for a massive score.',
      x: 2350, y: 1280, w: 200, h: 145, doorX: 2450, doorY: 1444,
      wall: '#f3e5c8', roof: '#3a344c', neon: '#ffd166', height: 128, style: 'helipad',
    },
    {
      id: 'mart',
      name: 'SOLARA CORNER MART',
      badge: 'QUICK STICKUP',
      desc: 'Highway convenience store in Solara Flats. Easy register cash — watch out for fast-responding patrol cars.',
      x: 2350, y: 600, w: 155, h: 100, doorX: 2428, doorY: 718,
      wall: '#ffbe76', roof: '#3b2e3c', neon: '#5ef29d', height: 42, style: 'ac',
    },
  ];

  for (const it of interiors) {
    buildings.push({
      x: it.x, y: it.y, w: it.w, h: it.h,
      height: it.height,
      wall: it.wall,
      roof: it.roof,
      neon: it.neon,
      style: it.style,
      label: it.name,
      interiorId: it.id,
    });
  }

  // Radio Tower landmark at Pineridge Overlook
  buildings.push({
    x: 610, y: 240, w: 96, h: 96,
    height: 165, wall: '#cfd8dc', roof: '#263238', neon: '#b967ff',
    style: 'tower', label: 'PINERIDGE TOWER',
  });

  // Harbor Point colorful shipping containers
  const containerColors = ['#ff595e', '#1982c4', '#ffca3a', '#2ec4b6', '#ff9f1c'];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const cx = 470 + col * 62;
      const cy = 1280 + row * 120;
      if (!isOnRoad(cx + 25, cy + 40, 20)) {
        buildings.push({
          x: cx, y: cy, w: 46, h: 92,
          height: 30,
          wall: containerColors[(row + col) % containerColors.length],
          roof: containerColors[(row + col) % containerColors.length],
          neon: null,
          style: 'container',
        });
      }
    }
  }

  // Procedural Art Deco skyscrapers, motels, villas & industrial warehouses
  const artDecoWalls = ['#ff9ebb', '#80ed99', '#72efdd', '#ffd6a5', '#cdb4db', '#a0c4ff', '#ffe5b4', '#f8edeb'];
  const artDecoRoofs = ['#2c2246', '#213547', '#3a2444', '#1d2d44', '#2e294e'];
  const artDecoNeons = ['#ff4d9d', '#00e5ff', '#ffd166', '#5ef29d', '#b967ff', '#ff7a3d'];

  const overlapsAny = (x, y, w, h, pad = 22) => {
    // Keep Bayside First Bank front plaza open for heist gunfights
    if (x < 2680 && x + w > 2280 && y < 1610 && y + h > 1425) return true;
    // Check road overlap
    for (let sx = x - pad; sx <= x + w + pad; sx += 35) {
      for (let sy = y - pad; sy <= y + h + pad; sy += 35) {
        if (isOnRoad(sx, sy, 14) || isWaterAt(sx, sy) || isBeachAt(sx, sy)) return true;
      }
    }
    for (const b of buildings) {
      if (x - pad < b.x + b.w && x + w + pad > b.x && y - pad < b.y + b.h && y + h + pad > b.y) {
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < 240; i++) {
    const bx = 460 + Math.floor(rng() * 2700);
    const by = 220 + Math.floor(rng() * 2550);
    const dist = getDistrictAt(bx, by);
    if (dist.id === 'cypress_marsh' && rng() < 0.85) continue;

    let bw = 90 + Math.floor(rng() * 110);
    let bh = 80 + Math.floor(rng() * 100);
    let height = 55 + Math.floor(rng() * 85);
    let wall = artDecoWalls[Math.floor(rng() * artDecoWalls.length)];
    let roof = artDecoRoofs[Math.floor(rng() * artDecoRoofs.length)];
    let neon = artDecoNeons[Math.floor(rng() * artDecoNeons.length)];
    let style = rng() < 0.25 ? 'pool' : rng() < 0.45 ? 'helipad' : rng() < 0.72 ? 'neon_sign' : 'ac';

    if (dist.id === 'bayside_strip') {
      height = 85 + Math.floor(rng() * 95);
    } else if (dist.id === 'solara_flats') {
      bw = 110 + Math.floor(rng() * 80);
      bh = 64 + Math.floor(rng() * 44);
      height = 36 + Math.floor(rng() * 28);
      wall = rng() < 0.5 ? '#f4c095' : '#ffe2b8';
      style = 'motel';
    } else if (dist.id === 'harbor_point') {
      bw = 120 + Math.floor(rng() * 90);
      bh = 85 + Math.floor(rng() * 70);
      height = 46 + Math.floor(rng() * 34);
      wall = '#8d99ae';
      roof = '#2b2d42';
      neon = rng() < 0.4 ? '#00e5ff' : null;
      style = 'ac';
    } else if (dist.id === 'pineridge') {
      bw = 74 + Math.floor(rng() * 52);
      bh = 68 + Math.floor(rng() * 46);
      height = 34 + Math.floor(rng() * 24);
      wall = '#c9a682';
      roof = '#3c4a3e';
      neon = null;
      style = 'ac';
    } else if (dist.id === 'coral_keys') {
      bw = 82 + Math.floor(rng() * 64);
      bh = 70 + Math.floor(rng() * 54);
      height = 44 + Math.floor(rng() * 45);
      style = rng() < 0.55 ? 'pool' : 'neon_sign';
    } else if (dist.id === 'cypress_marsh') {
      bw = 68;
      bh = 56;
      height = 28;
      wall = '#9e7b56';
      roof = '#3d332a';
      neon = null;
      style = 'ac';
    }

    if (!overlapsAny(bx, by, bw, bh, 22)) {
      buildings.push({ x: bx, y: by, w: bw, h: bh, height, wall, roof, neon, style });
    }
  }

  // Palm trees (Bayside, Coral Keys, Solara Flats), Pines (Pineridge), Cypress (Marsh)
  for (let i = 0; i < 290; i++) {
    const tx = 140 + rng() * (WORLD_W - 280);
    const ty = 140 + rng() * (WORLD_H - 280);
    if (isWaterAt(tx, ty) || isOnRoad(tx, ty, 24)) continue;
    let blocked = false;
    for (const b of buildings) {
      if (tx > b.x - 20 && tx < b.x + b.w + 20 && ty > b.y - 20 && ty < b.y + b.h + 20) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;
    const dist = getDistrictAt(tx, ty);
    const kind = dist.id === 'pineridge' ? 'pine' : dist.id === 'cypress_marsh' ? 'cypress' : 'palm';
    trees.push({
      x: tx,
      y: ty,
      kind,
      radius: 18 + rng() * 14,
      phase: rng() * Math.PI * 2,
    });
  }

  // Palm-lined beachfront boulevard along x = 3050..3120
  for (let y = 520; y < 2050; y += 110) {
    if (!isOnRoad(3060, y, 10)) {
      trees.push({ x: 3065, y, kind: 'palm', radius: 26, phase: y * 0.02 });
    }
  }

  // Beach umbrellas & towels along Bayside Beach
  const umbrellaColors = ['#ff4d6d', '#00e5ff', '#ffd166', '#ff9f1c', '#b967ff'];
  for (let i = 0; i < 42; i++) {
    const ux = 3190 + rng() * 155;
    const uy = 540 + rng() * 1540;
    if (isBeachAt(ux, uy)) {
      props.push({
        type: 'umbrella',
        x: ux,
        y: uy,
        color: umbrellaColors[i % umbrellaColors.length],
        angle: rng() * Math.PI * 2,
      });
    }
  }

  // Cypress Marsh lily pads
  for (let i = 0; i < 95; i++) {
    const lx = 180 + rng() * 1450;
    const ly = 2080 + rng() * 980;
    if (isMarshAt(lx, ly) && isWaterAt(lx, ly)) {
      lilyPads.push({
        x: lx,
        y: ly,
        r: 7 + rng() * 9,
        angle: rng() * Math.PI * 2,
        flower: rng() < 0.25,
      });
    }
  }

  // Streetlights along main avenues
  for (const rx of V_ROADS) {
    for (let y = 300; y < 2680; y += 220) {
      if (!isWaterAt(rx + ROAD_W * 0.56, y)) {
        streetlights.push({ x: rx + ROAD_W * 0.56, y, side: 1 });
      }
      if (!isWaterAt(rx - ROAD_W * 0.56, y)) {
        streetlights.push({ x: rx - ROAD_W * 0.56, y, side: -1 });
      }
    }
  }

  // 3 Hidden Mysteries across Solara Coast
  const mysteries = [
    {
      id: 'ufo',
      name: 'SWAMP UFO ANOMALY',
      district: 'Cypress Marsh',
      x: 920, y: 2610, r: 95,
      rewardCash: 3500, rewardClout: 1800,
      discovered: false,
      caption: 'UNREAL FOOTAGE!! Glowing craft hovering over Cypress Marsh while gators circle below!! #SolaraUFO',
    },
    {
      id: 'shipwreck',
      name: 'CORAL REEF SHIPWRECK',
      district: 'Coral Keys',
      x: 3680, y: 2220, r: 95,
      rewardCash: 4000, rewardClout: 1600,
      discovered: false,
      caption: 'Sunken gold galleon spotted right off Coral Keys marina! Divers are losing it! #SolaraCoast',
    },
    {
      id: 'beacon',
      name: 'GHOST RADIO BEACON',
      district: 'Pineridge Overlook',
      x: 660, y: 380, r: 90,
      rewardCash: 3000, rewardClout: 1500,
      discovered: false,
      caption: 'Creepy numbers broadcast hijacking Neon Synth FM from Pineridge Tower! #GhostBeacon',
    },
  ];

  // Street Pickups (Health, Armor, Cash, Weapons)
  const pickupDefs = [
    { x: 2150, y: 1520, kind: 'armor', value: 50 },
    { x: 2560, y: 1520, kind: 'health', value: 50 },
    { x: 2820, y: 1180, kind: 'cash', value: 650 },
    { x: 1120, y: 1480, kind: 'weapon', weaponIndex: 3, label: 'SHOTGUN' },
    { x: 1880, y: 840, kind: 'weapon', weaponIndex: 2, label: 'RAPID SMG' },
    { x: 2740, y: 2520, kind: 'weapon', weaponIndex: 4, label: 'ASSAULT RIFLE' },
    { x: 960, y: 2240, kind: 'health', value: 60 },
    { x: 640, y: 1560, kind: 'armor', value: 60 },
    { x: 3240, y: 1420, kind: 'cash', value: 800 },
  ];
  for (const p of pickupDefs) {
    pickups.push({ ...p, active: true, respawn: 0 });
  }

  return {
    width: WORLD_W,
    height: WORLD_H,
    buildings,
    interiors,
    trees,
    props,
    streetlights,
    lilyPads,
    mysteries,
    pickups,
    skidmarks: [],
  };
}

export function resolveBuildingCollision(world, x, y, radius) {
  let nx = Math.max(radius + 20, Math.min(world.width - radius - 20, x));
  let ny = Math.max(radius + 20, Math.min(world.height - radius - 20, y));
  let hit = false;

  for (const b of world.buildings) {
    const cx = Math.max(b.x, Math.min(nx, b.x + b.w));
    const cy = Math.max(b.y, Math.min(ny, b.y + b.h));
    const dx = nx - cx;
    const dy = ny - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      hit = true;
      const d = Math.sqrt(d2);
      if (d > 0.001) {
        const push = radius - d;
        nx += (dx / d) * push;
        ny += (dy / d) * push;
      } else {
        // Inside rect: push out along nearest edge
        const dl = Math.abs(nx - b.x);
        const dr = Math.abs(b.x + b.w - nx);
        const dt = Math.abs(ny - b.y);
        const db = Math.abs(b.y + b.h - ny);
        const m = Math.min(dl, dr, dt, db);
        if (m === dl) nx = b.x - radius;
        else if (m === dr) nx = b.x + b.w + radius;
        else if (m === dt) ny = b.y - radius;
        else ny = b.y + b.h + radius;
      }
    }
  }
  return { x: nx, y: ny, hit };
}

export function pointHitsBuilding(world, x, y) {
  for (const b of world.buildings) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}
