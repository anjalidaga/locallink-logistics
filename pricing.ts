import { Service } from '../types';
export interface ServiceInfo { name: string; desc: string; priceLabel: string; window: string; hours: number; }
export const SERVICES: Record<Service, ServiceInfo> = {
  standard: { name: 'Standard Delivery', desc: 'Same-city local delivery.', priceLabel: '₹150 per package', window: 'Within 4-6 hours', hours: 5 },
  express: { name: 'Express Delivery', desc: 'Priority local delivery.', priceLabel: '₹300 per package', window: 'Within 1-2 hours', hours: 2 },
  bulk: { name: 'Bulk Delivery', desc: 'Ten or more packages.', priceLabel: '₹1,000 for the first ten, ₹100 per extra package', window: 'Same day (6-8 hours)', hours: 7 },
};
export const PRICE = { standard: 150, express: 300, bulkBase: 1000, bulkMin: 10, bulkExtra: 100 };
export function validateQty(s: Service, q: number): string | null {
  if (!Number.isFinite(q) || !Number.isInteger(q)) return 'Enter a whole number of packages.';
  if (q < 1) return 'Quantity must be at least 1.';
  if (q > 500) return 'For more than 500 packages please send an enquiry.';
  if (s === 'bulk' && q < PRICE.bulkMin) return `Bulk Delivery needs at least ${PRICE.bulkMin} packages.`;
  return null;
}
// Shared pricing function used by Services, Booking and seed data
export function calcPrice(s: Service, q: number): number {
  if (validateQty(s, q)) return 0;
  if (s === 'standard') return q * PRICE.standard;
  if (s === 'express') return q * PRICE.express;
  return PRICE.bulkBase + Math.max(0, q - PRICE.bulkMin) * PRICE.bulkExtra;
}
export const inr = (n: number) => '₹' + n.toLocaleString('en-IN');
