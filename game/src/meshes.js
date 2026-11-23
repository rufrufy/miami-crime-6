// Procedural CanvasTextures & detailed multi-part 3D Three.js mesh builders for Miami Crime 6.
import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// ==================== PROCEDURAL TEXTURES ====================

export function createSkyTexture(phaseId) {
  const c = makeCanvas(1024, 512);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);

  if (phaseId === 'sunset') {
    // Iconic Miami Golden Hour: deep violet zenith -> vibrant magenta -> warm coral -> radiant gold horizon
    grad.addColorStop(0.0, '#180d3d');
    grad.addColorStop(0.22, '#431a6e');
    grad.addColorStop(0.39, '#ad2e7e');
    grad.addColorStop(0.51, '#ff5c72');
    grad.addColorStop(0.62, '#ff9e57');
    grad.addColorStop(0.72, '#ffe08a');
    grad.addColorStop(1.0, '#4a2448');
  } else if (phaseId === 'day') {
    grad.addColorStop(0.0, '#0a58ca');
    grad.addColorStop(0.34, '#1fa2e8');
    grad.addColorStop(0.6, '#7ce8ff');
    grad.addColorStop(0.74, '#e3fbff');
    grad.addColorStop(1.0, '#2c7080');
  } else {
    // Neon Night: deep indigo zenith -> rich synthwave purple -> vibrant neon magenta-cyan Miami skyline glow
    grad.addColorStop(0.0, '#050414');
    grad.addColorStop(0.32, '#100a30');
    grad.addColorStop(0.52, '#2d1258');
    grad.addColorStop(0.64, '#701e74');
    grad.addColorStop(0.72, '#c73288');
    grad.addColorStop(0.77, '#325a9e');
    grad.addColorStop(1.0, '#0b0820');
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 512);

  if (phaseId === 'night') {
    // Crisp pinpoint stars
    for (let i = 0; i < 320; i++) {
      const sx = (i * 397) % 1024;
      const sy = (i * 113) % 245;
      const r = i % 7 === 0 ? 1.2 : 0.65;
      g.fillStyle = i % 5 === 0 ? 'rgba(160, 235, 255, 0.9)' : 'rgba(255, 255, 255, 0.85)';
      g.beginPath();
      g.arc(sx, sy, r, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    // Soft painted tropical clouds
    for (let i = 0; i < 24; i++) {
      const cx = (i * 113) % 1024;
      const cy = 160 + ((i * 43) % 140);
      const cw = 85 + (i % 5) * 34;
      const ch = 10 + (i % 3) * 6;
      const cg = g.createRadialGradient(cx, cy, 4, cx, cy, cw);
      if (phaseId === 'sunset') {
        cg.addColorStop(0, 'rgba(255, 215, 148, 0.42)');
        cg.addColorStop(0.6, 'rgba(255, 125, 130, 0.2)');
        cg.addColorStop(1, 'rgba(255, 125, 130, 0)');
      } else {
        cg.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        cg.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      g.fillStyle = cg;
      g.beginPath();
      g.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
      g.fill();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createGlowSpriteTexture(innerHex, outerHex) {
  const c = makeCanvas(256, 256);
  const g = c.getContext('2d');
  const rad = g.createRadialGradient(128, 128, 12, 128, 128, 126);
  rad.addColorStop(0.0, '#ffffff');
  rad.addColorStop(0.22, innerHex);
  rad.addColorStop(0.55, outerHex);
  rad.addColorStop(1.0, 'rgba(0,0,0,0)');
  g.fillStyle = rad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRoadTexture() {
  const c = makeCanvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = '#252938';
  g.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 900; i++) {
    const x = (i * 97) % 256;
    const y = (i * 53) % 256;
    g.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
    g.fillRect(x, y, 2, 2);
  }

  // Sidewalks / curbs on edges
  g.fillStyle = '#5a6178';
  g.fillRect(0, 0, 14, 256);
  g.fillRect(242, 0, 14, 256);

  // Crisp double yellow center line
  g.fillStyle = '#ffd166';
  g.fillRect(122, 0, 4, 256);
  g.fillRect(130, 0, 4, 256);

  // Dashed white lane dividers
  g.fillStyle = 'rgba(245, 248, 255, 0.78)';
  for (let y = 10; y < 256; y += 44) {
    g.fillRect(64, y, 4, 22);
    g.fillRect(188, y, 4, 22);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createFacadeTexture(wallHex, neonHex) {
  const c = makeCanvas(256, 512);
  const g = c.getContext('2d');

  g.fillStyle = wallHex;
  g.fillRect(0, 0, 256, 512);

  // Art Deco vertical pilasters
  g.fillStyle = 'rgba(0, 0, 0, 0.16)';
  g.fillRect(0, 0, 12, 512);
  g.fillRect(244, 0, 12, 512);
  g.fillStyle = 'rgba(255, 255, 255, 0.18)';
  g.fillRect(12, 0, 6, 512);

  const cols = 6;
  const rows = 14;
  const padX = 18;
  const padY = 14;
  const cellW = (256 - padX * 2) / cols;
  const cellH = (512 - padY * 2) / rows;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const wx = padX + col * cellW + 4;
      const wy = padY + r * cellH + 5;
      const ww = cellW - 8;
      const wh = cellH - 10;
      const h = (r * 31 + col * 17) % 11;
      const lit = h < 7;
      if (lit) {
        g.fillStyle = h % 3 === 0 ? '#ffe89e' : h % 3 === 1 ? '#8ff5ff' : '#ffd1e3';
      } else {
        g.fillStyle = '#1b243b';
      }
      g.fillRect(wx, wy, ww, wh);
      g.fillStyle = 'rgba(255,255,255,0.28)';
      g.fillRect(wx, wy, ww, 3);
    }
  }

  if (neonHex) {
    g.fillStyle = neonHex;
    g.fillRect(0, 8, 256, 8);
    g.fillRect(0, 252, 256, 5);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createWaterTexture(isMarsh = false) {
  const c = makeCanvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = isMarsh ? '#1f6350' : '#00a8dc';
  g.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 48; i++) {
    const x = (i * 61) % 256;
    const y = (i * 43) % 256;
    const w = 28 + (i % 4) * 16;
    g.fillStyle = isMarsh ? 'rgba(118, 230, 168, 0.24)' : 'rgba(165, 245, 255, 0.32)';
    g.beginPath();
    g.ellipse(x, y, w, 4.5, 0, 0, Math.PI * 2);
    g.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(22, 22);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createGroundTexture(baseColor, speckleA, speckleB) {
  const c = makeCanvas(256, 256);
  const g = c.getContext('2d');
  g.fillStyle = baseColor;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) {
    const x = (i * 83) % 256;
    const y = (i * 47) % 256;
    g.fillStyle = i % 2 === 0 ? speckleA : speckleB;
    g.fillRect(x, y, 3, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(36, 36);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSignTexture(text, neonHex = '#ff4d9d') {
  const c = makeCanvas(512, 128);
  const g = c.getContext('2d');
  g.fillStyle = '#120a24';
  g.fillRect(0, 0, 512, 128);

  g.strokeStyle = neonHex;
  g.lineWidth = 8;
  g.strokeRect(8, 8, 496, 112);

  g.font = '900 42px "Segoe UI", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = neonHex;
  g.shadowBlur = 18;
  g.fillStyle = '#ffffff';
  g.fillText(text, 256, 66);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWakeTexture() {
  const c = makeCanvas(128, 128);
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(128, 64, 0, 64);
  grad.addColorStop(0, 'rgba(235, 252, 255, 0.85)');
  grad.addColorStop(0.55, 'rgba(130, 240, 255, 0.42)');
  grad.addColorStop(1, 'rgba(130, 240, 255, 0)');
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(128, 52);
  g.lineTo(128, 76);
  g.lineTo(0, 124);
  g.lineTo(0, 4);
  g.closePath();
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const wakeTexture = createWakeTexture();

// ==================== 3D VEHICLES ====================

const wheelGeo = new THREE.CylinderGeometry(5.2, 5.2, 4.0, 12);
wheelGeo.rotateX(Math.PI * 0.5);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x151821, roughness: 0.8 });
const rimMat = new THREE.MeshStandardMaterial({ color: 0xdcf0ff, metalness: 0.75, roughness: 0.22 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x162442, metalness: 0.85, roughness: 0.14 });
const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfff8d6 });
const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff2a68 });

export function createVehicleMesh(v) {
  const group = new THREE.Group();
  const len = v.h;
  const wid = v.w;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(v.color || '#ff3b8d'),
    metalness: 0.38,
    roughness: 0.26,
  });

  if (v.boat) {
    const hull = new THREE.Mesh(new THREE.BoxGeometry(len * 0.86, 8, wid * 0.86), bodyMat);
    hull.position.set(-len * 0.04, 4, 0);
    hull.castShadow = true;
    group.add(hull);

    const bow = new THREE.Mesh(new THREE.ConeGeometry(wid * 0.48, len * 0.34, 4), bodyMat);
    bow.rotation.z = -Math.PI * 0.5;
    bow.rotation.x = Math.PI * 0.25;
    bow.position.set(len * 0.45, 4.5, 0);
    group.add(bow);

    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(len * 0.65, 2.5, wid * 0.72),
      new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: 0.3 }),
    );
    deck.position.set(-2, 8.5, 0);
    group.add(deck);

    const shield = new THREE.Mesh(new THREE.BoxGeometry(len * 0.22, 6, wid * 0.64), glassMat);
    shield.position.set(len * 0.08, 11.5, 0);
    shield.rotation.z = -0.35;
    group.add(shield);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(len * 0.72, 1.8, wid * 0.9),
      new THREE.MeshBasicMaterial({ color: 0x00f5ff }),
    );
    stripe.position.set(0, 6.2, 0);
    group.add(stripe);

    // Tapered frothy white V-wake behind boat
    const wakeMat = new THREE.MeshBasicMaterial({
      map: wakeTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const wake = new THREE.Mesh(new THREE.PlaneGeometry(78, wid * 2.2), wakeMat);
    wake.rotation.x = -Math.PI * 0.5;
    wake.position.set(-len * 0.95, 0.85, 0);
    group.add(wake);
    group.userData.wake = wake;
    group.userData.bodyMat = bodyMat;
    return group;
  }

  // Chassis + sporty front hood taper
  const bodyH = v.type === 'swat' ? 18 : v.type === 'suv' ? 13 : v.type === 'moto' ? 7 : 8.5;
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(len, bodyH, wid), bodyMat);
  chassis.position.set(0, 5 + bodyH * 0.5, 0);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);
  group.userData.bodyMat = bodyMat;

  // Cabin / Windshield
  if (v.type !== 'moto') {
    const cabLen = v.type === 'swat' ? len * 0.76 : v.type === 'suv' ? len * 0.56 : len * 0.44;
    const cabH = v.type === 'swat' ? 8 : v.type === 'suv' ? 9 : 7.2;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(cabLen, cabH, wid * 0.82), glassMat);
    cab.position.set(v.type === 'swat' ? -len * 0.04 : -len * 0.06, 5 + bodyH + cabH * 0.44, 0);
    cab.castShadow = true;
    group.add(cab);

    const roofColor = v.type === 'police' ? 0xf8fafc : v.type === 'swat' ? 0x26344d : bodyMat.color;
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(cabLen * 0.82, 1.5, wid * 0.78),
      new THREE.MeshStandardMaterial({ color: roofColor, metalness: 0.35, roughness: 0.3 }),
    );
    roof.position.set(cab.position.x, 5 + bodyH + cabH * 0.9, 0);
    group.add(roof);
  }

  // Police white doors, hood accent & red/blue lightbar
  if (v.type === 'police' || v.type === 'swat') {
    if (v.type === 'police') {
      const doorWhite = new THREE.Mesh(
        new THREE.BoxGeometry(len * 0.46, bodyH * 0.88, wid + 0.7),
        new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.32 }),
      );
      doorWhite.position.set(-1, 5 + bodyH * 0.5, 0);
      group.add(doorWhite);
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(len * 0.96, 1.8, wid + 0.8),
        new THREE.MeshBasicMaterial({ color: 0x00d2ff }),
      );
      stripe.position.set(0, 7.2, 0);
      group.add(stripe);
    } else {
      // SWAT side tactical stripe
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(len * 0.85, 2.4, wid + 0.8),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      );
      stripe.position.set(0, 14, 0);
      group.add(stripe);
    }

    const barY = v.type === 'swat' ? 31.5 : 22.2;
    const redPod = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 3.2, wid * 0.4),
      new THREE.MeshBasicMaterial({ color: 0xff2244 }),
    );
    redPod.position.set(-2, barY, -wid * 0.22);
    const bluePod = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 3.2, wid * 0.4),
      new THREE.MeshBasicMaterial({ color: 0x00c8ff }),
    );
    bluePod.position.set(-2, barY, wid * 0.22);
    group.add(redPod, bluePod);
    group.userData.redPod = redPod;
    group.userData.bluePod = bluePod;

    const sirenLight = new THREE.PointLight(0xff2244, 0, 160, 1.4);
    sirenLight.position.set(0, barY + 6, 0);
    group.add(sirenLight);
    group.userData.sirenLight = sirenLight;
  }

  // Sports Coupe GT Wing Spoiler + Neon Underglow + Nitro Exhaust Cones
  if (v.type === 'coupe' || v.type === 'muscle') {
    if (v.type === 'coupe') {
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(5.5, 1.6, wid * 1.08),
        new THREE.MeshStandardMaterial({ color: 0x161a28, metalness: 0.6, roughness: 0.25 }),
      );
      wing.position.set(-len * 0.44, 5 + bodyH + 4.4, 0);
      group.add(wing);

      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(len * 1.12, wid * 1.35),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(v.color || '#ff3b8d'), transparent: true, opacity: 0.55 }),
      );
      glow.rotation.x = -Math.PI * 0.5;
      glow.position.y = 0.65;
      group.add(glow);
      group.userData.underglow = glow;
    }

    const nitroGroup = new THREE.Group();
    const flameGeo = new THREE.ConeGeometry(3.8, 28, 10);
    flameGeo.rotateZ(Math.PI * 0.5);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x48f8ff, transparent: true, opacity: 0.92 });
    const f1 = new THREE.Mesh(flameGeo, flameMat);
    f1.position.set(-len * 0.5 - 13, 6.5, -wid * 0.25);
    const f2 = new THREE.Mesh(flameGeo, flameMat);
    f2.position.set(-len * 0.5 - 13, 6.5, wid * 0.25);
    nitroGroup.add(f1, f2);
    nitroGroup.visible = false;
    group.add(nitroGroup);
    group.userData.nitro = nitroGroup;
  }

  if (v.type === 'taxi') {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(8, 3.2, 11), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
    sign.position.set(-2, 22.2, 0);
    group.add(sign);
  }

  // Headlights, ground headlight beam & Taillights
  const hl1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.8, 5.8), headLightMat);
  hl1.position.set(len * 0.5 + 0.3, 8.5, -wid * 0.3);
  const hl2 = hl1.clone();
  hl2.position.z = wid * 0.3;
  const tl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, wid * 0.88), tailLightMat);
  tl.position.set(-len * 0.5 - 0.3, 8.8, 0);
  group.add(hl1, hl2, tl);

  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(54, wid * 1.45),
    new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.14, depthWrite: false }),
  );
  beam.rotation.x = -Math.PI * 0.5;
  beam.position.set(len * 0.5 + 26, 0.7, 0);
  group.add(beam);

  const wx = len * 0.32;
  const wz = wid * 0.48;
  const wheelCoords = v.type === 'moto'
    ? [[wx, 5.2, 0], [-wx, 5.2, 0]]
    : [[wx, 5.2, -wz], [wx, 5.2, wz], [-wx, 5.2, -wz], [-wx, 5.2, wz]];
  for (const [x, y, z] of wheelCoords) {
    const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
    wMesh.position.set(x, y, z);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 4.3, 8).rotateX(Math.PI * 0.5), rimMat);
    wMesh.add(rim);
    group.add(wMesh);
  }

  return group;
}

