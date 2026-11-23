// Live HUD DOM updater + tactical Minimap canvas renderer.
import { OUTFITS, PROTAGONISTS, TIME_PHASES, WEAPONS, WORLD_H, WORLD_W } from './config.js';
import { getMissionBanner } from './missions.js';
import { H_ROADS, ISLANDS, V_ROADS, getDistrictAt } from './world.js';

export function createHUD() {
  const mmCanvas = document.getElementById('minimap');
  const mmCtx = mmCanvas.getContext('2d');

  const els = {
    hud: document.getElementById('hud'),
    district: document.getElementById('hud-district'),
    time: document.getElementById('hud-time'),
    missionTitle: document.getElementById('mission-title'),
    missionObj: document.getElementById('mission-obj'),
    prompt: document.getElementById('interact-prompt'),
    stars: Array.from(document.querySelectorAll('#wanted-stars .star')),
    cash: document.getElementById('hud-cash'),
    clout: document.getElementById('hud-clout'),
    protagCard: document.getElementById('protag-card'),
    protagName: document.getElementById('hud-protag-name'),
    protagRole: document.getElementById('hud-protag-role'),
    barHp: document.getElementById('bar-hp'),
    barArmor: document.getElementById('bar-armor'),
    weaponName: document.getElementById('hud-weapon-name'),
    weaponAmmo: document.getElementById('hud-weapon-ammo'),
    solagram: document.getElementById('solagram-card'),
    sgHandle: document.getElementById('sg-handle'),
    sgText: document.getElementById('sg-text'),
    sgViews: document.getElementById('sg-views'),
    sgClout: document.getElementById('sg-clout'),
    dialogueBox: document.getElementById('dialogue-box'),
    dlgSpeaker: document.getElementById('dlg-speaker'),
    dlgText: document.getElementById('dlg-text'),
    vehPanel: document.getElementById('vehicle-panel'),
    vehName: document.getElementById('veh-name'),
    vehPlate: document.getElementById('veh-plate'),
    vehSpeed: document.getElementById('veh-speed'),
    vehNitro: document.getElementById('veh-nitro'),
    radio: document.getElementById('hud-radio'),
  };

  function renderMinimap(state) {
    const w = mmCanvas.width;
    const h = mmCanvas.height;
    const sx = w / WORLD_W;
    const sy = h / WORLD_H;

    // Terrain base
    mmCtx.fillStyle = '#253338';
    mmCtx.fillRect(0, 0, w, h);

    // Cypress Marsh
    mmCtx.fillStyle = '#183f36';
    mmCtx.fillRect(0, 2000 * sy, 1800 * sx, 1200 * sy);

    // Ocean & Harbor Water
    mmCtx.fillStyle = '#0077b6';
    mmCtx.fillRect(3340 * sx, 0, 860 * sx, 2240 * sy);
    mmCtx.fillRect(1760 * sx, 2140 * sy, 2440 * sx, 1060 * sy);
    mmCtx.fillRect(0, 1020 * sy, 420 * sx, 1040 * sy);

    // Coral Keys Islands
    mmCtx.fillStyle = '#4e7a62';
    for (const isl of ISLANDS) {
      mmCtx.fillRect(isl.x * sx, isl.y * sy, isl.w * sx, isl.h * sy);
    }

    // Roads
    mmCtx.strokeStyle = '#6f788a';
    mmCtx.lineWidth = 3;
    for (const rx of V_ROADS) {
      const maxY = rx === 740 ? 2040 : rx === 2960 ? 2700 : 2740;
      mmCtx.beginPath();
      mmCtx.moveTo(rx * sx, 180 * sy);
      mmCtx.lineTo(rx * sx, maxY * sy);
      mmCtx.stroke();
    }
    for (const ry of H_ROADS) {
      mmCtx.beginPath();
      mmCtx.moveTo((ry === 2520 ? 1400 : 380) * sx, ry * sy);
      mmCtx.lineTo(3120 * sx, ry * sy);
      mmCtx.stroke();
    }

    // Enterable Interiors (cyan squares)
    mmCtx.fillStyle = '#00e5ff';
    for (const it of state.world.interiors) {
      mmCtx.fillRect(it.doorX * sx - 2.5, it.doorY * sy - 2.5, 5, 5);
    }

    // Hidden Mysteries (purple rings)
    mmCtx.strokeStyle = '#c77dff';
    mmCtx.lineWidth = 1.5;
    for (const m of state.world.mysteries) {
      if (m.discovered) continue;
      mmCtx.beginPath();
      mmCtx.arc(m.x * sx, m.y * sy, 3.5, 0, Math.PI * 2);
      mmCtx.stroke();
    }

    // Mission Gold Beacon
    if (state.missions.marker) {
      const mk = state.missions.marker;
      mmCtx.fillStyle = '#ffd166';
      mmCtx.beginPath();
      mmCtx.arc(mk.x * sx, mk.y * sy, 4.5, 0, Math.PI * 2);
      mmCtx.fill();
    }

    // Police Blips + Vision Cones
    for (const v of state.vehicles) {
      if (!v.isPolice || v.dead) continue;
      const vx = v.x * sx;
      const vy = v.y * sy;
      if (state.wanted.level > 0) {
        mmCtx.fillStyle = 'rgba(255, 56, 100, 0.28)';
        mmCtx.beginPath();
        mmCtx.moveTo(vx, vy);
        mmCtx.arc(vx, vy, 14, v.angle - 0.5, v.angle + 0.5);
        mmCtx.closePath();
        mmCtx.fill();
      }
      mmCtx.fillStyle = Math.floor(state.time * 8) % 2 === 0 ? '#ff3864' : '#00d2ff';
      mmCtx.beginPath();
      mmCtx.arc(vx, vy, 2.8, 0, Math.PI * 2);
      mmCtx.fill();
    }

    // Partner Dot
    const partnerId = state.player.activeId === 'marco' ? 'elena' : 'marco';
    const partner = state.heroes[partnerId];
    mmCtx.fillStyle = PROTAGONISTS[partnerId].accent;
    mmCtx.beginPath();
    mmCtx.arc(partner.x * sx, partner.y * sy, 3, 0, Math.PI * 2);
    mmCtx.fill();

    // Active Player Directional Arrow
    const active = state.heroes[state.player.activeId];
    const px = (active.vehicle ? active.vehicle.x : active.x) * sx;
    const py = (active.vehicle ? active.vehicle.y : active.y) * sy;
    const ang = active.vehicle ? active.vehicle.angle : active.angle;
    mmCtx.save();
    mmCtx.translate(px, py);
    mmCtx.rotate(ang);
    mmCtx.fillStyle = '#ffffff';
    mmCtx.beginPath();
    mmCtx.moveTo(6, 0);
    mmCtx.lineTo(-4, -4);
    mmCtx.lineTo(-2, 0);
    mmCtx.lineTo(-4, 4);
    mmCtx.closePath();
    mmCtx.fill();
    mmCtx.restore();
  }

  function update(state, promptText = '') {
    const active = state.heroes[state.player.activeId];
    const px = active.vehicle ? active.vehicle.x : active.x;
    const py = active.vehicle ? active.vehicle.y : active.y;
    const dist = getDistrictAt(px, py);
    const phase = TIME_PHASES[state.timeIndex] || TIME_PHASES[0];

    els.district.textContent = dist.name;
    els.district.style.color = dist.accent;
    els.time.textContent = phase.label;

    const banner = getMissionBanner(state);
    els.missionTitle.textContent = banner.title;
    els.missionObj.textContent = banner.obj;

    if (promptText) {
      els.prompt.textContent = promptText;
      els.prompt.classList.remove('hidden');
    } else {
      els.prompt.classList.add('hidden');
    }

    // Wanted stars with flashing siren effect
    const flash = Math.floor(state.time * 6) % 2 === 0;
    els.stars.forEach((el, idx) => {
      el.classList.remove('active', 'flash-red', 'flash-blue');
      if (idx < state.wanted.level) {
        if (state.wanted.level >= 2) {
          el.classList.add(flash ? 'flash-red' : 'flash-blue');
        } else {
          el.classList.add('active');
        }
      }
    });

    els.cash.textContent = `$${state.player.cash.toLocaleString()}`;
    const cloutK = state.player.clout >= 1000 ? `${(state.player.clout / 1000).toFixed(1)}K` : `${state.player.clout}`;
    els.clout.textContent = `${cloutK} CLOUT`;

    const spec = PROTAGONISTS[state.player.activeId];
    const outfit = OUTFITS[state.player.outfitIndex] || OUTFITS[0];
    els.protagName.textContent = spec.name;
    els.protagRole.textContent = `${spec.role} · ${outfit.name}`;
    els.protagCard.classList.toggle('elena', state.player.activeId === 'elena');
    els.barHp.style.width = `${Math.max(0, Math.round((active.hp / active.maxHp) * 100))}%`;
    els.barArmor.style.width = `${Math.max(0, Math.round((active.armor / active.maxArmor) * 100))}%`;

    const wIdx = state.player.weaponIndex;
    const w = WEAPONS[wIdx];
    els.weaponName.textContent = w.name;
    els.weaponAmmo.textContent = w.melee ? '∞' : `${state.player.mag[wIdx]} / ${state.player.ammo[wIdx]}`;

    // Solagram viral feed card
    if (state.social.activePost) {
      const post = state.social.activePost;
      els.sgHandle.textContent = post.handle;
      els.sgText.textContent = post.text;
      els.sgViews.textContent = post.views;
      els.sgClout.textContent = post.clout;
      els.solagram.classList.remove('hidden');
    } else {
      els.solagram.classList.add('hidden');
    }

    // Dialogue banter box
    if (state.social.dialogue) {
      els.dlgSpeaker.textContent = `${state.social.dialogue.speaker}:`;
      els.dlgSpeaker.className = `dlg-speaker ${state.social.dialogue.cls}`;
      els.dlgText.textContent = state.social.dialogue.text;
      els.dialogueBox.classList.remove('hidden');
    } else {
      els.dialogueBox.classList.add('hidden');
    }

    // Vehicle Dashboard
    if (active.vehicle) {
      const v = active.vehicle;
      els.vehPanel.classList.remove('hidden');
      els.vehName.textContent = v.name;
      els.vehPlate.textContent = `${v.plate} · ${v.hotPlate ? 'HOT PLATE' : 'CLEAN'}`;
      els.vehPlate.className = `plate-pill ${v.hotPlate ? 'hot' : 'clean'}`;
      els.vehSpeed.textContent = Math.round(v.speed * 0.24);
      els.vehNitro.style.width = `${Math.round(v.nitro)}%`;
    } else {
      els.vehPanel.classList.add('hidden');
    }

    els.radio.textContent = state.audio ? state.audio.getStationName() : 'NEON SYNTH FM';
    renderMinimap(state);
  }

  return { els, update };
}
