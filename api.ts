import { Enquiry, Shipment, Status, Service } from '../types';
import type { BookingInput } from '../context/ShipmentContext';

const URL = (import.meta as any).env?.VITE_SUPABASE_URL?.replace(/\/$/, '') || '';
const KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
const TOKEN_KEY = 'locallink.admin.access_token';
export const isSupabaseConfigured = () => Boolean(URL && KEY);
export const hasAdminSession = () => Boolean(sessionStorage.getItem(TOKEN_KEY));

async function invoke<T>(action: string, body: Record<string, unknown>, admin = false): Promise<T> {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
  const token = admin ? sessionStorage.getItem(TOKEN_KEY) : null;
  const response = await fetch(`${URL}/functions/v1/locallink-api`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${token || KEY}` },
    body: JSON.stringify({ action, ...body }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data as T;
}

export async function createRemoteOrder(b: BookingInput & { price: number; expected: string }): Promise<Shipment> {
  return invoke<Shipment>('create_order', { order: {
    customer_name: b.customer.trim(), business_name: b.business.trim(), email: b.email.trim(), phone: b.phone.trim(),
    pickup_address: b.pickup.trim(), delivery_address: b.destination.trim(), pickup_date: b.pickupDate,
    pickup_time: b.pickupTime, package_count: b.quantity, package_description: b.packageType,
    product_type: b.packageType, weight_grams: b.weightGrams, order_value: b.productValue,
    service_type: b.service === 'standard' ? 'local' : b.service, delivery_charge: b.price,
    estimated_delivery_at: b.expected, instructions: b.instructions.trim(), location: b.destination.trim(),
  } });
}
export async function trackRemoteOrder(orderId: string, phone: string): Promise<Shipment | null> {
  return invoke<Shipment | null>('track_order', { order_id: orderId, phone });
}
export async function submitRemoteEnquiry(e: Omit<Enquiry, 'id' | 'at'>): Promise<void> {
  await invoke('submit_enquiry', { enquiry: { customer_name: e.name, business_name: e.business, email: e.email, phone: e.phone, category: e.category, message: e.message } });
}
export async function loginAdmin(email: string, password: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error('Add your Supabase URL and anon key to the .env file first.');
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify({ email, password }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.access_token) throw new Error(d.msg || d.message || 'Sign-in failed. Check the email and password.');
  sessionStorage.setItem(TOKEN_KEY, d.access_token);
}
export function logoutAdmin() { sessionStorage.removeItem(TOKEN_KEY); }
export async function loadRemoteOrders(): Promise<Shipment[]> { return invoke<Shipment[]>('admin_list_orders', {}, true); }
export async function updateRemoteStatus(orderId: string, status: Status): Promise<void> { await invoke('admin_update_status', { order_id: orderId, status }, true); }
