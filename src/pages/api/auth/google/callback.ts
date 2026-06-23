import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { getDb } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

function getRequestOrigin(req: NextApiRequest) {
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0];
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0];

  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = String(req.query.code || '');
  if (!code) return res.status(400).send('Missing code');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${getRequestOrigin(req)}/api/auth/google/callback`;

  if (!clientId || !clientSecret) return res.status(500).send('Missing Google OAuth env vars');

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
  const tokenJson: any = await tokenRes.json();
  const idToken = tokenJson.id_token as string | undefined;
  const accessToken = tokenJson.access_token as string | undefined;

    if (!idToken && !accessToken) return res.status(401).send('Failed to retrieve tokens');

    // Fetch userinfo
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  const profile: any = await userRes.json();

  const email = profile.email as string | undefined;
  const name = (profile.name as string) || (profile.email ? String(profile.email).split('@')[0] : 'GoogleUser');
  const avatar = (profile.picture as string) || '';

    const db = await getDb();
    const users = db.collection('users');
    let user = await users.findOne({ email });
    if (!user) {
        const usernameBase = email ? String(email).split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) : `googleuser${Date.now()}`;
      let username = usernameBase;
      let i = 1;
      while (await users.findOne({ username })) {
        username = `${usernameBase}${i++}`;
      }
      // Atomic upsert: avoids creating a duplicate (passwordless) account if two
      // requests for the same email race here, since email has no unique index.
      user = await users.findOneAndUpdate(
        { email },
        { $setOnInsert: { email, name, username, avatar, createdAt: new Date() } },
        { upsert: true, returnDocument: 'after' }
      );
    }

  if (!user) return res.status(500).send('Failed to create or find user');
  const appUser = {
    id: String((user as any)._id),
    email: (user as any).email,
    name: (user as any).name,
    username: (user as any).username,
    avatar: (user as any).avatar,
    contacts: (user as any).contacts || [],
    blockedUsers: (user as any).blockedUsers || [],
  };
  const token = jwt.sign({ sub: appUser.id, email: appUser.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    // Redirect back to the app with token in query (app will store it in localStorage)
    const redirectTo = `/auth/oauth?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(appUser))}`;
    res.redirect(redirectTo);
  } catch (err: any) {
    console.error('Google OAuth callback error', err);
    res.status(500).send('Authentication failed');
  }
}
