export type EventItem = {
  title: string;
  time: string;
  description: string;
};

export type GalleryItem = {
  id: number;
  alt: string;
  src: string;
  width: number;
  height: number;
};

export type WeddingData = {
  couple: {
    bride: string;
    groom: string;
    displayName: string;
  };
  weddingDate: string;
  venue: {
    name: string;
    city: string;
    address: string;
  };
  heroImage: string;
  dressCode: string;
  schedule: EventItem[];
  gallery: GalleryItem[];
  audioUrl: string;
};

export const weddingData: WeddingData = {
  couple: {
    bride: 'Charly',
    groom: 'Franck',
    displayName: 'Franck & Charly',
  },
  weddingDate: '2026-08-01T10:00:00+02:00',
  venue: {
    name: 'Salle de fête des Frères des Écoles Chrétiennes',
    city: 'Kinshasa, Democratic Republic of Congo',
    address: 'Av. Lukengo N°07, Réf. Stade Vélodrome, en face de l’école Saint Georges',
  },
  heroImage: '/media/Franck%20et%20Charlie.jpeg',
  dressCode: 'Noir doré',
  schedule: [
    {
      title: 'Nuptial Blessing',
      time: '12:00',
      description: 'Bénédiction nuptiale à la Paroisse Saint Pie X, Av. Movenda n°85 C/ Ngiri-Ngiri, Direction Assossa-Shaba, Réf. Lycée Movenda.',
    },
    {
      title: 'Shooting',
      time: '15:00',
      description: 'Photos et vidéos des mariés avec les proches.',
    },
    {
      title: 'Dance Party',
      time: '19:00',
      description: 'Soirée dansante et ambiance festive.',
    },
    {
      title: 'Cake Cutting',
      time: '23:00',
      description: 'Découpe du gâteau et célébration.',
    },
  ],
  gallery: [
    {
      id: 1,
      alt: 'Franck et Charly portrait 1',
      src: '/media/Franck%20et%20Charlie.jpeg',
      width: 854,
      height: 1280,
    },
    {
      id: 2,
      alt: 'Franck et Charly portrait 2',
      src: '/media/Franck%20et%20Charlie%202.jpeg',
      width: 720,
      height: 1080,
    },
    {
      id: 3,
      alt: 'Franck et Charly portrait 3',
      src: '/media/Franck%20et%20Charlie%203.jpeg',
      width: 720,
      height: 1080,
    },
    {
      id: 4,
      alt: 'Franck et Charly portrait 4',
      src: '/media/Franck%20et%20Charlie%204.jpeg',
      width: 851,
      height: 1280,
    },
  ],
  audioUrl: '/media/wedding-song.m4a',
};

export const traditionalWeddingData: WeddingData = {
  couple: {
    bride: 'Charly',
    groom: 'Franck',
    displayName: 'Franck & Charly',
  },
  weddingDate: '2026-07-25T19:00:00+02:00',
  venue: {
    name: 'Salle de fête Frères des Écoles Chrétiennes',
    city: 'Kinshasa, Democratic Republic of Congo',
    address: 'Av. Lukengo N°07, Réf: Stade Vélodrome, en face de l’école Saint Georges',
  },
  heroImage: '/media/Franck%20et%20Charlie%202.jpeg',
  dressCode: 'Blanc, bleu, vert citron et jaune',
  schedule: [
    {
      title: 'Arrivée des familles et présentations',
      time: '19:00',
      description: 'Accueil des familles et présentations pour lancer la soirée du mariage traditionnel dans une ambiance élégante et festive.',
    },
  ],
  gallery: [
    {
      id: 1,
      alt: 'Franck & Charlie traditional portrait 1',
      src: '/media/Franck%20%26%20Charlie%20trad%201.jpeg',
      width: 720,
      height: 1080,
    },
    {
      id: 2,
      alt: 'Franck & Charlie traditional portrait 2',
      src: '/media/Franck%20%26%20Charlie%20trad%202.jpeg',
      width: 720,
      height: 1080,
    },
    {
      id: 3,
      alt: 'Franck & Charlie traditional portrait 3',
      src: '/media/Franck%20%26%20Charlie%20trad%203.jpeg',
      width: 720,
      height: 1080,
    },
    {
      id: 4,
      alt: 'Franck & Charlie traditional portrait 4',
      src: '/media/Franck%20%26%20Charlie%20trad%204.jpeg',
      width: 720,
      height: 1080,
    },
  ],
  audioUrl: '/media/wedding-song.m4a',
};
