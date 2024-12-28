import { AudioMessageSender } from "~/routes/_app.rooms.$roomId/_components/AudioMessageSender";
import { CurrentRoomUrl } from "~/routes/_app.rooms.$roomId/_components/CurrentRoomUrl";
import { MessageList } from "~/routes/_app.rooms.$roomId/_components/MessageList";
import { TextMessageSender } from "~/routes/_app.rooms.$roomId/_components/TextMessageSender";
import { useRoom } from "~/routes/_app.rooms.$roomId/_hooks/useRoom";
import { getWebsocketUrl } from "~/utils/getWebsocketUrl.server";
import type { Route } from "./+types/route";

export const loader = ({ params }: Route.LoaderArgs) => {
  const baseUrl = getWebsocketUrl();
  return { baseUrl, roomId: params.roomId };
};

export default function Component({ loaderData }: Route.ComponentProps) {
  const { language, switchLanguage, messages, addTextMessage, addAudioMessage } = useRoom(
    loaderData.baseUrl,
    loaderData.roomId,
  );
  return (
    <div>
      <h2>Real-Time Chat</h2>
      <CurrentRoomUrl baseUrl={loaderData.baseUrl} />
      <div className="flex flex-row items-center gap-2">
        <div>{language === "ja" ? "日本語" : "英語"}で話します</div>
        <button type="button" className="border p-2 rounded" onClick={switchLanguage}>
          切り替える
        </button>
      </div>
      <hr className="my-2" />
      <div className="flex flex-row gap-2 items-center">
        <TextMessageSender addTextMessage={addTextMessage} />
        <span>or</span>
        <AudioMessageSender addAudioMessage={addAudioMessage} />
      </div>
      <hr className="my-2" />
      <MessageList messages={messages} />
    </div>
  );
}
