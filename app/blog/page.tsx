import type { Metadata } from 'next';
import LocalizedGuidesPage, {
  generateMetadata as baseGenerateMetadata,
} from '@/app/[locale]/guides/page';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return baseGenerateMetadata({
    params: Promise.resolve({ locale: 'ar' }),
  });
}

export default async function BlogPage() {
  return LocalizedGuidesPage({
    params: Promise.resolve({ locale: 'ar' }),
  });
}
