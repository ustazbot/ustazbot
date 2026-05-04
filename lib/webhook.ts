export function fireWebhook(payload: Record<string, unknown>): void {
  const url = process.env.MAKE_WEBHOOK_URL;
  if (!url) return;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // silent — fire-and-forget
  });
}
