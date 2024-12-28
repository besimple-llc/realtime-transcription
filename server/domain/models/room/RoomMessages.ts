import type { ITranslator } from "@/server/domain/models/translator/ITranslator";
import { DeepLTranslator } from "@/server/infra/translate/DeepLTranslator";
import type { Language } from "@/types/Language";
import type { Message } from "@/types/Websocket";

export class RoomMessages {
  private readonly _messages: Message[] = [];
  private readonly translator: ITranslator;
  private readonly addMessageCallback: (message: Message) => void;

  constructor(addMessageCallback: (message: Message) => void) {
    // TODO: 特定のインフラに依存しないように抽象化する
    this.translator = new DeepLTranslator();
    this.addMessageCallback = addMessageCallback;
  }

  get messages(): Message[] {
    return this._messages;
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
    this._messages.push(message);
    this.addMessageCallback(message);
  }
}
