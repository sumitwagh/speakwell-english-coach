const http = require('http');
const fs = require('fs');
const path = require('path');

// Tiny .env loader; avoids a runtime dependency.
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
const send = (res, status, body, type = 'application/json') => res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' }).end(body);
const staticType = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/feedback') {
    let raw = ''; req.on('data', c => { raw += c; if (raw.length > 40000) req.destroy(); });
    req.on('end', async () => {
      if (!process.env.AI_API_KEY || !process.env.AI_BASE_URL || !process.env.AI_MODEL) return send(res, 503, JSON.stringify({ error: 'AI provider is not configured.' }));
      try {
        const input = JSON.parse(raw);
        if (typeof input.text !== 'string' || input.text.length > 12000) return send(res, 400, JSON.stringify({ error: 'Invalid practice text.' }));
        const prompt = `You are a kind English coach for a Marathi-speaking learner. Review this ${input.activity || 'practice'} response: "${input.text}". Return ONLY valid JSON with keys: praise (string), corrections (array of {original, corrected, why}), naturalAlternative (string), nextFocus (string), marathiTip (string), microExercise (string). Use simple English. Do not invent audio feedback.`;
        const response = await fetch(`${process.env.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AI_API_KEY}` },
          // Keep this broadly compatible with OpenAI-compatible local servers too.
          body: JSON.stringify({ model: process.env.AI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: .35 })
        });
        if (!response.ok) throw new Error(`Provider returned ${response.status}`);
        const data = await response.json(); send(res, 200, data.choices?.[0]?.message?.content || '{}');
      } catch (error) { send(res, 502, JSON.stringify({ error: 'AI provider is unavailable. Your practice is saved locally.' })); }
    }); return;
  }
  const safe = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const file = path.join(__dirname, safe);
  if (!file.startsWith(__dirname) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, 'Not found', 'text/plain');
  send(res, 200, fs.readFileSync(file), staticType[path.extname(file)] || 'application/octet-stream');
});
server.on('error', err => { console.error(`Could not start SpeakWell: ${err.message}`); process.exitCode = 1; });
server.listen(process.env.PORT || 3000, '127.0.0.1', () => console.log(`SpeakWell running at http://localhost:${process.env.PORT || 3000}`));
