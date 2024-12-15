import {type FormEventHandler, useState} from "react";

type Props = {
  addTextMessage: (text: string) => void;
}

export const TextMessageSender = ({ addTextMessage }: Props) => {

  const [inputMessage, setInputMessage] = useState("");

  const sendMessage: FormEventHandler = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      addTextMessage(inputMessage);
      setInputMessage("");
    }
  };

  return (
    <form onSubmit={sendMessage} className="flex flex-row gap-2">
      <input
        type="text"
        className="border p-2 rounded"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder="テキストでメッセージを送信"
      />
      <button type="submit" className="border p-2 rounded">
        Send
      </button>
    </form>
  )
}
