"use client";

import "@/lib/amplify";
import Link from "next/link";
import { useState } from "react";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { ShieldCheck, ArrowRight, Mail, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const pendingSignup =
    typeof window !== "undefined"
      ? sessionStorage.getItem("orgshield_pending_signup")
      : null;

  let signupEmail = "";

  try {
    signupEmail = pendingSignup
      ? JSON.parse(pendingSignup).email || ""
      : "";
  } catch {
    signupEmail = "";
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!signupEmail) {
      setError("Signup details were not found. Please return to signup and try again.");
      return;
    }

    if (!code.trim()) {
      setError("Enter the verification code sent to your email.");
      return;
    }

    setLoading(true);

    try {
      const result = await confirmSignUp({
        username: signupEmail,
        confirmationCode: code.trim(),
      });

      if (result.isSignUpComplete) {
        setMessage("Email verified successfully! Redirecting to sign in...");
        sessionStorage.removeItem("orgshield_pending_signup");
        window.location.href = "/signin";
      } else {
        setMessage("Your verification request was processed. Please sign in to continue.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to verify your email. Check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");

    if (!signupEmail) {
      setError("Signup details were not found. Please return to signup.");
      return;
    }

    setLoading(true);

    try {
      await resendSignUpCode({ username: signupEmail });
      setMessage("A new verification code has been sent to your email.");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resend the code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
            <ShieldCheck size={25} />
          </span>
          <span className="text-xl font-bold text-slate-900">OrgShield</span>
        </Link>

        <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Mail size={27} />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
          Verify your email
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Enter the verification code sent to{" "}
          <span className="font-semibold text-slate-700">
            {signupEmail || "your email address"}
          </span>
          .
        </p>

        <form onSubmit={handleVerify} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Verification code
            </span>
            <input
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter the code from your email"
              className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying..." : <>Verify email <ArrowRight size={18} /></>}
          </button>
        </form>

        <button
          type="button"
          disabled={loading}
          onClick={handleResend}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} />
          Resend verification code
        </button>

        <p className="mt-7 text-center text-sm text-slate-500">
          Wrong email?{" "}
          <Link href="/signup" className="font-semibold text-violet-600 hover:text-violet-800">
            Return to signup
          </Link>
        </p>
      </div>
    </main>
  );
}