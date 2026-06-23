"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OAuthHandler({ searchParams }: { searchParams?: any }) {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const user = params.get('user');
    if (token && user) {
      localStorage.setItem('auth-token', token);
      localStorage.setItem('currentUser', user);
      router.replace('/chat');
    } else {
      router.replace('/');
    }
  }, [router]);

  return null;
}
