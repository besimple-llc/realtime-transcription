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
const { socket } = useRoom(loaderData.baseUrl, loaderData.roomId)
  return (
    <div>
      <h2>Real-Time Chat</h2>
      <CurrentRoomUrl baseUrl={loaderData.baseUrl} />
      <MessageList socket={socket} />
      <hr />
      <TextMessageSender socket={socket} roomId={loaderData.roomId} />
      <AudioMessageSender socket={socket} roomId={loaderData.roomId} />
    </div>
  );
}
