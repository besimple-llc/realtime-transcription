import { RoomId } from "@/server/domain/models/room/RoomId";
import type { ITranscriber } from "@/server/domain/models/transcriber/ITranscriber";
import { MicrosoftTranscriber } from "@/server/domain/models/transcriber/MicrosoftTranscriber";
import type { User } from "@/server/domain/models/user/User";
import type { Language } from "@/types/Language";
import type { Message } from "@/types/Websocket";
import type { TargetLanguageCode } from "deepl-node";
import * as deepl from "deepl-node";
import type { SourceLanguageCode } from "deepl-node/dist/types";

export class Room {
  private readonly roomId: RoomId;
  private readonly transcriber: ITranscriber;
  private readonly _messages: Message[] = [];
  private readonly members: Set<string> = new Set();
  private addMessageCallback: (message: Message) => void;

  constructor(language: Language, addMessageCallback: (message: Message) => void) {
    this.roomId = RoomId.from(language);
    this.transcriber = new MicrosoftTranscriber(language, {
      onRecognized: this.addMessage,
    });
    this.addMessageCallback = addMessageCallback;
  }

  get id() {
    return this.roomId.value();
  }

  get messages() {
    return this._messages;
  }

  join(user: User) {
    this.members.add(user.id);
    if (this.members.size > 0 && !this.transcriber.isTranscribing()) {
      this.transcriber.start();
    }
    return this.members.size;
  }

  leave(user: User) {
    this.members.delete(user.id);
    if (this.members.size === 0) {
      this.transcriber.stop();
    }
    return this.members.size;
  }

  private addMessage(message: Message) {
    this._messages.push(message);
    this.addMessageCallback(message);
  }

  async addTextMessage(text: string) {
    const messageJa = this.roomId.language() === "ja" ? text : await this.translateTextFromEnToJa(text);
    const messageEn = this.roomId.language() === "en" ? text : await this.translateTextFromJaToEn(text);
    const message = {
      messageJa: messageJa,
      messageEn: messageEn,
      datetime: new Date().toISOString(),
    };
    this.addMessage(message);
  }

  private async translateTextFromJaToEn(text: string) {
    return await this.translateText(text, "ja", "en-US");
  }

  private async translateTextFromEnToJa(text: string) {
    return await this.translateText(text, "en", "ja");
  }

  private async translateText(text: string, from: SourceLanguageCode, to: TargetLanguageCode) {
    if (!process.env.DEEPL_API_KEY) {
      throw new Error("Please set DEEPL_API_KEY.");
    }
    const deepL = new deepl.Translator(process.env.DEEPL_API_KEY);
    const translationResult = await deepL.translateText(text, from, to);
    return translationResult.text;
  }

  addAudioMessage(arrayBuffer: ArrayBuffer) {
    this.transcriber.transcribe(arrayBuffer.slice());
  }

  toString() {
    return JSON.stringify(
      {
        id: this.id,
        members: Array.from(this.members),
        messages: this._messages,
        isTranscribing: this.transcriber.isTranscribing(),
      },
      null,
      4,
    );
  }
}
