// Keyboard & mouse input manager with edge-triggered press tracking.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = {
    screenX: window.innerWidth * 0.5,
    screenY: window.innerHeight * 0.5,
    worldX: 0,
    worldY: 0,
    down: false,
    clicked: false,
  };

  window.addEventListener('keydown', (e) => {
    const code = e.code;
    if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }
    if (!keys.has(code)) pressed.add(code);
    keys.add(code);
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  window.addEventListener('blur', () => {
    keys.clear();
    mouse.down = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.screenX = e.clientX - rect.left;
    mouse.screenY = e.clientY - rect.top;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      mouse.down = true;
      mouse.clicked = true;
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
  });

  return {
    keys,
    mouse,
    isDown(code) {
      return keys.has(code);
    },
    consumePress(code) {
      if (pressed.has(code)) {
        pressed.delete(code);
        return true;
      }
      return false;
    },
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
    },
  };
}
