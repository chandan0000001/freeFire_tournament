export const DATA_CHANGED = 'arena:data-changed';
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('arena-data') : null;
export function notifyDataChanged(broadcast = true) {
  window.dispatchEvent(new Event(DATA_CHANGED));
  if (broadcast) channel?.postMessage('refresh');
}
if (channel) channel.onmessage = () => notifyDataChanged(false);
