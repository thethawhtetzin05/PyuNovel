"use client"; // Client Component ဖြစ်ရပါမယ်

import { useState } from "react";
import { signUp } from "@/lib/auth-client"; // Client function ကို ခေါ်သုံးမယ်
import { useRouter, Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
export const runtime = 'edge';

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('Auth');

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      alert(t('passwordMismatch') || "Passwords do not match");
      return;
    }

    setLoading(true);
    await signUp.email({
      email,
      password,
      name,
      callbackURL: "/", // အကောင့်ဖွင့်ပြီးရင် Home ကို ပြန်ပို့မယ်
    }, {
      onRequest: () => {
        // စတင်လုပ်ဆောင်နေပြီ (Loading state...)
      },
      onSuccess: () => {
        setLoading(false);
        router.push("/"); // Success
      },
      onError: (ctx) => {
        setLoading(false);
        alert(ctx.error.message); // Error တက်ရင် Alert ပြမယ်
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="max-w-md w-full bg-[var(--surface)] p-8 rounded-2xl shadow-sm border border-[var(--border)]">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t('joinPyuNovel')}</h1>
          <p className="mt-2 text-[var(--text-muted)]">{t('signUpDesc')}</p>
        </div>

        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">{t('name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] px-4 py-2 rounded-xl focus:border-[var(--action)] focus:ring-1 focus:ring-[var(--action)] outline-none transition-colors placeholder:text-[var(--text-muted)]"
              placeholder={t('namePlaceholder')}
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] px-4 py-2 rounded-xl focus:border-[var(--action)] focus:ring-1 focus:ring-[var(--action)] outline-none transition-colors placeholder:text-[var(--text-muted)]"
              placeholder={t('emailPlaceholder')}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">{t('password')}</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] px-4 py-2 rounded-xl focus:border-[var(--action)] focus:ring-1 focus:ring-[var(--action)] outline-none transition-colors placeholder:text-[var(--text-muted)]"
              placeholder="••••••••"
            />
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">{t('confirmPassword') || "Confirm Password"}</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] px-4 py-2 rounded-xl focus:border-[var(--action)] focus:ring-1 focus:ring-[var(--action)] outline-none transition-colors placeholder:text-[var(--text-muted)]"
              placeholder="••••••••"
            />
          </div>

          {/* Show Password Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--action)] focus:ring-[var(--action)] cursor-pointer"
            />
            <label htmlFor="showPassword" className="text-sm text-[var(--text-muted)] cursor-pointer select-none">
              {t('showPassword') || "Show Password"}
            </label>
          </div>

          {/* Sign Up Button */}
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full bg-[var(--action)] text-white py-2.5 rounded-xl font-bold hover:bg-[var(--action-hover)] transition-all shadow-md disabled:opacity-50"
          >
            {loading ? t('signingUp') : t('signUp')}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
          {t('hasAccount')}{" "}
          <Link href="/sign-in" className="text-[var(--action)] font-semibold hover:underline">
            {t('loginLink')}
          </Link>
        </div>

      </div>
    </div>
  );
}