# SpeakWell — personal English coach

A privacy-conscious, local-first English practice app. It is intentionally dependency-free so it can run on any current Node.js installation.

## Run

```bash
cp .env.example .env
npm start
```

Open `http://localhost:3000`. The core activities, timer, scores, speech synthesis, recording, transcript capture (where the browser supports it), and local progress work without an AI key.

## Real AI feedback

To turn on real model feedback, fill `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` in `.env`. The key stays on the Node server; the browser sends only activity text to `/api/feedback`. Compatible choices include an OpenAI-compatible endpoint, a self-hosted Ollama server (`http://localhost:11434/v1`, model such as `qwen2.5:7b-instruct`), or another provider's compatible endpoint. Do not expose a cloud key in client-side code.

## Technology choices and trade-offs

| Capability | Default | Optional upgrade | Why |
|---|---|---|---|
| Speech to text | Web Speech API | whisper.cpp / faster-whisper self-hosted | Fast, zero-key convenience; browser support varies. Self-hosting is more private but needs roughly 4–8 GB RAM for small models. |
| Text to speech | SpeechSynthesis API | Piper locally / cloud TTS | Free and works offline after voices load; quality and voices vary by device. |
| Tutor feedback | Rule-based fallback | OpenAI-compatible model proxy | The fallback keeps practice usable; the proxy provides personalized, real model feedback when configured. |
| Audio pronunciation | Recording + transcript pace | Whisper timestamps / dedicated scoring service | This app clearly labels heuristic feedback. Accurate phoneme scoring needs an audio model/service and is not claimed by default. |

## Privacy

Recordings are held in the current browser session, unless you download them; progress text is stored in `localStorage`. The microphone is requested only after selecting Record. You can clear local learning history from Settings. When configured, written or transcribed content is sent to the selected AI provider for feedback; recordings themselves are not uploaded by this app.
