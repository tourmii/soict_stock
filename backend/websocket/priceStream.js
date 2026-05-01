export function setupPriceStream(wss, engine) {
  const clients = new Set();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`📡 WebSocket client connected (${clients.size} total)`);

    // Send initial prices
    ws.send(JSON.stringify({ type: 'prices', data: engine.prices }));

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`📡 WebSocket client disconnected (${clients.size} total)`);
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
