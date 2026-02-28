"use client";

import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter, Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useModalStore } from "@/lib/store/use-modal-store";
export const runtime = 'edge';

export default function SignUpPage() {
  const openModal = useModalStore((state) => state.openModal);
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
      openModal("alert", {
        title: "Error",
        message: t('passwordMismatch') || "Passwords do not match",
        type: "error"
      });
      return;
    }

    setLoading(true);
    await signUp.email({
      email,
      password,
      name,
      callbackURL: "/",
    }, {
      onSuccess: () => {
        setLoading(false);
        router.push("/");
      },
      onError: (ctx) => {
        setLoading(false);
        openModal("alert", {
          title: t('registrationFailed') || "Registration Failed",
          message: ctx.error.message || "Something went wrong. Please try again.",
          type: "error"
        });
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
