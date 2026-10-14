import { Link } from 'react-router-dom';
import { Package, Zap, Boxes, Eye, Clock, BarChart3 } from 'lucide-react';
import { CO } from '../lib/config';
import { SERVICES } from '../lib/pricing';
import { Service } from '../types';
import { useShipments } from '../context/ShipmentContext';
export default function Home() {
  const { shipments } = useShipments();
  const del = shipments.filter(s => s.status === 'Delivered'); const on = del.filter(s => s.onTime).length;
  const stats: [string | number, string][] = [[shipments.length, 'Sample orders'], [del.length, 'Delivered'], [del.length ? ((on / del.length) * 100).toFixed(1) + '%' : '-', 'On-time (of delivered)']];
  const icons = [Package, Zap, Boxes];
  return (<>
    <section className="hero"><div className="wrap">
      <h1>{CO.tagline}</h1>
      <p className="lead">{CO.name} is a demo local-delivery platform for Vadodara's bakeries, pharmacies, wholesalers and retailers: book deliveries, track shipments and monitor performance in one place.</p>
      <div className="row"><Link className="btn" to="/services">Get Started</Link><Link className="btn alt" to="/book">Book a Delivery</Link><Link className="btn ghost" to="/track">Track Your Order</Link></div></div></section>
    <section className="wrap page"><h2>Our services</h2>
      <div className="grid3">{(Object.keys(SERVICES) as Service[]).map((k, i) => { const I = icons[i]; return (
        <Link key={k} to="/services" className="card link"><I aria-hidden /><h3>{SERVICES[k].name}</h3><p>{SERVICES[k].desc}</p><p className="muted">{SERVICES[k].priceLabel} (illustrative)</p></Link>); })}</div>
      <h2>Why LocalLink</h2>
      <div className="grid3">
        <div className="card"><Eye aria-hidden /><h3>Shipment visibility</h3><p>Every order has an ID and a clear status timeline.</p></div>
        <div className="card"><Clock aria-hidden /><h3>Faster dispatch</h3><p>Online booking replaces phone calls and chat threads.</p></div>
        <div className="card"><BarChart3 aria-hidden /><h3>Operational insight</h3><p>Managers see KPIs and delays from one dataset.</p></div></div>
      <h2>Sample delivery statistics</h2>
      <div className="grid3">{stats.map(([v, l]) => <div className="card kpi" key={l}><span className="num">{v}</span><span>{l}</span></div>)}</div>
      <p className="muted">Figures are calculated from fictional demo data stored in your browser.</p></section></>);
}
