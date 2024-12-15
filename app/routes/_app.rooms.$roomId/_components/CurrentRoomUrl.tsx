import {useLocation} from "react-router";

type Props = {
  baseUrl: string;
}

export const CurrentRoomUrl = ({ baseUrl }: Props) => {
  const location = useLocation();

  return (
    <p>Room URL: {`${baseUrl}${location.pathname}`}</p>
  )
}
