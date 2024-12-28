import { DeepLTranslator } from "@/server/domain/models/translator/DeepLTranslator";
import type { ITranslator } from "@/server/domain/models/translator/ITranslator";
import type { Language } from "@/types/Language";
import type { Message } from "@/types/Websocket";

export class RoomMessages {
  private readonly language: Language;
  private readonly _messages: Message[] = [];
  private readonly translator: ITranslator;
  private readonly addMessageCallback: (message: Message) => void;

  constructor(language: Language, addMessageCallback: (message: Message) => void) {
    this.language = language;
    this.translator = new DeepLTranslator();
    this.addMessageCallback = addMessageCallback;
  }

  get messages(): Message[] {
    return this._messages;
  }

  async addTextMessage(text: string) {
    const messageJa = this.language === "ja" ? text : await this.translator.translate(text, "ja", "en");
    const messageEn = this.language === "en" ? text : await this.translator.translate(text, "en", "ja");
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
