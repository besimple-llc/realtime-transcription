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
  private readonly transcriber: ITranscriber;

  constructor(language: Language, addMessageCallback: (message: Message) => void) {
    this.roomId = RoomId.from(language);
    this.roomMessages = new RoomMessages(language, addMessageCallback);
    // TODO: 特定のインフラに依存しないように抽象化する
    this.transcriber = new MicrosoftTranscriber(language, {
      onRecognized: this.roomMessages.addMessage,
    });
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
    if (this.roomMembers.isEmpty && !this.transcriber.isTranscribing()) {
      this.transcriber.start();
    }
  }

  leave(user: User) {
    this.roomMembers.leave(user);
    if (this.roomMembers.isEmpty) {
      this.transcriber.stop();
    }
  }

  async addTextMessage(text: string) {
    await this.roomMessages.addTextMessage(text);
  }

  addAudioMessage(arrayBuffer: ArrayBuffer) {
    this.transcriber.transcribe(arrayBuffer);
  }

  toString() {
    return JSON.stringify(
      {
        id: this.id,
        members: this.roomMembers.ids,
        messages: this.messages,
        isTranscribing: this.transcriber.isTranscribing(),
      },
      null,
      4,
    );
  }
}
