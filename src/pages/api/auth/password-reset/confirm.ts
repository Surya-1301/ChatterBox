import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from '@/lib/mongodb';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = String(req.body?.token || '');
  const tokenId = String(req.body?.tokenId || '');
  const password = String(req.body?.password || '');

  if (!token || !tokenId) return res.status(400).json({ error: 'Invalid or missing reset link' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const db = await getDb();
    const users = db.collection('users');
    const tokenHash = hashToken(token);

    const user = await users.findOne({
      passwordResetTokenId: tokenId,
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await users.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: {
          passwordResetTokenHash: '',
          passwordResetTokenId: '',
          passwordResetExpiresAt: '',
        },
      }
    );

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('password reset confirm error', err);
    res.status(500).json({ error: 'Unable to reset password' });
  }
}
