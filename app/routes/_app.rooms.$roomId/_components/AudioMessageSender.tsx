import type {Socket} from "socket.io-client";
import type {ClientToServerEvents, ServerToClientEvents} from "types/Websocket";
import {useAudio} from "~/routes/_app.rooms.$roomId/_hooks/useAudio";

type Props = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  roomId: string;
};

export const AudioMessageSender = ({ socket, roomId }: Props) => {
  const audio = useAudio();


  const startTranscription = async () => {
    await audio.startRecording((buffer) => {
      socket.emit("add_audio_message", roomId, buffer);
    })
  };

  const stopTranscription = async () => {
    await audio.stopRecording();
  };

  if (audio.isRecording) {
    return (
      <button type="button" className="border p-2 rounded" onClick={stopTranscription}>
        音声メッセージの送信を停止する
      </button>
    );
  }

  return (
    <button type="button" className="border p-2 rounded" onClick={startTranscription}>
      音声メッセージの送信を開始する
    </button>
  );
};
