import { useWebSocket } from "~/hooks/useWebsocket";
import type { Route } from "./+types/home";

export function meta() {
  return [{ title: "New React Router App" }, { name: "description", content: "Welcome to React Router!" }];
}

export function loader({ context }: Route.LoaderArgs) {

  const websocketURL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || "3000"}`;
  return { message: context.VALUE_FROM_EXPRESS, websocketURL };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  useWebSocket(loaderData.websocketURL);
  return <div>test</div>;
}
