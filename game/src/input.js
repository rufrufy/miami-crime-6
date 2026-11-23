// Keyboard & mouse input manager with edge-triggered press tracking + 3D mouse look/aim.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = {
    screenX: window.innerWidth * 0.5,
    screenY: window.innerHeight * 0.5,
    ndcX: 0,
    ndcY: 0,
    dx: 0,
    dy: 0,
    worldX: 0,
    worldY: 0,
    down: false,
    rightDown: false,
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
    mouse.rightDown = false;
  });

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const nx = e.clientX - rect.left;
    const ny = e.clientY - rect.top;
    mouse.dx += e.movementX || (nx - mouse.screenX);
    mouse.dy += e.movementY || (ny - mouse.screenY);
    mouse.screenX = nx;
    mouse.screenY = ny;
    mouse.ndcX = (nx / Math.max(1, rect.width)) * 2 - 1;
    mouse.ndcY = -((ny / Math.max(1, rect.height)) * 2 - 1);
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      mouse.down = true;
      mouse.clicked = true;
    } else if (e.button === 2) {
      mouse.rightDown = true;
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.down = false;
    else if (e.button === 2) mouse.rightDown = false;
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
      mouse.dx = 0;
      mouse.dy = 0;
    },
  };
}
