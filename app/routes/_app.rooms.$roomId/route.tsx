import {AudioMessageSender} from "~/routes/_app.rooms.$roomId/_components/AudioMessageSender";
import {CurrentRoomUrl} from "~/routes/_app.rooms.$roomId/_components/CurrentRoomUrl";
import {MessageList} from "~/routes/_app.rooms.$roomId/_components/MessageList";
import {TextMessageSender} from "~/routes/_app.rooms.$roomId/_components/TextMessageSender";
import {useRoom} from "~/routes/_app.rooms.$roomId/_hooks/useRoom";
import {getWebsocketUrl} from "~/utils/getWebsocketUrl.server";
import type {Route} from "./+types/route";

export const loader = ({ params }: Route.LoaderArgs) => {
  const baseUrl = getWebsocketUrl();
  return { baseUrl, roomId: params.roomId };
};

export default function Component({ loaderData }: Route.ComponentProps) {
const { socket, language } = useRoom(loaderData.baseUrl, loaderData.roomId)
  return (
    <div>
      <h2>Real-Time Chat</h2>
      <CurrentRoomUrl baseUrl={loaderData.baseUrl}/>
      <div>{language === "ja" ? "日本語" : "英語"}で話す部屋です。</div>
      <hr className="my-2"/>
      <div className="flex flex-row gap-2 items-center">
        <TextMessageSender socket={socket} roomId={loaderData.roomId}/>
        <span>or</span>
        <AudioMessageSender socket={socket} roomId={loaderData.roomId}/>
      </div>
      <hr className="my-2"/>
      <MessageList socket={socket}/>

    </div>
  );
}
