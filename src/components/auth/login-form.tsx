'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { app, Credentials } from '@/lib/realm';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Try built-in server auth endpoint first (MongoDB-backed)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('auth-token', data.token || '');
        localStorage.setItem('currentUser', JSON.stringify(data.user || {}));
        toast({ title: 'Login Successful!', description: "Welcome back! You're being redirected." });
        router.push('/chat');
        return;
      }

      // If server responded with an error (4xx/5xx), show that message instead of falling back to Realm.
      let parsed: any = null;
      try {
        parsed = await res.json();
      } catch (e) {
        // not JSON
      }
      const serverMsg = parsed?.error || parsed?.message || (await res.text()).slice(0, 200);
      throw new Error(serverMsg || 'Login failed');
    } catch (error: any) {
      console.error('Error logging in: ', error);
      const raw = error?.error || error?.message || String(error || '');
      const isEol = /atlas app services|device sync|reached eol/i.test(raw);
      if (isEol) {
        toast({
          title: 'Login Failed',
          description:
            'MongoDB Atlas App Services (Realm) and Device Sync have reached end-of-life. Authentication via this provider is currently unavailable. Please contact the site administrator or switch to the configured alternative auth provider.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login Failed',
          description: raw || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" {...field} />
              </FormControl>
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  className="text-sm text-primary underline hover:text-primary/80 focus:outline-none"
                  onClick={() => router.push('/reset-password')}
                >
                  Forgot password?
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Login</Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => { window.location.href = '/api/auth/google'; }}>
          Continue with Google
        </Button>
      </form>
    </Form>
  );
}
