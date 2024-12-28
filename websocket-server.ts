import type { Server as HttpServer, IncomingMessage, ServerResponse } from "node:http";
import type { IRoomRepository } from "@/server/domain/models/room/IRoomRepository";
import { Room } from "@/server/domain/models/room/Room";
import { User } from "@/server/domain/models/user/User";
import { InMemoryRoomRepository } from "@/server/infra/inMemory/InMemoryRoomStore";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, WebsocketServer } from "./types/Websocket";

export class WebSocketServer {
  private readonly io: WebsocketServer;
  private readonly roomRepository: IRoomRepository;

  constructor(httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse>) {
    this.io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
    this.roomRepository = new InMemoryRoomRepository();
  }

  setUp() {
    // WebSocket connection handler
    this.io.on("connection", (socket) => {
      // console.log("A client connected: ", socket.id);

      socket.on("disconnect", () => {
        // console.log("A client disconnected: ", socket.id);
      });

      socket.on("create_room", async (language) => {
        const room = new Room(language, (message) => {
          this.io.to(room.id).emit("message", message);
        });
        await this.roomRepository.createRoom(room);
        socket.emit("created_room", room.id);
      });

      socket.on("join", async (roomId) => {
        socket.join(roomId);
        const user = new User(socket.id);
        const room = await this.roomRepository.getRoom(roomId);
        if (!room) {
          // socket.emit("join_failed", `room(id: ${roomId}) is not found.`);
          return;
        }
        room.join(user);
        for (const message of room.messages) {
          socket.emit("message", message);
        }
      });

      socket.on("leave", async (roomId) => {
        socket.leave(roomId);
        const user = new User(socket.id);
        const room = await this.roomRepository.getRoom(roomId);
        if (!room) {
          return;
        }
        room.leave(user);
      });

      socket.on("add_text_message", async (roomId, text) => {
        const room = await this.roomRepository.getRoom(roomId);
        room?.addTextMessage(text);
      });

      socket.on("add_audio_message", async (roomId, arrayBuffer) => {
        const room = await this.roomRepository.getRoom(roomId);
        room?.addAudioMessage(arrayBuffer);
      });
    });
  }
}
