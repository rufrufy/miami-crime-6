// Save / Load persistence via localStorage.

const SAVE_KEY = 'miami_crime_6_save_v1';

export function hasSave() {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}

export function saveGame(state) {
  try {
    const payload = {
      version: 1,
      savedAt: Date.now(),
      cash: state.player.cash,
      clout: state.player.clout,
      activeId: state.player.activeId,
      outfitIndex: state.player.outfitIndex,
      weaponIndex: state.player.weaponIndex,
      ammo: state.player.ammo,
      mag: state.player.mag,
      timeIndex: state.timeIndex,
      missionIndex: state.missions.index,
      missionsCompleted: state.missions.completed,
      discoveredMysteries: state.world.mysteries.filter((m) => m.discovered).map((m) => m.id),
      marco: {
        x: state.heroes.marco.x,
        y: state.heroes.marco.y,
        hp: state.heroes.marco.hp,
        armor: state.heroes.marco.armor,
      },
      elena: {
        x: state.heroes.elena.x,
        y: state.heroes.elena.y,
        hp: state.heroes.elena.hp,
        armor: state.heroes.elena.armor,
      },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