// ==================== 3D POLICE HELICOPTER ====================

export function createHelicopterMesh() {
  const g = new THREE.Group();
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b263b, metalness: 0.5, roughness: 0.35 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf4f7fc, roughness: 0.4 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(46, 16, 18), darkMat);
  g.add(body);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(36, 4.5, 18.6), whiteMat);
  stripe.position.y = -2;
  g.add(stripe);
  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 16), glassMat);
  cockpit.position.set(22, -1, 0);
  g.add(cockpit);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(44, 5, 5), darkMat);
  tail.position.set(-40, 2, 0);
  g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(8, 16, 2.5), darkMat);
  fin.position.set(-60, 7, 0);
  g.add(fin);

  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(0, 11, 0);
  const bladeMat = new THREE.MeshBasicMaterial({ color: 0xd8e2f0, transparent: true, opacity: 0.82 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(92, 1.2, 3.6), bladeMat);
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 92), bladeMat);
  rotorGroup.add(b1, b2);
  g.add(rotorGroup);
  g.userData.rotor = rotorGroup;

  const coneGeo = new THREE.ConeGeometry(54, 150, 20, 1, true);
  coneGeo.translate(0, -75, 0);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xd8f8ff,
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.set(14, -8, 0);
  g.add(cone);
  g.userData.searchCone = cone;

  return g;
}

