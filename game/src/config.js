// Core constants, Solara Coast districts, dual protagonists, weapons, vehicles, and outfits.

export const WORLD_W = 4200;
export const WORLD_H = 3200;
export const ROAD_W = 116;

export const DISTRICTS = [
  { id: 'pineridge', name: 'PINERIDGE OVERLOOK', x: 0, y: 0, w: 1700, h: 1050, accent: '#7ce38b' },
  { id: 'solara_flats', name: 'SOLARA FLATS', x: 1700, y: 0, w: 2500, h: 1050, accent: '#ffb86c' },
  { id: 'harbor_point', name: 'HARBOR POINT', x: 0, y: 1050, w: 1400, h: 950, accent: '#8be9fd' },
  { id: 'bayside_strip', name: 'BAYSIDE STRIP', x: 1400, y: 1050, w: 2800, h: 1050, accent: '#ff79c6' },
  { id: 'cypress_marsh', name: 'CYPRESS MARSH', x: 0, y: 2000, w: 1800, h: 1200, accent: '#50fa7b' },
  { id: 'coral_keys', name: 'CORAL KEYS', x: 1800, y: 2100, w: 2400, h: 1100, accent: '#00e5ff' },
];

export const PROTAGONISTS = {
  marco: {
    id: 'marco',
    name: 'MARCO VEGA',
    short: 'MARCO',
    role: 'GETAWAY DRIVER',
    accent: '#ff8a4c',
    skin: '#d99e77',
    hair: '#1f1614',
    shirt: '#ff4d6d',
    pants: '#24293d',
    handlingBonus: 1.22,
    nitroRegen: 1.45,
    accuracyBonus: 1.0,
    fireRateBonus: 1.0,
    cloutBonus: 1.0,
  },
  elena: {
    id: 'elena',
    name: 'ELENA CRUZ',
    short: 'ELENA',
    role: 'HEIST TACTICIAN',
    accent: '#00e5ff',
    skin: '#e0a984',
    hair: '#2b1622',
    shirt: '#00d2ff',
    pants: '#1b1d30',
    handlingBonus: 1.0,
    nitroRegen: 1.0,
    accuracyBonus: 1.3,
    fireRateBonus: 1.18,
    cloutBonus: 1.35,
  },
};

export const OUTFITS = [
  { id: 'street', name: 'STREETWEAR', marcoShirt: '#ff4d6d', elenaShirt: '#00d2ff', pants: '#23283c' },
  { id: 'resort', name: 'RESORT SUIT', marcoShirt: '#fff3d1', elenaShirt: '#ff90c8', pants: '#e6dcc5' },
  { id: 'neon', name: 'CLUB NEON', marcoShirt: '#9d4edd', elenaShirt: '#39ff9e', pants: '#17122b' },
  { id: 'stealth', name: 'STEALTH OPS', marcoShirt: '#2b3242', elenaShirt: '#1f2937', pants: '#111622' },
];

export const WEAPONS = [
  { id: 'melee', name: 'BATON / FISTS', damage: 28, fireRate: 0.34, range: 52, spread: 0.1, pellets: 1, mag: 0, speed: 0, color: '#fff', melee: true },
  { id: 'pistol', name: '9MM PISTOL', damage: 24, fireRate: 0.28, range: 520, spread: 0.055, pellets: 1, mag: 12, speed: 920, color: '#ffe680' },
  { id: 'smg', name: 'RAPID SMG', damage: 17, fireRate: 0.1, range: 470, spread: 0.11, pellets: 1, mag: 30, speed: 960, color: '#ff9d5c' },
  { id: 'shotgun', name: 'PUMP SHOTGUN', damage: 16, fireRate: 0.68, range: 320, spread: 0.24, pellets: 5, mag: 6, speed: 840, color: '#ff5c8a' },
  { id: 'rifle', name: 'ASSAULT RIFLE', damage: 27, fireRate: 0.14, range: 640, spread: 0.045, pellets: 1, mag: 28, speed: 1120, color: '#6df2ff' },
];

export const VEHICLE_TYPES = {
  coupe: {
    name: 'SOLARA GT COUPE',
    w: 28, h: 54,
    maxSpeed: 540, accel: 460, brake: 620, turn: 3.1, drift: 0.92, hp: 145,
    colors: ['#ff3b8d', '#00e5ff', '#ff8c42', '#b967ff', '#ffe066'],
    boat: false, siren: false,
  },
  muscle: {
    name: 'VEGA V8 MUSCLE',
    w: 30, h: 58,
    maxSpeed: 495, accel: 430, brake: 560, turn: 2.85, drift: 0.94, hp: 175,
    colors: ['#ff595e', '#ffca3a', '#4ea8de', '#f72585'],
    boat: false, siren: false,
  },
  moto: {
    name: 'WAVERUNNER 600',
    w: 16, h: 38,
    maxSpeed: 560, accel: 540, brake: 680, turn: 3.7, drift: 0.88, hp: 90,
    colors: ['#00f5d4', '#ff4d6d', '#ffd166', '#ffffff'],
    boat: false, siren: false,
  },
  suv: {
    name: 'MARSHLANDER SUV',
    w: 33, h: 62,
    maxSpeed: 415, accel: 340, brake: 520, turn: 2.55, drift: 0.9, hp: 230,
    colors: ['#3d5a80', '#2a9d8f', '#e76f51', '#383d52'],
    boat: false, siren: false, offroad: true,
  },
  taxi: {
    name: 'BAYSIDE CAB',
    w: 28, h: 54,
    maxSpeed: 425, accel: 355, brake: 540, turn: 2.8, drift: 0.9, hp: 140,
    colors: ['#ffd166'],
    boat: false, siren: false,
  },
  police: {
    name: 'SC-PD INTERCEPTOR',
    w: 29, h: 56,
    maxSpeed: 515, accel: 450, brake: 600, turn: 3.0, drift: 0.91, hp: 170,
    colors: ['#182038'],
    boat: false, siren: true,
  },
  swat: {
    name: 'TACTICAL SWAT VAN',
    w: 36, h: 68,
    maxSpeed: 390, accel: 310, brake: 500, turn: 2.25, drift: 0.87, hp: 310,
    colors: ['#1b2434'],
    boat: false, siren: true,
  },
  boat: {
    name: 'KEYRUNNER SPEEDBOAT',
    w: 28, h: 62,
    maxSpeed: 470, accel: 390, brake: 360, turn: 2.7, drift: 0.95, hp: 180,
    colors: ['#ffffff', '#00e5ff', '#ff6b6b'],
    boat: true, siren: false,
  },
};

export const TIME_PHASES = [
  { id: 'sunset', label: '18:45 · GOLDEN HOUR', tint: 'rgba(255, 118, 72, 0.16)', darkness: 0.16, lights: 0.78 },
  { id: 'day', label: '13:20 · TROPICAL DAY', tint: 'rgba(255, 245, 210, 0.05)', darkness: 0.0, lights: 0.0 },
  { id: 'night', label: '22:30 · NEON NIGHT', tint: 'rgba(28, 16, 68, 0.44)', darkness: 0.44, lights: 1.0 },
];

export const PAINT_OPTIONS = [
  { name: 'CORAL SUNSET', color: '#ff3b8d', cost: 250 },
  { name: 'NEON CYAN', color: '#00e5ff', cost: 250 },
  { name: 'SOLARA GOLD', color: '#ffd166', cost: 250 },
  { name: 'MIDNIGHT VIOLET', color: '#9d4edd', cost: 250 },
  { name: 'STEALTH MATTE', color: '#2b3242', cost: 250 },
];
