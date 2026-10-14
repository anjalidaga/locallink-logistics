import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
export default function About() {
  const steps = ['Booking', 'Dispatch', 'In Transit', 'Delivered'];
  return (<div className="wrap page"><h1>About the business</h1>
    <div className="grid2">
      <div className="card"><h3>What we do</h3><p>LocalLink Logistics is a digital local-delivery platform where small businesses book deliveries, track shipments, estimate costs and monitor performance through a simple web interface.</p></div>
      <div className="card"><h3>The problem</h3><p>Small shops struggle to arrange reliable local deliveries. Coordination by calls and messages causes delayed dispatches, poor visibility and unclear proof of delivery.</p></div>
      <div className="card"><h3>Target customers</h3><p>Bakeries, pharmacies, wholesalers, boutiques and neighbourhood retailers.</p></div>
      <div className="card"><h3>Service area</h3><p>Vadodara, Gujarat, India (demonstration scope).</p></div>
      <div className="card"><h3>Value proposition</h3><p>Transparent per-package pricing, one order ID per shipment, and a manager dashboard showing status and on-time performance.</p></div>
      <div className="card"><h3>Why visibility and dispatch efficiency matter</h3><p>Customers make fewer "where is my order?" calls, managers spot delays early, and faster dispatch reduces idle partner time and late deliveries.</p></div></div>
    <h2>Delivery workflow</h2>
    <ol className="flow">{steps.map((s, i) => <li key={s}><span>{s}</span>{i < 3 && <ChevronRight aria-hidden />}</li>)}</ol>
    <div className="row"><Link className="btn" to="/services">View Services</Link><Link className="btn alt" to="/contact">Contact Us</Link></div></div>);
}