// ==================== 3D ARTICULATED CHARACTERS ====================

export function createCharacterMesh(opts) {
  const g = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(opts.skin || '#dfaa84'), roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(opts.shirt || '#ff4d6d'), roughness: 0.5 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(opts.pants || '#23283c'), roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(opts.hair || '#211615'), roughness: 0.8 });

  const legGeo = new THREE.BoxGeometry(3.8, 9.5, 3.8);
  const legL = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(0, 4.75, -2.5);
  legL.castShadow = true;
  const legR = new THREE.Mesh(legGeo, pantsMat);
  legR.position.set(0, 4.75, 2.5);
  legR.castShadow = true;
  g.add(legL, legR);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(5.8, 10.5, 9.5), shirtMat);
  torso.position.set(0, 14.5, 0);
  torso.castShadow = true;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(5.6, 5.8, 5.6), skinMat);
  head.position.set(0, 22.8, 0);
  head.castShadow = true;
  g.add(head);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.6, 6.0), hairMat);
  hair.position.set(-0.3, 25.4, 0);
  g.add(hair);

  if (opts.sunglasses) {
    const shades = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 5.4), new THREE.MeshBasicMaterial({ color: 0x090b12 }));
    shades.position.set(2.7, 23.0, 0);
    g.add(shades);
  }

  const armGeo = new THREE.BoxGeometry(3.2, 8.5, 3.0);
  const armL = new THREE.Mesh(armGeo, shirtMat);
  armL.position.set(0, 14.2, -6.2);
  const armR = new THREE.Mesh(armGeo, shirtMat);
  armR.position.set(0, 14.2, 6.2);
  g.add(armL, armR);

  if (opts.armed) {
    const gun = new THREE.Mesh(
      new THREE.BoxGeometry(11.5, 2.2, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x1b202b, metalness: 0.7, roughness: 0.3 }),
    );
    gun.position.set(7.5, 15.2, 3.6);
    g.add(gun);
    armR.rotation.z = Math.PI * 0.45;
    armR.position.set(3.2, 15.6, 4.6);
  }

  const phone = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 3.2, 2.0),
    new THREE.MeshBasicMaterial({ color: 0x56f0ff }),
  );
  phone.position.set(5.5, 19.5, 4.0);
  phone.visible = false;
  g.add(phone);

  g.userData = { legL, legR, armL, armR, shirtMat, pantsMat, phone };
  return g;
}

