# Error & Fix Record (2024-03-02)

ဒီနေ့တက်ခဲ့တဲ့ အဓိက error တွေနဲ့ သူတို့ကို ဖြေရှင်းခဲ့တဲ့ မှတ်တမ်းဖြစ်ပါတယ်။ (ဤဖိုင်ကို Git ပေါ်သို့ မတင်ရန် .gitignore တွင် ထည့်သွင်းထားသည်)

---

## ၁။ Admin Panel Login "Verifying..." Hang ဖြစ်ခြင်း
**Error:** Admin Login ဝင်တဲ့အခါ Key မှန်သော်လည်း "Verifying..." မှာပဲ ရပ်နေပြီး ရှေ့မဆက်ခြင်း။ (Local တွင် အလုပ်လုပ်သော်လည်း Live Cloudflare Pages တွင် ဖြစ်ခြင်း)

- **Cause:** Next.js Server Actions ထဲမှာ `getRequestContext()` နဲ့ `redirect()` ကို သုံးထားခြင်း။ Client Component ကနေ Server Action ကို direct await လုပ်ထားတဲ့အခါ Cloudflare Edge Runtime က Redirect signal ကို handle မလုပ်နိုင်ဘဲ request က ပျောက်သွား/hang ဖြစ်သွားခြင်း။
- **Fix:** Server Action ကို ဖယ်ရှားပြီး `/api/admin/login` ဆိုတဲ့ **API Route** အသစ်ကို တည်ဆောက်ခဲ့သည်။ API Route က Edge မှာ ပို stable ဖြစ်ပြီး `Response.cookies.set()` နဲ့ redirect URL ကို JSON payload အဖြစ် ပြန်ပို့ကာ Client ဘက်က `window.location.href` နဲ့ navigate လုပ်စေခဲ့ပြီး ဖြေရှင်းခဲ့သည်။

---

## ၂။ Telegram Webhook "500 Internal Server Error"
**Error:** Telegram Bot ကို /start ပို့သော်လည်း ဘာစာမှ ပြန်မလာခြင်း။ Webhook info တွင် "500 Error" ပြနေခြင်း။

- **Cause 1:** `getServerContext()` ကို သုံးထားတဲ့အတွက် Webhook ထဲမှာ မလိုအပ်ဘဲ `Better-Auth` (User session) ကိုပါ initialize လုပ်ဖို့ ကြိုးစားခြင်း။ Telegram က ပို့တဲ့ Headers တွေကြောင့် Auth layer က crash ဖြစ်သွားခြင်း။
- **Cause 2:** Drizzle Relational API (`db.query.X`) က Cloudflare D1 ပေါ်မှာ Silently fail ဖြစ်တတ်ခြင်း။
- **Fix:** `getServerContext()` ကို ဖြုတ်ပြီး Cloudflare Context (`getRequestContext`) နဲ့ Database (`drizzle`) ကို တိုက်ရိုက် initialize လုပ်ခဲ့သည်။ Query တွေကိုလည်း relational API အစား standard `db.select().from()` API ကို ပြောင်းသုံးပြီး ဖြေရှင်းခဲ့သည်။

---

## ၃။ Admin Panel Locale Hardcoding
**Error:** Admin logout လုပ်တဲ့အခါ ဒါမှမဟုတ် Admin route တချို့ကို access လုပ်တဲ့အခါ Hardcoded `/en/` သို့သာ redirect ဖြစ်နေခြင်း။

- **Cause:** Redirect URL တွေမှာ Dynamic locale param ကို မသုံးဘဲ template literal ထဲမှာ `/en/` လို့ ရှေ့က ပိတ်ထားခဲ့ခြင်း။
- **Fix:** Redirect တွေအားလုံးကို `/${locale}/admin/...` ပုံစံသို့ ပြောင်းလဲခဲ့ပြီး Layout ကနေ locale params ကို ထုတ်ယူသုံးစွဲစေခဲ့သည်။

---

## ၄။ Telegram Callback Query Handler ပျောက်နေခြင်း
**Error:** Telegram Bot မှာ ဝတ္ထုစာရင်းပြပြီး ရွေးခိုင်းသော်လည်း Novel ကို နှိပ်လိုက်တဲ့အခါ ဘာမှ မပြောင်းလဲခြင်း။

- **Cause:** Webhook ကုဒ်ထဲမှာ `select_novel_*` ဆိုတဲ့ callback_data handler ကို handle မလုပ်ထားခဲ့ခြင်း။
- **Fix:** Webhook ရဲ့ `callback_query` handler ထဲမှာ `data.startsWith("select_novel_")` logic ကို ထည့်သွင်းပေးခဲ့သည်။

---

## ၅။ Webhook Diagnostic Tooling
**Future Proofing:** Live မှာ အလုပ်လုပ်လား စစ်နိုင်ရန် Webhook URL ကို Browser မှာ ဖွင့်ကြည့်ပါက Environment Variables (Tokens နှင့် DB Binding) ရှိ၊ မရှိ စစ်ဆေးပေးမည့် **GET diagnostic endpoint** တစ်ခုကိုပါ webhook code ထဲတွင် ထည့်သွင်းပေးခဲ့သည်။
