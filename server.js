const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // WebSocketサーバーを同じHTTPサーバーに統合
  const wss = new WebSocketServer({ server, path: "/ws" });

  const clients = new Map();

  wss.on("connection", (ws, req) => {
    const { query } = parse(req.url || "", true);
    const userId = query.userId;

    if (!userId) {
      ws.close();
      return;
    }

    const client = {
      ws,
      userId,
      channelIds: new Set(),
    };

    clients.set(userId, client);
    console.log(`Client connected: ${userId}`);

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case "join_channel":
            client.channelIds.add(message.channelId);
            console.log(`User ${userId} joined channel ${message.channelId}`);
            break;

          case "leave_channel":
            client.channelIds.delete(message.channelId);
            console.log(`User ${userId} left channel ${message.channelId}`);
            break;

          case "message":
            console.log(`Broadcasting message to channel ${message.channelId}`);
            broadcastToChannel(message.channelId, {
              type: "message",
              data: message.data,
            });
            break;

          case "mention":
            sendToUser(message.mentionedUserId, {
              type: "mention",
              data: message.data,
            });
            break;

          case "read":
            broadcastToChannel(
              message.channelId,
              {
                type: "read",
                data: message.data,
              },
              userId
            );
            break;

          case "typing":
            console.log(
              `User ${userId} is typing in thread ${message.threadId}`
            );
            broadcastToChannel(
              message.channelId,
              {
                type: "typing",
                data: {
                  userId: message.data.userId,
                  userName: message.data.userName,
                  threadId: message.threadId,
                },
              },
              userId
            );
            break;
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    ws.on("close", () => {
      clients.delete(userId);
      console.log(`Client disconnected: ${userId}`);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
  });

  function broadcastToChannel(channelId, message, excludeUserId) {
    let sentCount = 0;
    clients.forEach((client, userId) => {
      if (client.channelIds.has(channelId)) {
        if (excludeUserId && userId === excludeUserId) {
          return;
        }
        if (client.ws.readyState === 1) {
          // WebSocket.OPEN
          client.ws.send(JSON.stringify(message));
          sentCount++;
        }
      }
    });
    console.log(`Broadcast to ${sentCount} clients in channel ${channelId}`);
  }

  function sendToUser(userId, message) {
    const client = clients.get(userId);
    if (client && client.ws.readyState === 1) {
      // WebSocket.OPEN
      client.ws.send(JSON.stringify(message));
    }
  }

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws`);
  });
});
