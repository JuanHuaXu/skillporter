---
name: openclaw-discord-url-embed
description: Use when a Discord user asks an OpenClaw agent to embed, preview, unfurl, share, cite, or post a URL/link/card in Discord.
---

# OpenClaw Discord URL Embed

Use this for Discord requests that want a visible URL preview, link card, source card, or clickable citation in chat.

## Rule

Do not assume a plain URL will create a Discord preview. Link previews require Discord auto-embedding, bot/channel permission, and no suppress-embed flag. OpenClaw Discord outbound may suppress generated link embeds by default.

## Choose The Delivery Path

1. **User wants a link preview/card for a webpage**
   - Send the URL in message content using `action: "send"`.
   - Explicitly set `suppressEmbeds: false` when the message tool exposes it.
   - Keep the URL bare, not wrapped in angle brackets.
2. **User wants an image, meme, GIF, or visual result**
   - Use `openclaw-discord-image-embed` instead.
   - Prefer `media` over URL unfurling.
3. **User only wants a citation**
   - Send normal text with the URL. Do not force a card unless asked.

## Preferred Link Preview Shape

Use the numeric id from the current turn's `chat_id` metadata as `target`.

```json
{
  "action": "send",
  "target": "channel:<current chat_id numeric id>",
  "message": "https://example.com/page",
  "suppressEmbeds": false
}
```

## Avoid

- Do not wrap URLs in `<...>` when the user wants a preview.
- Do not set `suppressEmbeds: true` when the user wants an unfurl or card.
- Do not promise Discord will unfurl every URL; sites, permissions, and Discord fetch behavior can block previews.
- Do not fetch a page only to create a link preview unless the user asked for a summary or metadata.

## Discord Facts

- Discord message create accepts `embeds` arrays for explicit rich embeds.
- `SUPPRESS_EMBEDS` prevents embeds from being included in serialized messages.
- `EMBED_LINKS` controls whether links auto-embed in text channels.
- Embed `image.url` supports only `http(s)` and attachment URLs.
