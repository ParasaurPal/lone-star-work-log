export function getAppParams() {
  return {
    appId: "lonestar-worklog-local",
    token: "local-token",
    functionsVersion: "local",
    appBaseUrl: typeof window !== "undefined" ? window.location.origin : "",
  };
}
