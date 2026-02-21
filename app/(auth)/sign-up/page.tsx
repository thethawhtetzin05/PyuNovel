"use client"; // Client Component ဖြစ်ရပါမယ်

import { useState } from "react";
import { signUp } from "@/lib/auth-client"; // Client function ကို ခေါ်သုံးမယ်
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Join Aladdin 🧞‍♂️</h1>
          <p className="text-gray-500 mt-2">Start your reading journey today.</p>
        </div>

        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border px-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Your Name"
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border px-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="hello@example.com"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border px-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          {/* Sign Up Button */}
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full bg-black text-white py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-indigo-600 font-semibold hover:underline">
            Log in
          </Link>
        </div>

      </div>
    </div>
  );
}