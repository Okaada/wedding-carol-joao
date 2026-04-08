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

export interface WeddingDayData {
  date: string;
  time: string;
  ceremony: { name: string; address: string; embedUrl: string; mapUrl: string };
  reception: { name: string; start: string; end: string; embedUrl: string; mapUrl: string };
}

export interface CoupleData {
  hero: HeroData;
  timeline: TimelineEvent[];
  gallery: GalleryPhoto[];
  weddingDay: WeddingDayData;
}

export interface Gift {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number; // BRL cents
  externalUrl: string;
  status: "available" | "reserved" | "purchased";
  claimedBy: string | null;
  claimedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PixSettings {
  keyType: "cpf" | "email" | "phone" | "random";
  keyValue: string;
  recipientName: string;
  city: string;
}

export interface Rsvp {
  _id: string;
  name: string;
  cellphone: string;
  submittedAt: string;
}
