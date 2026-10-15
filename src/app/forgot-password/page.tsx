"use client";

import "@/lib/amplify";
import Link from "next/link";
import { useState } from "react";
import {
  resetPassword,
  confirmResetPassword,
} from "aws-amplify/auth";
import {
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Mail,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "confirm" | "success">(
    "request"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestCode(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await resetPassword({
        username: email.trim().toLowerCase(),
      });
      setStep("confirm");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to request a password reset. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await confirmResetPassword({
        username: email.trim().toLowerCase(),
        confirmationCode: code.trim(),
        newPassword: password,
      });

      setStep("success");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset your password. Check the code and try again."
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
          <span className="text-xl font-bold text-slate-900">
            OrgShield
          </span>
        </Link>

        {step === "request" && (
          <>
            <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Mail size={27} />
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
              Forgot your password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter the email address associated with your account.
              We&apos;ll send you a password reset code.
            </p>

            <form
              onSubmit={handleRequestCode}
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Work email
                </span>

                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              {error && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {loading ? "Sending code..." : <>Send reset code <ArrowRight size={18} /></>}
              </button>
            </form>
          </>
        )}

        {step === "confirm" && (
          <>
            <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <LockKeyhole size={27} />
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
              Reset your password
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter the reset code sent to{" "}
              <span className="font-semibold text-slate-700">
                {email}
              </span>{" "}
              and choose a new password.
            </p>

            <form
              onSubmit={handleResetPassword}
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Reset code
                </span>
                <input
                  required
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value)
                  }
                  placeholder="Enter reset code"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  New password
                </span>
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm new password
                </span>
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Re-enter your password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </label>

              {error && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {loading ? "Resetting password..." : "Reset password"}
              </button>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="mt-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={34} />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-slate-900">
              Password updated
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your password has been reset successfully. You can now
              sign in using your new password.
            </p>

            <Link
              href="/signin"
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Return to sign in <ArrowRight size={18} />
            </Link>
          </div>
        )}

        <Link
          href="/signin"
          className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-violet-700"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
      </div>
    </main>
  );
}