// ==================== 3D ALLIGATOR ====================

export function createAlligatorMesh() {
  const g = new THREE.Group();
  const scaleMat = new THREE.MeshStandardMaterial({ color: 0x358244, roughness: 0.7 });
  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x1e5229, roughness: 0.78 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(24, 5.5, 11), scaleMat);
  body.position.set(0, 2.4, 0);
  g.add(body);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(16, 3.6, 7.2), scaleMat);
  snout.position.set(18, 2.0, 0);
  g.add(snout);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(1.2, 6, 6), eyeMat);
  eyeL.position.set(11, 4.8, -3.0);
  const eyeR = eyeL.clone();
  eyeR.position.z = 3.0;
  g.add(eyeL, eyeR);

  for (let i = -8; i <= 8; i += 4) {
    const r = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.8, 4), ridgeMat);
    r.position.set(i, 6.0, 0);
    g.add(r);
  }

  const tail = new THREE.Mesh(new THREE.ConeGeometry(4.5, 24, 6), scaleMat);
  tail.rotation.z = Math.PI * 0.5;
  tail.position.set(-22, 2.2, 0);
  g.add(tail);

  g.userData.tail = tail;
  return g;
}

// ==================== 3D TREES & LANDMARK PROPS ====================

const trunkMat = new THREE.MeshStandardMaterial({ color: 0x82573b, roughness: 0.9 });
const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x32cc70, roughness: 0.55, side: THREE.DoubleSide });
const palmLeafDark = new THREE.MeshStandardMaterial({ color: 0x1e9652, roughness: 0.6, side: THREE.DoubleSide });
const pineLeafMat = new THREE.MeshStandardMaterial({ color: 0x1d5c3e, roughness: 0.8 });
const cypressLeafMat = new THREE.MeshStandardMaterial({ color: 0x2d784e, roughness: 0.82 });

