import { NextResponse } from 'next/server';
import { listPublishedProducts } from '@/server/repositories/products.repo';
import { listActiveCategories } from '@/server/repositories/categories.repo';
import { listActiveSources } from '@/server/repositories/sources.repo';

export async function GET() {
  try {
    const [products, categories, sources] = await Promise.all([
      listPublishedProducts(),
      listActiveCategories(),
      listActiveSources(),
    ]);

    return NextResponse.json({
      products,
      categories,
      sources,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load catalog data right now.' },
      { status: 500 }
    );
  }
}
