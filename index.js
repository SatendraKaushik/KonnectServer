const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });
const connections = new Map();

wss.on("connection", (ws) => {
  let connectionId = null;
  let isAlive = true;

  const heartbeat = () => {
    isAlive = true;
  };

  ws.on('pong', heartbeat);

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received ${data.type} from ${data.connectionId || 'unknown'}`);

      switch(data.type) {
        case 'register':
          connectionId = data.connectionId;
          connections.set(connectionId, ws);
          ws.send(JSON.stringify({
            type: 'registered',
            connectionId,
            peers: Array.from(connections.keys())
          }));
          break;

        case 'connect':
          if (connections.has(data.targetId)) {
            connections.get(data.targetId).send(JSON.stringify({
              type: 'connectionRequest',
              senderId: data.senderId
            }));
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Peer unavailable'
            }));
          }
          break;

        case 'signal':
          if (['offer', 'answer', 'candidate'].includes(data.signalType)) {
            const target = connections.get(data.targetId);
            if (target?.readyState === WebSocket.OPEN) {
              target.send(JSON.stringify(data));
            }
          }
          break;

        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message type' }));
      }
    } catch (err) {
      console.error("Message error:", err);
    }
  });

  const interval = setInterval(() => {
    if (!isAlive) {
      ws.terminate();
      return;
    }
    isAlive = false;
    ws.ping();
  }, 30000);

  ws.on("close", () => {
    clearInterval(interval);
    if (connectionId) {
      connections.delete(connectionId);
      console.log(`Connection ${connectionId} removed`);
    }
  });

  ws.on("error", (error) => {
    console.error("WS error:", error);
  });
});

console.log(`Signaling server running on port ${process.env.PORT || 8080}`);