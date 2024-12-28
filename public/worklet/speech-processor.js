/* Implementation of the AudioWorkletProcessor
 https://webaudio.github.io/web-audio-api/#audioworklet
 This file will be loaded only in recent browsers that supports Audio worklet it is
 currently in js because it needs to be in es6 */
class SpeechProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) {
      return true; // データがなければ次回にスキップ（エラー防止）
    }
    const output = []; // Make sure output array can be assigned to
    for (let channel = 0; channel < input.length; channel += 1) {
      output[channel] = input[channel];
    }
    if (output[0]) {
      this.port.postMessage(output[0]);
    }
    return true;
  }
}

registerProcessor("speech-processor", SpeechProcessor);
