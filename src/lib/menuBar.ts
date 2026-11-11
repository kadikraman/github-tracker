import { activate } from '@legendapp/spark/app';
import { createTray } from '@legendapp/spark/tray';
import {
  addWindowListener,
  getCursorPoint,
  getDisplays,
  hideWindow,
  listWindows,
  openWindow,
  setWindowBounds,
  showWindow,
} from '@legendapp/spark/windows';

export const POPOVER_COMPONENT = 'GitHubTrackerMenuBar';
const POPOVER_ID = 'popover';
const WIDTH = 380;
const HEIGHT = 790;
// A tray click on an open popover blurs it first (which hides it), then
// arrives as a click; without this window the click would reopen it.
const REOPEN_GRACE_MS = 300;

let listening = false;
let hiddenByBlurAt = 0;

// The native window outlives a JS reload, so ask Spark rather than keep a flag.
async function findPopover() {
  return (await listWindows()).find((window) => window.id === POPOVER_ID);
}

// The tray API gives no status item frame, but a click leaves the cursor on
// the icon, so the popover centres on the cursor under the menu bar.
async function popoverPosition() {
  const cursor = await getCursorPoint();
  const display = (await getDisplays()).find((d) => d.id === cursor.displayId);
  if (!display) {
    throw new Error(`Unknown display ${cursor.displayId}`);
  }
  const { workArea } = display;
  const x = Math.min(
    Math.max(cursor.x - WIDTH / 2, workArea.x + 6),
    workArea.x + workArea.width - WIDTH - 6
  );
  return {
    position: { displayId: display.id, x, y: workArea.y + 4 },
    size: { width: WIDTH, height: Math.min(HEIGHT, workArea.height - 8) },
  };
}

async function openPopover(): Promise<void> {
  const { position, size } = await popoverPosition();
  if (await findPopover()) {
    await setWindowBounds(POPOVER_ID, { ...position, ...size });
  } else {
    // An overlay keeps showing while another app is active, and the hidden
    // (titled) title bar lets it become key, so it gets blur events.
    await openWindow({
      id: POPOVER_ID,
      component: POPOVER_COMPONENT,
      kind: 'overlay',
      size,
      position,
      titleBarStyle: 'hidden',
      // Without an appearance Spark makes the window dark, so the glass stayed
      // dark under the light palette. 'system' follows the app's appearance,
      // which ThemeProvider sets.
      appearance: 'system',
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: true,
      closable: false,
      show: false,
      macos: {
        level: 'status',
        titleBar: {
          trafficLights: false,
          titleVisibility: 'hidden',
          transparent: true,
          contentLayout: 'fullSize',
        },
      },
    });
  }
  if (!listening) {
    await addWindowListener(POPOVER_ID, 'focusChanged', (event) => {
      if (!event.focused) {
        hiddenByBlurAt = Date.now();
        hideWindow(POPOVER_ID).catch(logError);
      }
    });
    listening = true;
  }
  await showWindow(POPOVER_ID, { focus: true });
}

async function togglePopover(): Promise<void> {
  if (Date.now() - hiddenByBlurAt < REOPEN_GRACE_MS) {
    return;
  }
  if ((await findPopover())?.visible) {
    await hideWindow(POPOVER_ID);
    return;
  }
  await openPopover();
}

export function closePopover(): void {
  findPopover()
    .then((popover) => (popover?.visible ? hideWindow(POPOVER_ID) : undefined))
    .catch(logError);
}

// The popover is a non-activating panel, so a click in it leaves the app
// inactive, and showWindow alone then orders the main window behind the
// active app's front window.
export function openMainWindow(): void {
  closePopover();
  activate()
    .then(() => showWindow('main', { focus: true }))
    .catch(logError);
}

function logError(error: unknown): void {
  console.error('Menu bar popover failed', error);
}

/** Adds the menu bar item. Call once, at module scope. */
export function startMenuBar(): void {
  createTray({
    id: 'github-tracker',
    tooltip: 'GitHub Tracker',
    macos: { symbol: 'point.3.filled.connected.trianglepath.dotted' },
    onAction: (action) => {
      if (action.type === 'click') {
        togglePopover().catch(logError);
      }
    },
  }).catch(logError);
}
