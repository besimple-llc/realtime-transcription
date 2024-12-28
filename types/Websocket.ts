import type { Server } from "socket.io";
import type { Language } from "./Language";

export interface ServerToClientEvents {
  message: (message: Message) => void;
  created_room: (roomId: string) => void;
}

export interface ClientToServerEvents {
  create_room: () => void;
  join: (roomId: string) => void;
  leave: (roomId: string) => void;
  add_text_message: (roomId: string, text: string, language: Language) => void;
  add_audio_message: (roomId: string, arrayBuffer: ArrayBuffer, language: Language) => void;
}

export type WebsocketServer = Server<ClientToServerEvents, ServerToClientEvents>;

export type Message = {
  messageJa: string;
  messageEn: string;
  datetime: string;
};
