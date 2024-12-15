import type {Server as HttpServer, IncomingMessage, ServerResponse} from "node:http";
import type {TargetLanguageCode} from "deepl-node";
import * as deepl from "deepl-node";
import type {SourceLanguageCode} from "deepl-node/dist/types";
import {
  AudioConfig,
  AudioInputStream,
  CancellationReason,
  type PushAudioInputStream,
  ResultReason,
  SpeechTranslationConfig,
  TranslationRecognizer
} from "microsoft-cognitiveservices-speech-sdk";
import {Server} from "socket.io";
import {v7} from "uuid";
import type {Language} from "./types/Language";
import type {ClientToServerEvents, Message, ServerToClientEvents} from "./types/Websocket";

type WebsocketServer = Server<ClientToServerEvents, ServerToClientEvents>
type RoomServer = ReturnType<WebsocketServer["to"]>

interface Transcriber {
  start: () => void;
  stop: () => void;
  isTranscribing: () => boolean;
  transcribe: (arrayBuffer: ArrayBuffer) => void;
}

class MicrosoftTranscriber implements Transcriber {
  private recognizer: TranslationRecognizer;
  private pushStream: PushAudioInputStream;
  private transcribing = false;
  constructor(language: Language, callbacks: {
    onRecognized: (message: Message) => void;
  }) {
    if (!process.env.MICROSOFT_SPEECH_API_KEY || !process.env.MICROSOFT_SPEECH_API_REGION) {
      throw new Error("Please set MICROSOFT_SPEECH_API_KEY and MICROSOFT_SPEECH_API_REGION.");
    }
    const speechConfig = SpeechTranslationConfig.fromSubscription(process.env.MICROSOFT_SPEECH_API_KEY, process.env.MICROSOFT_SPEECH_API_REGION);
    if (language === "ja") {
      speechConfig.speechRecognitionLanguage = "ja-JP";
      speechConfig.addTargetLanguage("en");
    } else if (language === "en") {
      speechConfig.speechRecognitionLanguage = "en-US";
      speechConfig.addTargetLanguage("ja");
    }

    const pushStream = AudioInputStream.createPushStream();
    const audioConfig = AudioConfig.fromStreamInput(pushStream);
    const recognizer = new TranslationRecognizer(speechConfig, audioConfig);

    recognizer.recognized = (_, e) => {
      if (e.result.reason === ResultReason.TranslatedSpeech) {
        const messageJa = language === "ja" ? e.result.text : e.result.translations.get("ja");
        const messageEn = language === "en" ? e.result.text : e.result.translations.get("en");
        console.log("RECOGNIZED: Text=", { ja: messageJa, en: messageEn});
        callbacks.onRecognized({
          messageJa,
          messageEn,
          datetime: new Date().toISOString(),
        })

      } else if (e.result.reason === ResultReason.NoMatch) {
        console.log("NOMATCH: Speech could not be recognized.");
      }
    };

    recognizer.canceled = (_, e) => {
      console.log(`CANCELED: Reason=${e.reason}`);
      if (e.reason === CancellationReason.Error) {
        console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
        console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
      }
      this.stop();
    };

    recognizer.sessionStopped = () => {
      console.log("Session stopped event.");
      this.stop();
    };

    this.recognizer = recognizer;
    this.pushStream = pushStream;
  }

  start() {
    console.log("------- Transcribe start --------");
    this.recognizer.startContinuousRecognitionAsync();
    this.transcribing = true;
  }

  stop() {
    console.log("------- Transcribe stop --------");
    this.recognizer.stopContinuousRecognitionAsync();
    this.transcribing = false;
  }

  isTranscribing() {
    return this.transcribing;
  }

  transcribe(arrayBuffer: ArrayBuffer) {
    this.pushStream.write(arrayBuffer);
  }
}

class Room {
  private transcriber: Transcriber;
  private readonly messages: Message[] = [];
  private readonly members: Set<string> = new Set();
  private language: string;
  private roomServer: RoomServer;

  constructor(roomServer: RoomServer, language: Language) {
    this.roomServer = roomServer;
    this.transcriber = new MicrosoftTranscriber(language, {
      onRecognized: (message) => {
        this.addMessage(message);
      }
    });
    if (["ja", "en"].includes(language)) {
      this.language = language;
    } else {
      this.language = "ja";
    }
  }

  join(who: string) {
    this.members.add(who);
    if (this.members.size > 0 && !this.transcriber.isTranscribing()) {
      this.transcriber.start();
    }
    return this.members.size;
  }

