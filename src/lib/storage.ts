import { Shipment, Enquiry, STATUSES } from '../types';
import { SERVICES } from './pricing';
const KS = 'locallink.shipments.v1', KE = 'locallink.enquiries.v1';
function read(k: string): unknown { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } }
function write(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: app keeps working in memory */ } }
const okShip = (s: any): s is Shipment => !!s && typeof s.id === 'string' && STATUSES.includes(s.status) && s.service in SERVICES && typeof s.price === 'number' && typeof s.bookingDate === 'string';
export function loadShipments(): Shipment[] | null {
  const d = read(KS); if (!Array.isArray(d)) return null;
  const seen = new Set<string>(); const out = (d as any[]).filter(okShip).filter(s => !seen.has(s.id) && !!seen.add(s.id)).map(s => ({
    ...s, weightGrams: Number.isFinite(s.weightGrams) ? s.weightGrams : 500, productValue: Number.isFinite(s.productValue) ? s.productValue : 1000,
    location: typeof s.location === 'string' ? s.location : (s.destination || ''), packageType: s.packageType || 'Other',
  }));
  return out.length ? out : null;
}
export const saveShipments = (s: Shipment[]) => write(KS, s);
export const clearShipments = () => { try { localStorage.removeItem(KS); } catch { /* ignore */ } };
export function loadEnquiries(): Enquiry[] { const d = read(KE); return Array.isArray(d) ? (d as Enquiry[]) : []; }
export const saveEnquiries = (e: Enquiry[]) => write(KE, e);
