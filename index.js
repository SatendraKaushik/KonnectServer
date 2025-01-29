const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });
const connections = new Map();

wss.on("connection", (ws) => {
  let connectionId = null;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`Received message type: ${data.type}`);

      switch(data.type) {
        case 'register':
          connectionId = data.connectionId;
          connections.set(connectionId, ws);
          console.log(`Registered connection: ${connectionId}`);
          ws.send(JSON.stringify({
            type: 'registrationConfirmed',
            connectionId
          }));
          break;

        case 'connect':
          if (connections.has(data.targetId)) {
            const targetWs = connections.get(data.targetId);
            targetWs.send(JSON.stringify({
              type: 'connectionRequest',
              senderId: data.senderId
            }));
            console.log(`Routing connection request from ${data.senderId} to ${data.targetId}`);
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Target connection not found'
            }));
          }
          break;

        case 'signal':
          if (['offer', 'answer', 'candidate'].includes(data.signalType)) {
            const targetWs = connections.get(data.targetId);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify(data));
              console.log(`Forwarded ${data.signalType} to ${data.targetId}`);
            }
          }
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (err) {
      console.error("Message handling error:", err);
    }
  });

  ws.on('close', () => {
    console.log(`Connection closed: ${connectionId}`);
    if (connectionId) {
      connections.delete(connectionId);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error: ${error.message}`);
  });
});

// Cleanup stale connections periodically
setInterval(() => {
  console.log(`Active connections: ${connections.size}`);
  connections.forEach((ws, id) => {
    if (ws.readyState !== WebSocket.OPEN) {
      console.log(`Removing stale connection: ${id}`);
      connections.delete(id);
    }
  });
}, 30000);

console.log(`Signaling server running on port: ${process.env.PORT || 8080}`);