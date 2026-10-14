import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, AlertTriangle } from 'lucide-react';
import { useShipments } from '../context/ShipmentContext';
import Badge from '../components/Badge';
import { SERVICES, inr } from '../lib/pricing';
import { fmt } from '../lib/format';
import { isSupabaseConfigured, trackRemoteOrder } from '../lib/api';
const STEPS = ['Booked', 'Dispatched', 'In Transit', 'Out for Delivery', 'Delivered'];
export default function Track() {
  const { shipments } = useShipments(); const [sp, setSp] = useSearchParams();
  const [input, setInput] = useState(sp.get('id') ?? ''); const [phone, setPhone] = useState(''); const [query, setQuery] = useState(sp.get('id') ?? '');
  const [remote, setRemote] = useState<import('../types').Shipment | null>(null); const [remoteError, setRemoteError] = useState(''); const [searching, setSearching] = useState(false);
  const q = query.trim().toUpperCase(); const local = q ? shipments.find(x => x.id.toUpperCase() === q) : undefined; const s = remote || local;
  const submit = async (e: FormEvent) => { e.preventDefault(); setQuery(input); setRemote(null); setRemoteError(''); setSp(input.trim() ? { id: input.trim().toUpperCase() } : {}); if (isSupabaseConfigured() && input.trim().toUpperCase().startsWith('ORD')) { if (!phone.trim()) { setRemoteError('Enter the phone number used when booking this order.'); return; } setSearching(true); try { setRemote(await trackRemoteOrder(input.trim(), phone)); } catch (e) { setRemoteError(e instanceof Error ? e.message : 'Could not track this order.'); } finally { setSearching(false); } } };
  const idx = !s ? 0 : s.status === 'Delayed' ? 2 : STEPS.indexOf(s.status);
  const rows: [string, string][] = s ? [['Order ID', s.id], ['Customer', s.customer], ['Pickup', s.pickup], ['Destination', s.destination], ['Delivery partner', s.partner], ['Booking date', fmt(s.bookingDate)], ['Expected delivery', fmt(s.expected)], ['Service', `${SERVICES[s.service].name} · ${s.quantity} pkg · ${inr(s.price)}`], ['Product type', s.packageType], ['Weight', `${s.weightGrams.toLocaleString('en-IN')} g`], ['Product value', inr(s.productValue)], ['Location', s.location]] : [];
  return (<div className="wrap page narrow"><h1>Track your order</h1>
    <p className="muted">Enter the Order ID. Database bookings also require the phone number used during booking. Status updates are recorded; there is no live GPS tracking. Demo IDs: TRK1025 to TRK1029.</p>
    <form className="card row" onSubmit={submit} role="search"><label className="f grow">Order ID<input value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. ORD12345678 or TRK1025" /></label>{isSupabaseConfigured() && <label className="f grow">Booking phone number<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone used when booking" /></label>}<button className="btn" type="submit" disabled={searching}>{searching ? 'Searching…' : 'Track'}</button></form>
    {query.trim() === '' && <p className="muted">Enter an Order ID to see its status.</p>}
    {query.trim() !== '' && !s && <div className="card" role="alert"><h3>{remoteError || 'Shipment not found.'}</h3><p>Check the Order ID and phone number, or <Link to="/book">book a new delivery</Link>.</p></div>}
    {s && <div className="card"><div className="between"><h2>{s.id}</h2><Badge status={s.status} /></div>
      <dl className="dl">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}<div><dt>Current status</dt><dd>{s.status}</dd></div></dl>
      <ol className="tl" aria-label="Tracking timeline">{STEPS.map((st, i) => { const delayed = s.status === 'Delayed' && i === idx; const done = s.status === 'Delivered' || i < idx;
        return <li key={st} className={delayed ? 'warn' : done ? 'done' : i === idx ? 'cur' : ''}><span className="dot">{delayed ? <AlertTriangle size={14} aria-hidden /> : done ? <Check size={14} aria-hidden /> : null}</span>{delayed ? 'Delayed (in transit)' : st}</li>; })}</ol>
      <Link to="/dashboard" className="btn ghost">Open Dashboard</Link></div>}</div>);
}
