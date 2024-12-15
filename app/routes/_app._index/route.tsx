import {useEffect, useRef} from "react";
import {useNavigate} from "react-router";
import {type Socket, io } from "socket.io-client";
import {getWebsocketUrl} from "~/utils/getWebsocketUrl.server";
import type {ClientToServerEvents, ServerToClientEvents} from "../../../types/Websocket";
import type {Route} from "./+types/route";

export function meta() {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }];
}

export function loader({ context }: Route.LoaderArgs) {
  const websocketUrl = getWebsocketUrl();
  return { message: context.VALUE_FROM_EXPRESS, websocketUrl };
}

export default function Component({ loaderData }: Route.ComponentProps) {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>(io(loaderData.websocketUrl));
  const navigate = useNavigate();

  useEffect(() => {
    socketRef.current.on("created_room", (roomId) => {
      navigate(`/rooms/${roomId}`);
    });
    return () => {
      socketRef.current.off("created_room");
      socketRef.current.disconnect();
    }
  }, [navigate]);

  const createJapaneseRoom = () => {
    socketRef.current.emit("create_room", "ja");

  };
  const createEnglishRoom = () => {
    socketRef.current.emit("create_room", "en");
  };
  return (
    <div className="flex flex-col justify-center items-center">
      <button type="button" className="border rounded-2xl m-4 p-4" onClick={createJapaneseRoom}>日本語で話す部屋を作る</button>
      <button type="button" className="border rounded-2xl m-4 p-4" onClick={createEnglishRoom}>英語で話す部屋を作る</button>
    </div>
  );
}
