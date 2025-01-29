// Example using WebSocket (Node.js)
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });
const connections = new Map();

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "register") {
      connections.set(data.connectionId, ws);
    } else if (data.type === "signal") {
      const target = connections.get(data.targetId);
      if (target) target.send(JSON.stringify(data));
    }
  });
});