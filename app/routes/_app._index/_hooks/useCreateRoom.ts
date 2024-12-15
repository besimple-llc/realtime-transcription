import {useCallback, useEffect, useRef} from "react";
import {useNavigate} from "react-router";
import {type Socket, io } from "socket.io-client";
import type {ClientToServerEvents, ServerToClientEvents} from "../../../../types/Websocket";

export const useCreateRoom = (baseUrl: string) => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>(io(baseUrl));
  const navigate = useNavigate();

  const createdRoomEventHandler = useCallback(
    (roomId: string) => {
      navigate(`/rooms/${roomId}`);
    },
    [navigate],
  );

  useEffect(() => {
    socketRef.current.connect();
    socketRef.current.on("created_room", createdRoomEventHandler);
    return () => {
      socketRef.current.off("created_room", createdRoomEventHandler);
      socketRef.current.disconnect();
    };
  }, [createdRoomEventHandler]);

  const createJapaneseRoom = useCallback(() => {
    socketRef.current.emit("create_room", "ja");
  }, []);
  const createEnglishRoom = useCallback(() => {
    socketRef.current.emit("create_room", "en");
  }, []);

  return { createJapaneseRoom, createEnglishRoom };
};
