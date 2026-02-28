"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client"; // auth-client က function ကိုသုံးမယ်
import { getTranslations } from "next-intl/server";
export const runtime = 'edge';
import { useRouter, Link } from "@/i18n/routing";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    setLoading(true);
    await signIn.email({
      email,
      password,
      callbackURL: "/", // Login ဝင်ပြီးရင် Home ကို ပြန်ပို့မယ်
    }, {
      onSuccess: () => {
        setLoading(false);
        router.push("/");
      },
      onError: (ctx) => {
        setLoading(false);
        alert(ctx.error.message); // Password မှားရင် Error ပြမယ်
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="max-w-md w-full bg-[var(--surface)] p-8 rounded-2xl shadow-sm border border-[var(--border)]">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Welcome Back 👋</h1>
          <p className="mt-2 text-[var(--text-muted)]">Sign in to continue to PyuNovel.</p>
        </div>

        <div className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] px-4 py-2 rounded-xl focus:border-[var(--action)] focus:ring-1 focus:ring-[var(--action)] outline-none transition-colors placeholder:text-[var(--text-muted)]"
              placeholder="hello@example.com"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] px-4 py-2 rounded-xl focus:border-[var(--action)] focus:ring-1 focus:ring-[var(--action)] outline-none transition-colors placeholder:text-[var(--text-muted)]"
              placeholder="••••••••"
            />
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full bg-[var(--action)] text-white py-2.5 rounded-xl font-bold hover:bg-[var(--action-hover)] transition-all shadow-md disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Don't have an account?{" "}
          <Link href="/sign-up" className="text-[var(--action)] font-semibold hover:underline">
            Sign up
          </Link>
        </div>

      </div>
    </div>
  );
}