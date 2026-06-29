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
    name: 'Salle Food Market',
    city: 'Kinshasa, Democratic Republic of Congo',
    address: 'Avenue Nguma 102, Réf. Saint Luc, C/Ngaliema',
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
  weddingDate: '2026-08-01T14:00:00+02:00',
  venue: {
    name: 'Salle Food Market',
    city: 'Kinshasa, Democratic Republic of Congo',
    address: 'Avenue Nguma 102, Réf. Saint Luc, C/Ngaliema',
  },
  heroImage: '/media/Franck%20et%20Charlie%202.jpeg',
  dressCode: 'Black and gold',
  schedule: [
    {
      title: 'Arrivée des familles et présentations',
      time: '14:00',
      description: 'Rassemblement des familles et présentation officielle des deux clans aux sons des tam-tams.',
    },
    {
      title: 'Cérémonie traditionnelle du mariage',
      time: '15:30',
      description: 'Célébration des rituels traditionnels congolais avec bénédictions des ancêtres et échanges solennels.',
    },
    {
      title: 'Danses et célébrations',
      time: '17:30',
      description: 'Danses traditionnelles, démonstrations de joie et musiques folkloriques du Congo.',
    },
    {
      title: 'Festin traditionnel',
      time: '19:00',
      description: 'Repas avec les mets traditionnels et réjouissances en famille.',
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
      alt: 'Franck et Charly portrait 1 bis',
      src: '/media/Franck%20et%20Charlie.jpeg',
      width: 854,
      height: 1280,
    },
  ],
  audioUrl: '/media/wedding-song.m4a',
};
