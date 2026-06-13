/**
 * WebSocket Price Stream
 *
 * Lifecycle:
 *   1. HTTP server starts and accepts WebSocket connections BEFORE engine.initialize().
 *   2. Clients connecting during initialization receive { type: 'loading' }.
 *   3. As each stock's history is generated, { type: 'init_progress' } is broadcast.
 *   4. After initialize() finishes, broadcastReady() sends { type: 'init' } to every
 *      connected client with the last 30 days of 5-minute bars.
 *   5. Clients connecting after initialization immediately receive { type: 'init' }.
 *   6. Real-time { type: 'tick' } broadcasts start only after initialization.
 */
let engineReady = false;

export function setupPriceStream(wss, engine) {
  const clients = new Set();

  wss.on('connection', async (ws) => {
    clients.add(ws);
    console.log(` WebSocket client connected (${clients.size} total)`);

    if (engineReady) {
      // Engine is ready — send recent history immediately
      _sendInit(ws, engine);
    } else {
      // Engine still initializing — tell the client to show a loading screen
      _safeSend(ws, { type: 'loading', data: { message: 'Generating 1-year market history…' } });
    }

    ws.on('close', () => {
      clients.delete(ws);
      console.log(` WebSocket client disconnected (${clients.size} remaining)`);
    });
    ws.on('error', () => clients.delete(ws));
  });

  // Broadcast real-time ticks (skipped before engine is ready)
  engine.onTick((updates) => {
    if (!engineReady) return;
    const msg = JSON.stringify({ type: 'tick', data: updates });
    for (const ws of clients) {
      if (ws.readyState === 1) ws.send(msg);
    }
  });

  // Called by server.js with each stock's progress during engine.initialize()
  function broadcastProgress(progress) {
    const msg = JSON.stringify({ type: 'init_progress', data: progress });
    for (const ws of clients) {
      if (ws.readyState === 1) ws.send(msg);
    }
  }

  // Called by server.js after engine.initialize() completes
  async function broadcastReady() {
    engineReady = true;
    for (const ws of clients) {
      if (ws.readyState === 1) _sendInit(ws, engine);
    }
  }

  return { broadcastProgress, broadcastReady };
}

/* ── Helpers ───────────────────────────────────────────────────── */

async function _sendInit(ws, engine) {
  try {
    // 30 days of 5-min bars covers 15m and 1H charts fully.
    // 4H / 1D / 1W / 1M charts lazy-fetch from the REST API.
    const rawTicks = await engine.getRecentHistory(30);
    _safeSend(ws, { type: 'init', data: { prices: engine.prices, rawTicks } });
  } catch (err) {
    console.error('_sendInit error:', err.message);
    _safeSend(ws, { type: 'init', data: { prices: engine.prices, rawTicks: {} } });
  }
}

function _safeSend(ws, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}
