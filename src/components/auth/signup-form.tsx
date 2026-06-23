
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

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: 'Name must be at least 2 characters.',
    }),
    username: z.string().min(3, {
        message: 'Username must be at least 3 characters.',
    }).regex(/^[a-zA-Z0-9_]+$/, {
        message: 'Username can only contain letters, numbers, and underscores.'
    }),
    email: z.string().email({
      message: 'Please enter a valid email.',
    }),
    password: z.string().min(6, {
      message: 'Password must be at least 6 characters.',
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export default function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Call server-side signup endpoint (stores user in MongoDB)
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, password: values.password, name: values.name, username: values.username }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('auth-token', data.token || '');
        localStorage.setItem('currentUser', JSON.stringify(data.user || {}));
        toast({ title: 'Signup Successful!', description: 'You have been registered. Logging you in...' });
        router.push('/chat');
        return;
      }

      if (res.ok) return; // already handled above

      // If server responded with an error, surface it instead of silently falling back.
      let parsed: any = null;
      try {
        parsed = await res.json();
      } catch (e) {}
      const serverMsg = parsed?.error || parsed?.message || (await res.text()).slice(0, 200);
      throw new Error(serverMsg || 'Signup failed');
    } catch (error: any) {
      console.error('Error signing up: ', error);
      const raw = error?.error || error?.message || String(error || '');
      const isEol = /atlas app services|device sync|reached eol/i.test(raw);
      if (isEol) {
        toast({
          title: 'Signup Failed',
          description:
            'MongoDB Atlas App Services (Realm) and Device Sync have reached end-of-life. Registration via this provider is currently unavailable. Please contact the site administrator or use another signup method.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Registration Failed',
          description: raw || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="your_username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
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
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create Account
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => { window.location.href = '/api/auth/google'; }}>
          Continue with Google
        </Button>
      </form>
    </Form>
  );
}
