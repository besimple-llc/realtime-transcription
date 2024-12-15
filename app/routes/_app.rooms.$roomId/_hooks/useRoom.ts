import {useCallback, useEffect, useRef} from "react";
import {type Socket, io } from "socket.io-client";
import type {Language} from "types/Language";
import type {ClientToServerEvents, ServerToClientEvents} from "types/Websocket";

export const useRoom = (baseUrl: string, roomId: string) => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>(io(baseUrl));

  const joinRoom = useCallback(() => {
    console.log("joinRoom", roomId);
    socketRef.current.emit("join", roomId);
  }, [roomId]);

  const leaveRoom = useCallback(() => {
    console.log("leaveRoom", roomId);
    socketRef.current.emit("leave", roomId);
  }, [roomId]);

  useEffect(() => {
    joinRoom();
    return () => {
      leaveRoom();
      socketRef.current.disconnect();
    };
  }, [joinRoom, leaveRoom]);

  const language = roomId.substring(0, 2) as Language;

  return { socket: socketRef.current, language };
}
