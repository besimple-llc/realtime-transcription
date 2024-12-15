import {useEffect, useState} from "react";
import type {Socket} from "socket.io-client";
import type {ClientToServerEvents, Message, ServerToClientEvents} from "types/Websocket";

type Props = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
}

export const MessageList = ({socket}: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      setMessages((prevMessages) => [message, ...prevMessages]);
    }
    socket.on("message", handleNewMessage);

    return () => {
      socket.off("message", handleNewMessage);
    }
  }, [socket.on, socket.off]);

  return (
    <div>
      {messages.length === 0 && (
        <div className="border mb-2 p-2">
          <p>ja: メッセージはありません</p>
          <p>en: There are not messages</p>
        </div>
      )}
      {messages.map((message) => (
        <div key={`${message.datetime}`} className="border mb-2 p-2">
          <p>ja: {message.messageJa}</p>
          <p>en: {message.messageEn}</p>
          <p>{message.datetime}</p>
        </div>
      ))}
    </div>
  )
}
