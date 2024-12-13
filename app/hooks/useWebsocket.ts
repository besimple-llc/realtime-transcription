import {useEffect, useState} from "react";
import {io, Socket} from "socket.io-client";

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketIo = io(`http://localhost:${process.env.PORT || "3000"}`);

    socketIo.on("connect", () => {
      setIsConnected(true);
    });

    socketIo.on("disconnect", () => {
      setIsConnected(false);
    });

    // 接続エラー時：サーバーへ接続できない場合や再接続時の失敗などで呼ばれます
    socketIo.on("connect_error", (error) => {
      console.error("接続エラーが発生しました:", error);
    });

    // サーバー側からerrorイベントがemitされた場合：
    // 例: サーバ側で socket.emit("error", "何らかのエラーメッセージ");
    socketIo.on("error", (errMsg) => {
      console.error("サーバーからエラーが送信されました:", errMsg);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  return {socket, isConnected};
}
