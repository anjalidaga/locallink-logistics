import { useState, FormEvent } from 'react';
import { Mail, Phone, MapPin, Clock, ExternalLink } from 'lucide-react';
import { CO, CATEGORIES } from '../lib/config';
import { isEmail, isPhone } from '../lib/format';
import { loadEnquiries, saveEnquiries } from '../lib/storage';
import { isSupabaseConfigured, submitRemoteEnquiry } from '../lib/api';
const empty = { name: '', business: '', email: '', phone: '', category: CATEGORIES[0], message: '' };
type F = typeof empty;
export default function Contact() {
  const [f, setF] = useState<F>(empty); const [err, setErr] = useState<Record<string, string>>({}); const [ok, setOk] = useState(''); const [count, setCount] = useState(() => loadEnquiries().length);
  const set = (k: keyof F, v: string) => setF(p => ({ ...p, [k]: v }));
  async function submit(e: FormEvent) {
    e.preventDefault(); const x: Record<string, string> = {}; const r = 'This field is required.';
    if (!f.name.trim()) x.name = r;
    if (!f.business.trim()) x.business = r;
    if (!f.message.trim()) x.message = r; else if (f.message.trim().length < 10) x.message = 'Please write at least 10 characters.';
    if (!f.email.trim()) x.email = r; else if (!isEmail(f.email)) x.email = 'Enter a valid email, e.g. name@shop.com.';
    if (!f.phone.trim()) x.phone = r; else if (!isPhone(f.phone)) x.phone = 'Enter a valid phone number (at least 10 digits).';
    setErr(x); setOk(''); if (Object.keys(x).length) return;
    try {
      if (isSupabaseConfigured()) { await submitRemoteEnquiry(f); setOk('Enquiry submitted successfully. Our demo database has recorded it. No email was sent.'); }
      else { const list = loadEnquiries(); list.unshift({ id: 'ENQ' + Date.now(), at: new Date().toISOString(), ...f }); saveEnquiries(list); setCount(list.length); setOk('Enquiry saved in this browser as a demo record. No email was sent.'); }
      setF(empty);
    } catch (e) { setOk(e instanceof Error ? e.message : 'Could not submit the enquiry. Please try again.'); }
  }
  const T = (k: keyof F, label: string, type = 'text') => <label className="f">{label}<input type={type} value={f[k]} onChange={e => set(k, e.target.value)} aria-invalid={!!err[k]} />{err[k] && <span className="err" role="alert">{err[k]}</span>}</label>;
  return (<div className="wrap page"><h1>Contact / Enquiry</h1><p className="muted">Demo contact details only.</p>
    <div className="grid2">
      <div className="card"><h3>Reach us</h3>
        <p><Mail size={16} aria-hidden /> <a href={`mailto:${CO.email}`}>{CO.email}</a></p><p><Phone size={16} aria-hidden /> <a href={`tel:${CO.phoneTel}`}>{CO.phone}</a></p>
        <p><MapPin size={16} aria-hidden /> {CO.location} - <a href={CO.maps} target="_blank" rel="noreferrer">Open in Google Maps</a></p><p><Clock size={16} aria-hidden /> {CO.hours}</p>
        <h3>Logistics industry links</h3>{CO.links.map(l => <p key={l.url}><ExternalLink size={16} aria-hidden /> <a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></p>)}
        <p className="muted">Email/phone links open your own mail or phone app. Enquiries saved in this browser: {count}</p></div>
      <form className="card form one" onSubmit={submit} noValidate><h3 className="full">Send an enquiry</h3>
        {T('name', 'Full name')}{T('business', 'Business name')}{T('email', 'Email', 'email')}{T('phone', 'Phone number', 'tel')}
        <label className="f">Enquiry category<select value={f.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="f">Message<textarea rows={4} value={f.message} onChange={e => set('message', e.target.value)} aria-invalid={!!err.message} />{err.message && <span className="err" role="alert">{err.message}</span>}</label>
        <div><button className="btn" type="submit">Submit enquiry</button></div>
        {ok && <p className="okmsg" role="status">{ok}</p>}</form></div></div>);
}
