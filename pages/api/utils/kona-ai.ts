import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { Remarkable } from 'remarkable';
import { getChatGPTResponse } from '../../../lib/openai';
import rateLimit from '../../../lib/rate-limit';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getSessionOrThrow } from '../../../lib/auth-utils';

const limiter = rateLimit({
  interval: 10 * 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 300, // Max 500 users per second
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSessionOrThrow(req, res);
  try {
    await limiter.check(res, 10, session.user.sub); // 10 requests per every 10 minutes
  } catch (_) {
    return res.status(429).json({ message: 'Rate limit exceeded' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { question } = z
    .object({
      question: z.string().trim().default(''),
    })
    .parse(req.body);

  const answer = await getChatGPTResponse(question, session.user.sub);

  const md = new Remarkable();
  const html = md.render(answer);

  return res.json({
    answer: html,
  });
}

export default withApiAuthRequired(handler);
