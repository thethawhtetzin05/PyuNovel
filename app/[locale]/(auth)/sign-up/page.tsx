"use client"; // Client Component ဖြစ်ရပါမယ်

import { useState } from "react";
import { signUp } from "@/lib/auth-client"; // Client function ကို ခေါ်သုံးမယ်
import { useRouter, Link } from "@/i18n/routing";
export const runtime = 'edge';

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
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
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Join PyuNovel 🧞‍♂️</h1>
          <p className="mt-2 text-[var(--text-muted)]">Start your reading journey today.</p>
        </div>

        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] px-4 py-2 rounded-xl focus:border-[var(--action)] focus:ring-1 focus:ring-[var(--action)] outline-none transition-colors placeholder:text-[var(--text-muted)]"
              placeholder="Your Name"
            />
          </div>

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

          {/* Sign Up Button */}
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full bg-[var(--action)] text-white py-2.5 rounded-xl font-bold hover:bg-[var(--action-hover)] transition-all shadow-md disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[var(--action)] font-semibold hover:underline">
            Log in
          </Link>
        </div>

      </div>
    </div>
  );
}