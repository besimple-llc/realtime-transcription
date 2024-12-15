import type {Server as HttpServer, IncomingMessage, ServerResponse} from "node:http";
import * as deepl from "deepl-node";
import {
  AudioConfig,
  AudioInputStream,
  CancellationReason,
  type PushAudioInputStream,
  ResultReason,
  SpeechConfig,
  SpeechTranslationConfig,
  TranslationRecognizer
} from "microsoft-cognitiveservices-speech-sdk";
import {Server} from "socket.io";
import type {ClientToServerEvents, Message, ServerToClientEvents} from "./types/Websocket";

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
  constructor(callbacks: {
    onRecognized: (message: Message) => void;
  }) {
    if (!process.env.MICROSOFT_SPEECH_API_KEY || !process.env.MICROSOFT_SPEECH_API_REGION) {
      throw new Error("Please set MICROSOFT_SPEECH_API_KEY and MICROSOFT_SPEECH_API_REGION.");
    }
    const speechConfig = SpeechTranslationConfig.fromSubscription(process.env.MICROSOFT_SPEECH_API_KEY, process.env.MICROSOFT_SPEECH_API_REGION);
    speechConfig.speechRecognitionLanguage = "ja-JP";
    speechConfig.addTargetLanguage("en");

    const pushStream = AudioInputStream.createPushStream();
    const audioConfig = AudioConfig.fromStreamInput(pushStream);
    const recognizer = new TranslationRecognizer(speechConfig, audioConfig);

    recognizer.recognized = (s, e) => {
      if (e.result.reason === ResultReason.TranslatedSpeech) {
        console.log("RECOGNIZED: Text=", {
          ja: e.result.text,
          en: e.result.translations.get("en"),
        });
        callbacks.onRecognized({
          messageJa: e.result.text,
          messageEn: e.result.translations.get("en"),
          datetime: new Date().toISOString(),
        })
      } else if (e.result.reason === ResultReason.NoMatch) {
        console.log("NOMATCH: Speech could not be recognized.");
      }
    };

    recognizer.canceled = (s, e) => {
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
    this.pushStream.write(arrayBuffer.slice());
  }
}

class Room {
  private transcriber: Transcriber;
  private readonly messages: Message[] = [];
  private readonly members: Set<string> = new Set();
  private callbacks: {
    onAddMessage: (message: Message) => void;
  }
  constructor(callbacks: {
    onAddMessage: (message: Message) => void;
  }) {
    this.callbacks = callbacks;
    this.transcriber = new MicrosoftTranscriber({
      onRecognized: (message) => {
        this.addMessage(message);
      }
    });
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
    this.callbacks.onAddMessage(message);
  }

  async addTextMessage(text: string) {
    const message = {
      messageJa: text,
      messageEn: await this.translateTextFromJaToEn(text),
      datetime: new Date().toISOString(),
    }
    this.addMessage(message);
  }

  private async translateTextFromJaToEn(text: string) {
    if (!process.env.DEEPL_API_KEY) {
      throw new Error("Please set DEEPL_API_KEY.");
    }
    const deepL = new deepl.Translator(process.env.DEEPL_API_KEY);
    const translationResult = await deepL.translateText(text, "ja", "en-US")
    return translationResult.text
  }

  addAudioMessage(arrayBuffer: ArrayBuffer) {
    this.transcriber.transcribe(arrayBuffer.slice());
  }

  getMessages() {
    return this.messages;
  }
}

class RoomList {
  _rooms: Map<string, Room>;

  constructor() {
    this._rooms = new Map();
  }

  getRoom(roomId: string) {
    return this._rooms.get(roomId);
  }

  joinRoom(roomId: string, who: string, messageSubscriber: (message: Message) => void) {
    console.log("Joining room:", { roomId, who });
    let room = this.getRoom(roomId);
    if (!room) {
      room = new Room({
        onAddMessage: messageSubscriber
      });
      this._rooms.set(roomId, room);
    }
    room.join(who);
    return room;
  }

  leaveRoom(roomId: string, who: string) {
    console.log("Leaving room:", { roomId, who });
    const room = this.getRoom(roomId);
    const leftMemberCount = room?.leave(who);
    if (leftMemberCount === 0) {
      this._rooms.delete(roomId);
    }
  }

  leaveAllRooms(who: string) {
    console.log("Leaving all rooms:", { who });
    for (const roomId of this._rooms.keys()) {
      this.leaveRoom(roomId, who);
    }
  }
}

export const setUpWebSocketServer = (httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse>) => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer);

  const rooms = new RoomList();

  const speechConfig = SpeechConfig.fromSubscription("4eed816aca7d4593a224d3b7cd004fb8", "eastasia");
  speechConfig.speechRecognitionLanguage = "ja-JP";

  // WebSocket connection handler
  io.on("connection", (socket) => {
    console.log("A client connected: ", socket.id);

    socket.on("disconnect", () => {
      console.log("A client disconnected: ", socket.id);
      rooms.leaveAllRooms(socket.id);
    });

    socket.on("join", (roomId) => {
      socket.join(roomId);
      const room = rooms.joinRoom(roomId, socket.id, (message) => {
        io.to(roomId).emit("message", message);
      });
      const messages = room.getMessages();
      for (const message of messages) {
        socket.emit("message", message);
      }
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
