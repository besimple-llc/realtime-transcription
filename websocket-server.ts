import type {Server as HttpServer, IncomingMessage, ServerResponse} from "node:http";
import {
  AudioConfig,
  AudioInputStream,
  type PushAudioInputStream,
  ResultReason,
  SpeechConfig,
  SpeechRecognizer
} from "microsoft-cognitiveservices-speech-sdk";
import {Server} from "socket.io";
import type {ClientToServerEvents, Message, ServerToClientEvents} from "./types/Websocket";

export const setUpWebSocketServer = (httpServer: HttpServer<typeof IncomingMessage, typeof ServerResponse>) => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents
  >(httpServer);

  const rooms: Map<string, {
    transcription: {
      recognizer: SpeechRecognizer,
      pushStream: PushAudioInputStream,
      transcribing: boolean
    },
    messages: Message[],
    members: Set<string>,
  }> = new Map();

  const speechConfig = SpeechConfig.fromSubscription("4eed816aca7d4593a224d3b7cd004fb8", "eastasia")
  speechConfig.speechRecognitionLanguage = 'ja-JP';

  // WebSocket connection handler
  io.on("connection", (socket) => {
    console.log("A client connected: ", socket.id);

    socket.on("disconnect", () => {
      console.log("A client disconnected: ", socket.id);
      for (const [roomId, room] of rooms) {
        if (room.members.has(socket.id)) {
          room.members.delete(socket.id);
          if (room.members.size === 0) {
            room.transcription.recognizer.stopContinuousRecognitionAsync(() => {
              rooms.delete(roomId);
            });
          }
        }
      }
    });

    socket.on("join", roomId => {
      console.log("Joining room:", {
        roomId,
        members: socket.id
      });
      socket.join(roomId);
      if (rooms.has(roomId)) {
        rooms.get(roomId)?.members.add(socket.id);
        const messages = rooms.get(roomId)?.messages || [];
        for (const message of messages) {
          socket.emit("message", message);
        }
        return;
      }

      const pushStream = AudioInputStream.createPushStream();
      const audioConfig = AudioConfig.fromStreamInput(pushStream);
      const speechRecognizer = new SpeechRecognizer(speechConfig, audioConfig);

      // speechRecognizer.recognizing = (s, e) => {
      //   console.log(`RECOGNIZING: Text=${e.result.text}`);
      // };

      speechRecognizer.recognized = (s, e) => {
        if (e.result.reason === ResultReason.RecognizedSpeech) {
          console.log(`RECOGNIZED: Text=${e.result.text}`);
          socket.emit("message", {
            messageJa: e.result.text,
            messageEn: "",
            datetime: new Date().toISOString()
          });
        }
        else if (e.result.reason === ResultReason.NoMatch) {
          console.log("NOMATCH: Speech could not be recognized.");
        }
      };

      // speechRecognizer.canceled = (s, e) => {
      //   console.log(`CANCELED: Reason=${e.reason}`);
      //
      //   if (e.reason === CancellationReason.Error) {
      //     console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
      //     console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
      //     console.log("CANCELED: Did you set the speech resource key and region values?");
      //   }
      //
      //   speechRecognizer.stopContinuousRecognitionAsync();
      // };
      //
      // speechRecognizer.sessionStopped = (s, e) => {
      //   console.log("\n    Session stopped event.");
      //   speechRecognizer.stopContinuousRecognitionAsync();
      // };
      rooms.set(roomId, {
        transcription: {
          recognizer: speechRecognizer,
          pushStream,
          transcribing: true
        },
        messages: [],
        members: new Set(socket.id)
      });
      speechRecognizer.startContinuousRecognitionAsync();
    });

    socket.on("leave", roomId => {
      console.log("Leaving room:", {
        roomId,
        members: socket.id
      });
      socket.leave(roomId);
      rooms.get(roomId)?.members.delete(socket.id);
      if (rooms.get(roomId)?.members.size === 0) {
        rooms.get(roomId)?.transcription.recognizer.stopContinuousRecognitionAsync(() => {
          rooms.delete(roomId);
        });
      }
    });

    socket.on("room_message", (data) => {
      console.log("Received room_message:", data);
      rooms.get(data.roomId)?.messages.push(data.message);
      // Broadcast the message to all connected clients
      io.to(data.roomId).emit("message", data.message);
    });

    socket.on("transcription", (roomId, arrayBuffer) => {
      const transcription = rooms.get(roomId)?.transcription;
      if (transcription) {
        transcription.pushStream.write(arrayBuffer.slice())
      }
    });
  });
}
