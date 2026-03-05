# Error & Fix Record (2024-03-05)

ဒီနေ့တက်ခဲ့တဲ့ အဓိက error တွေနဲ့ သူတို့ကို ဖြေရှင်းခဲ့တဲ့ မှတ်တမ်းဖြစ်ပါတယ်။ (မှတ်သားရန် - 'don't work.md' သည် လက်ရှိဆက်ဖြစ်နေသူများဖြစ်ပြီး 'error-record.md' သည် ရှင်းပြီးသားများကို မှတ်တမ်းတင်ထားခြင်းဖြစ်သည်)

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

## ၅။ Webhook Diagnostic Tooling (Enhanced)
**Future Proofing:** Live မှာ အလုပ်လုပ်လား စစ်နိုင်ရန် Webhook URL ကို Browser မှာ ဖွင့်ကြည့်ပါက Environment Variables (Tokens နှင့် DB Binding) ရှိ၊ မရှိ စစ်ဆေးပေးမည့် **GET diagnostic endpoint** တစ်ခုကိုပါ webhook code ထဲတွင် ထည့်သွင်းပေးခဲ့သည်။

**Enhanced Diagnostic:**
နောင်တွင် Token valid ဖြစ်မဖြစ်နှင့် Message ချိတ်ဆက်မှု ရှိမရှိ စစ်ရန် အောက်ပါတို့ကို ထပ်တိုးခဲ့သည် -
- **Telegram `getMe` API Call:** Bot Token မှန်ကန်ကြောင်း Telegram Server ဘက်သို့ လှမ်းစစ်ပေးခြင်း။
- **Test Message Injection:** URL ထဲတွင် `?chatId=YOUR_ID` ထည့်သွင်းရုံဖြင့် သင့် Telegram ထံသို့ Webhook မှတစ်ဆင့် test message တိုက်ရိုက် ပို့ပေးခြင်း။ (ဥပမာ- `https://your-domain/api/telegram/webhook?chatId=12345`)
- **Verbose Errors:** Telegram API မှ ပြန်လာသော error status များကို console log ထဲတွင် မြင်သာအောင် ထည့်သွင်းပေးထားသည်။
- **Actual DB Query Test:** `user` table ထဲရှိ `telegramId` column ကို တိုက်ရိုက် Query လုပ်နိုင်ခြင်း ရှိ/မရှိ စစ်ဆေးပေးခြင်း။

---

## ၆။ Cloudflare D1 Query Silent Failure
**Error:** Bot Token နှင့် Webhook connection မှန်ကန်သော်လည်း `/start` ဟု ပို့သည့်အခါ ဘာ reply မှ ပြန်မလာခြင်း။

- **Cause:** Cloudflare D1 ပေါ်တွင် Database Query တစ်ခုခု fail ဖြစ်ပါက (ဥပမာ- Column အမည် မမှန်ခြင်း သို့မဟုတ် Binding အဆင်မပြေခြင်း) Error သည် try-catch အပြင်ဘက်သို့မရောက်ဘဲ request ကို silent ဖြစ်သွားစေတတ်ခြင်း (သို့မဟုတ် custom error ကို catch မလုပ်နိုင်ခြင်း)။
- **Fix:** Webhook ရဲ့ POST handler တစ်ခုလုံးကို global try-catch ပတ်ရုံသာမက နေရာတိုင်းတွင် DB query များကို individual try-catch ဖြင့် ပတ်ခဲ့သည်။ DB query fail ဖြစ်လျှင်ပင် Bot က User ထံသို့ Error message တစ်ခု ပြန်ပို့ပေးရန် (ဥပမာ- `DB error: xxx`) ကုဒ်ကို ပြုပြင်ခဲ့သဖြင့် ပြဿနာကို အလွယ်တကူ ရှာဖွေနိုင်စေခဲ့သည်။

---

## ၇။ Novel View Count မတိုးခြင်း (သုညသာ ပြနေခြင်း)
**Error:** Novel Detail Page ကို ကြည့်သော်လည်း View count သည် သုညသာ ပြနေပြီး Database တွင်လည်း မတိုးခြင်း။ (Local တွင် အလုပ်လုပ်သော်လည်း Live Cloudflare ပေါ်တွင် မတိုးခြင်း)

- **Cause:** `ViewTracker` (Client Component) မှ Server Action (`incrementView`) ကို တိုက်ရိုက် ခေါ်ထားခြင်း။ Cloudflare Edge Runtime တွင် Server Actions ထဲရှိ `getRequestContext()` သည် Bindings (Database connection) များကို အမြဲတမ်း မှန်ကန်စွာ/တည်ငြိမ်စွာ မရရှိနိုင်ခြင်းကြောင့် View တိုးသည့် Query သည် Silent fail ဖြစ်နေခြင်း။
- **Fix:** Server Action အစား `/api/novel/view` ဆိုသည့် **API Route** အသစ်ကို တည်ဆောက်ခဲ့သည်။ Client ဘက်မှ `fetch()` ကို အသုံးပြုကာ ထို API ကို လှမ်းခေါ်စေခဲ့သည်။ API Route များသည် Edge Runtime ပေါ်တွင် ပိုမို Reliable ဖြစ်ပြီး `getServerContext()` မှတစ်ဆင့် Database ကို တည်ငြိမ်စွာ Update လုပ်နိုင်သဖြင့် ပြဿနာကို ဖြေရှင်းနိုင်ခဲ့သည်။
