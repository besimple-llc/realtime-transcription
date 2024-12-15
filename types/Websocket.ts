export interface ServerToClientEvents {
  message: (message: Message) => void;
  joined: (roomId: string) => void;
  left: (roomId: string) => void;
}

export interface ClientToServerEvents {
  join: (roomId: string) => void;
  leave: (roomId: string) => void;
  add_text_message: (roomId: string, text: string) => void;
  add_audio_message: (roomId: string, arrayBuffer: ArrayBuffer) => void;
}

export type Message = {
  messageJa: string;
  messageEn: string;
  datetime: string;
};
