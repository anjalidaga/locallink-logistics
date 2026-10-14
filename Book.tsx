import { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useShipments } from '../context/ShipmentContext';
import { Service, Shipment } from '../types';
import { SERVICES, calcPrice, validateQty, inr } from '../lib/pricing';
import { isEmail, isPhone, today, fmt } from '../lib/format';
const TYPES = ['Documents', 'Food items', 'Medicines', 'Retail goods', 'Electronics', 'Other'];
type Form = { customer: string; business: string; email: string; phone: string; pickup: string; destination: string; quantity: string; packageType: string; service: string; pickupDate: string; pickupTime: string; instructions: string; weightGrams: string; productValue: string };
export default function Book() {
  const { addBooking } = useShipments(); const [sp] = useSearchParams();
  const s0 = sp.get('service'); const svc0: Service = s0 && s0 in SERVICES ? (s0 as Service) : 'standard';
  const [f, setF] = useState<Form>({ customer: '', business: '', email: '', phone: '', pickup: '', destination: '', quantity: sp.get('qty') || (svc0 === 'bulk' ? '10' : '1'), packageType: TYPES[0], service: svc0, pickupDate: today(), pickupTime: '10:00', instructions: '', weightGrams: '500', productValue: '1000' });
  const [err, setErr] = useState<Record<string, string>>({}); const [done, setDone] = useState<Shipment | null>(null); const [copied, setCopied] = useState(false); const [saving, setSaving] = useState(false); const [submitError, setSubmitError] = useState('');
  const set = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target; setF(p => { const n = { ...p, [name]: value }; if (name === 'service' && value === 'bulk' && Number(n.quantity) < 10) n.quantity = '10'; return n; }); };
  const q = Number(f.quantity); const qErr = f.quantity.trim() === '' ? 'Enter a quantity.' : validateQty(f.service as Service, q);
  async function submit(e: FormEvent) {
    e.preventDefault(); const r = 'This field is required.'; const x: Record<string, string> = {};
    (['customer', 'business', 'pickup', 'destination', 'pickupDate', 'pickupTime'] as const).forEach(k => { if (!f[k].trim()) x[k] = r; });
    if (!f.email.trim()) x.email = r; else if (!isEmail(f.email)) x.email = 'Enter a valid email, e.g. name@shop.com.';
    if (!f.phone.trim()) x.phone = r; else if (!isPhone(f.phone)) x.phone = 'Enter a valid phone number (at least 10 digits).';
    if (qErr) x.quantity = qErr;
    if (!f.weightGrams.trim() || !Number.isInteger(Number(f.weightGrams)) || Number(f.weightGrams) < 1) x.weightGrams = 'Enter weight in whole grams (at least 1).';
    if (!f.productValue.trim() || !Number.isFinite(Number(f.productValue)) || Number(f.productValue) < 0) x.productValue = 'Enter a valid product value (0 or more).';
    if (f.pickupDate && f.pickupDate < today()) x.pickupDate = 'Pickup date cannot be in the past.';
    setErr(x); setSubmitError(''); if (Object.keys(x).length) return;
    setSaving(true);
    try { setDone(await addBooking({ ...f, quantity: q, service: f.service as Service, weightGrams: Number(f.weightGrams), productValue: Number(f.productValue) })); }
    catch (e) { setSubmitError(e instanceof Error ? e.message : 'Booking failed. Please try again.'); }
    finally { setSaving(false); }
  }
  async function copy() { try { await navigator.clipboard.writeText(done!.id); setCopied(true); } catch { window.prompt('Copy your Order ID:', done!.id); } }
  if (done) return (<div className="wrap page narrow"><div className="card center"><CheckCircle2 size={40} className="okc" aria-hidden />
    <h1>Booking confirmed</h1><p>Your Order ID</p><p className="oid">{done.id}</p>
    <p>{SERVICES[done.service].name} · {done.quantity} package(s) · <strong>{inr(done.price)}</strong> (estimate)</p>
    <p className="muted">Expected delivery: {fmt(done.expected)}. No payment is taken and no message is sent.</p>
    <div className="row c"><button className="btn alt" onClick={copy}><Copy size={16} aria-hidden /> {copied ? 'Copied' : 'Copy Order ID'}</button>
      <Link className="btn" to={`/track?id=${done.id}`}>Track This Order</Link><Link className="btn ghost" to="/dashboard">View in Dashboard</Link></div>
    <p><button className="link-btn" onClick={() => { setDone(null); setCopied(false); }}>Book another delivery</button></p></div></div>);
  const fld = (n: keyof Form, label: string, type = 'text') => (
    <label className="f">{label}<input name={n} type={type} value={f[n]} onChange={set} aria-invalid={!!err[n]} />{err[n] && <span className="err" role="alert">{err[n]}</span>}</label>);
  return (<div className="wrap page narrow"><h1>Book a delivery</h1><p className="muted">Book a local delivery. Delivery charges are estimates; product value is recorded separately.</p>
    <form className="card form" onSubmit={submit} noValidate>
      {fld('customer', 'Customer name')}{fld('business', 'Business name')}{fld('email', 'Email', 'email')}{fld('phone', 'Phone', 'tel')}
      {fld('pickup', 'Pickup address')}{fld('destination', 'Destination address')}
      <label className="f">Delivery service<select name="service" value={f.service} onChange={set}>{(Object.keys(SERVICES) as Service[]).map(k => <option key={k} value={k}>{SERVICES[k].name}</option>)}</select></label>
      <label className="f">Package quantity<input name="quantity" type="number" min={1} step={1} value={f.quantity} onChange={set} aria-invalid={!!qErr} />{qErr && <span className="err" role="alert">{qErr}</span>}</label>
      <label className="f">Product type<select name="packageType" value={f.packageType} onChange={set}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
      <label className="f">Product weight (grams)<input name="weightGrams" type="number" min="1" step="1" value={f.weightGrams} onChange={set} aria-invalid={!!err.weightGrams} />{err.weightGrams && <span className="err" role="alert">{err.weightGrams}</span>}</label>
      <label className="f">Product value (₹)<input name="productValue" type="number" min="0" step="0.01" value={f.productValue} onChange={set} aria-invalid={!!err.productValue} />{err.productValue && <span className="err" role="alert">{err.productValue}</span>}</label>
      {fld('pickupDate', 'Preferred pickup date', 'date')}{fld('pickupTime', 'Preferred pickup time', 'time')}
      <label className="f full">Additional instructions<textarea name="instructions" rows={3} value={f.instructions} onChange={set} /></label>
      <p className="total full" aria-live="polite">Estimated total: <strong>{qErr ? '-' : inr(calcPrice(f.service as Service, q))}</strong></p>
      <div className="full">{submitError && <p className="err" role="alert">{submitError}</p>}<button className="btn" type="submit" disabled={saving}>{saving ? 'Saving booking…' : 'Confirm booking'}</button></div></form></div>);
}
