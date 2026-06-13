/**
 * WebSocket Price Stream — sends unified tick data to all clients
 */
export function setupPriceStream(wss, engine) {
  const clients = new Set();

  wss.on('connection', async (ws) => {
    clients.add(ws);
    console.log(` WebSocket client connected (${clients.size} total)`);

    // Send full tick history so all clients have consistent price data
    try {
      const rawTicks = await engine.getAllTickHistory();
      ws.send(JSON.stringify({
        type: 'init',
        data: {
          prices: engine.prices,
          rawTicks,
        },
      }));
    } catch (err) {
      console.error('Error sending init data:', err.message);
      ws.send(JSON.stringify({
        type: 'init',
        data: {
          prices: engine.prices,
          rawTicks: {},
        },
      }));
    }

    ws.on('close', () => {
      clients.delete(ws);
      console.log(` WebSocket client disconnected (${clients.size} total)`);
    });

    ws.on('error', () => clients.delete(ws));
  });

  // Broadcast price updates on each tick
  engine.onTick((updates) => {
    const message = JSON.stringify({ type: 'tick', data: updates });
    for (const client of clients) {
      if (client.readyState === 1) {
        client.send(message);
      }
    }
  });
}
