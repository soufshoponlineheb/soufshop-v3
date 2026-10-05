import { NextRequest, NextResponse } from 'next/server';
import {
  createTestimonialServer,
  listApprovedTestimonialsServer,
} from '@/server/repositories/testimonials.repo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const testimonials = await listApprovedTestimonialsServer();
  return NextResponse.json({ testimonials });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await createTestimonialServer({
      name: String(body.name || ''),
      rating: Number(body.rating || 5),
      text: String(body.text || ''),
      locale: body.locale === 'en' ? 'en' : 'ar',
    });
    return NextResponse.json({ testimonial: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to save testimonial' },
      { status: 400 }
    );
  }
}
