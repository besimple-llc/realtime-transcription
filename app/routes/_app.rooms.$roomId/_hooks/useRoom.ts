import { useCallback, useEffect, useRef, useState } from "react";
import { type Socket, io } from "socket.io-client";
import type { Language } from "types/Language";
import type { ClientToServerEvents, Message, ServerToClientEvents } from "types/Websocket";

export const useRoom = (baseUrl: string, roomId: string) => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents>>(io(baseUrl));
  const [language, setLanguage] = useState<Language>("ja");
  const [messages, setMessages] = useState<Message[]>([]);

  const joinRoom = useCallback(() => {
    console.log("joinRoom", roomId);
    socketRef.current.emit("join", roomId);
  }, [roomId]);

  const leaveRoom = useCallback(() => {
    console.log("leaveRoom", roomId);
    socketRef.current.emit("leave", roomId);
  }, [roomId]);

  const messageEventHandler = useCallback((message: Message) => {
    setMessages((prevMessages) => [message, ...prevMessages]);
  }, []);

  const addTextMessage = useCallback(
    (text: string) => {
      socketRef.current.emit("add_text_message", roomId, text, language);
    },
    [roomId, language],
  );

  const addAudioMessage = useCallback(
    (buffer: ArrayBuffer) => {
      socketRef.current.emit("add_audio_message", roomId, buffer, language);
    },
    [roomId, language],
  );

  useEffect(() => {
    socketRef.current.connect();
    socketRef.current.on("message", messageEventHandler);
    joinRoom();
    return () => {
      leaveRoom();
      socketRef.current.off("message", messageEventHandler);
      socketRef.current.disconnect();
    };
  }, [joinRoom, leaveRoom, messageEventHandler]);

  const switchLanguage = useCallback(() => {
    setLanguage((prevLanguage) => (prevLanguage === "ja" ? "en" : "ja"));
  }, []);

  return { language, switchLanguage, messages, addTextMessage, addAudioMessage };
};
