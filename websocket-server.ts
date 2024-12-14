import type {Server as HttpServer, IncomingMessage, ServerResponse} from "node:http";
import {Server} from "socket.io";

export const setUpWebSocketServer = (httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse>) => {
  const io = new Server(httpServer);

  // WebSocket connection handler
  io.on("connection", (socket) => {
    console.log("A client connected");

    socket.on("join", (data: { roomId: string }) => {
      console.log("Joining room:", data);
      socket.join(data.roomId);
    });

    socket.on("room_message", (data: { roomId: string, message: string }) => {
      console.log("Received message:", data);
      // Broadcast the message to all connected clients
      io.to(data.roomId).emit("message", data.message);
    });

    socket.on("disconnect", () => {
      console.log("A client disconnected");
    });
  });
}
