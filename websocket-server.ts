import type { Server as HttpServer, IncomingMessage, ServerResponse } from "node:http";
import type { IRoomRepository } from "@/server/domain/models/room/IRoomRepository";
import { Room } from "@/server/domain/models/room/Room";
import { User } from "@/server/domain/models/user/User";
import { InMemoryRoomRepository } from "@/server/infra/persistence/inMemory/InMemoryRoomStore";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, WebsocketServer } from "./types/Websocket";

export class WebSocketServer {
  private readonly io: WebsocketServer;
  private readonly roomRepository: IRoomRepository;

  constructor(httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse>) {
    this.io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);
    // TODO: 特定のインフラに依存しないように抽象化する
    this.roomRepository = new InMemoryRoomRepository();
  }

  setUp() {
    setInterval(async () => {
      const list = await this.roomRepository.listRooms();
      for (const room of list) {
        console.log(room.toString());
      }
    }, 5000);

    // WebSocket connection handler
    this.io.on("connection", (socket) => {
      // console.log("A client connected: ", socket.id);

      socket.on("disconnect", () => {
        // console.log("A client disconnected: ", socket.id);
      });

      socket.on("create_room", async () => {
        const room = new Room((message) => {
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

      socket.on("add_text_message", async (roomId, text, language) => {
        const room = await this.roomRepository.getRoom(roomId);
        room?.addTextMessage(text, language);
      });

      socket.on("add_audio_message", async (roomId, arrayBuffer, language) => {
        const room = await this.roomRepository.getRoom(roomId);
        room?.addAudioMessage(arrayBuffer, language);
      });
    });
  }
}
