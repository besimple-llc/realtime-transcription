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
      {messages.map((message) => (
        <div key={`${message.datetime}`} className="border mb-2">
          <p>{message.messageJa}</p>
          <p>{message.datetime}</p>
        </div>
      ))}
    </div>
  )
}
