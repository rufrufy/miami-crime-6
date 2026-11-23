// SOLAGRAM in-game viral social media feed & dual-protagonist banter system.

const HANDLES = ['@bayside_watch', '@solara_live', '@marsh_hunter', '@neon_drift', '@keys_daily', '@coast_scanner'];

export function createSocial() {
  return {
    activePost: null,
    postTimer: 0,
    cooldown: 0,
    dialogue: null,
    dialogueTimer: 0,
    history: [],
  };
}

export function postSolagram(state, caption, cloutGain = 250, handle = null) {
  const mult = state.player.activeId === 'elena' ? 1.35 : 1.0;
  const gain = Math.round(cloutGain * mult);
  state.player.clout += gain;

  const views = (12 + Math.floor(Math.random() * 140) + Math.floor(state.player.clout * 0.015)).toFixed(1) + 'K views';
  const post = {
    handle: handle || HANDLES[Math.floor(Math.random() * HANDLES.length)],
    text: caption,
    views,
    clout: `+${gain} CLOUT`,
  };
  state.social.activePost = post;
  state.social.postTimer = 6.5;
  state.social.cooldown = 3.2;
  state.social.history.unshift(post);
  if (state.social.history.length > 12) state.social.history.pop();
  if (state.audio) state.audio.playClout();
}

export function sayDialogue(state, speaker, text, duration = 4.6) {
  state.social.dialogue = {
    speaker: speaker.toUpperCase(),
    text,
    cls: speaker.toLowerCase().includes('elena') ? 'elena' : speaker.toLowerCase().includes('dispatch') ? 'dispatch' : 'marco',
  };
  state.social.dialogueTimer = duration;
}

export function updateSocial(state, dt) {
  if (state.social.cooldown > 0) state.social.cooldown -= dt;
  if (state.social.postTimer > 0) {
    state.social.postTimer -= dt;
    if (state.social.postTimer <= 0) state.social.activePost = null;
  }
  if (state.social.dialogueTimer > 0) {
    state.social.dialogueTimer -= dt;
    if (state.social.dialogueTimer <= 0) state.social.dialogue = null;
  }
}
