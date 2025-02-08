import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { nanoid } from "nanoid";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Map<string, WebSocket>();

  function heartbeat(ws: WebSocket) {
    (ws as any).isAlive = true;
  }

  wss.on('connection', (ws) => {
    let connectionId: string | null = null;

    // Setup heartbeat
    (ws as any).isAlive = true;
    ws.on('pong', () => heartbeat(ws));

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received message:', message.type);

        switch (message.type) {
          case 'register':
            connectionId = message.connectionId || nanoid(10);
            clients.set(connectionId, ws);
            await storage.createConnection({ 
              connectionId, 
              isSharing: false 
            });
            ws.send(JSON.stringify({ 
              type: 'registered', 
              connectionId 
            }));
            break;

          case 'connect':
            if (!message.connectionId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'No connection ID provided'
              }));
              return;
            }
            const targetWs = clients.get(message.connectionId);
            if (targetWs) {
              targetWs.send(JSON.stringify({
                type: 'connectionRequest',
                senderId: connectionId
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Connection not found'
              }));
            }
            break;

          case 'tabSync':
            if (message.senderId && clients.has(message.senderId)) {
              const targetWs = clients.get(message.senderId);
              if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify(message));
              }
            }
            break;
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', async () => {
      if (connectionId) {
        clients.delete(connectionId);
        await storage.deleteConnection(connectionId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Heartbeat interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        return ws.terminate();
      }
      (ws as any).isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return httpServer;
}