import { useRef, useState } from "react";

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

    const frameSize = 320; // 16kHz * 0.02秒 = 320サンプル
    let leftoverBuffer: Int16Array | null = null;

    workletNode.port.onmessage = (event) => {
      const float32Data = event.data as Float32Array;

      // Float32 -> Int16へ変換
      const int16Data = new Int16Array(float32Data.length);
      for (let i = 0; i < float32Data.length; i++) {
        int16Data[i] = Math.max(-32768, Math.min(32767, float32Data[i] * 32767));
      }

      // 前の残りデータと結合
      const fullBuffer = leftoverBuffer ? new Int16Array(leftoverBuffer.length + int16Data.length) : int16Data;
      if (leftoverBuffer) {
        fullBuffer.set(leftoverBuffer);
        fullBuffer.set(int16Data, leftoverBuffer.length);
      }

      // フレーム分割
      let offset = 0;
      while (offset + frameSize <= fullBuffer.length) {
        const frame = fullBuffer.slice(offset, offset + frameSize);
        onMessage(frame.buffer); // 送信
        offset += frameSize;
      }

      // 残りデータを保存
      leftoverBuffer = fullBuffer.slice(offset);
    };
    source.connect(workletNode);

    setRecording(true);
  };

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
        await audioContext.close(); // 非同期処理を待機
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
      console.error("Error stopping the recording:", error);
    }
    setRecording(false);
  };

  return {
    startRecording,
    stopRecording,
    isRecording,
  };
};
