"use client";

import "@/lib/amplify";
import Link from "next/link";
import { useState } from "react";
import { signUp } from "aws-amplify/auth";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
} from "lucide-react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (
      !name.trim() ||
      !organization.trim() ||
      !email.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);

    try {
      const result = await signUp({
        username: normalizedEmail,
        password,
        options: {
          userAttributes: {
            email: normalizedEmail,
            name: name.trim(),
          },
        },
      });

      sessionStorage.setItem(
        "orgshield_pending_signup",
        JSON.stringify({
          name: name.trim(),
          organization: organization.trim(),
          email: normalizedEmail,
        })
      );

      if (
        result.nextStep.signUpStep === "CONFIRM_SIGN_UP"
      ) {
        window.location.href = "/verify-email";
        return;
      }

      if (result.isSignUpComplete) {
        window.location.href = "/signin";
        return;
      }

      setError(
        "Your account registration has started, but another verification step is required. Please try again or contact support."
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.";

      if (
        message.includes("UsernameExistsException") ||
        message.toLowerCase().includes("already exists")
      ) {
        setError(
          "An account with this email may already exist. Try signing in or resetting your password."
        );
      } else {
        setError(message);
      }
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
            GET STARTED FOR FREE
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Create your workspace
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Bring your team, projects, and daily work together
            in one secure place.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Your full name
              </span>
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Enter your name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Organization name
              </span>
              <input
                required
                autoComplete="organization"
                value={organization}
                onChange={(event) =>
                  setOrganization(event.target.value)
                }
                placeholder="e.g. Acme Technologies"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </label>

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
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </span>

              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                "Creating account..."
              ) : (
                <>
                  Create account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-violet-600 hover:text-violet-800"
            >
              Sign in
            </Link>
          </p>

          <p className="mt-10 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to your organization&apos;s
            applicable terms and privacy policies.
          </p>
        </div>
      </section>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#17152f] p-12 text-white lg:flex xl:p-16">
        <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-violet-200">
            <ShieldCheck size={15} />
            Organization-first management
          </span>
        </div>

        <div className="relative max-w-lg">
          <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
            Great teams deserve a workspace that works.
          </h2>

          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
            Organize departments, manage people, track
            projects, and understand your team&apos;s progress
            from one connected platform.
          </p>

          <div className="mt-9 space-y-4">
            {[
              "Manage departments and employees",
              "Track projects and task completion",
              "Keep your organization's data secure",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm text-slate-200"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-violet-300">
                  <Check size={15} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-400">
          OrgShield · Your organization, in control.
        </p>
      </aside>
    </main>
  );
}