import {type FormEventHandler, useEffect, useState} from "react";
import {useWebSocket} from "~/hooks/useWebsocket";
import type {Route} from "./+types/route";

export const loader = ({ params }: Route.LoaderArgs) => {
  const websocketURL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || "3000"}`;
  return { websocketURL, roomId: params.roomId };
}

export default function Component({ loaderData }: Route.ComponentProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const { socket, isConnected } = useWebSocket(loaderData.websocketURL);

  useEffect(() => {
    if (socket) {
      socket.emit("join", { roomId: loaderData.roomId });
      socket.on("message", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
    }
  }, [socket, loaderData]);

  const sendMessage:FormEventHandler = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.emit("room_message", { roomId: loaderData.roomId, message: inputMessage });
      setInputMessage("");
    }
  };

  return (
    <div>
      <h2>Real-Time Chat</h2>
      <p>Room URL: http://localhost:3000/rooms/{loaderData.roomId}</p>
      <p>Connection status: {isConnected ? "Connected" : "Disconnected"}</p>
      <div>
        {messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  )
}
