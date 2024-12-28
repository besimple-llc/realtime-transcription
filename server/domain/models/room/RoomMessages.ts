import type { ITranslator } from "@/server/domain/models/translator/ITranslator";
import { DeepLTranslator } from "@/server/infra/translate/DeepLTranslator";
import type { Language } from "@/types/Language";
import type { Message } from "@/types/Websocket";
import { v7 } from "uuid";

export class RoomMessages {
  private readonly _messages: Map<string, Message> = new Map();
  private readonly translator: ITranslator;
  private readonly addMessageCallback: (message: Message) => void;

  constructor(addMessageCallback: (message: Message) => void) {
    // TODO: 特定のインフラに依存しないように抽象化する
    this.translator = new DeepLTranslator();
    this.addMessageCallback = addMessageCallback;
  }

  get messages(): Message[] {
    return Array.from(this._messages.entries())
      .sort((a, b) => {
        // UUIDv7は最初の部分がタイムスタンプなので、それを比較
        const timestampA = Number.parseInt(a[0].slice(0, 8), 16); // UUIDの最初の部分（タイムスタンプ）
        const timestampB = Number.parseInt(b[0].slice(0, 8), 16);
        return timestampA - timestampB; // 時間順にソート
      })
      .map((entry) => entry[1]);
  }

  async addTextMessage(text: string, language: Language) {
    const messageJa = language === "ja" ? text : await this.translator.translate(text, "en", "ja");
    const messageEn = language === "en" ? text : await this.translator.translate(text, "ja", "en");
    const message = {
      messageJa: messageJa,
      messageEn: messageEn,
      datetime: new Date().toISOString(),
    };
    this.addMessage(message);
  }

  addMessage(message: Message) {
    this._messages.set(v7(), message);
    this.addMessageCallback(message);
  }
}
