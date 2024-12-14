import {Link} from "react-router";
import {generateRoomId} from "~/utils/generateRoomId";
import type {Route} from "./+types/route";

export function meta() {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }];
}

export function loader({ context }: Route.LoaderArgs) {
  const roomId = generateRoomId();
  return { message: context.VALUE_FROM_EXPRESS, roomId };
}

export default function Component({ loaderData }: Route.ComponentProps) {
  return (
    <Link to={`/rooms/${loaderData.roomId}`}>部屋を作る</Link>
  );
}
