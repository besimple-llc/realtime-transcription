import { RoomId } from "@/server/domain/models/room/RoomId";
import { RoomMembers } from "@/server/domain/models/room/RoomMembers";
import { RoomMessages } from "@/server/domain/models/room/RoomMessages";
import type { ITranscriber } from "@/server/domain/models/transcriber/ITranscriber";
import type { User } from "@/server/domain/models/user/User";
import { MicrosoftTranscriber } from "@/server/infra/transcription/MicrosoftTranscriber";
import type { Language } from "@/types/Language";
import type { Message } from "@/types/Websocket";

export class Room {
  private readonly roomId: RoomId;
  private readonly roomMessages: RoomMessages;
  private readonly roomMembers: RoomMembers;
  private readonly jaTranscriber: ITranscriber;
  private readonly enTranscriber: ITranscriber;

  constructor(addMessageCallback: (message: Message) => void) {
    this.roomId = RoomId.generate();
    this.roomMessages = new RoomMessages(addMessageCallback);
    // TODO: 特定のインフラに依存しないように抽象化する
    const transcribeCallback = {
      onRecognized: (message: Message) => {
        this.roomMessages.addMessage(message);
      },
    };
    this.jaTranscriber = new MicrosoftTranscriber("ja", transcribeCallback);
    this.enTranscriber = new MicrosoftTranscriber("en", transcribeCallback);
    this.roomMembers = new RoomMembers();
  }

  get id() {
    return this.roomId.value();
  }

  get messages() {
    return this.roomMessages.messages;
  }

  join(user: User) {
    this.roomMembers.join(user);
    if (this.roomMembers.isEmpty) {
      return;
    }

    if (!this.jaTranscriber.transcribing) {
      this.jaTranscriber.start();
    }

    if (!this.enTranscriber.transcribing) {
      this.enTranscriber.start();
    }
  }

  leave(user: User) {
    this.roomMembers.leave(user);
    if (this.roomMembers.isEmpty) {
      this.jaTranscriber.stop();
      this.enTranscriber.stop();
    }
  }

  async addTextMessage(text: string, language: Language) {
    await this.roomMessages.addTextMessage(text, language);
  }

  addAudioMessage(arrayBuffer: ArrayBuffer, language: Language) {
    if (language === "ja") {
      this.jaTranscriber.transcribe(arrayBuffer);
    } else if (language === "en") {
      this.enTranscriber.transcribe(arrayBuffer);
    }
  }

  toString() {
    return JSON.stringify(
      {
        id: this.id,
        members: this.roomMembers.ids,
        messages: this.messages,
        isTranscribing: {
          ja: this.jaTranscriber.transcribing,
          en: this.enTranscriber.transcribing,
        },
      },
      null,
      4,
    );
  }
}
