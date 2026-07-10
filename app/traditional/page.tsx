import type { Metadata } from 'next';
import { traditionalWeddingData } from '@/data';
import TraditionalPageContent from '@/components/TraditionalPageContent';

export const metadata: Metadata = {
  title: 'Franck & Charly | Save the Date Traditionnel',
  description:
    'Save the date pour le mariage traditionnel de Franck et Charly à Kinshasa, le 25 juillet 2026 à 19h00.',
  openGraph: {
    title: 'Franck & Charly Save the Date Traditionnel',
    description:
      'Une invitation save the date au style traditionnel, avec date du 25/07/2026 à 19h00.',
    images: [{ url: traditionalWeddingData.heroImage }],
  },
};

export default function TraditionalPage() {
  return <TraditionalPageContent />;
}
