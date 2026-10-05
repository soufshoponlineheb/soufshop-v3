import { NextResponse } from 'next/server';
import { listActiveCategories } from '@/server/repositories/categories.repo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await listActiveCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to fetch categories.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
