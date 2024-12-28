import type { Message } from "types/Websocket";

type Props = {
  messages: Message[];
};

export const MessageList = ({ messages }: Props) => {
  return (
    <div>
      {messages.length === 0 && (
        <div className="border mb-2 p-2">
          <p>ja: メッセージはありません</p>
          <p>en: There are not messages</p>
        </div>
      )}
      {messages.map((message) => (
        <div key={`${message.datetime}`} className="border mb-2 p-2">
          <p>ja: {message.messageJa}</p>
          <p>en: {message.messageEn}</p>
          <p>{message.datetime}</p>
        </div>
      ))}
    </div>
  );
};
