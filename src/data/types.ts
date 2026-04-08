export interface HeroData {
  names: string;
  date: string;
  subtitle: string;
  image: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  image?: string;
}

export interface GalleryPhoto {
  src: string;
  alt: string;
}

export interface CoupleData {
  hero: HeroData;
  timeline: TimelineEvent[];
  gallery: GalleryPhoto[];
}
