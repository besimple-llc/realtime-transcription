export interface ITranscriber {
  start: () => void;
  stop: () => void;
  get transcribing(): boolean;
  transcribe: (arrayBuffer: ArrayBuffer) => void;
}
