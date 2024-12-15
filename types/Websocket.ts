export interface ServerToClientEvents {
  message: (message: Message) => void;
  joined: (roomId: string) => void;
  left: (roomId: string) => void;
}

export interface ClientToServerEvents {
  join: (roomId: string) => void;
  leave: (roomId: string) => void;
  room_message: (data: { roomId: string; message: Message }) => void;
  transcription: (roomId: string, arrayBuffer: ArrayBuffer) => void;
}

export type Message = {
  messageJa: string;
  messageEn: string;
  datetime: string;
};