export function createTreeMesh(kind, scale = 1) {
  const g = new THREE.Group();
  if (kind === 'palm') {
    const h = 48 * scale;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.5 * scale, 2.9 * scale, h, 7), trunkMat);
    trunk.position.y = h * 0.5;
    trunk.rotation.z = 0.09;
    trunk.castShadow = true;
    g.add(trunk);

    const crown = new THREE.Group();
    crown.position.set(-h * 0.045, h, 0);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const frondGroup = new THREE.Group();
      frondGroup.rotation.y = -a;
      const inner = new THREE.Mesh(new THREE.BoxGeometry(12 * scale, 0.8, 3.8 * scale), i % 2 === 0 ? palmLeafMat : palmLeafDark);
      inner.position.set(6 * scale, 0.5, 0);
      inner.rotation.z = 0.14;
      const tip = new THREE.Mesh(new THREE.BoxGeometry(11 * scale, 0.7, 3.0 * scale), i % 2 === 0 ? palmLeafMat : palmLeafDark);
      tip.position.set(16 * scale, -2.5 * scale, 0);
      tip.rotation.z = -0.52;
      frondGroup.add(inner, tip);
      crown.add(frondGroup);
    }
    g.add(crown);
  } else if (kind === 'pine') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.2 * scale, 3.2 * scale, 18 * scale, 6), trunkMat);
    trunk.position.y = 9 * scale;
    g.add(trunk);
    for (let t = 0; t < 3; t++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry((15 - t * 3.5) * scale, 18 * scale, 7), pineLeafMat);
      cone.position.y = (20 + t * 11) * scale;
      cone.castShadow = true;
      g.add(cone);
    }
  } else {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.6 * scale, 5.6 * scale, 36 * scale, 7), trunkMat);
    trunk.position.y = 18 * scale;
    g.add(trunk);
    const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(18 * scale, 0), cypressLeafMat);
    canopy.scale.set(1.3, 0.72, 1.3);
    canopy.position.y = 37 * scale;
    canopy.castShadow = true;
    g.add(canopy);
  }
  return g;
}

