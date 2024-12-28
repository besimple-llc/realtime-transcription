import { useState } from "react";
import { Link, useLocation } from "react-router";

type Props = {
  baseUrl: string;
};

export const CurrentRoomUrl = ({ baseUrl }: Props) => {
  const location = useLocation();
  const url = `${baseUrl}${location.pathname}`;
  const [copied, setCopied] = useState(false);

  const handleOnCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="flex flex-row items-center gap-2">
      <p>
        Room URL:{" "}
        <Link to={url} target="_blank">
          {url}
        </Link>
      </p>
      <button type="button" className="border rounded p-2" onClick={handleOnCopy}>
        {copied ? "コピーしました" : "コピーする"}
      </button>
    </div>
  );
};
