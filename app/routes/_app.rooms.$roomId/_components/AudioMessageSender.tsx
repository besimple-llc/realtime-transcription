import { useAudio } from "~/routes/_app.rooms.$roomId/_hooks/useAudio";

type Props = {
  addAudioMessage: (buffer: ArrayBuffer) => void;
};

export const AudioMessageSender = ({ addAudioMessage }: Props) => {
  const audio = useAudio();

  const startTranscription = async () => {
    await audio.startRecording((buffer) => {
      addAudioMessage(buffer);
    });
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
