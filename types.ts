export type Status = 'Booked' | 'Dispatched' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Delayed';
export type Service = 'standard' | 'express' | 'bulk';
export const STATUSES: Status[] = ['Booked', 'Dispatched', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed'];
export const ACTIVE: Status[] = ['Booked', 'Dispatched', 'In Transit', 'Out for Delivery'];
export interface Shipment {
  id: string; customer: string; business: string; email: string; phone: string;
  pickup: string; destination: string; quantity: number; packageType: string; service: Service;
  instructions: string; partner: string; status: Status;
  bookingDate: string; expected: string; price: number; productValue: number; weightGrams: number; location: string; onTime?: boolean;
}
export interface Enquiry { id: string; at: string; name: string; business: string; email: string; phone: string; category: string; message: string; }
