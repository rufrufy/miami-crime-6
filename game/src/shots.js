// Deterministic showcase scenes for ?shot=cover, ?shot=heist, ?shot=swamp, ?shot=start
// using the real Miami Crime 6 engine, world, vehicles, police, combat VFX, HUD, and renderer.
import { fireBullet, spawnExplosion } from './combat.js';
import { postSolagram, sayDialogue } from './social.js';
import { createVehicle } from './vehicles.js';

export function applyShotScene(state, shotName, ui) {
  const marco = state.heroes.marco;
  const elena = state.heroes.elena;

  if (shotName === 'cover') {
    // 1-cover.jpg: Golden-hour Bayside Strip coastal chase!
    state.mode = 'playing';
    state.timeIndex = 0; // Golden Hour
    state.time = 14.2;
    state.player.activeId = 'marco';
    state.player.cash = 14850;
    state.player.clout = 8400;
    state.wanted.level = 3;

    const heroCar = createVehicle('coupe', 2960, 1480, -Math.PI * 0.5, {
      color: '#ff3b8d',
      plate: 'SLR-606',
      hotPlate: true,
      turbo: true,
    });
    heroCar.speed = 420;
    heroCar.vx = 0;
    heroCar.vy = -420;
    heroCar.nitroActive = true;
    heroCar.nitro = 78;
    heroCar.driver = marco;
    heroCar.passenger = elena;
    marco.vehicle = heroCar;
    elena.vehicle = heroCar;
    marco.x = heroCar.x;
    marco.y = heroCar.y;
    elena.x = heroCar.x;
    elena.y = heroCar.y;
    state.vehicles.push(heroCar);

    // Pursuing SC-PD Interceptors with flashing red/blue lights
    const cop1 = createVehicle('police', 2925, 1620, -Math.PI * 0.46, { isPolice: true, sirenOn: true });
    cop1.speed = 380;
    const cop2 = createVehicle('police', 3005, 1675, -Math.PI * 0.55, { isPolice: true, sirenOn: true });
    cop2.speed = 370;
    const cop3 = createVehicle('swat', 2960, 1220, Math.PI * 0.5, { isPolice: true, sirenOn: true });
    state.vehicles.push(cop1, cop2, cop3);

    // Drift skidmarks behind hero coupe
    for (let k = 0; k < 28; k++) {
      state.world.skidmarks.push({
        x1: 2948 + Math.sin(k * 0.2) * 8,
        y1: 1510 + k * 7,
        x2: 2972 + Math.sin(k * 0.2) * 8,
        y2: 1510 + k * 7,
      });
    }

    state.camera.x = 3010;
    state.camera.y = 1490;
    state.missions.index = 4;
    state.missions.stage = 1;
    state.missions.marker = { x: 2145, y: 1776, label: 'SAFEHOUSE ESCAPE' };
    postSolagram(state, 'NEON COUPE drifting Bayside Strip at 100 MPH with 3-STAR SC-PD HEAT! #SolaraCoast', 450, '@bayside_watch');
    sayDialogue(state, 'MARCO', 'Hold tight, Elena — hitting nitro past the beachfront!');
    ui.showHUD();
  } else if (shotName === 'heist') {
    // 2-heist.jpg: On-foot dual-protagonist Bayside Bank heist shootout!
    state.mode = 'playing';
    state.timeIndex = 0; // Golden Hour
    state.time = 22.6;
    state.player.activeId = 'elena';
    state.player.weaponIndex = 4; // Assault Rifle
    state.player.cash = 52400;
    state.player.clout = 16200;
    state.wanted.level = 4;

    marco.vehicle = null;
    elena.vehicle = null;
    elena.x = 2430;
    elena.y = 1485;
    elena.angle = 0.25;
    marco.x = 2385;
    marco.y = 1525;
    marco.angle = 0.1;

    // Getaway muscle car parked outside bank
    const getaway = createVehicle('muscle', 2310, 1465, -0.2, { color: '#00e5ff', plate: 'HST-909', hotPlate: true });
    state.vehicles.push(getaway);

    // Police cruisers + SWAT van + officers + explosion + tracers
    state.vehicles.push(
      createVehicle('police', 2620, 1475, Math.PI, { isPolice: true, sirenOn: true }),
      createVehicle('swat', 2660, 1580, Math.PI * 0.92, { isPolice: true, sirenOn: true }),
    );
    state.police.officers = [
      { x: 2565, y: 1455, angle: Math.PI, hp: 55, maxHp: 55, swat: false, fireCd: 1, dead: false, walkCycle: 2 },
      { x: 2590, y: 1545, angle: Math.PI, hp: 85, maxHp: 85, swat: true, fireCd: 1, dead: false, walkCycle: 4 },
      { x: 2520, y: 1610, angle: -2.2, hp: 85, maxHp: 85, swat: true, fireCd: 1, dead: false, walkCycle: 1 },
    ];
    state.police.heli.active = true;
    state.police.heli.x = 2580;
    state.police.heli.y = 1365;
    state.police.heli.lightX = 2440;
    state.police.heli.lightY = 1495;

    // Add bright visible bullet tracers mid-air for dynamic heist action
    const addTracer = (x1, y1, x2, y2, color) => {
      state.combat.bullets.push({ prevX: x1, prevY: y1, x: x2, y: y2, vx: 0, vy: 0, color, damage: 0, team: 'player', life: 1 });
    };
    addTracer(elena.x + 16, elena.y + 4, elena.x + 115, elena.y + 12, '#6df2ff');
    addTracer(marco.x + 16, marco.y + 4, marco.x + 125, marco.y - 16, '#ffd166');
    addTracer(2555, 1460, 2465, 1474, '#ff5c8a');
    addTracer(2580, 1545, 2475, 1532, '#ff5c8a');
    fireBullet(state, elena.x + 14, elena.y + 4, 0.08, 25, 1100, '#6df2ff', 'player');
    fireBullet(state, marco.x + 14, marco.y + 4, -0.05, 22, 960, '#ffd166', 'player');
    spawnExplosion(state, 2610, 1505, 86);
    state.camera.shake = 0;

    state.camera.x = 2495;
    state.camera.y = 1500;
    state.missions.index = 5;
    state.missions.stage = 1;
    postSolagram(state, 'BAYSIDE FIRST BANK VAULT HIT!! Marco & Elena trading fire with SWAT! #MiamiCrime6', 900, '@solara_live');
    sayDialogue(state, 'ELENA', 'Vault bags secured! Cover my left flank, Marco — we’re taking the Muscle Car!');
    ui.showHUD();
  } else if (shotName === 'swamp') {
    // 3-swamp.jpg: Cypress Marsh speedboat, patrolling alligators & glowing Swamp UFO mystery!
    state.mode = 'playing';
    state.timeIndex = 0;
    state.time = 31.4;
    state.player.activeId = 'marco';
    state.player.cash = 9650;
    state.player.clout = 11400;
    state.wanted.level = 1;

    const boat = createVehicle('boat', 820, 2575, 0.12, { color: '#00e5ff', plate: 'KEY-777' });
    boat.speed = 320;
    boat.driver = marco;
    boat.passenger = elena;
    marco.vehicle = boat;
    elena.vehicle = boat;
    marco.x = boat.x;
    marco.y = boat.y;
    elena.x = boat.x;
    elena.y = boat.y;
    state.vehicles.push(boat);

    // Position 3 visible patrolling alligators around the lagoon & UFO
    state.wildlife.gators[0].x = 740;
    state.wildlife.gators[0].y = 2665;
    state.wildlife.gators[0].angle = -0.6;
    state.wildlife.gators[0].aggro = true;
    state.wildlife.gators[1].x = 1045;
    state.wildlife.gators[1].y = 2525;
    state.wildlife.gators[1].angle = 2.6;
    state.wildlife.gators[2].x = 955;
    state.wildlife.gators[2].y = 2720;
    state.wildlife.gators[2].angle = -1.9;

    state.camera.x = 890;
    state.camera.y = 2595;
    state.missions.index = 2;
    state.missions.stage = 1;
    state.missions.marker = { x: 880, y: 2540, label: 'MARSH CARGO 2/3' };
    postSolagram(state, 'UNREAL FOOTAGE!! Glowing UFO hovering over Cypress Marsh while gators lunge at a speedboat!! #SolaraUFO', 1800, '@marsh_hunter');
    sayDialogue(state, 'ELENA', 'Forget the cargo for a second — look at that glowing saucer above the marsh!');
    ui.showHUD();
  } else if (shotName === 'start') {
    // 4-start.jpg: Neon Night Solara Coast panorama behind sleek Start Screen overlay
    state.mode = 'title';
    state.timeIndex = 2; // Neon Night
    state.time = 19.5;
    state.wanted.level = 2;

    // Clear overlapping traffic near showcase zone & add crisp spaced neon vehicles
    state.vehicles = state.vehicles.filter((v) => Math.hypot(v.x - 2960, v.y - 1540) > 280);
    state.vehicles.push(
      createVehicle('coupe', 2936, 1410, -Math.PI * 0.5, { color: '#ff3b8d' }),
      createVehicle('muscle', 2986, 1545, -Math.PI * 0.5, { color: '#00e5ff' }),
      createVehicle('police', 2936, 1650, -Math.PI * 0.5, { isPolice: true, sirenOn: true }),
      createVehicle('coupe', 2780, 1180, 0, { color: '#ffd166' }),
    );
    state.camera.x = 2835;
    state.camera.y = 1515;
    ui.showStart(true);
  }
}
