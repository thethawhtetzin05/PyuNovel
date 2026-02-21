export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // အထူးအက္ခရာများ ဖယ်မယ်
    .replace(/[\s_-]+/g, '-') // Space တွေကို Dash ပြောင်းမယ်
    .replace(/^-+|-+$/g, ''); // ရှေ့နောက် Dash တွေကို ဖယ်မယ်
}