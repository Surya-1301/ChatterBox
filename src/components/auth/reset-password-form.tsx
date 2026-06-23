"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Props = {
  token?: string;
  tokenId?: string;
};

export default function ResetPasswordForm({ token, tokenId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const hasResetToken = Boolean(token && tokenId);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResetUrl("");

    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Unable to create reset link.");

      setResetUrl(data.resetUrl || "");
      setSuccess(true);
      toast({ title: "Reset link created", description: data.message });
    } catch (err: any) {
      setError(err?.message || "Unable to create reset link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !tokenId) {
      setError("Invalid or missing reset link.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tokenId, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Password reset failed.");

      setSuccess(true);
      toast({ title: "Password Reset!", description: "You can now log in with your new password." });
    } catch (err: any) {
      setError(err?.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  if (success && !hasResetToken) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, a reset link has been created.
        </p>
        {resetUrl && (
          <div className="rounded-md border bg-muted p-3 text-sm">
            <p className="mb-2 font-medium">Development reset link:</p>
            <a className="break-all text-primary underline" href={resetUrl}>
              {resetUrl}
            </a>
          </div>
        )}
        <Button className="w-full" variant="outline" onClick={() => router.push("/")}>
          Back to Login
        </Button>
      </div>
    );
  }

  if (success && hasResetToken) {
    return (
      <div className="space-y-4">
        <p className="mb-4">Your password has been reset!</p>
        <Button className="w-full" onClick={() => router.push("/")}>Go to Login</Button>
      </div>
    );
  }

  if (!hasResetToken) {
    return (
      <form onSubmit={handleRequestReset} className="space-y-4">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating link..." : "Create Reset Link"}
        </Button>
        <Button type="button" className="w-full" variant="ghost" onClick={() => router.push("/")}>
          Back to Login
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleReset} className="space-y-4">
      <Input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}
