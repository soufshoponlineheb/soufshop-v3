import type { Metadata } from 'next';
import GuideDetailPage, {
  generateMetadata as baseGenerateMetadata,
} from '@/app/[locale]/guides/[slug]/page';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return baseGenerateMetadata({
    params: Promise.resolve({ locale: 'ar', slug }),
  });
}

export default async function SingleBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return GuideDetailPage({
    params: Promise.resolve({ locale: 'ar', slug }),
  });
}
