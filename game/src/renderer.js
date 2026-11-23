// High-contrast 2.5D top-down Canvas renderer for Miami Crime 6 (Solara Coast).
import { OUTFITS, PROTAGONISTS, ROAD_W, TIME_PHASES, WORLD_H, WORLD_W } from './config.js';
import { BRIDGES, H_ROADS, ISLANDS, V_ROADS } from './world.js';

function shadeHex(hex, percent) {
  if (!hex || hex[0] !== '#') return hex || '#888';
  let num = parseInt(hex.slice(1), 16);
  let r = Math.min(255, Math.max(0, ((num >> 16) & 255) + percent));
  let g = Math.min(255, Math.max(0, ((num >> 8) & 255) + percent));
  let b = Math.min(255, Math.max(0, (num & 255) + percent));
  return `rgb(${r},${g},${b})`;
}

export function renderGame(ctx, state, width, height) {
  const cam = state.camera;
  const t = state.time;
  const phase = TIME_PHASES[state.timeIndex] || TIME_PHASES[0];

  const shakeX = cam.shake > 0.1 ? (Math.sin(t * 73) * cam.shake) : 0;
  const shakeY = cam.shake > 0.1 ? (Math.cos(t * 61) * cam.shake) : 0;
  const viewL = cam.x - width * 0.5 + shakeX;
  const viewT = cam.y - height * 0.5 + shakeY;
  const viewR = viewL + width;
  const viewB = viewT + height;

  ctx.save();
  ctx.translate(-viewL, -viewT);

  // 1. BASE TERRAIN & BIOMES
  drawTerrain(ctx, state, viewL, viewT, width, height, t);

  // 2. ROADS, BRIDGES, LANE MARKINGS & SKIDMARKS
  drawRoadsAndBridges(ctx, state);

  // 3. BEACH UMBRELLAS, LILY PADS, PICKUPS, INTERIORS & MISSION MARKER
  drawWorldDetails(ctx, state, viewL, viewT, viewR, viewB, t);

  // 4. VEHICLES
  for (const v of state.vehicles) {
    if (v.x < viewL - 120 || v.x > viewR + 120 || v.y < viewT - 120 || v.y > viewB + 120) continue;
    drawVehicle(ctx, v, phase.lights, t);
  }

  // 5. WILDLIFE (ALLIGATORS)
  for (const g of state.wildlife.gators) {
    if (g.dead) continue;
    if (g.x < viewL - 90 || g.x > viewR + 90 || g.y < viewT - 90 || g.y > viewB + 90) continue;
    drawAlligator(ctx, g, t);
  }

  // 6. CHARACTERS (PEDESTRIANS, ENEMIES, POLICE, MARCO & ELENA)
  for (const p of state.pedestrians) {
    if (p.dead || p.x < viewL - 50 || p.x > viewR + 50 || p.y < viewT - 50 || p.y > viewB + 50) continue;
    drawHuman(ctx, p.x, p.y, p.angle, p.shirt, '#2c3044', p.skin, p.hair, p.walkCycle, null, p.memory.state === 'filming');
  }
  for (const e of state.enemies) {
    if (e.dead || e.x < viewL - 50 || e.x > viewR + 50 || e.y < viewT - 50 || e.y > viewB + 50) continue;
    drawHuman(ctx, e.x, e.y, e.angle, '#c92a2a', '#1e1b24', '#d8a07a', '#1b1414', e.walkCycle, '#ffd166', false);
  }
  for (const cop of state.police.officers) {
    if (cop.dead || cop.x < viewL - 50 || cop.x > viewR + 50 || cop.y < viewT - 50 || cop.y > viewB + 50) continue;
    drawHuman(ctx, cop.x, cop.y, cop.angle, cop.swat ? '#1d2738' : '#254e8a', '#121a2a', '#ddb08b', '#141a24', cop.walkCycle, '#6df2ff', false, cop.swat ? 'swat' : 'cop');
  }

  const outfit = OUTFITS[state.player.outfitIndex] || OUTFITS[0];
  for (const id of ['marco', 'elena']) {
    const h = state.heroes[id];
    if (h.vehicle) continue;
    const spec = PROTAGONISTS[id];
    const shirt = id === 'marco' ? outfit.marcoShirt : outfit.elenaShirt;
    const isActive = state.player.activeId === id;
    drawHeroMarker(ctx, h.x, h.y, spec.accent, isActive, t);
    drawHuman(ctx, h.x, h.y, h.angle, shirt, outfit.pants, spec.skin, spec.hair, h.walkCycle, '#ffffff', false, id);
  }

  // 7. 2.5D PERSPECTIVE-EXTRUDED ART DECO BUILDINGS
  drawBuildings25D(ctx, state, cam.x, cam.y, viewL, viewT, viewR, viewB, phase.lights, t);

  // 8. SWAYING PALM TREES, PINES & CYPRESS CANOPIES
  drawTrees(ctx, state, viewL, viewT, viewR, viewB, t);

  // 9. HIDDEN MYSTERY EFFECTS (SWAMP UFO, SHIPWRECK, GHOST BEACON)
  drawMysteries(ctx, state, t);

  // 10. COMBAT VFX (BULLETS, EXPLOSIONS, PARTICLES, POPUPS)
  drawCombatVFX(ctx, state);

  // 11. COASTAL BIRDS & POLICE HELICOPTER + SEARCHLIGHT
  drawBirdsAndHeli(ctx, state, t);

  // 12. STREETLIGHT GLOW HALOS (SUNSET / NIGHT)
  if (phase.lights > 0.1) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const s of state.world.streetlights) {
      if (s.x < viewL - 100 || s.x > viewR + 100 || s.y < viewT - 100 || s.y > viewB + 100) continue;
      const g = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 64);
      g.addColorStop(0, `rgba(255, 195, 110, ${0.34 * phase.lights})`);
      g.addColorStop(0.5, `rgba(255, 120, 175, ${0.12 * phase.lights})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 64, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();

  // 13. ATMOSPHERIC TIME-OF-DAY COLOR GRADING & SUBTLE VIGNETTE
  ctx.fillStyle = phase.tint;
  ctx.fillRect(0, 0, width, height);

  if (state.timeIndex === 0) {
    // Golden hour warm coastal horizon glow from top-right
    const sunGrad = ctx.createLinearGradient(0, 0, width, height);
    sunGrad.addColorStop(0, 'rgba(255, 90, 140, 0.08)');
    sunGrad.addColorStop(0.55, 'rgba(255, 160, 80, 0.04)');
    sunGrad.addColorStop(1, 'rgba(30, 12, 60, 0.16)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, width, height);
  }

  const vig = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.34, width * 0.5, height * 0.5, width * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(8, 4, 20, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
}

function drawTerrain(ctx, state, viewL, viewT, width, height, t) {
  // Base tropical urban turf / concrete ground
  ctx.fillStyle = '#3b4f45';
  ctx.fillRect(viewL - 20, viewT - 20, width + 40, height + 40);

  // District turf tints
  // Pineridge Overlook (north-west pine hills)
  ctx.fillStyle = '#2d4c3b';
  ctx.fillRect(0, 0, 1700, 1050);
  // Topographic hill rings in Pineridge
  ctx.strokeStyle = 'rgba(130, 210, 145, 0.14)';
  ctx.lineWidth = 3;
  for (let r = 120; r <= 420; r += 85) {
    ctx.beginPath();
    ctx.ellipse(660, 320, r * 1.35, r * 0.85, 0.1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Solara Flats (sun-baked motel desert-coastal strip)
  ctx.fillStyle = '#5c5548';
  ctx.fillRect(1700, 0, 2500, 1050);

  // Harbor Point (industrial concrete docks)
  ctx.fillStyle = '#474f5c';
  ctx.fillRect(0, 1050, 1400, 950);

  // Bayside Strip (urban sidewalk blocks & tropical greenery)
  ctx.fillStyle = '#3d4c53';
  ctx.fillRect(1400, 1050, 2000, 1050);

  // Cypress Marsh (deep mossy wetlands)
  ctx.fillStyle = '#214032';
  ctx.fillRect(0, 2000, 1800, 1200);

  // Eastern & Southern Turquoise Ocean
  const oceanGrad = ctx.createLinearGradient(3200, 0, 4200, 0);
  oceanGrad.addColorStop(0, '#00c4d4');
  oceanGrad.addColorStop(0.45, '#0096c7');
  oceanGrad.addColorStop(1, '#023e8a');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(3340, 0, 900, 2240);
  ctx.fillRect(1760, 2140, 2460, 1080);

  // Harbor Point shipping basin water
  ctx.fillStyle = '#0e5b78';
  ctx.fillRect(0, 1020, 420, 1040);

  // Cypress Marsh murky emerald waterways
  ctx.fillStyle = '#124a42';
  ctx.beginPath();
  ctx.ellipse(940, 2580, 520, 300, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(0, 2000, 340, 1200);
  ctx.lineWidth = 148;
  ctx.strokeStyle = '#124a42';
  ctx.beginPath();
  for (let x = 220; x <= 1700; x += 60) {
    const y = 2320 + Math.sin(x * 0.007) * 90;
    if (x === 220) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Animated turquoise ocean wave shimmer lines
  ctx.strokeStyle = 'rgba(180, 252, 255, 0.25)';
  ctx.lineWidth = 2.5;
  for (let wy = 180; wy < 3050; wy += 95) {
    const off = Math.sin(t * 1.4 + wy * 0.02) * 26;
    ctx.beginPath();
    ctx.moveTo(3460 + off, wy);
    ctx.quadraticCurveTo(3540 + off, wy - 14, 3620 + off, wy);
    ctx.stroke();
  }

  // Bayside Golden Sandy Beach & animated surf foam
  ctx.fillStyle = '#f2d399';
  ctx.beginPath();
  ctx.moveTo(3130, 380);
  for (let y = 380; y <= 2160; y += 50) {
    const wave = Math.sin(y * 0.0045) * 42 + Math.cos(y * 0.011) * 18;
    ctx.lineTo(3380 + wave, y);
  }
  ctx.lineTo(3130, 2160);
  ctx.closePath();
  ctx.fill();

  // White surf foam line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let y = 390; y <= 2150; y += 40) {
    const wave = Math.sin(y * 0.0045) * 42 + Math.cos(y * 0.011) * 18 + Math.sin(t * 2.4 + y * 0.03) * 6;
    if (y === 390) ctx.moveTo(3380 + wave, y);
    else ctx.lineTo(3380 + wave, y);
  }
  ctx.stroke();

  // Coral Keys Tropical Islands
  for (const isl of ISLANDS) {
    // Sand ring
    ctx.fillStyle = '#f2d399';
    roundRect(ctx, isl.x, isl.y, isl.w, isl.h, 64);
    ctx.fill();
    // Lush island interior
    ctx.fillStyle = '#3e6e58';
    roundRect(ctx, isl.x + 28, isl.y + 28, isl.w - 56, isl.h - 56, 44);
    ctx.fill();
  }
}

function drawRoadsAndBridges(ctx, state) {
  // Sidewalk borders
  ctx.fillStyle = '#757d8a';
  for (const rx of V_ROADS) {
    const maxY = rx === 740 ? 2040 : rx === 2960 ? 2700 : 2840;
    ctx.fillRect(rx - ROAD_W * 0.5 - 12, 180, ROAD_W + 24, maxY - 180);
  }
  for (const ry of H_ROADS) {
    const minX = ry === 2520 ? 1400 : 380;
    ctx.fillRect(minX, ry - ROAD_W * 0.5 - 12, 3120 - minX, ROAD_W + 24);
  }

  // Crisp Asphalt Surface
  ctx.fillStyle = '#252836';
  for (const rx of V_ROADS) {
    const maxY = rx === 740 ? 2040 : rx === 2960 ? 2700 : 2840;
    ctx.fillRect(rx - ROAD_W * 0.5, 180, ROAD_W, maxY - 180);
  }
  for (const ry of H_ROADS) {
    const minX = ry === 2520 ? 1400 : 380;
    ctx.fillRect(minX, ry - ROAD_W * 0.5, 3120 - minX, ROAD_W);
  }

  // Wooden boat dock extending into Cypress Marsh lagoon
  ctx.fillStyle = '#6e4c34';
  ctx.fillRect(700, 2040, 80, 128);
  ctx.strokeStyle = '#4a3120';
  ctx.lineWidth = 2;
  for (let dy = 2050; dy < 2166; dy += 12) {
    ctx.beginPath();
    ctx.moveTo(700, dy);
    ctx.lineTo(780, dy);
    ctx.stroke();
  }

  // Bridges over Coral Keys water
  for (const b of BRIDGES) {
    ctx.fillStyle = '#8b95a5';
    ctx.fillRect(b.x - 10, b.y - 4, b.w + 20, b.h + 8);
    ctx.fillStyle = '#2a2e3f';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    // Neon bridge railings
    ctx.fillStyle = '#00e5ff';
    if (b.dir === 'v') {
      ctx.fillRect(b.x - 6, b.y, 4, b.h);
      ctx.fillRect(b.x + b.w + 2, b.y, 4, b.h);
    } else {
      ctx.fillRect(b.x, b.y - 6, b.w, 4);
      ctx.fillRect(b.x, b.y + b.h + 2, b.w, 4);
    }
  }

  // Dashed yellow centerlines
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.setLineDash([22, 18]);
  for (const rx of V_ROADS) {
    const maxY = rx === 740 ? 2020 : rx === 2960 ? 2680 : 2820;
    ctx.beginPath();
    ctx.moveTo(rx, 200);
    ctx.lineTo(rx, maxY);
    ctx.stroke();
  }
  for (const ry of H_ROADS) {
    const minX = ry === 2520 ? 1420 : 400;
    ctx.beginPath();
    ctx.moveTo(minX, ry);
    ctx.lineTo(3100, ry);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Crosswalks at intersections
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (const rx of V_ROADS) {
    for (const ry of H_ROADS) {
      if (ry === 2520 && rx < 1400) continue;
      for (let k = -40; k <= 40; k += 16) {
        ctx.fillRect(rx + k - 3, ry - ROAD_W * 0.5 - 10, 6, 12);
        ctx.fillRect(rx + k - 3, ry + ROAD_W * 0.5 - 2, 6, 12);
      }
    }
  }

  // Tire skidmarks
  ctx.strokeStyle = 'rgba(12, 10, 18, 0.45)';
  ctx.lineWidth = 4;
  for (const s of state.world.skidmarks) {
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x1 + 3, s.y1 + 3);
    ctx.moveTo(s.x2, s.y2);
    ctx.lineTo(s.x2 + 3, s.y2 + 3);
    ctx.stroke();
  }
}

function drawWorldDetails(ctx, state, viewL, viewT, viewR, viewB, t) {
  // Marsh Lily Pads
  for (const lp of state.world.lilyPads) {
    if (lp.x < viewL - 30 || lp.x > viewR + 30 || lp.y < viewT - 30 || lp.y > viewB + 30) continue;
    ctx.fillStyle = '#2f9e44';
    ctx.beginPath();
    ctx.arc(lp.x, lp.y, lp.r, lp.angle + 0.3, lp.angle + Math.PI * 2 - 0.3);
    ctx.lineTo(lp.x, lp.y);
    ctx.fill();
    if (lp.flower) {
      ctx.fillStyle = '#ff8fab';
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Beach Umbrellas & Towels
  for (const p of state.world.props) {
    if (p.x < viewL - 40 || p.x > viewR + 40 || p.y < viewT - 40 || p.y > viewB + 40) continue;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    // Towel
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(-16, 10, 24, 11);
    // Umbrella shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.arc(5, 5, 16, 0, Math.PI * 2);
    ctx.fill();
    // Umbrella canopy
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 16, 0, Math.PI / 2);
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 16, Math.PI, Math.PI * 1.5);
    ctx.fill();
    ctx.restore();
  }

  // Enterable Interior Doorway Markers
  const pulse = 0.75 + Math.sin(t * 4.5) * 0.25;
  for (const it of state.world.interiors) {
    ctx.save();
    ctx.strokeStyle = it.neon;
    ctx.lineWidth = 3;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(it.doorX, it.doorY, 20 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = it.neon;
    ctx.globalAlpha = 0.22;
    ctx.fill();
    ctx.restore();
  }

  // Pickups
  for (const pk of state.world.pickups) {
    if (!pk.active) continue;
    const bob = Math.sin(t * 5 + pk.x) * 3;
    const col = pk.kind === 'health' ? '#5ef29d' : pk.kind === 'armor' ? '#00e5ff' : pk.kind === 'cash' ? '#ffd166' : '#ff5eb8';
    ctx.save();
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y + bob, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d0a1a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const sym = pk.kind === 'health' ? '+' : pk.kind === 'armor' ? 'A' : pk.kind === 'cash' ? '$' : 'W';
    ctx.fillText(sym, pk.x, pk.y + bob + 1);
    ctx.restore();
  }

  // Active Mission Gold Beacon Ring
  if (state.missions.marker) {
    const mk = state.missions.marker;
    ctx.save();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(mk.x, mk.y, 34 + Math.sin(t * 5) * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 209, 102, 0.22)';
    ctx.fill();
    ctx.restore();
  }
}

function drawVehicle(ctx, v, lightsStrength, t) {
  ctx.save();
  ctx.translate(v.x, v.y);
  ctx.rotate(v.angle);

  const L = v.h; // length along local X
  const W = v.w; // width along local Y

  // Boat water wake foam
  if (v.boat && v.speed > 40) {
    ctx.strokeStyle = 'rgba(220, 252, 255, 0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-L * 0.5, -W * 0.3);
    ctx.lineTo(-L * 0.5 - 32, -W * 0.75);
    ctx.moveTo(-L * 0.5, W * 0.3);
    ctx.lineTo(-L * 0.5 - 32, W * 0.75);
    ctx.stroke();
  }

  // Headlight cones (golden hour & night)
  if (lightsStrength > 0.15 && !v.dead) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cone = ctx.createLinearGradient(L * 0.45, 0, L * 0.45 + 150, 0);
    cone.addColorStop(0, `rgba(255, 244, 195, ${0.42 * lightsStrength})`);
    cone.addColorStop(1, 'rgba(255, 244, 195, 0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(L * 0.45, -W * 0.32);
    ctx.lineTo(L * 0.45 + 150, -W * 1.45);
    ctx.lineTo(L * 0.45 + 150, W * 1.45);
    ctx.lineTo(L * 0.45, W * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Ground Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  roundRect(ctx, -L * 0.5 + 4, -W * 0.5 + 5, L, W, v.boat ? 14 : 7);
  ctx.fill();

  // Wheels (for land vehicles)
  if (!v.boat) {
    ctx.fillStyle = '#11131a';
    ctx.fillRect(L * 0.2, -W * 0.5 - 2, 11, 4);
    ctx.fillRect(L * 0.2, W * 0.5 - 2, 11, 4);
    ctx.fillRect(-L * 0.35, -W * 0.5 - 2, 11, 4);
    ctx.fillRect(-L * 0.35, W * 0.5 - 2, 11, 4);
  }

  // Main Chassis
  ctx.fillStyle = v.dead ? '#2b2d34' : v.color;
  if (v.boat) {
    ctx.beginPath();
    ctx.moveTo(L * 0.56, 0);
    ctx.quadraticCurveTo(L * 0.25, -W * 0.54, -L * 0.5, -W * 0.48);
    ctx.lineTo(-L * 0.5, W * 0.48);
    ctx.quadraticCurveTo(L * 0.25, W * 0.54, L * 0.56, 0);
    ctx.closePath();
    ctx.fill();
    // Boat deck stripe
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(-L * 0.35, -W * 0.14, L * 0.65, W * 0.28);
  } else {
    roundRect(ctx, -L * 0.5, -W * 0.5, L, W, 7);
    ctx.fill();

    // Police white doors + hood stripe
    if (v.type === 'police') {
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(-L * 0.16, -W * 0.48, L * 0.32, W * 0.96);
    } else if (v.type === 'taxi') {
      ctx.fillStyle = '#111';
      ctx.fillRect(-L * 0.1, -W * 0.48, L * 0.18, W * 0.96);
    } else if (v.type === 'coupe' || v.type === 'muscle') {
      // Racing twin stripes
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(-L * 0.45, -4, L * 0.9, 3);
      ctx.fillRect(-L * 0.45, 2, L * 0.9, 3);
    }

    // Windshield & rear glass
    ctx.fillStyle = '#151b2e';
    roundRect(ctx, L * 0.05, -W * 0.38, L * 0.22, W * 0.76, 3);
    ctx.fill();
    roundRect(ctx, -L * 0.32, -W * 0.34, L * 0.16, W * 0.68, 3);
    ctx.fill();

    // Headlights & Taillights
    ctx.fillStyle = '#fff5c0';
    ctx.fillRect(L * 0.46, -W * 0.38, 3, 6);
    ctx.fillRect(L * 0.46, W * 0.38 - 6, 3, 6);
    ctx.fillStyle = '#ff2a55';
    ctx.fillRect(-L * 0.5, -W * 0.38, 3, 7);
    ctx.fillRect(-L * 0.5, W * 0.38 - 7, 3, 7);
  }

  // Nitro exhaust flame!
  if (v.nitroActive) {
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(-L * 0.5, -6);
    ctx.lineTo(-L * 0.5 - 24 - Math.random() * 12, 0);
    ctx.lineTo(-L * 0.5, 6);
    ctx.fill();
  }

  // Police flashing red/blue lightbar + glow halo
  if (v.siren) {
    const flash = Math.floor(t * 10) % 2 === 0;
    ctx.fillStyle = flash ? '#ff2a55' : '#00d2ff';
    ctx.fillRect(-4, -W * 0.34, 8, W * 0.34);
    ctx.fillStyle = flash ? '#00d2ff' : '#ff2a55';
    ctx.fillRect(-4, 0, 8, W * 0.34);

    if (v.sirenOn) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, flash ? -8 : 8, 2, 0, flash ? -8 : 8, 52);
      g.addColorStop(0, flash ? 'rgba(255, 42, 85, 0.72)' : 'rgba(0, 210, 255, 0.72)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, flash ? -8 : 8, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawHeroMarker(ctx, x, y, color, isActive, t) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = isActive ? 2.5 : 1.5;
  ctx.globalAlpha = isActive ? 0.85 : 0.45;
  ctx.beginPath();
  ctx.arc(x, y, isActive ? 18 + Math.sin(t * 6) * 2 : 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHuman(ctx, x, y, angle, shirt, pants, skin, hair, walkCycle, gunColor, filming = false, badge = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Soft shadow
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(2, 4, 11, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Animated feet
  const stride = Math.sin(walkCycle) * 4;
  ctx.fillStyle = pants;
  ctx.fillRect(-3 + stride, -7, 7, 5);
  ctx.fillRect(-3 - stride, 2, 7, 5);

  // Torso / shoulders
  ctx.fillStyle = shirt;
  roundRect(ctx, -6, -10, 12, 20, 5);
  ctx.fill();

  // Held weapon or filming phone
  if (filming) {
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(7, 2, 5, 8);
  } else if (gunColor) {
    ctx.fillStyle = '#1b1d28';
    ctx.fillRect(4, 2, 13, 4);
    ctx.fillStyle = gunColor;
    ctx.fillRect(14, 3, 4, 2);
  }

  // Head
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
  ctx.fill();

  // Hair or Police/SWAT helmet
  ctx.fillStyle = badge === 'swat' ? '#101824' : badge === 'cop' ? '#1c3b70' : hair;
  ctx.beginPath();
  ctx.arc(-1.5, 0, 6.2, Math.PI * 0.45, Math.PI * 1.55);
  ctx.fill();

  ctx.restore();
}

function drawAlligator(ctx, g, t) {
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.angle);

  const sway = Math.sin(g.swimPhase) * 5;
  // Water ripples around gator
  ctx.strokeStyle = 'rgba(180, 255, 220, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 34 + Math.sin(t * 4 + g.id) * 3, 14, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Articulated tail
  ctx.fillStyle = '#2b5930';
  ctx.beginPath();
  ctx.moveTo(-14, -6);
  ctx.lineTo(-42, sway);
  ctx.lineTo(-14, 6);
  ctx.closePath();
  ctx.fill();

  // Legs
  ctx.fillStyle = '#386e3d';
  ctx.fillRect(-10, -13, 8, 6);
  ctx.fillRect(-10, 7, 8, 6);
  ctx.fillRect(6, -12, 8, 6);
  ctx.fillRect(6, 6, 8, 6);

  // Body + armored back ridges
  ctx.fillStyle = '#346638';
  roundRect(ctx, -18, -9, 34, 18, 7);
  ctx.fill();
  ctx.fillStyle = '#1e3d21';
  for (let rx = -12; rx <= 8; rx += 6) {
    ctx.fillRect(rx, -4, 3, 8);
  }

  // Snout + snapping jaw
  ctx.fillStyle = '#3d7a42';
  roundRect(ctx, 12, -6, 18, 12, 5);
  ctx.fill();

  // Glowing yellow eyes when aggro
  ctx.fillStyle = g.aggro ? '#ffd166' : '#a9e34b';
  ctx.beginPath();
  ctx.arc(14, -4, 2, 0, Math.PI * 2);
  ctx.arc(14, 4, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBuildings25D(ctx, state, camX, camY, viewL, viewT, viewR, viewB, lightsStrength, t) {
  // Sort buildings back-to-front by distance from camera so tall rooftops layer cleanly
  const visible = [];
  for (const b of state.world.buildings) {
    if (b.x + b.w < viewL - 140 || b.x > viewR + 140 || b.y + b.h < viewT - 140 || b.y > viewB + 140) continue;
    const cx = b.x + b.w * 0.5;
    const cy = b.y + b.h * 0.5;
    const dist2 = (cx - camX) * (cx - camX) + (cy - camY) * (cy - camY);
    visible.push({ b, cx, cy, dist2 });
  }
  visible.sort((a, b) => b.dist2 - a.dist2);

  for (const { b, cx, cy } of visible) {
    const scale = b.height * 0.0022;
    const ox = Math.max(-75, Math.min(75, (cx - camX) * scale));
    const oy = Math.max(-75, Math.min(75, (cy - camY) * scale));

    const rx = b.x + ox;
    const ry = b.y + oy;

    // Ground drop shadow
    ctx.fillStyle = 'rgba(10, 6, 22, 0.34)';
    ctx.fillRect(b.x + 12, b.y + 14, b.w, b.h);

    // 3D Extruded Side Walls (quad polygons connecting base corners to roof corners)
    const wallDark = shadeHex(b.wall, -38);
    const wallMid = shadeHex(b.wall, -16);

    // South wall
    if (oy < 0) {
      drawQuad(ctx, b.x, b.y + b.h, b.x + b.w, b.y + b.h, rx + b.w, ry + b.h, rx, ry + b.h, wallDark);
      drawWallWindows(ctx, b.x, b.y + b.h, b.x + b.w, b.y + b.h, rx + b.w, ry + b.h, rx, ry + b.h, lightsStrength);
    }
    // North wall
    if (oy > 0) {
      drawQuad(ctx, b.x, b.y, b.x + b.w, b.y, rx + b.w, ry, rx, ry, wallMid);
      drawWallWindows(ctx, b.x, b.y, b.x + b.w, b.y, rx + b.w, ry, rx, ry, lightsStrength);
    }
    // East wall
    if (ox < 0) {
      drawQuad(ctx, b.x + b.w, b.y, b.x + b.w, b.y + b.h, rx + b.w, ry + b.h, rx + b.w, ry, wallDark);
      drawWallWindows(ctx, b.x + b.w, b.y, b.x + b.w, b.y + b.h, rx + b.w, ry + b.h, rx + b.w, ry, lightsStrength);
    }
    // West wall
    if (ox > 0) {
      drawQuad(ctx, b.x, b.y, b.x, b.y + b.h, rx, ry + b.h, rx, ry, wallMid);
      drawWallWindows(ctx, b.x, b.y, b.x, b.y + b.h, rx, ry + b.h, rx, ry, lightsStrength);
    }

    // Rooftop base
    ctx.fillStyle = b.roof;
    ctx.fillRect(rx, ry, b.w, b.h);
    ctx.strokeStyle = b.neon || 'rgba(255,255,255,0.2)';
    ctx.lineWidth = b.neon ? 2.5 : 1.5;
    ctx.strokeRect(rx + 1, ry + 1, b.w - 2, b.h - 2);

    // Rooftop Details
    if (b.style === 'pool') {
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(rx + 16, ry + 16, Math.max(24, b.w - 32), Math.max(20, b.h - 32));
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(rx + 22, ry + 22, Math.max(10, b.w - 54), 5);
    } else if (b.style === 'helipad') {
      const hcx = rx + b.w * 0.5;
      const hcy = ry + b.h * 0.5;
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hcx, hcy, Math.min(b.w, b.h) * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', hcx, hcy + 1);
    } else if (b.style === 'container') {
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      for (let sy = ry + 10; sy < ry + b.h - 6; sy += 12) {
        ctx.beginPath();
        ctx.moveTo(rx + 4, sy);
        ctx.lineTo(rx + b.w - 4, sy);
        ctx.stroke();
      }
    } else if (b.style === 'tower') {
      const tcx = rx + b.w * 0.5;
      const tcy = ry + b.h * 0.5;
      ctx.strokeStyle = '#ff3864';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tcx, tcy, 16 + Math.sin(t * 5) * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ff3864';
      ctx.beginPath();
      ctx.arc(tcx, tcy, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // AC units & skylight
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(rx + 12, ry + 12, 22, 16);
      ctx.fillRect(rx + b.w - 34, ry + b.h - 28, 20, 14);
    }

    // Glowing Neon Trim & Landmark Label
    if (b.neon && lightsStrength > 0.2) {
      ctx.save();
      ctx.shadowColor = b.neon;
      ctx.shadowBlur = 14 * lightsStrength;
      ctx.strokeStyle = b.neon;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(rx + 2, ry + 2, b.w - 4, b.h - 4);
      ctx.restore();
    }

    if (b.label) {
      ctx.fillStyle = 'rgba(12, 8, 26, 0.8)';
      ctx.fillRect(rx + 6, ry + b.h - 22, b.w - 12, 17);
      ctx.fillStyle = b.neon || '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, rx + b.w * 0.5, ry + b.h - 13);
    }
  }
}

function drawQuad(ctx, x1, y1, x2, y2, x3, y3, x4, y4, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.lineTo(x4, y4);
  ctx.closePath();
  ctx.fill();
}

function drawWallWindows(ctx, x1, y1, x2, y2, x3, y3, x4, y4, lightsStrength) {
  // Draw glowing architectural window bands along the extruded facade
  ctx.strokeStyle = lightsStrength > 0.2 ? `rgba(255, 240, 175, ${0.32 + lightsStrength * 0.28})` : 'rgba(24, 34, 52, 0.35)';
  ctx.lineWidth = 2;
  for (let f = 0.25; f <= 0.78; f += 0.26) {
    const ax = x1 + (x4 - x1) * f;
    const ay = y1 + (y4 - y1) * f;
    const bx = x2 + (x3 - x2) * f;
    const by = y2 + (y3 - y2) * f;
    ctx.setLineDash([8, 7]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawTrees(ctx, state, viewL, viewT, viewR, viewB, t) {
  for (const tr of state.world.trees) {
    if (tr.x < viewL - 60 || tr.x > viewR + 60 || tr.y < viewT - 60 || tr.y > viewB + 60) continue;
    const sway = Math.sin(t * 1.8 + tr.phase) * 3;
    ctx.save();
    ctx.translate(tr.x, tr.y);

    // Soft tree shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.arc(8, 10, tr.radius * 0.85, 0, Math.PI * 2);
    ctx.fill();

    if (tr.kind === 'palm') {
      // 7 swaying tropical palm fronds
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + sway * 0.03;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = i % 2 === 0 ? '#2ec46b' : '#1fa358';
        ctx.beginPath();
        ctx.ellipse(tr.radius * 0.58, 0, tr.radius * 0.62, tr.radius * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#5c4033';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (tr.kind === 'pine') {
      ctx.fillStyle = '#1f5e3b';
      ctx.beginPath();
      ctx.arc(sway * 0.3, 0, tr.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2d7a4f';
      ctx.beginPath();
      ctx.arc(sway * 0.5, 0, tr.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cypress Marsh mossy tree
      ctx.fillStyle = '#2b5e43';
      ctx.beginPath();
      ctx.arc(sway * 0.4, 0, tr.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4c8c5e';
      ctx.beginPath();
      ctx.arc(sway * 0.5, -2, tr.radius * 0.58, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawMysteries(ctx, state, t) {
  for (const m of state.world.mysteries) {
    ctx.save();
    ctx.translate(m.x, m.y);
    if (m.id === 'ufo') {
      // Hovering Swamp UFO with emerald tractor beam rings!
      ctx.globalCompositeOperation = 'lighter';
      const beam = ctx.createRadialGradient(0, 0, 12, 0, 0, 92);
      beam.addColorStop(0, 'rgba(80, 255, 190, 0.58)');
      beam.addColorStop(0.55, 'rgba(0, 229, 255, 0.26)');
      beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.arc(0, 0, 92, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Saucer hull
      ctx.fillStyle = '#3b4a5e';
      ctx.beginPath();
      ctx.ellipse(0, Math.sin(t * 3) * 4, 34, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#72efdd';
      ctx.beginPath();
      ctx.arc(0, Math.sin(t * 3) * 4, 13, 0, Math.PI * 2);
      ctx.fill();
      // Rotating rim lights
      for (let i = 0; i < 6; i++) {
        const a = t * 2.5 + (i / 6) * Math.PI * 2;
        ctx.fillStyle = i % 2 === 0 ? '#5ef29d' : '#00e5ff';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 25, Math.sin(a) * 16 + Math.sin(t * 3) * 4, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (m.id === 'shipwreck') {
      ctx.fillStyle = 'rgba(40, 25, 15, 0.6)';
      ctx.rotate(0.4);
      ctx.fillRect(-38, -14, 76, 28);
      ctx.strokeStyle = 'rgba(255, 215, 100, 0.65)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 26 + Math.sin(t * 3) * 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (m.id === 'beacon') {
      ctx.strokeStyle = 'rgba(185, 103, 255, 0.72)';
      ctx.lineWidth = 3;
      for (let r = 20; r <= 75; r += 25) {
        ctx.beginPath();
        ctx.arc(0, 0, (r + t * 28) % 85, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawCombatVFX(ctx, state) {
  // Bullet tracers
  ctx.lineWidth = 3;
  for (const b of state.combat.bullets) {
    ctx.strokeStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(b.prevX, b.prevY);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // Particles
  for (const p of state.combat.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Explosion shockwaves
  for (const ex of state.combat.explosions) {
    const a = ex.life / ex.maxLife;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(ex.x, ex.y, 4, ex.x, ex.y, ex.r);
    g.addColorStop(0, `rgba(255, 250, 190, ${a})`);
    g.addColorStop(0.5, `rgba(255, 105, 50, ${a * 0.85})`);
    g.addColorStop(1, 'rgba(255, 40, 90, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Floating Cash / Clout Popups
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  for (const pop of state.combat.popups) {
    ctx.globalAlpha = Math.min(1, pop.life);
    ctx.fillStyle = '#0a0714';
    ctx.fillText(pop.text, pop.x + 1, pop.y + 1);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y);
  }
  ctx.globalAlpha = 1;
}

function drawBirdsAndHeli(ctx, state, t) {
  // Pelicans / Seagulls
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  for (const b of state.wildlife.birds) {
    const wing = Math.sin(b.flap) * b.size;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    ctx.beginPath();
    ctx.moveTo(-b.size, -wing);
    ctx.quadraticCurveTo(0, -3, b.size, 0);
    ctx.quadraticCurveTo(0, 3, -b.size, wing);
    ctx.stroke();
    ctx.restore();
  }

  // 4-5 Star Police Helicopter & Searchlight Cone
  const heli = state.police.heli;
  if (heli.active) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const sg = ctx.createRadialGradient(heli.lightX, heli.lightY, 10, heli.lightX, heli.lightY, 115);
    sg.addColorStop(0, 'rgba(220, 245, 255, 0.45)');
    sg.addColorStop(1, 'rgba(0, 210, 255, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(heli.lightX, heli.lightY, 115, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(heli.x, heli.y);
    ctx.rotate(heli.angle);
    ctx.fillStyle = '#182236';
    roundRect(ctx, -26, -11, 46, 22, 8);
    ctx.fill();
    ctx.fillRect(-48, -3, 24, 6);
    // Spinning rotor blades
    ctx.rotate(heli.rotor);
    ctx.strokeStyle = 'rgba(220, 235, 255, 0.72)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.lineTo(42, 0);
    ctx.moveTo(0, -42);
    ctx.lineTo(0, 42);
    ctx.stroke();
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
