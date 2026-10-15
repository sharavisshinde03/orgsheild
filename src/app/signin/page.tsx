"use client";

import "@/lib/amplify";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  signIn,
  confirmSignIn,
  fetchAuthSession,
} from "aws-amplify/auth";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  LockKeyhole,
} from "lucide-react";

type SignInResult = Awaited<ReturnType<typeof signIn>>;

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [requiresNewPassword, setRequiresNewPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSignInResult(result: SignInResult) {
    if (result.isSignedIn) {
      window.location.replace("/");
      return;
    }

    switch (result.nextStep.signInStep) {
      case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED":
        setRequiresNewPassword(true);
        setError("");
        break;
      case "CONFIRM_SIGN_UP":
        setError("Please verify your email before signing in.");
        break;
      case "RESET_PASSWORD":
        window.location.href = "/forgot-password";
        break;
      case "CONFIRM_SIGN_IN_WITH_SMS_CODE":
      case "CONFIRM_SIGN_IN_WITH_EMAIL_CODE":
      case "CONFIRM_SIGN_IN_WITH_TOTP_CODE":
        setError("Additional verification is required to complete sign-in.");
        break;
      default:
        setError(
          `Additional authentication is required: ${result.nextStep.signInStep}`
        );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn({
        username: normalizedEmail,
        password,
      });

      handleSignInResult(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.";

      if (message.includes("UserNotConfirmedException")) {
        setError(
          "Your email is not verified yet. Please complete email verification first."
        );
      } else if (
        message.includes("NotAuthorizedException") ||
        message.includes("UserNotFoundException")
      ) {
        setError(
          "Cognito rejected the sign-in. Check your email and password, and verify that you are using the correct Cognito user pool."
        );
      } else if (message.includes("PasswordResetRequiredException")) {
        setError(
          "Your password must be reset before you can sign in. Please use Forgot password."
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleNewPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await confirmSignIn({
        challengeResponse: newPassword,
      });

      if (result.isSignedIn) {
        const session = await fetchAuthSession();

        if (!session.tokens?.accessToken) {
          setError(
            "Password accepted, but no active session was returned. Please sign in again."
          );
          setRequiresNewPassword(false);
          return;
        }

        window.location.replace("/");
        return;
      }

      setError(
        `Cognito requires another authentication step: ${result.nextStep.signInStep}`
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to set your new password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-12 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
              <ShieldCheck size={25} />
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              OrgShield
            </span>
          </Link>

          <p className="text-sm font-semibold text-violet-600">
            {requiresNewPassword ? "ACCOUNT SETUP" : "WELCOME BACK"}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {requiresNewPassword
              ? "Create your password"
              : "Sign in to your workspace"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {requiresNewPassword
              ? "Your administrator provided a temporary password. Choose a new password to continue."
              : "Pick up where you left off. Your team and projects are waiting."}
          </p>

          {requiresNewPassword ? (
            <form onSubmit={handleNewPasswordSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  New password
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100">
                  <LockKeyhole size={18} className="shrink-0 text-slate-400" />
                  <input
                    required
                    minLength={8}
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Create a new password"
                    className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="shrink-0 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm new password
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100">
                  <LockKeyhole size={18} className="shrink-0 text-slate-400" />
                  <input
                    required
                    minLength={8}
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Enter your new password again"
                    className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              {error && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating password..." : "Set new password"}
                {!loading && <ArrowRight size={18} />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequiresNewPassword(false);
                  setNewPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                className="w-full text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Work email
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100">
                  <Mail size={18} className="shrink-0 text-slate-400" />
                  <input
                    required
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </span>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100">
                  <LockKeyhole size={18} className="shrink-0 text-slate-400" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                    className="shrink-0 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </label>

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-violet-600 hover:text-violet-800"
                >
                  Forgot password?
                </Link>
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {!requiresNewPassword && (
            <p className="mt-7 text-center text-sm text-slate-500">
              New to OrgShield?{" "}
              <Link
                href="/signup"
                className="font-semibold text-violet-600 hover:text-violet-800"
              >
                Create an account
              </Link>
            </p>
          )}

          <p className="mt-10 text-center text-xs text-slate-400">
            Protected organization workspace · OrgShield
          </p>
        </div>
      </section>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#17152f] p-12 text-white lg:flex xl:p-16">
        <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex items-center gap-2 text-sm font-semibold text-violet-200">
          <ShieldCheck size={19} />
          YOUR ORGANIZATION, IN CONTROL
        </div>

        <div className="relative max-w-lg">
          <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
            One workspace. Your entire organization.
          </h2>
          <p className="mt-6 text-base leading-7 text-slate-300">
            Bring people, departments, projects, and tasks together. Make progress visible and keep everyone aligned.
          </p>
          <div className="mt-9 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-sm font-semibold">Built for connected teams</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              A unified view of work across your organization, with authentication powered by Amazon Cognito.
            </p>
          </div>
        </div>

        <p className="relative text-xs text-slate-400">
          OrgShield · Organization management, simplified.
        </p>
      </aside>
    </main>
  );
}
