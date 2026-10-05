import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/server/middleware/security';
import {
  approveTestimonialServer,
  deleteTestimonialServer,
  listAllTestimonialsAdminServer,
} from '@/server/repositories/testimonials.repo';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.authorized) return guard.response;

  try {
    const testimonials = await listAllTestimonialsAdminServer();
    return NextResponse.json({ testimonials });
  } catch {
    return NextResponse.json({ testimonials: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.authorized) return guard.response;

  try {
    const body = await req.json();
    const id = String(body.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'Missing testimonial id' }, { status: 400 });
    }
    await approveTestimonialServer(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to approve testimonial' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.authorized) return guard.response;

  try {
    const id = req.nextUrl.searchParams.get('id') || '';
    if (!id) {
      return NextResponse.json({ error: 'Missing testimonial id' }, { status: 400 });
    }
    await deleteTestimonialServer(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unable to delete testimonial' },
      { status: 400 }
    );
  }
}
