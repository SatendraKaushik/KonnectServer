const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });
const connections = new Map();

wss.on('connection', (ws) => {
    let connectionId = null;
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            switch(message.type) {
                case 'register':
                    connectionId = message.connectionId;
                    connections.set(connectionId, ws);
                    ws.send(JSON.stringify({
                        type: 'registered',
                        connectionId,
                        peers: Array.from(connections.keys())
                    }));
                    break;
                    
                case 'connect':
                    if (connections.has(message.targetId)) {
                        connections.get(message.targetId).send(JSON.stringify({
                            type: 'connectionRequest',
                            senderId: message.senderId
                        }));
                    }
                    break;
                    
                case 'signal':
                    if (connections.has(message.targetId)) {
                        connections.get(message.targetId).send(JSON.stringify(message));
                    }
                    break;
            }
        } catch (err) {
            console.error('Message error:', err);
        }
    });

    ws.on('close', () => {
        if (connectionId) {
            connections.delete(connectionId);
            console.log(`Connection ${connectionId} closed`);
        }
    });
});

console.log(`Signaling server running on port ${process.env.PORT || 8080}`);