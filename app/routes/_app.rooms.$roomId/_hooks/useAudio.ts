import {useRef, useState} from "react";

export const useAudio = () => {
  const [isRecording, setRecording] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startRecording = async (onMessage: (buffer: ArrayBuffer) => void) => {
    // オーディオコンテキスト作成
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;

    // AudioWorkletモジュールを追加
    await audioContext.audioWorklet.addModule("/worklet/speech-processor.js");

    // マイク入力取得
    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(mediaStreamRef.current);

    // AudioWorkletNode作成
    const workletNode = new AudioWorkletNode(audioContext, "speech-processor");
    workletNodeRef.current = workletNode;

    // AudioWorkletNodeからメッセージを受け取る
    workletNode.port.onmessage = (event) => {
      // event.data は Float32Array(Mono)
      const float32Data = event.data as Float32Array;

      // Float32 -> Int16 PCM変換
      const int16Data = new Int16Array(float32Data.length);
      for (let i = 0; i < float32Data.length; i++) {
        let s = float32Data[i] * 32767; // Float32(-1 to 1) -> Int16(-32767 to 32767)
        // クリッピング
        if (s < -32768) s = -32768;
        if (s > 32767) s = 32767;
        int16Data[i] = s;
      }

      onMessage(int16Data.buffer);
    };
    source.connect(workletNode);

    setRecording(true);
  }

  const stopRecording = async () => {
    try {
      // 接続解除処理
      const workletNode = workletNodeRef.current;
      if (workletNode) {
        workletNode.disconnect();
        workletNodeRef.current = null;
      }

      const audioContext = audioContextRef.current;
      if (audioContext) {
        await audioContext.close();  // 非同期処理を待機
        audioContextRef.current = null;
      }

      // MediaStreamの停止
      const stream = mediaStreamRef.current;
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        mediaStreamRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping the recording:', error);
    }
    setRecording(false);
  }

  return {
    startRecording,
    stopRecording,
    isRecording,
  }
}
