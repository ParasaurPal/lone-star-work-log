export async function getServerInfo() {
  return { runtime: "client-spa", timestamp: new Date().toISOString() };
}
