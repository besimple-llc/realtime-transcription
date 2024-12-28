export interface ITranscriber {
  start: () => void;
  stop: () => void;
  isTranscribing: () => boolean;
  transcribe: (arrayBuffer: ArrayBuffer) => void;
}
