# Problem Solving Record (PyuNovel)

Last Updated: 2026-03-02

## 1. Telegram Bot Silence & Database Errors
- **Issue**: The bot was receiving messages but not replying, or replying with a `Failed query` error.
- **Root Cause**: The `user` table in the Cloudflare D1 Database was missing the `telegram_id`, `telegram_username`, and `telegram_name` columns. This caused any query searching for a user by their Telegram ID to crash.
- **Solution Path**: 
    - (Attempt 1) Forced string casting in code - did not work due to Drizzle/D1 driver behavior.
    - (Attempt 2) Used raw SQL `CAST()` - did not work.
    - (Attempt 3) Used raw SQL string literal - did not work.
    - (Attempt 4) Used D1 native `prepare` statement - did not work.
    - (Step 5) Implemented a diagnostic system (`PRAGMA table_info`) which confirmed the root cause.
    - **(Final Solution)**: Manually execute `ALTER TABLE user ADD COLUMN telegram_id TEXT;` in the Cloudflare D1 Console.
- **Key Learning**: When a `Failed query` error persists despite code changes, the issue is likely with the physical database schema not matching the application's ORM schema. Direct inspection is necessary.

## 2. Chapter Delete Functionality
- **Issue**: Clicking the delete button on the novel detail page did nothing.
- **Root Cause**: Missing Modal trigger in the frontend (`novel-tabs.tsx`).
- **Solution**: Added `ConfirmModal` and `AlertModal` to `novel-tabs.tsx` to handle the user confirmation flow.

## 3. UI Layout Issues (Author Dashboard)
- **Issue**: Long novel titles were pushing other elements off-screen.
- **Root Cause**: Flexbox default behavior (`min-width: auto`).
- **Solution**: Switched the card layout to CSS Grid (`grid-cols-[auto_1fr_auto]`) to give the title a flexible but constrained column, which allows `truncate` to work correctly.

## 4. Environment Variable Access
- **Issue**: The Telegram Bot Token was not being accessed correctly in the Cloudflare Pages Edge runtime.
- **Solution**: Used `getRequestContext().env` to reliably access environment variables and bindings.
