// The two small names the screens share: where a note came from, and what wrote it.
export const SOURCE = { voice: 'voice note', file: 'audio file', shared: 'shared from WhatsApp', typed: 'typed' };

export const engineName = e => (e?.startsWith('ai:') ? `AI → ${e.slice(3)[0].toUpperCase()}${e.slice(4)}` : 'offline parser');
