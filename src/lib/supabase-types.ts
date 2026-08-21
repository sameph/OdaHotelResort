export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface BookingRow {
  id: number;
  ref: string;
  guest: string;
  email: string;
  phone: string;
  country: string | null;
  requests: string | null;
  room: string;
  roomSlug: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  extras: Json;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
  source: string;
  created_at: string;
}

export interface BookingInsert {
  ref: string;
  guest: string;
  email: string;
  phone: string;
  country?: string | null;
  requests?: string | null;
  room: string;
  roomSlug: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  extras: Json;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status?: string;
  source?: string;
}

export interface GuestRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  visits: number;
  totalSpend: number;
  tier: "Bronze" | "Silver" | "Gold" | "Platinum";
  lastStay: string;
}

export interface GuestInsert {
  name: string;
  email: string;
  phone: string;
  country: string;
  visits?: number;
  totalSpend?: number;
  tier?: "Bronze" | "Silver" | "Gold" | "Platinum";
  lastStay?: string;
}

export interface RoomRow {
  id: number;
  number: string;
  type: string;
  view: string;
  capacity: number;
  price: number;
  status: "available" | "occupied" | "maintenance" | "cleaning";
  floor: number;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
  amenities?: string[] | null;
  beds?: string | null;
  size_sqm?: number | null;
  popular?: boolean | null;
}

export interface GalleryRow {
  id: number;
  src: string;
  alt: string;
  tag: string;
  created_at: string;
}

export interface GalleryInsert {
  src: string;
  alt: string;
  tag: string;
}

export interface OfferRow {
  id: number;
  tag: string;
  title: string;
  price: string;
  from_label: string;
  perks: string[];
  image_url: string | null;
  created_at?: string;
}

export interface OfferInsert {
  tag: string;
  title: string;
  price: string;
  from_label: string;
  perks: string[];
  image_url?: string | null;
}

export interface JournalRow {
  id: number;
  title: string;
  date: string;
  category: string;
  content: string | null;
  image_url: string | null;
  slug: string | null;
  created_at?: string;
}

export interface JournalInsert {
  title: string;
  date: string;
  category: string;
  content?: string | null;
  image_url?: string | null;
  slug?: string | null;
}

export interface RoomInsert {
  number: string;
  type: string;
  view: string;
  capacity: number;
  price: number;

  status: "available" | "occupied" | "maintenance" | "cleaning";
  floor: number;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
  amenities?: string[] | null;
  beds?: string | null;
  size_sqm?: number | null;
  popular?: boolean | null;
}

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: BookingRow;
        Insert: BookingInsert;
        Update: Partial<BookingInsert>;
      };
      guests: {
        Row: GuestRow;
        Insert: GuestInsert;
        Update: Partial<GuestInsert>;
      };
      rooms: {
        Row: RoomRow;
        Insert: RoomInsert;
        Update: Partial<RoomInsert>;
      };
      gallery_images: {
        Row: GalleryRow;
        Insert: GalleryInsert;
        Update: Partial<GalleryInsert>;
      };
      offers: {
        Row: OfferRow;
        Insert: OfferInsert;
        Update: Partial<OfferInsert>;
      };
      journal_posts: {
        Row: JournalRow;
        Insert: JournalInsert;
        Update: Partial<JournalInsert>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
