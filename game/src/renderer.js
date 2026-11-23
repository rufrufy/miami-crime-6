// True 3D WebGL Renderer (Three.js) for Miami Crime 6 — Solara Coast.
import * as THREE from 'three';
import { OUTFITS, PROTAGONISTS, ROAD_W, WORLD_H, WORLD_W } from './config.js';
import {
  createAlligatorMesh,
  createCharacterMesh,
  createFacadeTexture,
  createGlowSpriteTexture,
  createGroundTexture,
  createHelicopterMesh,
  createRoadTexture,
  createSignTexture,
  createSkyTexture,
  createSwampUFOMesh,
  createTreeMesh,
  createVehicleMesh,
  createWaterTexture,
} from './meshes.js';
import { BRIDGES, H_ROADS, ISLANDS, V_ROADS } from './world.js';

export function createRenderer3D(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xff8e72, 0.00044);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 2, 4200);
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -8);
  const rayHit = new THREE.Vector3();

  // ==================== LIGHTING & SKY ====================
  const hemiLight = new THREE.HemisphereLight(0xffb5a7, 0x262344, 1.05);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffc98b, 2.0);
  sunLight.position.set(1600, 950, -900);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 100;
  sunLight.shadow.camera.far = 3000;
  const sc = 900;
  sunLight.shadow.camera.left = -sc;
  sunLight.shadow.camera.right = sc;
  sunLight.shadow.camera.top = sc;
  sunLight.shadow.camera.bottom = -sc;
  scene.add(sunLight);
  scene.add(sunLight.target);

  const skyTextures = {
    sunset: createSkyTexture('sunset'),
    day: createSkyTexture('day'),
    night: createSkyTexture('night'),
  };
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTextures.sunset, side: THREE.BackSide, fog: false });
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 22), skyMat);
  scene.add(skyDome);

  // Soft glowing Sun & Moon sprites (zero hard ring artifacts!)
  const sunGlowTex = createGlowSpriteTexture('#ffe07a', 'rgba(255, 92, 118, 0.55)');
  const moonGlowTex = createGlowSpriteTexture('#d8eaff', 'rgba(130, 80, 255, 0.42)');
  const celestialMat = new THREE.SpriteMaterial({ map: sunGlowTex, transparent: true, fog: false, depthWrite: false });
  const celestialSprite = new THREE.Sprite(celestialMat);
  celestialSprite.scale.set(420, 420, 1);
  scene.add(celestialSprite);

  // ==================== STATIC WORLD BUILDER ====================
  let builtWorld = null;
  let worldGroup = null;
  let oceanTex = null;
  let marshTex = null;
  let ufoMesh = null;
  let beaconOrb = null;
  let facadeMats = [];
  let lastTimeIndex = -1;

  function buildStaticWorld(world) {
    if (worldGroup) scene.remove(worldGroup);
    worldGroup = new THREE.Group();
    scene.add(worldGroup);
    facadeMats = [];

    const grassTex = createGroundTexture('#2e5247', 'rgba(80,155,105,0.16)', 'rgba(15,35,28,0.18)');
    const sandTex = createGroundTexture('#f2d399', 'rgba(255,248,220,0.22)', 'rgba(205,162,98,0.22)');
    const roadTex = createRoadTexture();
    oceanTex = createWaterTexture(false);
    marshTex = createWaterTexture(true);

    // Main terrain ground plane
    const baseGround = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_W + 1200, WORLD_H + 1200),
      new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.92 }),
    );
    baseGround.rotation.x = -Math.PI * 0.5;
    baseGround.position.set(WORLD_W * 0.5, -0.2, WORLD_H * 0.5);
    baseGround.receiveShadow = true;
    worldGroup.add(baseGround);

    // Bayside Strip urban concrete slab
    const citySlab = new THREE.Mesh(
      new THREE.PlaneGeometry(1800, 1750),
      new THREE.MeshStandardMaterial({ color: 0x3b4056, roughness: 0.9 }),
    );
    citySlab.rotation.x = -Math.PI * 0.5;
    citySlab.position.set(2280, -0.08, 1260);
    citySlab.receiveShadow = true;
    worldGroup.add(citySlab);

    // Golden Bayside Beach strip
    const beach = new THREE.Mesh(
      new THREE.PlaneGeometry(310, 1950),
      new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.88 }),
    );
    beach.rotation.x = -Math.PI * 0.5;
    beach.position.set(3275, 0.05, 1240);
    beach.receiveShadow = true;
    worldGroup.add(beach);

    // Animated Turquoise Ocean
    const oceanMat = new THREE.MeshStandardMaterial({
      map: oceanTex,
      color: 0x24dfff,
      roughness: 0.16,
      metalness: 0.22,
      transparent: true,
      opacity: 0.92,
    });
    const eastOcean = new THREE.Mesh(new THREE.PlaneGeometry(1800, 3200), oceanMat);
    eastOcean.rotation.x = -Math.PI * 0.5;
    eastOcean.position.set(4280, 0.12, 1200);
    worldGroup.add(eastOcean);

    const southOcean = new THREE.Mesh(new THREE.PlaneGeometry(3400, 1800), oceanMat);
    southOcean.rotation.x = -Math.PI * 0.5;
    southOcean.position.set(3460, 0.12, 3040);
    worldGroup.add(southOcean);

    const harborWater = new THREE.Mesh(new THREE.PlaneGeometry(600, 1080), oceanMat);
    harborWater.rotation.x = -Math.PI * 0.5;
    harborWater.position.set(120, 0.12, 1540);
    worldGroup.add(harborWater);

    // Cypress Marsh emerald water lagoon (vibrant glowing wetland sheen)
    const marshFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(1760, 1240),
      new THREE.MeshStandardMaterial({ color: 0x244233, roughness: 0.92 }),
    );
    marshFloor.rotation.x = -Math.PI * 0.5;
    marshFloor.position.set(880, 0.04, 2610);
    worldGroup.add(marshFloor);

    const marshWaterMat = new THREE.MeshStandardMaterial({
      map: marshTex,
      color: 0x2ca880,
      emissive: 0x0d382c,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.18,
      transparent: true,
      opacity: 0.92,
    });
    const marshLagoon = new THREE.Mesh(new THREE.CircleGeometry(540, 32), marshWaterMat);
    marshLagoon.rotation.x = -Math.PI * 0.5;
    marshLagoon.scale.set(1.05, 0.62, 1);
    marshLagoon.position.set(940, 0.22, 2580);
    worldGroup.add(marshLagoon);

    const marshChannel = new THREE.Mesh(new THREE.PlaneGeometry(1560, 190), marshWaterMat);
    marshChannel.rotation.x = -Math.PI * 0.5;
    marshChannel.position.set(820, 0.2, 2330);
    worldGroup.add(marshChannel);

    // Coral Keys islands
    for (const isl of ISLANDS) {
      const sand = new THREE.Mesh(
        new THREE.BoxGeometry(isl.w, 2.2, isl.h),
        new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.9 }),
      );
      sand.position.set(isl.x + isl.w * 0.5, 0.3, isl.y + isl.h * 0.5);
      worldGroup.add(sand);

      const turf = new THREE.Mesh(
        new THREE.BoxGeometry(isl.w - 64, 2.6, isl.h - 64),
        new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.9 }),
      );
      turf.position.set(isl.x + isl.w * 0.5, 0.5, isl.y + isl.h * 0.5);
      worldGroup.add(turf);
    }

    // Pineridge Overlook green hill
    const hill = new THREE.Mesh(
      new THREE.CylinderGeometry(280, 480, 48, 20),
      new THREE.MeshStandardMaterial({ color: 0x2b5c3e, roughness: 0.92 }),
    );
    hill.position.set(660, 18, 300);
    worldGroup.add(hill);

    // Asphalt Roads
    const roadMatBase = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.82 });
    for (const rx of V_ROADS) {
      const maxY = rx === 740 ? 2040 : rx === 2960 ? 2700 : 2850;
      const len = maxY - 180;
      const rTex = roadTex.clone();
      rTex.needsUpdate = true;
      rTex.repeat.set(1, len / 180);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(ROAD_W, len),
        new THREE.MeshStandardMaterial({ map: rTex, roughness: 0.82 }),
      );
      mesh.rotation.x = -Math.PI * 0.5;
      mesh.position.set(rx, 0.28, 180 + len * 0.5);
      mesh.receiveShadow = true;
      worldGroup.add(mesh);
    }
    for (const ry of H_ROADS) {
      const minX = ry === 2520 ? 1400 : 380;
      const len = 3120 - minX;
      const rTex = roadTex.clone();
      rTex.needsUpdate = true;
      rTex.repeat.set(1, len / 180);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(ROAD_W, len),
        new THREE.MeshStandardMaterial({ map: rTex, roughness: 0.82 }),
      );
      mesh.rotation.x = -Math.PI * 0.5;
      mesh.rotation.z = Math.PI * 0.5;
      mesh.position.set(minX + len * 0.5, 0.3, ry);
      mesh.receiveShadow = true;
      worldGroup.add(mesh);
    }

    // 3D Causeway Bridges
    const railMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    for (const b of BRIDGES) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(b.w, 4.5, b.h), roadMatBase);
      deck.position.set(b.x + b.w * 0.5, 2.2, b.y + b.h * 0.5);
      worldGroup.add(deck);
      if (b.dir === 'v') {
        const rL = new THREE.Mesh(new THREE.BoxGeometry(4, 7, b.h), railMat);
        rL.position.set(b.x + 2, 6, b.y + b.h * 0.5);
        const rR = rL.clone();
        rR.position.x = b.x + b.w - 2;
        worldGroup.add(rL, rR);
      } else {
        const rT = new THREE.Mesh(new THREE.BoxGeometry(b.w, 7, 4), railMat);
        rT.position.set(b.x + b.w * 0.5, 6, b.y + 2);
        const rB = rT.clone();
        rB.position.z = b.y + b.h - 2;
        worldGroup.add(rT, rB);
      }
    }

    // Art Deco Skyscrapers + Iconic Bayside Boulevard Skyline Towers
    const facadeCache = new Map();
    const getFacadeMat = (wall, neon) => {
      const key = `${wall}|${neon || ''}`;
      if (!facadeCache.has(key)) {
        const tex = createFacadeTexture(wall, neon);
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.42,
          metalness: 0.15,
          emissive: new THREE.Color(wall),
          emissiveMap: tex,
          emissiveIntensity: 0.35,
        });
        facadeCache.set(key, mat);
        facadeMats.push(mat);
      }
      return facadeCache.get(key);
    };

    // Extra iconic Bayside Boulevard Art Deco skyline towers along the west side of the Strip (x=2770..2865)
    const skylineDecor = [
      { x: 2775, y: 970, w: 105, h: 115, height: 155, wall: '#ff9ebb', roof: '#2a1d44', neon: '#ff3b9a', label: 'HOTEL SOLARA' },
      { x: 2780, y: 780, w: 100, h: 120, height: 185, wall: '#72efdd', roof: '#1d2d44', neon: '#00f0ff', label: 'CORAL TOWERS' },
      { x: 2785, y: 600, w: 96, h: 108, height: 145, wall: '#cdb4db', roof: '#2c2046', neon: '#ffd166', label: 'OCEAN PLAZA' },
      { x: 2560, y: 940, w: 130, h: 120, height: 195, wall: '#a0c4ff', roof: '#1b2640', neon: '#00e5ff' },
      { x: 2360, y: 950, w: 125, h: 115, height: 175, wall: '#ffd6a5', roof: '#3a2444', neon: '#ff5eb8' },
    ];

    const allBuildings = [...world.buildings, ...skylineDecor];

    for (const b of allBuildings) {
      const h = b.height * 1.18;
      const cx = b.x + b.w * 0.5;
      const cz = b.y + b.h * 0.5;

      if (b.style === 'container') {
        const cont = new THREE.Mesh(
          new THREE.BoxGeometry(b.w, h, b.h),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(b.wall), roughness: 0.65, metalness: 0.2 }),
        );
        cont.position.set(cx, h * 0.5, cz);
        cont.castShadow = true;
        cont.receiveShadow = true;
        worldGroup.add(cont);
        continue;
      }

      if (b.style === 'tower') {
        const base = new THREE.Mesh(new THREE.BoxGeometry(b.w, 28, b.h), new THREE.MeshStandardMaterial({ color: 0x455a64 }));
        base.position.set(cx, 38, cz);
        worldGroup.add(base);
        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(2.5, 14, 210, 4),
          new THREE.MeshStandardMaterial({ color: 0xcfd8dc, wireframe: true }),
        );
        mast.position.set(cx, 150, cz);
        worldGroup.add(mast);
        beaconOrb = new THREE.Mesh(
          new THREE.SphereGeometry(8, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xc77dff }),
        );
        beaconOrb.position.set(cx, 258, cz);
        worldGroup.add(beaconOrb);
        continue;
      }

      const sideMat = getFacadeMat(b.wall, b.neon);
      const roofMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(b.roof || '#242038'), roughness: 0.7 });
      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, h, b.h),
        [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat],
      );
      bMesh.position.set(cx, h * 0.5, cz);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      worldGroup.add(bMesh);

      // Stepped Art Deco setback crown + neon vertical accent strips
      if (h > 90) {
        const crownH = 28 + (h % 32);
        const crown = new THREE.Mesh(
          new THREE.BoxGeometry(b.w * 0.66, crownH, b.h * 0.66),
          [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat],
        );
        crown.position.set(cx, h + crownH * 0.5, cz);
        crown.castShadow = true;
        worldGroup.add(crown);

        if (b.neon) {
          const spire = new THREE.Mesh(
            new THREE.CylinderGeometry(1.4, 3.0, 32, 6),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(b.neon) }),
          );
          spire.position.set(cx, h + crownH + 16, cz);
          worldGroup.add(spire);
        }
      }

      if (b.neon) {
        const trimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(b.neon) });
        const trim = new THREE.Mesh(new THREE.BoxGeometry(b.w + 2.6, 3.6, b.h + 2.6), trimMat);
        trim.position.set(cx, h - 1.5, cz);
        worldGroup.add(trim);
      }

      // Single-sided crisp 3D Neon Landmark Billboard (no mirrored back-face!)
      if (b.label) {
        const signTex = createSignTexture(b.label, b.neon || '#ffd166');
        const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.FrontSide });
        const signW = Math.min(b.w * 0.94, 152);
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(signW, 32), signMat);
        sign.position.set(cx, h + 17, b.y + b.h + 1.5);
        worldGroup.add(sign);
      }
    }

    // 3D Trees + Extra Cypress Trees framing the Cypress Marsh lagoon
    const extraMarshTrees = [
      { x: 690, y: 2515, kind: 'cypress', radius: 30, phase: 0.4 },
      { x: 710, y: 2710, kind: 'cypress', radius: 32, phase: 1.5 },
      { x: 1080, y: 2510, kind: 'cypress', radius: 28, phase: 2.1 },
      { x: 1095, y: 2690, kind: 'cypress', radius: 31, phase: 0.9 },
    ];
    for (const t of [...world.trees, ...extraMarshTrees]) {
      const scale = Math.max(0.75, Math.min(1.45, t.radius / 22));
      const tree = createTreeMesh(t.kind, scale);
      tree.position.set(t.x, 0, t.y);
      tree.rotation.y = t.phase;
      worldGroup.add(tree);
    }

    // Beach Umbrellas + Lifeguard Tower
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xe8e4d8 });
    for (const p of world.props) {
      if (p.type === 'umbrella') {
        const ug = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 13, 6), poleMat);
        pole.position.y = 6.5;
        const cap = new THREE.Mesh(
          new THREE.ConeGeometry(10, 4.5, 8),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(p.color), roughness: 0.6 }),
        );
        cap.position.y = 13;
        ug.add(pole, cap);
        ug.position.set(p.x, 0, p.y);
        worldGroup.add(ug);
      }
    }

    const lg = new THREE.Group();
    const lgDeck = new THREE.Mesh(new THREE.BoxGeometry(22, 16, 22), new THREE.MeshStandardMaterial({ color: 0x00e5ff }));
    lgDeck.position.y = 16;
    const lgRoof = new THREE.Mesh(new THREE.ConeGeometry(19, 9, 4), new THREE.MeshStandardMaterial({ color: 0xff4d9d }));
    lgRoof.rotation.y = Math.PI * 0.25;
    lgRoof.position.y = 28;
    const lgStilts = new THREE.Mesh(new THREE.BoxGeometry(18, 12, 18), new THREE.MeshStandardMaterial({ color: 0xf4f1de, wireframe: true }));
    lgStilts.position.y = 6;
    lg.add(lgStilts, lgDeck, lgRoof);
    lg.position.set(3240, 0, 1360);
    worldGroup.add(lg);

    // Streetlights with subtle warm ground pools
    const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x3b4259, metalness: 0.6 });
    const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xffe8a8 });
    for (const sl of world.streetlights) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 36, 6), lampPoleMat);
      pole.position.set(sl.x, 18, sl.y);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 8), lampBulbMat);
      bulb.position.set(sl.x - sl.side * 5, 36, sl.y);
      worldGroup.add(pole, bulb);
    }

    // Cypress Marsh Lily Pads
    const padMat = new THREE.MeshStandardMaterial({ color: 0x45c46a, roughness: 0.7 });
    for (const lp of world.lilyPads) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(lp.r, lp.r, 0.6, 10), padMat);
      pad.position.set(lp.x, 0.4, lp.y);
      worldGroup.add(pad);
    }

    // Swamp UFO Anomaly
    const ufoData = world.mysteries.find((m) => m.id === 'ufo');
    if (ufoData) {
      ufoMesh = createSwampUFOMesh();
      ufoMesh.position.set(ufoData.x, 108, ufoData.y);
      worldGroup.add(ufoMesh);
    }

    // Coral Reef Shipwreck
    const shipData = world.mysteries.find((m) => m.id === 'shipwreck');
    if (shipData) {
      const ship = new THREE.Group();
      const shipWoodMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 });
      const hull = new THREE.Mesh(new THREE.BoxGeometry(64, 14, 24), shipWoodMat);
      hull.rotation.z = 0.24;
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.2, 42, 6), shipWoodMat);
      mast.position.set(4, 18, 0);
      mast.rotation.z = 0.35;
      const gold = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 8), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
      gold.position.set(-10, 6, 0);
      ship.add(hull, mast, gold);
      ship.position.set(shipData.x, 1, shipData.y);
      worldGroup.add(ship);
    }

    // Enterable Interior Glowing Cyan Portal Rings
    const portalRingGeo = new THREE.TorusGeometry(15, 2.0, 8, 24);
    portalRingGeo.rotateX(Math.PI * 0.5);
    const portalMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.85 });
    for (const it of world.interiors) {
      const ring = new THREE.Mesh(portalRingGeo, portalMat);
      ring.position.set(it.doorX, 2.0, it.doorY);
      worldGroup.add(ring);
    }

    builtWorld = world;
  }

  // ==================== DYNAMIC ENTITY SYNC ====================
  const dynGroup = new THREE.Group();
  scene.add(dynGroup);

  const vehicleMap = new Map();
  const charMap = new Map();
  const gatorMap = new Map();

  const heroMeshes = {
    marco: createCharacterMesh({ ...PROTAGONISTS.marco, armed: true, sunglasses: true }),
    elena: createCharacterMesh({ ...PROTAGONISTS.elena, armed: true, sunglasses: true }),
  };
  dynGroup.add(heroMeshes.marco, heroMeshes.elena);

  const heliMesh = createHelicopterMesh();
  heliMesh.visible = false;
  dynGroup.add(heliMesh);

  const missionBeacon = new THREE.Group();
  const beaconBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(10, 14, 260, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  beaconBeam.position.y = 130;
  const beaconRing = new THREE.Mesh(
    new THREE.TorusGeometry(18, 2.4, 8, 24).rotateX(Math.PI * 0.5),
    new THREE.MeshBasicMaterial({ color: 0xffd166 }),
  );
  beaconRing.position.y = 2.5;
  missionBeacon.add(beaconBeam, beaconRing);
  missionBeacon.visible = false;
  dynGroup.add(missionBeacon);

  const vfxGroup = new THREE.Group();
  scene.add(vfxGroup);
  const vfxUnitSphere = new THREE.SphereGeometry(1, 10, 8);
  const vfxTracerGeo = new THREE.CylinderGeometry(1.1, 1.1, 1, 6);
  vfxTracerGeo.rotateX(Math.PI * 0.5);

  function applyTimePhase(timeIndex) {
    if (timeIndex === lastTimeIndex) return;
    lastTimeIndex = timeIndex;
    if (timeIndex === 0) {
      // Golden Hour
      skyMat.map = skyTextures.sunset;
      scene.fog.color.setHex(0xd96b78);
      scene.fog.density = 0.0004;
      hemiLight.color.setHex(0xffc2aa);
      hemiLight.groundColor.setHex(0x362452);
      hemiLight.intensity = 1.18;
      sunLight.color.setHex(0xffbc75);
      sunLight.intensity = 2.2;
      celestialMat.map = sunGlowTex;
      celestialSprite.position.set(3550, 360, -150);
      celestialSprite.scale.set(460, 460, 1);
      for (const m of facadeMats) m.emissiveIntensity = 0.34;
    } else if (timeIndex === 1) {
      // Tropical Day
      skyMat.map = skyTextures.day;
      scene.fog.color.setHex(0x9ceeff);
      scene.fog.density = 0.00028;
      hemiLight.color.setHex(0xffffff);
      hemiLight.groundColor.setHex(0x4b6e68);
      hemiLight.intensity = 1.3;
      sunLight.color.setHex(0xfff6dc);
      sunLight.intensity = 2.3;
      celestialMat.map = sunGlowTex;
      celestialSprite.position.set(2800, 1250, 600);
      celestialSprite.scale.set(360, 360, 1);
      for (const m of facadeMats) m.emissiveIntensity = 0.12;
    } else {
      // Vibrant Neon Night
      skyMat.map = skyTextures.night;
      scene.fog.color.setHex(0x28134d);
      scene.fog.density = 0.00042;
      hemiLight.color.setHex(0x9c7aff);
      hemiLight.groundColor.setHex(0x1f143b);
      hemiLight.intensity = 1.05;
      sunLight.color.setHex(0x96c2ff);
      sunLight.intensity = 1.35;
      celestialMat.map = moonGlowTex;
      celestialSprite.position.set(3520, 460, -180);
      celestialSprite.scale.set(380, 380, 1);
      for (const m of facadeMats) m.emissiveIntensity = 0.68;
    }
    skyMat.needsUpdate = true;
    celestialMat.needsUpdate = true;
  }

  function syncCharacterAnim(mesh, entity, shirtHex, pantsHex, filming = false) {
    mesh.position.set(entity.x, 0, entity.y);
    mesh.rotation.y = -entity.angle;
    const sw = Math.sin(entity.walkCycle || 0) * 0.55;
    mesh.userData.legL.rotation.z = sw;
    mesh.userData.legR.rotation.z = -sw;
    mesh.userData.armL.rotation.z = -sw * 0.7;
    if (shirtHex) mesh.userData.shirtMat.color.set(shirtHex);
    if (pantsHex) mesh.userData.pantsMat.color.set(pantsHex);
    if (mesh.userData.phone) mesh.userData.phone.visible = filming;
  }

  function updateCamera(state, dt) {
    const active = state.heroes[state.player.activeId];

    if (state.camera.override) {
      const ov = state.camera.override;
      camera.fov = ov.fov || 58;
      camera.updateProjectionMatrix();
      camera.position.set(ov.pos[0], ov.pos[1], ov.pos[2]);
      camera.lookAt(ov.lookAt[0], ov.lookAt[1], ov.lookAt[2]);
      return;
    }

    if (state.mode === 'title') {
      const sway = Math.sin(state.time * 0.25) * 40;
      camera.fov = 58;
      camera.updateProjectionMatrix();
      camera.position.set(3015 + sway, 46 + Math.sin(state.time * 0.35) * 5, 1780);
      camera.lookAt(2840, 56, 1080);
      return;
    }

    const shake = state.camera.shake > 0 ? (Math.random() - 0.5) * state.camera.shake * 0.7 : 0;

    if (active.vehicle) {
      const v = active.vehicle;
      const desiredYaw = v.angle;
      let diff = desiredYaw - state.camera.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      state.camera.yaw += diff * Math.min(1, dt * 5.2);

      const dist = v.boat ? 128 : v.type === 'swat' ? 132 : 108;
      const height = v.boat ? 40 : 38;
      const cx = v.x - Math.cos(state.camera.yaw) * dist + shake;
      const cz = v.y - Math.sin(state.camera.yaw) * dist + shake;
      const lx = v.x + Math.cos(v.angle) * 68;
      const lz = v.y + Math.sin(v.angle) * 68;

      const targetFov = 58 + Math.min(16, (Math.abs(v.speed) / 520) * 10 + (v.nitroActive ? 8 : 0));
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 6);
      camera.updateProjectionMatrix();

      camera.position.lerp(new THREE.Vector3(cx, height, cz), Math.min(1, dt * 10));
      camera.lookAt(lx, 15, lz);
    } else {
      const yaw = state.camera.yaw;
      const pitch = state.camera.pitch ?? 0.32;
      const dist = 68;
      const shoulder = 12;
      const cx = active.x - Math.cos(yaw) * dist - Math.sin(yaw) * shoulder + shake;
      const cz = active.y - Math.sin(yaw) * dist + Math.cos(yaw) * shoulder + shake;
      const cy = 22 + Math.sin(pitch) * dist * 0.78;
      const lx = active.x + Math.cos(yaw) * 75;
      const lz = active.y + Math.sin(yaw) * 75;

      camera.fov += (56 - camera.fov) * Math.min(1, dt * 6);
      camera.updateProjectionMatrix();

      camera.position.lerp(new THREE.Vector3(cx, cy, cz), Math.min(1, dt * 12));
      camera.lookAt(lx, 18, lz);
    }
  }

  function screenToWorld(ndcX, ndcY) {
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    if (raycaster.ray.intersectPlane(groundPlane, rayHit)) {
      return { x: rayHit.x, y: rayHit.z };
    }
    return null;
  }

  function resize() {
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  function render(state, dt = 0.016) {
    if (builtWorld !== state.world) buildStaticWorld(state.world);
    applyTimePhase(state.timeIndex);

    if (oceanTex) {
      oceanTex.offset.x = (state.time * 0.03) % 1;
      oceanTex.offset.y = (state.time * 0.02) % 1;
    }
    if (marshTex) {
      marshTex.offset.x = (state.time * 0.012) % 1;
    }
    if (ufoMesh) {
      ufoMesh.position.y = 104 + Math.sin(state.time * 2.2) * 8;
      ufoMesh.userData.ringLights.rotation.y = state.time * 1.6;
    }
    if (beaconOrb) {
      const s = 1 + Math.sin(state.time * 5) * 0.35;
      beaconOrb.scale.set(s, s, s);
    }

    updateCamera(state, dt);
    skyDome.position.set(camera.position.x, 0, camera.position.z);
    sunLight.target.position.set(camera.position.x, 0, camera.position.z);
    sunLight.position.set(camera.position.x + 480, 620, camera.position.z - 420);

    // Sync Vehicles
    const activeVehicles = new Set(state.vehicles);
    for (const [v, m] of vehicleMap.entries()) {
      if (!activeVehicles.has(v) || v.dead) {
        dynGroup.remove(m);
        vehicleMap.delete(v);
      }
    }
    const sirenFlash = Math.floor(state.time * 10) % 2 === 0;
    for (const v of state.vehicles) {
      if (v.dead) continue;
      let m = vehicleMap.get(v);
      if (!m) {
        m = createVehicleMesh(v);
        vehicleMap.set(v, m);
        dynGroup.add(m);
      }
      m.position.set(v.x, v.boat ? 0.4 + Math.sin(state.time * 4 + v.x) * 0.6 : 0, v.y);
      m.rotation.y = -v.angle;
      if (m.userData.bodyMat && v.color) m.userData.bodyMat.color.set(v.color);
      if (m.userData.nitro) m.userData.nitro.visible = Boolean(v.nitroActive);
      if (m.userData.wake) m.userData.wake.visible = Math.abs(v.speed) > 45;
      if (m.userData.sirenLight) {
        if (v.sirenOn) {
          m.userData.sirenLight.intensity = 7.5;
          m.userData.sirenLight.color.setHex(sirenFlash ? 0xff1e42 : 0x00b8ff);
          m.userData.redPod.material.color.setHex(sirenFlash ? 0xff2244 : 0x440812);
          m.userData.bluePod.material.color.setHex(sirenFlash ? 0x082044 : 0x00c8ff);
        } else {
          m.userData.sirenLight.intensity = 0;
        }
      }
    }

    // Sync Dual Protagonists
    const outfit = OUTFITS[state.player.outfitIndex] || OUTFITS[0];
    for (const id of ['marco', 'elena']) {
      const h = state.heroes[id];
      const hm = heroMeshes[id];
      if (h.vehicle) {
        hm.visible = false;
      } else {
        hm.visible = true;
        const shirt = id === 'marco' ? outfit.marcoShirt : outfit.elenaShirt;
        syncCharacterAnim(hm, h, shirt, outfit.pants, false);
      }
    }

    // Sync Pedestrians, Police Officers & Enemies
    const liveChars = new Set();
    const syncList = (arr, optsFn) => {
      for (const e of arr) {
        if (e.dead) continue;
        liveChars.add(e);
        let m = charMap.get(e);
        if (!m) {
          m = createCharacterMesh(optsFn(e));
          charMap.set(e, m);
          dynGroup.add(m);
        }
        syncCharacterAnim(m, e, null, null, Boolean(e.memory && e.memory.state === 'filming'));
      }
    };
    syncList(state.pedestrians, (p) => ({ skin: p.skin, shirt: p.shirt, hair: p.hair, pants: '#272c3f', armed: false }));
    syncList(state.police.officers, (c) => ({
      skin: '#d9a480',
      shirt: c.swat ? '#1c263b' : '#2556a0',
      pants: '#111622',
      hair: '#1a1a1a',
      armed: true,
    }));
    syncList(state.enemies, () => ({ skin: '#cfa07e', shirt: '#d62828', pants: '#1b1d26', hair: '#1c1512', armed: true }));

    for (const [e, m] of charMap.entries()) {
      if (!liveChars.has(e)) {
        dynGroup.remove(m);
        charMap.delete(e);
      }
    }

    // Sync Alligators
    for (const g of state.wildlife.gators) {
      let m = gatorMap.get(g);
      if (g.dead) {
        if (m) {
          dynGroup.remove(m);
          gatorMap.delete(g);
        }
        continue;
      }
      if (!m) {
        m = createAlligatorMesh();
        gatorMap.set(g, m);
        dynGroup.add(m);
      }
      m.position.set(g.x, 0.5, g.y);
      m.rotation.y = -g.angle;
      m.userData.tail.rotation.y = Math.sin(g.swimPhase) * 0.35;
    }

    // Sync Helicopter
    const heli = state.police.heli;
    if (heli.active) {
      heliMesh.visible = true;
      heliMesh.position.set(heli.x, 126, heli.y);
      heliMesh.rotation.y = -heli.angle;
      heliMesh.userData.rotor.rotation.y = heli.rotor;
    } else {
      heliMesh.visible = false;
    }

    // Sync Mission Beacon
    if (state.missions.marker) {
      missionBeacon.visible = true;
      missionBeacon.position.set(state.missions.marker.x, 0, state.missions.marker.y);
      beaconRing.rotation.z = state.time * 2.2;
    } else {
      missionBeacon.visible = false;
    }

    // Sync 3D Combat VFX
    while (vfxGroup.children.length > 0) vfxGroup.remove(vfxGroup.children[0]);

    for (const b of state.combat.bullets) {
      const dx = b.x - b.prevX;
      const dy = b.y - b.prevY;
      const len = Math.max(18, Math.hypot(dx, dy));
      const tracer = new THREE.Mesh(vfxTracerGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(b.color || '#ffe680') }));
      tracer.scale.set(1, 1, len);
      tracer.position.set((b.x + b.prevX) * 0.5, 14, (b.y + b.prevY) * 0.5);
      tracer.lookAt(b.x, 14, b.y);
      vfxGroup.add(tracer);
    }

    for (const ex of state.combat.explosions) {
      const t = Math.max(0.05, ex.life / ex.maxLife);
      const r = Math.max(16, ex.r * 0.62);
      const fire = new THREE.Mesh(
        vfxUnitSphere,
        new THREE.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: t * 0.9 }),
      );
      fire.scale.set(r, r * 1.05, r);
      fire.position.set(ex.x, r * 0.55, ex.y);
      vfxGroup.add(fire);

      const core = new THREE.Mesh(
        vfxUnitSphere,
        new THREE.MeshBasicMaterial({ color: 0xfff5a8, transparent: true, opacity: t }),
      );
      core.scale.set(r * 0.58, r * 0.62, r * 0.58);
      core.position.set(ex.x, r * 0.48, ex.y);
      vfxGroup.add(core);

      const smoke = new THREE.Mesh(
        vfxUnitSphere,
        new THREE.MeshBasicMaterial({ color: 0x2b2330, transparent: true, opacity: t * 0.55 }),
      );
      smoke.scale.set(r * 0.72, r * 0.6, r * 0.72);
      smoke.position.set(ex.x + 6, r * 1.45, ex.y - 4);
      vfxGroup.add(smoke);
    }

    for (const p of state.combat.particles) {
      const s = Math.max(1.8, p.size * 0.7);
      const pm = new THREE.Mesh(
        vfxUnitSphere,
        new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color || '#ffd166') }),
      );
      pm.scale.set(s, s, s);
      pm.position.set(p.x, 12 + (1 - p.life / (p.maxLife || 1)) * 20, p.y);
      vfxGroup.add(pm);
    }

    renderer.render(scene, camera);
  }

  return { render, resize, screenToWorld, camera };
}
