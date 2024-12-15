import {useRef, useState} from "react";
import type {Socket} from "socket.io-client";
import type {ClientToServerEvents, ServerToClientEvents} from "types/Websocket";

type Props = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  roomId: string;
}

export const AudioMessageSender = ({ socket, roomId }: Props) => {
  const [isTranscribing, setTranscribing] = useState(false)

  const stream = useRef<MediaStream>(null);
  const startTranscription = async () => {
    stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream.current);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      // Float32 -> Int16に変換
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = inputData[i] * 0x7FFF;
      }
      socket.emit("transcription", roomId, pcmData.buffer);
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    setTranscribing(true)
  }

  const stopTranscription = () => {
    for (const mediaStreamTrack of stream.current?.getTracks() || []) {
      mediaStreamTrack.stop()
    }
    stream.current = null;
    setTranscribing(false)
  }

  if (isTranscribing) {
    return (
      <button type="button" className="border p-2 rounded" onClick={stopTranscription}>音声文字起こしを止める</button>
    )
  }

  return (
    <button type="button" className="border p-2 rounded" onClick={startTranscription}>音声文字起こしをする</button>
  )
}
