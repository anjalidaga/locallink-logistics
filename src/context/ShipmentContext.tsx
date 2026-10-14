import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Shipment, Status, Service } from '../types';
import { loadShipments, saveShipments, clearShipments } from '../lib/storage';
import { createSeed, PARTNERS } from '../lib/seed';
import { SERVICES, calcPrice } from '../lib/pricing';
import { isSupabaseConfigured, createRemoteOrder, updateRemoteStatus } from '../lib/api';

export interface BookingInput {
  customer: string; business: string; email: string; phone: string; pickup: string; destination: string;
  quantity: number; packageType: string; service: Service; pickupDate: string; pickupTime: string; instructions: string; weightGrams: number; productValue: number;
}
interface Ctx { shipments: Shipment[]; addBooking: (b: BookingInput) => Promise<Shipment>; updateStatus: (id: string, s: Status) => void; reset: () => void; mergeRemote: (items: Shipment[]) => void; }
const C = createContext<Ctx | null>(null);
export const useShipments = () => { const c = useContext(C); if (!c) throw new Error('ShipmentProvider missing'); return c; };

export function ShipmentProvider({ children }: { children: ReactNode }) {
  const [shipments, setShipments] = useState<Shipment[]>(() => loadShipments() ?? createSeed());
  useEffect(() => saveShipments(shipments), [shipments]);

  const addBooking = async (b: BookingInput): Promise<Shipment> => {
    let n = Math.max(1029, ...shipments.map(s => parseInt(s.id.replace(/\D/g, ''), 10) || 0)) + 1;
    while (shipments.some(s => s.id === 'TRK' + n)) n++;
    const pickupAt = new Date(`${b.pickupDate}T${b.pickupTime || '10:00'}`);
    const start = isNaN(+pickupAt) ? new Date() : pickupAt;
    const s: Shipment = {
      id: 'TRK' + n, customer: b.customer.trim(), business: b.business.trim(), email: b.email.trim(), phone: b.phone.trim(),
      pickup: b.pickup.trim(), destination: b.destination.trim(), quantity: b.quantity, packageType: b.packageType, service: b.service,
      instructions: b.instructions.trim(), partner: PARTNERS[n % PARTNERS.length], status: 'Booked', weightGrams: b.weightGrams, productValue: b.productValue, location: b.destination.trim(),
      bookingDate: new Date().toISOString(), expected: new Date(start.getTime() + SERVICES[b.service].hours * 36e5).toISOString(),
      price: calcPrice(b.service, b.quantity),
    };
    if (isSupabaseConfigured()) {
      const remote = await createRemoteOrder({ ...b, price: s.price, expected: s.expected });
      setShipments(p => [remote, ...p.filter(x => x.id !== remote.id)]);
      return remote;
    }
    setShipments(p => [s, ...p]);
    return s;
  };
  const updateStatus = (id: string, status: Status) => {
    const current = shipments.find(x => x.id === id);
    if (current && id.startsWith('ORD') && isSupabaseConfigured()) {
      void updateRemoteStatus(id, status).then(() => setShipments(p => p.map(s => s.id !== id ? s : { ...s, status, onTime: status === 'Delivered' ? s.status !== 'Delayed' : undefined })));
      return;
    }
    setShipments(p => p.map(s => s.id !== id ? s : { ...s, status, onTime: status === 'Delivered' ? s.status !== 'Delayed' : undefined }));
  };
  const mergeRemote = (items: Shipment[]) => setShipments(p => [...items.filter(r => !p.some(x => x.id === r.id)), ...p]);
  const reset = () => { clearShipments(); setShipments(createSeed()); };
  return <C.Provider value={{ shipments, addBooking, updateStatus, reset, mergeRemote }}>{children}</C.Provider>;
}
