import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';

function getRequestOrigin(req: NextApiRequest) {
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0];
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0];

  return `${proto}://${host}`;
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function sendResetEmail(email: string, resetUrl: string) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_RESET_TEMPLATE_ID || 'ajgh2qy';
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !publicKey) return false;

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        to_email: email,
        email,
        reset_url: resetUrl,
        reset_link: resetUrl,
        link: resetUrl,
        expires_in: '30 minutes',
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send password reset email with EmailJS: ${body}`);
  }

  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const db = await getDb();
    const users = db.collection('users');
    const user = await users.findOne({ email });

    let resetUrl: string | undefined;

    if (user?._id) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenId = new ObjectId().toString();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetTokenHash: hashToken(token),
            passwordResetTokenId: tokenId,
            passwordResetExpiresAt: expiresAt,
          },
        }
      );

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || getRequestOrigin(req);
      resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&tokenId=${encodeURIComponent(tokenId)}`;

      const sent = await sendResetEmail(email, resetUrl);

      if (!sent) {
        console.log(`Password reset link for ${email}: ${resetUrl}`);
      }
    }

    res.status(200).json({
      message: 'If an account exists for that email, a reset link has been created.',
      resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
    });
  } catch (err) {
    console.error('password reset request error', err);
    res.status(500).json({ error: 'Unable to create reset link' });
  }
}
