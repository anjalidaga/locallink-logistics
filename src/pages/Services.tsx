import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Service } from '../types';
import { SERVICES, calcPrice, validateQty, inr } from '../lib/pricing';
export default function Services() {
  const [svc, setSvc] = useState<Service>('standard'); const [qty, setQty] = useState('1');
  const q = Number(qty); const err = qty.trim() === '' ? 'Enter a quantity.' : validateQty(svc, q);
  return (<div className="wrap page"><h1>Services</h1>
    <p className="muted">All prices and delivery windows are illustrative estimates for this demo.</p>
    <div className="grid3">{(Object.keys(SERVICES) as Service[]).map(k => (
      <div className="card" key={k}><h3>{SERVICES[k].name}</h3><p>{SERVICES[k].desc}</p>
        <p><strong>{SERVICES[k].priceLabel}</strong></p><p className="muted">Est. window: {SERVICES[k].window}</p>
        <Link className="btn" to={`/book?service=${k}`}>Book This Service</Link></div>))}</div>
    <h2>Delivery-cost calculator</h2>
    <div className="card calc">
      <label className="f">Service<select value={svc} onChange={e => { const v = e.target.value as Service; setSvc(v); if (v === 'bulk' && (Number(qty) || 0) < 10) setQty('10'); }}>
        {(Object.keys(SERVICES) as Service[]).map(k => <option key={k} value={k}>{SERVICES[k].name}</option>)}</select></label>
      <label className="f">Package quantity<input type="number" min={1} step={1} value={qty} onChange={e => setQty(e.target.value)} aria-invalid={!!err} /></label>
      <div aria-live="polite">{err ? <p className="err" role="alert">{err}</p> : <p className="total">Estimated total: <strong>{inr(calcPrice(svc, q))}</strong></p>}</div>
      <p className="muted">Bulk: ₹1,000 covers the first 10 packages, then ₹100 per additional package.</p>
      {!err && <Link className="btn alt" to={`/book?service=${svc}&qty=${q}`}>Book with these details</Link>}</div>
    <p><Link to="/contact">Need a custom quote? Contact us.</Link></p></div>);
}
