export const GET = async () => {
  return Response.json({ status: "ok", timestamp: new Date().toISOString() });
};
