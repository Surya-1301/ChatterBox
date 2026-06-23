import ResetPasswordForm from '@/components/auth/reset-password-form';

// Avoid strict typing here to remain compatible with Next's generated PageProps
export default function ResetPasswordPage({ searchParams }: any) {
  const token = Array.isArray(searchParams?.token) ? searchParams?.token[0] : searchParams?.token;
  const tokenId = Array.isArray(searchParams?.tokenId) ? searchParams?.tokenId[0] : searchParams?.tokenId;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow">
        <h1 className="mb-2 text-2xl font-bold">Reset Password</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {!token || !tokenId
            ? 'Enter your email and we will create a password reset link for your account.'
            : 'Choose a new password for your account.'}
        </p>
        <ResetPasswordForm token={token} tokenId={tokenId} />
      </div>
    </main>
  );
}
