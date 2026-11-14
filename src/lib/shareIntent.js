import { Capacitor, registerPlugin } from "@capacitor/core";

const ShareIntent = registerPlugin("ShareIntent");

export async function watchSharedJobs(onShare) {
  if (!Capacitor.isNativePlatform()) return () => {};

  let listener;
  try {
    listener = await ShareIntent.addListener("shareReceived", onShare);
    const pending = await ShareIntent.getPendingShare();
    if (pending?.shared) onShare(pending);
  } catch {
    // The browser build and older installed builds simply have no native share bridge.
  }
  return () => listener?.remove?.();
}
