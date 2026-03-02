# Things That Don't Work (PyuNovel)

Last Updated: 2026-03-02

## Telegram Bot Issues
1. **Silence on /start**: The bot receives the command but fails to respond with the menu.
2. **Database Type Mismatch**: Telegram's numeric `chatId` causes a "Failed query" when compared with the `TEXT` column in D1/SQLite.
3. **Unstable Context**: `getRequestContext()` behavior is inconsistent in the Cloudflare Edge environment, often leading to missing DB or Token bindings.
4. **Non-functional Buttons**: Inline keyboard callbacks (Link/Publish) are not triggering any action or editing messages.

## Deployment Issues
- Webhook info shows 500 Internal Server Errors periodically.
- Outbound messages to Telegram are failing silently.
