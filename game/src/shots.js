// Deterministic 3D showcase scenes for ?shot=cover, ?shot=heist, ?shot=swamp, ?shot=start
// using the real Three.js 3D renderer, live world, vehicles, police, combat VFX, and HUD.
import { fireBullet, spawnExplosion } from './combat.js';
import { postSolagram, sayDialogue } from './social.js';
import { createVehicle } from './vehicles.js';

export function applyShotScene(state, shotName, ui) {
  const marco = state.heroes.marco;
  const elena = state.heroes.elena;

  if (shotName === 'cover') {
    // 1-cover.jpg: 3D Behind-the-Car Golden-Hour Coastal Chase down Bayside Strip!
    state.mode = 'playing';
    state.timeIndex = 0; // Golden Hour
    state.time = 14.2;
    state.player.activeId = 'marco';
    state.player.cash = 14850;
    state.player.clout = 8400;
    state.wanted.level = 3;

    state.vehicles = state.vehicles.filter((v) => Math.hypot(v.x - 2960, v.y - 1460) > 380);

    // Marco's magenta nitro GT coupe front-and-center in classic GTA chase framing!
    const heroCar = createVehicle('coupe', 2956, 1525, -Math.PI * 0.5, {
      color: '#ff3b8d',
      plate: 'SLR-606',
      hotPlate: true,
      turbo: true,
    });
    heroCar.speed = 460;
    heroCar.vx = 0;
    heroCar.vy = -460;
    heroCar.nitroActive = true;
    heroCar.nitro = 82;
    heroCar.driver = marco;
    heroCar.passenger = elena;
    marco.vehicle = heroCar;
    elena.vehicle = heroCar;
    marco.x = heroCar.x;
    marco.y = heroCar.y;
    elena.x = heroCar.x;
    elena.y = heroCar.y;
    state.vehicles.push(heroCar);

    // Pursuing SC-PD Interceptors flanking closely + cyan sports car ahead
    const cop1 = createVehicle('police', 2912, 1565, -Math.PI * 0.45, { isPolice: true, sirenOn: true });
    cop1.speed = 420;
    const cop2 = createVehicle('police', 3000, 1580, -Math.PI * 0.55, { isPolice: true, sirenOn: true });
    cop2.speed = 410;
    const aheadCar = createVehicle('coupe', 2982, 1340, -Math.PI * 0.5, { color: '#00e5ff' });
    state.vehicles.push(cop1, cop2, aheadCar);

    // Dynamic behind-the-car 3D chase camera framing Marco's coupe, Art Deco skyline on left, palms & ocean on right!
    state.camera.override = {
      pos: [2972, 36, 1650],
      lookAt: [2932, 34, 1210],
      fov: 62,
    };

    state.missions.index = 4;
    state.missions.stage = 1;
    state.missions.marker = { x: 2718, y: 1772, label: 'SAFEHOUSE ESCAPE' };
    postSolagram(state, 'NEON COUPE hitting nitro down Bayside Strip with 3-STAR SC-PD HEAT! #SolaraCoast', 450, '@bayside_watch');
    sayDialogue(state, 'MARCO', 'Hold tight, Elena — hitting nitro past the beachfront!');
    ui.showHUD();
  } else if (shotName === 'heist') {
    // 2-heist.jpg: 3D Over-the-Shoulder Bayside First Bank Heist Shootout!
    state.mode = 'playing';
    state.timeIndex = 0; // Golden Hour
    state.time = 22.6;
    state.player.activeId = 'elena';
    state.player.weaponIndex = 4; // Assault Rifle
    state.player.cash = 52400;
    state.player.clout = 16200;
    state.wanted.level = 4;

    state.vehicles = state.vehicles.filter((v) => Math.hypot(v.x - 2480, v.y - 1500) > 320);

    marco.vehicle = null;
    elena.vehicle = null;
    elena.x = 2425;
    elena.y = 1525;
    elena.angle = -0.18;
    marco.x = 2392;
    marco.y = 1495;
    marco.angle = -0.05;

    const getaway = createVehicle('muscle', 2350, 1555, -0.25, { color: '#00e5ff', plate: 'HST-909', hotPlate: true });
    state.vehicles.push(getaway);

    state.vehicles.push(
      createVehicle('police', 2585, 1465, Math.PI * 0.92, { isPolice: true, sirenOn: true }),
      createVehicle('swat', 2625, 1555, Math.PI * 1.08, { isPolice: true, sirenOn: true }),
    );
    state.police.officers = [
      { x: 2540, y: 1470, angle: Math.PI, hp: 55, maxHp: 55, swat: false, fireCd: 1, dead: false, walkCycle: 2 },
      { x: 2565, y: 1540, angle: Math.PI, hp: 85, maxHp: 85, swat: true, fireCd: 1, dead: false, walkCycle: 4 },
      { x: 2520, y: 1585, angle: -2.4, hp: 85, maxHp: 85, swat: true, fireCd: 1, dead: false, walkCycle: 1 },
    ];
    state.police.heli.active = true;
    state.police.heli.x = 2590;
    state.police.heli.y = 1410;
    state.police.heli.angle = 2.6;
    state.police.heli.rotor = 12;

    const addTracer = (x1, y1, x2, y2, color) => {
      state.combat.bullets.push({ prevX: x1, prevY: y1, x: x2, y: y2, vx: 0, vy: 0, color, damage: 0, team: 'player', life: 1 });
    };
    addTracer(elena.x + 14, elena.y - 2, 2535, 1485, '#6df2ff');
    addTracer(marco.x + 14, marco.y + 2, 2550, 1532, '#ffd166');
    addTracer(2535, 1472, 2450, 1510, '#ff4d88');
    addTracer(2558, 1540, 2445, 1538, '#ff4d88');
    fireBullet(state, elena.x + 14, elena.y, -0.1, 25, 1100, '#6df2ff', 'player');
    spawnExplosion(state, 2588, 1505, 92);
    state.camera.shake = 0;

    state.camera.override = {
      pos: [2326, 36, 1575],
      lookAt: [2540, 28, 1485],
      fov: 60,
    };

    state.missions.index = 5;
    state.missions.stage = 1;
    postSolagram(state, 'BAYSIDE FIRST BANK VAULT HIT!! Marco & Elena trading fire with SWAT! #MiamiCrime6', 900, '@solara_live');
    sayDialogue(state, 'ELENA', 'Vault bags secured! Cover my left flank, Marco — we’re taking the Muscle Car!');
    ui.showHUD();
  } else if (shotName === 'swamp') {
    // 3-swamp.jpg: 3D Cypress Marsh Speedboat, Patrolling Alligators & Hovering Glowing UFO!
    state.mode = 'playing';
    state.timeIndex = 0; // Golden Hour twilight
    state.time = 31.4;
    state.player.activeId = 'marco';
    state.player.cash = 9650;
    state.player.clout = 11400;
    state.wanted.level = 1;

    const boat = createVehicle('boat', 785, 2610, -0.05, { color: '#00e5ff', plate: 'KEY-777' });
    boat.speed = 340;
    boat.driver = marco;
    boat.passenger = elena;
    marco.vehicle = boat;
    elena.vehicle = boat;
    marco.x = boat.x;
    marco.y = boat.y;
    elena.x = boat.x;
    elena.y = boat.y;
    state.vehicles.push(boat);

    state.wildlife.gators[0].x = 855;
    state.wildlife.gators[0].y = 2660;
    state.wildlife.gators[0].angle = -2.4;
    state.wildlife.gators[0].aggro = true;
    state.wildlife.gators[1].x = 985;
    state.wildlife.gators[1].y = 2560;
    state.wildlife.gators[1].angle = 2.7;
    state.wildlife.gators[2].x = 875;
    state.wildlife.gators[2].y = 2540;
    state.wildlife.gators[2].angle = 0.4;

    state.camera.override = {
      pos: [648, 42, 2652],
      lookAt: [915, 46, 2605],
      fov: 62,
    };

    state.missions.index = 2;
    state.missions.stage = 1;
    // Place mission marker slightly aside so UFO tractor beam shines cleanly without overlap
    state.missions.marker = { x: 1120, y: 2740, label: 'MARSH CARGO 2/3' };
    postSolagram(state, 'UNREAL FOOTAGE!! Glowing UFO hovering over Cypress Marsh while gators lunge at a speedboat!! #SolaraUFO', 1800, '@marsh_hunter');
    sayDialogue(state, 'ELENA', 'Forget the cargo for a second — look at that glowing saucer above the marsh!');
    ui.showHUD();
  } else if (shotName === 'start') {
    // 4-start.jpg: 3D Neon Night Bayside Boulevard Vista behind sleek Start Screen overlay
    state.mode = 'title';
    state.timeIndex = 2; // Neon Night
    state.time = 19.5;
    state.wanted.level = 2;

    state.vehicles = state.vehicles.filter((v) => Math.hypot(v.x - 2960, v.y - 1500) > 380);
    state.vehicles.push(
      createVehicle('coupe', 2942, 1515, -Math.PI * 0.5, { color: '#ff3b8d' }),
      createVehicle('muscle', 2986, 1420, -Math.PI * 0.5, { color: '#00e5ff' }),
      createVehicle('police', 2942, 1620, -Math.PI * 0.5, { isPolice: true, sirenOn: true }),
      createVehicle('coupe', 2986, 1280, -Math.PI * 0.5, { color: '#ffd166' }),
    );

    // Sweeping low-angle 3D vista angled to showcase glowing Art Deco towers, neon traffic, palms & moonlit ocean on the right!
    state.camera.override = {
      pos: [3050, 44, 1740],
      lookAt: [2855, 58, 1020],
      fov: 60,
    };
    ui.showStart(true);
  }
}
