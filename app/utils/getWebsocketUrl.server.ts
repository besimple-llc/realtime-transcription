export const getWebsocketUrl = () => {
  return process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || "3000"}`;
};
