import redisClient from '../../shared/redisClient.js'
import { WebSocketServer } from 'ws';

export default function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });
  const activeConnections = new Map();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');

    ws.on('message', async (message) => {
      const { taskId, type } = JSON.parse(message);
      activeConnections.set(taskId, ws);

      if(type === 'enhance'){
        await redisClient.subscribeToTask(taskId, ws);
      }else{
        await redisClient.subscribeToRenderTask(taskId, ws);
      }
    });

    ws.on('close', () => {
      for (const [taskId, connection] of activeConnections.entries()) {
        if (connection === ws) {
          activeConnections.delete(taskId);
          break;
        }
      }
      console.log('WebSocket connection closed');
    });
  });
}

