import {type FormEventHandler, useState} from "react";
import type {Socket} from "socket.io-client";
import type {ClientToServerEvents, ServerToClientEvents} from "types/Websocket";

type Props = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  roomId: string;
}

export const TextMessageSender = ({ socket, roomId }: Props) => {

  const [inputMessage, setInputMessage] = useState("");

  const sendMessage: FormEventHandler = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.emit("room_message", {
        roomId: roomId,
        message: {
          messageJa: inputMessage,
          messageEn: "",
          datetime: new Date().toISOString(),
        },
      });
      setInputMessage("");
    }
  };

  return (
    <form onSubmit={sendMessage} className="flex flex-row gap-2">
      <input
        type="text"
        className="border p-2 rounded"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder="メッセージを送信"
      />
      <button type="submit" className="border p-2 rounded">
        Send
      </button>
    </form>
  )
}
