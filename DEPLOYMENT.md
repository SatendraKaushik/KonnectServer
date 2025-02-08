# Deployment Guide

## Deploying to Render

1. Create a new account on [Render](https://render.com) if you haven't already
2. Click "New +" and select "Web Service"
3. Connect your repository or upload the following files:
   ```
   server/
   shared/
   package.json
   render.yaml
   tsconfig.json
   ```
4. Configure your web service:
   - Name: tab-share-server (or your preferred name)
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

## Updating the Extension

After deploying to Render, you need to update the WebSocket URL in the extension:

1. Open `client/src/lib/webSocket.ts`
2. Find this line:
   ```typescript
   const wsUrl = 'wss://your-render-app.onrender.com/ws';
   ```
3. Replace `your-render-app.onrender.com` with your actual Render app URL
4. Rebuild the extension:
   ```bash
   cd client
   ./build-extension.sh
   ```
5. Load the updated extension in Chrome

## Verifying the Deployment

1. Make sure your Render service is running (check the logs on Render dashboard)
2. Install the extension in Chrome
3. Click the extension icon
4. Try sharing tabs - you should see your connection ID
5. On another device/browser, use this connection ID to connect and see shared tabs

## Troubleshooting

If you encounter connection issues:
1. Check if the WebSocket URL in `webSocket.ts` matches your Render app URL
2. Ensure you're using `wss://` protocol (secure WebSocket)
3. Check Render logs for any server-side errors
4. Make sure the extension has permission to connect to your Render domain
