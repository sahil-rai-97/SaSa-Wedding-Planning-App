export type VendorServiceType =
  | "Decorator"
  | "Photographer"
  | "Videographer"
  | "Mehendi Artist"
  | "Hair & Makeup"
  | "Caterer"
  | "Florist"
  | "DJ / Music"
  | "Pundit"
  | "Day-of Coordinator"
  | "Transportation"
  | "Venue"
  | "Jeweler"
  | "Other";

export type BookingStatus =
  | "researching"
  | "contacted"
  | "quoted"
  | "booked"
  | "paid";

export interface Vendor {
  id: string;
  name: string;
  serviceType: VendorServiceType;
  email: string;
  phone: string;
  website: string;
  quote: string;
  bookingStatus: BookingStatus;
  notes: string;
  linkedTaskIds: string[];
}

export const ALL_SERVICE_TYPES: VendorServiceType[] = [
  "Decorator",
  "Photographer",
  "Videographer",
  "Mehendi Artist",
  "Hair & Makeup",
  "Caterer",
  "Florist",
  "DJ / Music",
  "Pundit",
  "Day-of Coordinator",
  "Transportation",
  "Venue",
  "Jeweler",
  "Other",
];

export const ALL_BOOKING_STATUSES: BookingStatus[] = [
  "researching",
  "contacted",
  "quoted",
  "booked",
  "paid",
];

export const bookingStatusConfig: Record<
  BookingStatus,
  { label: string; color: string }
> = {
  researching: { label: "Researching", color: "bg-gray-100 text-gray-700" },
  contacted: { label: "Contacted", color: "bg-blue-100 text-blue-700" },
  quoted: { label: "Quoted", color: "bg-amber-100 text-amber-700" },
  booked: { label: "Booked", color: "bg-green-100 text-green-700" },
  paid: { label: "Paid", color: "bg-emerald-100 text-emerald-800" },
};
