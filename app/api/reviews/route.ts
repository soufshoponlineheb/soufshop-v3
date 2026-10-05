import { NextRequest, NextResponse } from 'next/server';
import {
  getReviewsByProductSlug,
  createReview,
} from '@/server/repositories/reviews.repo';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || searchParams.get('productSlug') || '';

    if (!slug) {
      return NextResponse.json(
        { reviews: [], averageRating: 0, totalCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
        { status: 200 }
      );
    }

    const data = await getReviewsByProductSlug(slug);
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch reviews';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productSlug, userName, rating, comment } = body || {};

    if (!productSlug || typeof productSlug !== 'string' || !productSlug.trim()) {
      return NextResponse.json(
        { error: 'productSlug is required' },
        { status: 400 }
      );
    }

    if (!userName || typeof userName !== 'string' || !userName.trim()) {
      return NextResponse.json(
        { error: 'userName is required' },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: 'rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    const id = await createReview({
      productSlug: productSlug.trim(),
      userName: userName.trim(),
      rating: Math.round(numRating),
      comment: typeof comment === 'string' ? comment.trim() : '',
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
