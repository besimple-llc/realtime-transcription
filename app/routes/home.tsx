import { useWebSocket } from "~/hooks/useWebsocket";
import type { Route } from "./+types/home";

export function meta() {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }];
}

export function loader({ context }: Route.LoaderArgs) {

  return { message: context.VALUE_FROM_EXPRESS, websocketURL: `http://localhost:${process.env.PORT || "3000"}` };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  useWebSocket(loaderData.websocketURL);
  return <div>test</div>;
}
