// A small MCP client (Streamable HTTP): initialize, then tools/list and tools/call,
// with the user's OAuth token. Replies come back as JSON or as a server-sent-event stream.
export class McpAuthError extends Error {
  constructor(message) { super(message); this.name = 'McpAuthError'; }
}

function fromSSE(text, id) {
  for (const block of text.split(/\r?\n\r?\n/)) {
    const data = block.split(/\r?\n/).filter(l => l.startsWith('data:')).map(l => l.slice(5).trim()).join('\n');
    if (!data) continue;
    try {
      const msg = JSON.parse(data);
      if (msg.id === id) return msg;
    } catch { /* keep-alives and partial lines */ }
  }
  return null;
}

export async function openMcp(url, token, { timeoutMs = 45000 } = {}) {
  let session = null;
  let next = 0;
  async function rpc(method, params, { notify = false } = {}) {
    const id = notify ? undefined : ++next;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        authorization: `Bearer ${token}`,
        'mcp-protocol-version': '2025-06-18',
        ...(session ? { 'mcp-session-id': session } : {}),
      },
      body: JSON.stringify(notify ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id, method, params }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    session = res.headers.get('mcp-session-id') ?? session;
    if (res.status === 401 || res.status === 403) throw new McpAuthError(`sign-in needed (${res.status})`);
    if (notify) return null;
    const body = await res.text();
    if (!res.ok) throw new Error(`store said ${res.status}: ${body.slice(0, 200)}`);
    const msg = (res.headers.get('content-type') ?? '').includes('text/event-stream') ? fromSSE(body, id) : JSON.parse(body);
    if (!msg) throw new Error('no reply from the store');
    if (msg.error) throw new Error(msg.error.message ?? 'store error');
    return msg.result;
  }
  await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'Voc', version: '1.0' } });
  await rpc('notifications/initialized', {}, { notify: true });
  return {
    list: async () => (await rpc('tools/list', {})).tools ?? [],
    call: (name, args) => rpc('tools/call', { name, arguments: args ?? {} }),
  };
}

// A tool result as text for the model: its text parts, plus any structured content.
export function resultText(r) {
  const parts = (r?.content ?? []).map(c => (c.type === 'text' ? c.text : c.type === 'resource' ? JSON.stringify(c.resource) : '')).filter(Boolean);
  if (r?.structuredContent) parts.push(JSON.stringify(r.structuredContent));
  return parts.join('\n');
}