  leave(who: string) {
    this.members.delete(who);
    if (this.members.size === 0) {
      this.transcriber.stop();
    }
    return this.members.size;
  }

  private addMessage(message: Message) {
    this.messages.push(message);
    this.roomServer.emit("message", message);
  }

  async addTextMessage(text: string) {
    const messageJa = this.language === "ja" ? text : await this.translateTextFromEnToJa(text);
    const messageEn = this.language === "en" ? text : await this.translateTextFromJaToEn(text);
    const message = {
      messageJa: messageJa,
      messageEn: messageEn,
      datetime: new Date().toISOString(),
    }
    this.addMessage(message);
  }

  private async translateTextFromJaToEn(text: string) {
    return await this.translateText(text, "ja", "en-US")
  }

  private async translateTextFromEnToJa(text: string) {
    return await this.translateText(text, "en", "ja")
  }

  private async translateText(text: string, from:  SourceLanguageCode,to: TargetLanguageCode) {
    if (!process.env.DEEPL_API_KEY) {
      throw new Error("Please set DEEPL_API_KEY.");
    }
    const deepL = new deepl.Translator(process.env.DEEPL_API_KEY);
    const translationResult = await deepL.translateText(text, from, to)
    return translationResult.text
  }

  addAudioMessage(arrayBuffer: ArrayBuffer) {
    this.transcriber.transcribe(arrayBuffer.slice());
  }

  getMessages() {
    return this.messages;
  }

  logRoom() {
    console.log("Language:", this.language, "Members:", this.members, "Transcriber:", this.transcriber.isTranscribing());
  }
}

class RoomList {
  private roomMap: Map<string, Room>;
  private socketServer: WebsocketServer;

  constructor(socketServer: WebsocketServer) {
    this.roomMap = new Map();
    this.socketServer = socketServer;
  }

  getRoom(roomId: string) {
    return this.roomMap.get(roomId);
  }

  createRoom(language: Language) {
    console.log("Creating room with language: ", language);
    const roomId = `${language}-room-${v7()}`;
    this.createAndSetRoom(roomId);
    return roomId;
  }

  joinRoom(roomId: string, who: string) {
    console.log("Joining room:", { roomId, who });
    const room = this.getRoom(roomId) || this.createAndSetRoom(roomId);
    room.join(who);
    return room;
  }

  private createAndSetRoom(roomId: string) {
    const room = new Room(this.socketServer.to(roomId), roomId.substring(0, 2) as Language);
    this.roomMap.set(roomId, room);
    return room;
  }

  leaveRoom(roomId: string, who: string) {
    console.log("Leaving room:", { roomId, who });
    const room = this.getRoom(roomId);
    room?.leave(who);
  }

  leaveAllRooms(who: string) {
    console.log("Leaving all rooms:", { who });
    for (const roomId of this.roomMap.keys()) {
      this.leaveRoom(roomId, who);
    }
  }

  logRooms() {
    console.log("log start //////////////")
    for (const [roomId, room] of this.roomMap.entries()) {
      console.log("Room:", roomId);
      room.logRoom();
    }
    console.log("log end //////////////")
  }
}

export const setUpWebSocketServer = (httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse>) => {
  const server = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);

  const rooms = new RoomList(server);

  setInterval(() => {
    rooms.logRooms();
  }, 10000);

  // WebSocket connection handler
  server.on("connection", (socket) => {
    console.log("A client connected: ", socket.id);

    socket.on("disconnect", () => {
      console.log("A client disconnected: ", socket.id);
      rooms.leaveAllRooms(socket.id);
    });

    socket.on("join", (roomId) => {
      socket.join(roomId);
      const room = rooms.joinRoom(roomId, socket.id);
      const messages = room.getMessages();
      for (const message of messages) {
        socket.emit("message", message);
      }
    });

    socket.on("create_room", (language) => {
      const roomId = rooms.createRoom(language);
      socket.emit("created_room", roomId);
    });

    socket.on("leave", (roomId) => {
      socket.leave(roomId);
      rooms.leaveRoom(roomId, socket.id);
    });

    socket.on("add_text_message", (roomId, text) => {
      rooms.getRoom(roomId)?.addTextMessage(text);
    });

    socket.on("add_audio_message", (roomId, arrayBuffer) => {
      rooms.getRoom(roomId)?.addAudioMessage(arrayBuffer);
    });
  });
};

