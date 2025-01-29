const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 }); // Use Render's PORT
const connections = new Map();

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "register") {
        // Store connection ID (host or client)
        connections.set(data.connectionId, ws);
        console.log(`Registered ID: ${data.connectionId}`);
      } else if (data.type === "signal") {
        // Forward signals (SDP offers/answers) to target client/host
        const target = connections.get(data.targetId);
        if (target) target.send(JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log("Signaling server running on port:", process.env.PORT || 8080);