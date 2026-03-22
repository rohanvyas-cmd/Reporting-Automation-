export async function readJsonResponse(res) {
  const text = await res.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const preview = text.slice(0, 200).replace(/\s+/g, ' ');
    const suffix = text.length > preview.length ? '…' : '';
    const status = `${res.status} ${res.statusText}`.trim();
    throw new Error(`Server returned invalid JSON (${status}). Preview: ${preview}${suffix}`);
  }
}
