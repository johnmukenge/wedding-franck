import type { Metadata } from 'next';
import { weddingData } from '@/data';
import PageContent from '@/components/PageContent';

export const metadata: Metadata = {
  title: 'Franck & Charly | Wedding Invitation',
  description:
    'Celebrate with Franck and Charly in Kinshasa. View event details, countdown, gallery, and RSVP.',
  openGraph: {
    title: 'Franck & Charly Wedding Invitation',
    description:
      'A romantic wedding celebration in Kinshasa with ceremony, reception, and special moments.',
    images: [{ url: weddingData.heroImage }],
  },
};

export default function Page() {
  return <PageContent />;
}
