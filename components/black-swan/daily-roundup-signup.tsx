"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { useImprovedAuth } from "@/providers/authentication";
import { config } from "@/lib/config";

const DISMISSED_EMAIL_SIGNUP_KEY = "dismissed_email_signup";

type VerificationStep = "email" | "verification" | "success";

interface DailyRoundupSignupProps {
  onDismiss: () => void;
}

export function DailyRoundupSignup({ onDismiss }: DailyRoundupSignupProps) {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [currentStep, setCurrentStep] = useState<VerificationStep>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const { currentUser } = useImprovedAuth();

  // Handle email submission and validation
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Validate email (check duplicates and fake emails)
      const validateResponse = await fetch(
        `${config.services.userAuth}/user/email/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            uid: currentUser.uid,
          }),
        }
      );

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Email validation failed");
      }

      // Step 2: Send verification code
      const sendCodeResponse = await fetch(
        `${config.services.userAuth}/user/email/send-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            uid: currentUser.uid,
          }),
        }
      );

      if (!sendCodeResponse.ok) {
        const errorData = await sendCodeResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to send verification code"
        );
      }

      // Move to verification step
      setCurrentStep("verification");
      setRemainingAttempts(5);
    } catch (err) {
      console.error("Error validating/sending email:", err);
      setError(err instanceof Error ? err.message : "Failed to process email");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle verification code submission
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 4) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${config.services.userAuth}/user/email/verify-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: verificationCode,
            uid: currentUser.uid,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.data?.remainingAttempts !== undefined) {
          setRemainingAttempts(data.data.remainingAttempts);
        }
        throw new Error(data.message || "Verification failed");
      }

      // Success - mark as dismissed and show success
      localStorage.setItem(DISMISSED_EMAIL_SIGNUP_KEY, "true");
      setCurrentStep("success");

      // Auto-close after success
      setTimeout(() => {
        onDismiss();
      }, 3000);
    } catch (err) {
      console.error("Error verifying code:", err);
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle going back to email step
  const handleBackToEmail = () => {
    setCurrentStep("email");
    setVerificationCode("");
    setError(null);
    setRemainingAttempts(5);
  };

  const handleDismiss = () => {
    // Mark as dismissed in localStorage
    localStorage.setItem(DISMISSED_EMAIL_SIGNUP_KEY, "true");
    onDismiss();
  };

  // Success state
  if (currentStep === "success") {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-[550px] flex flex-col">
        <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
          <div className="w-16 h-16 bg-green-900/30 border border-green-700 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h4 className="text-lg font-medium text-white mb-2">
            Email Verified!
          </h4>
          <p className="text-sm text-zinc-400">
            You'll start receiving the Daily Roundup in your inbox from now on.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden relative h-[550px] flex flex-col">
      {/* Banner image at the top */}
      <div
        className={`w-full relative flex-shrink-0 ${
          currentStep === "verification" ? "h-[200px]" : "h-[300px]"
        }`}
      >
        <img
          src="/avatars/dailyRoundupSummary.png"
          alt="Daily Market Roundup"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for fade effect */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#0c0c0e] to-transparent"></div>
        {/* Dismiss button positioned over the banner */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-white transition-colors bg-black/30 rounded-full p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center p-6 py-8 text-center flex-1">
        {currentStep === "email" && (
          <>
            <p className="text-sm text-zinc-400 mb-6">
              Get our free daily analysis reports of the market by linking an
              email to your account.
            </p>

            <form onSubmit={handleEmailSubmit} className="w-full space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-white"
                  required
                />
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-50"
              >
                {isSubmitting ? "Validating..." : "Continue"}
              </Button>
            </form>

            <p className="text-xs text-zinc-500 mt-3">
              We promise to not spam you.
            </p>
          </>
        )}

        {currentStep === "verification" && (
          <>
            <div className="flex items-center mb-4">
              <button
                onClick={handleBackToEmail}
                className="mr-3 p-1 text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Mail className="w-5 h-5 text-zinc-400 mr-2" />
              <span className="text-sm text-zinc-400">{email}</span>
            </div>

            <h4 className="text-lg font-medium text-white mb-2">
              Check your email
            </h4>
            <p className="text-sm text-zinc-400 mb-6">
              Enter the 4-digit code sent to your inbox.
            </p>

            <form onSubmit={handleCodeSubmit} className="w-full space-y-4">
              <div>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  placeholder="Enter 4-digit code"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                    setVerificationCode(value);
                  }}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 focus:border-white"
                  required
                />
                {error && (
                  <div className="text-center mt-2">
                    <p className="text-red-400 text-xs">{error}</p>
                    <p className="text-zinc-500 text-xs mt-1">
                      {remainingAttempts} attempts remaining
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || verificationCode.length !== 4}
                className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-50"
              >
                {isSubmitting ? "Verifying..." : "Verify Email"}
              </Button>
            </form>

            <p className="text-xs text-zinc-500 mt-3">
              Didn't receive the code? Check your spam folder or{" "}
              <button
                onClick={handleBackToEmail}
                className="text-white hover:underline"
              >
                try again
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// Helper function to check if email signup was dismissed
export function isEmailSignupDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DISMISSED_EMAIL_SIGNUP_KEY) === "true";
}
