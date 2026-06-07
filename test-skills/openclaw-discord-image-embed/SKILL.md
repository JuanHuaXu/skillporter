---
name: openclaw-discord-image-embed
description: Use when a Discord user asks an OpenClaw agent to search, show, post, embed, or send an image, meme, GIF, thumbnail, or visual result.
---

# OpenClaw Discord Image Embed

Use this for Discord requests that want a visible image, meme, GIF, or visual search result in chat.

## Rule

Do not answer with prose only when the user asked to embed, show, post, or send an image. Deliver the selected image through the message tool.

## Workflow

1. Search with an image-capable tool when needed. Prefer result fields in this order:
   - `recommendedEmbedUrl`
   - `media`
   - `mediaUrl`
   - `imageUrl`
   - direct image URL from the result
   - thumbnail URL only when no better direct image is available
2. Treat `recommendedSourceUrl`, `url`, and result page links as attribution, not as the image to send.
3. Do not fetch the source page first unless the selected direct image URL fails.
4. Send the image with the message tool using `action: "send"` and top-level `media`.
5. Include a short caption. Add the source URL as text when available.
6. Do not rely on Discord automatic URL unfurling; outbound link previews may be suppressed.

## Preferred Send Shape

Use the numeric id from the current turn's `chat_id` metadata as `target`.

```json
{
  "action": "send",
  "target": "channel:<current chat_id numeric id>",
  "message": "Top result: <source-url>",
  "media": "<recommendedEmbedUrl>"
}
```

## Avoid

- Do not reply with a promise such as "let me get that embed"; call the message tool.
- Do not send only a source page URL when a direct image URL is available.
- Do not say "let me fetch the page" after an image search already returned a direct image.
- Do not mention confidence-ranking caveats unless no usable image candidate exists.
- Do not paste raw tool result JSON into the user-visible reply.
