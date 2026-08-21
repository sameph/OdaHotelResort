const roomExecutive = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-executive.jpg";
const roomPresidential = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-presidential.jpg";
const roomGarden = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-garden.jpg";
const roomDeluxe = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-deluxe.jpg";
const roomFamily = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/room-family.jpg";
const poolImg = "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/pool.jpg";

export type RoomType = "Suite" | "Deluxe" | "Villa";
export type RoomView = "Rift Valley View" | "Garden View" | "Pool View";
export type RoomAmenity =
  | "King-size bed"
  | "Queen-size bed"
  | "Twin beds"
  | "Private balcony"
  | "Soaking tub"
  | "Mini bar"
  | "Free WiFi"
  | "Butler service"
  | "Private terrace"
  | "Executive Lounge access"
  | "Sofa bed"
  | "Living area"
  | "Work desk";

export type Room = {
  slug: string;
  name: string;
  type: RoomType;
  view: RoomView;
  img: string;
  size: string;
  sizeSqm: number;
  beds: string;
  guests: number;
  price: number;
  popular?: boolean;
  amenities: RoomAmenity[];
  tags: string[];
  desc: string;
};

export const rooms: Room[] = [
  {
    slug: "presidential-suite",
    name: "Presidential Suite",
    type: "Suite",
    view: "Rift Valley View",
    img: roomPresidential,
    size: "120 m²",
    sizeSqm: 120,
    beds: "1 King Bed",
    guests: 2,
    price: 18000,
    popular: true,
    amenities: ["King-size bed", "Private terrace", "Butler service", "Executive Lounge access", "Soaking tub", "Mini bar", "Free WiFi"],
    tags: ["Butler", "Private terrace", "Executive Lounge"],
    desc: "The pinnacle of luxury with panoramic views of the Great Rift Valley, private terrace, and butler service.",
  },
  {
    slug: "executive-suite",
    name: "Executive Suite",
    type: "Suite",
    view: "Garden View",
    img: roomExecutive,
    size: "85 m²",
    sizeSqm: 85,
    beds: "1 King Bed + Sofa Bed",
    guests: 3,
    price: 12000,
    popular: true,
    amenities: ["King-size bed", "Sofa bed", "Living area", "Work desk", "Mini bar", "Free WiFi"],
    tags: ["Sofa bed", "Living area", "Work desk"],
    desc: "Spacious suite with separate living room, premium amenities, and garden views for the discerning traveler.",
  },
  {
    slug: "deluxe-king",
    name: "Deluxe King Room",
    type: "Deluxe",
    view: "Garden View",
    img: roomDeluxe,
    size: "48 m²",
    sizeSqm: 48,
    beds: "1 King Bed",
    guests: 2,
    price: 8500,
    amenities: ["King-size bed", "Private balcony", "Mini bar", "Free WiFi", "Work desk"],
    tags: ["King-size bed", "Private balcony", "Mini bar"],
    desc: "Refined deluxe room with king bed, private balcony, and considered comforts throughout.",
  },
  {
    slug: "garden-villa",
    name: "Garden Villa",
    type: "Villa",
    view: "Garden View",
    img: roomGarden,
    size: "95 m²",
    sizeSqm: 95,
    beds: "1 King Bed",
    guests: 2,
    price: 14000,
    amenities: ["King-size bed", "Private terrace", "Soaking tub", "Mini bar", "Free WiFi"],
    tags: ["Private terrace", "Soaking tub", "Garden"],
    desc: "Standalone villa nestled among our lush gardens with private terrace and outdoor soaking tub.",
  },
  {
    slug: "family-villa",
    name: "Family Villa",
    type: "Villa",
    view: "Pool View",
    img: roomFamily,
    size: "140 m²",
    sizeSqm: 140,
    beds: "2 Queen Beds + Sofa Bed",
    guests: 5,
    price: 16000,
    amenities: ["Queen-size bed", "Sofa bed", "Living area", "Mini bar", "Free WiFi", "Work desk"],
    tags: ["2 bedrooms", "Family friendly", "Living area"],
    desc: "Two-bedroom villa with connecting living area, ideal for families and small groups.",
  },
  {
    slug: "twin-comfort",
    name: "Twin Comfort Room",
    type: "Deluxe",
    view: "Pool View",
    img: poolImg,
    size: "42 m²",
    sizeSqm: 42,
    beds: "2 Twin Beds",
    guests: 2,
    price: 6500,
    amenities: ["Twin beds", "Free WiFi", "Work desk", "Mini bar"],
    tags: ["Twin beds", "Pool view", "Work desk"],
    desc: "Comfortable twin room overlooking the pool — perfect for colleagues and friends travelling together.",
  },
];
