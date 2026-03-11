import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/verify', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken is required' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const jwtSecret = process.env.JWT_SECRET;
  const allowedEmails = (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!clientId || !jwtSecret) {
    return res.status(500).json({ error: 'Auth is not configured on the server.' });
  }

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();

    const email = (payload.email ?? '').toLowerCase();
    const name = payload.name ?? email;
    const picture = payload.picture ?? null;

    if (!allowedEmails.includes(email)) {
      return res.status(403).json({ error: 'Access denied. Your email is not on the allowed list.' });
    }

    const token = jwt.sign({ email, name, picture }, jwtSecret, { expiresIn: '12h' });
    return res.json({ token, user: { email, name, picture } });
  } catch (err) {
    console.error('Google token verification failed:', err?.message ?? err);
    return res.status(401).json({ error: 'Invalid Google token.' });
  }
});

export default router;
