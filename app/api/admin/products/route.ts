import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminDb, setServerFirebaseIdToken } from '@/server/config/firebase-admin';
import { requireAdminApi, verifyCsrfRequest } from '@/server/middleware/security';
import {
  createOrUpdateProductAdmin,
  deleteProductAdmin,
  refreshProductPriceTimestampAdmin,
} from '@/server/repositories/products.repo';
import { sanitizePlainText, ValidationError } from '@/server/validators';

function captureFirebaseTokenFromRequest(req: NextRequest): void {
  const token = req.headers.get('x-firebase-id-token')?.trim();
  if (token) {
    setServerFirebaseIdToken(token);
  }
}

export async function POST(req: NextRequest) {
  captureFirebaseTokenFromRequest(req);
  const guard = await requireAdminApi();
  if (!guard.authorized) return guard.response;

  const csrfValid = await verifyCsrfRequest(req);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Invalid security token.' }, { status: 403 });
  }

  try {
    const body = (await req.json()) as { existingId?: string; payload?: unknown };
    const existingId = body.existingId ? sanitizePlainText(body.existingId, 128) : undefined;
    const saved = await createOrUpdateProductAdmin(body.payload ?? body, existingId);
    revalidatePath('/', 'layout');
    revalidatePath('/products');
    revalidatePath('/ar/products');
    revalidatePath('/en/products');
    return NextResponse.json({ product: saved });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message, field: err.field }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : 'Unable to save product.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  captureFirebaseTokenFromRequest(req);
  const guard = await requireAdminApi();
  if (!guard.authorized) return guard.response;

  const csrfValid = await verifyCsrfRequest(req);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Invalid security token.' }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      productId?: string;
      action?: 'refresh_price_timestamp' | 'toggle_status';
      status?: 'published' | 'draft' | 'archived';
    };
    const productId = sanitizePlainText(body.productId, 128);
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    if (body.action === 'refresh_price_timestamp') {
      await refreshProductPriceTimestampAdmin(productId);
      revalidatePath('/', 'layout');
      return NextResponse.json({ updated: true, priceUpdatedAt: new Date().toISOString() });
    }

    if (body.action === 'toggle_status' && body.status) {
      const db = getAdminDb();
      if (!db) {
        return NextResponse.json({ error: 'Database is not configured yet.' }, { status: 503 });
      }
      const nextStatus =
        body.status === 'published' || body.status === 'archived' ? body.status : 'draft';
      await db.collection('products').doc(productId).update({
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      revalidatePath('/', 'layout');
      revalidatePath('/products');
      revalidatePath('/ar/products');
      revalidatePath('/en/products');
      return NextResponse.json({ updated: true, status: nextStatus });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to update product.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  captureFirebaseTokenFromRequest(req);
  const guard = await requireAdminApi();
  if (!guard.authorized) return guard.response;

  const csrfValid = await verifyCsrfRequest(req);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Invalid security token.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = sanitizePlainText(searchParams.get('id'), 128);
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }
    await deleteProductAdmin(id);
    revalidatePath('/', 'layout');
    revalidatePath('/products');
    revalidatePath('/ar/products');
    revalidatePath('/en/products');
    return NextResponse.json({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unable to delete product.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