export function createSwampUFOMesh() {
  const g = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xc2d4ed, metalness: 0.82, roughness: 0.22 });
  const domeMat = new THREE.MeshBasicMaterial({ color: 0x70faff });

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(32, 46, 12, 24), metalMat);
  g.add(disc);
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(46, 20, 8, 24), metalMat);
  bottom.position.y = -10;
  g.add(bottom);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(20, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), domeMat);
  dome.position.y = 5;
  g.add(dome);

  const ringLights = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 8, 8),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x00f5ff : 0xff4dff }),
    );
    bulb.position.set(Math.cos(a) * 41, -1, Math.sin(a) * 41);
    ringLights.add(bulb);
  }
  g.add(ringLights);
  g.userData.ringLights = ringLights;

  const beamGeo = new THREE.ConeGeometry(54, 118, 24, 1, true);
  beamGeo.translate(0, -59, 0);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x38f6ff,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = -10;
  g.add(beam);

  // Glowing cyan water reflection pool right beneath the tractor beam
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(56, 24).rotateX(-Math.PI * 0.5),
    new THREE.MeshBasicMaterial({ color: 0x56f8ff, transparent: true, opacity: 0.42, depthWrite: false }),
  );
  pool.position.y = -102;
  g.add(pool);

  const ufoLight = new THREE.PointLight(0x38f6ff, 5.5, 320, 1.3);
  ufoLight.position.y = -20;
  g.add(ufoLight);

  return g;
}
