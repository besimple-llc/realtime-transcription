import {type FormEventHandler, useEffect, useState} from "react";
import {useWebSocket} from "~/hooks/useWebsocket";
import type {Route} from "./+types/route";

export function meta() {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }];
}

export function loader({ context }: Route.LoaderArgs) {
  const websocketURL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || "3000"}`;
  return { message: context.VALUE_FROM_EXPRESS, websocketURL };
}

export default function Component({ loaderData }: Route.ComponentProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const { socket, isConnected } = useWebSocket(loaderData.websocketURL);

  useEffect(() => {
    if (socket) {
      socket.on("message", (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
    }
  }, [socket]);

  const sendMessage:FormEventHandler = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.emit("message", inputMessage);
      setInputMessage("");
    }
  };

  return (
    <div>
      <h2>Real-Time Chat</h2>
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
  );
}
