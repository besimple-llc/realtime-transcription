import {useCallback, useEffect, useRef} from "react";
import {type Socket, io } from "socket.io-client";
import type {ClientToServerEvents, ServerToClientEvents} from "../../../../types/Websocket";

export const useRoom = (baseUrl: string, roomId: string) => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>(io(baseUrl));

  const setup = useCallback(() => {
    socketRef.current.on("joined", (roomId) => {
      console.log("joined: ", roomId);
    });
    socketRef.current.on("left", (roomId) => {
      console.log("joined: ", roomId);
      socketRef.current.disconnect();
    });
  }, []);

  const joinRoom = useCallback(() => {
    socketRef.current.emit("join", roomId);
  }, [roomId]);

  const leaveRoom = useCallback(() => {
    socketRef.current.emit("leave", roomId);
  }, [roomId]);

  useEffect(() => {
    setup();
    joinRoom();
    return () => {
      leaveRoom();
    };
  }, [setup, joinRoom, leaveRoom]);

  return { socket: socketRef.current };
}
