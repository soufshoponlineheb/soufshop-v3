import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIpFromHeaders,
  hashClientIpDaily,
} from '@/server/middleware/security';
import { createContactMessage } from '@/server/repositories/messages.repo';
import { ValidationError } from '@/server/validators';

export async function POST(req: NextRequest) {
  const rawIp = await getClientIpFromHeaders();
  const ipHash = hashClientIpDaily(rawIp);

  // Strict rate limit: max 5 contact submissions per 15 minutes per IP hash
  const rate = checkRateLimit(`contact_form:${ipHash}`, 5, 15 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error:
          'You have sent several messages recently. Please wait a few minutes before sending another.',
      },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;

    // Anti-spam Honeypot check: if hidden "websiteUrl" field is filled, silently accept without saving
    if (typeof body.websiteUrl === 'string' && body.websiteUrl.trim().length > 0) {
      return NextResponse.json({ sent: true });
    }

    await createContactMessage(body);
    return NextResponse.json({ sent: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message, field: err.field }, { status: 400 });
    }
    return NextResponse.json(
      {
        error:
          'We could not deliver your message right now. Please reach us directly via email or WhatsApp.',
      },
      { status: 503 }
    );
  }
}
