import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RotateCcw, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { useShipments } from '../context/ShipmentContext';
import Badge from '../components/Badge';
import { PARTNERS } from '../lib/seed';
import { SERVICES } from '../lib/pricing';
import { STATUSES, ACTIVE, Status, Service } from '../types';
import { fmt, dayKey } from '../lib/format';
import { hasAdminSession, isSupabaseConfigured, loadRemoteOrders, loginAdmin, logoutAdmin, updateRemoteStatus } from '../lib/api';
const COL: Record<Status, string> = { Booked: '#93c5fd', Dispatched: '#60a5fa', 'In Transit': '#2563eb', 'Out for Delivery': '#1e40af', Delivered: '#16a34a', Delayed: '#d97706' };
export default function Dashboard() {
  const { shipments, updateStatus, reset } = useShipments();
  const [remoteRows, setRemoteRows] = useState<import('../types').Shipment[]>([]); const [adminActive, setAdminActive] = useState(isSupabaseConfigured() && hasAdminSession());
  const [adminEmail, setAdminEmail] = useState(''); const [adminPassword, setAdminPassword] = useState(''); const [adminError, setAdminError] = useState(''); const [adminBusy, setAdminBusy] = useState(false);
  const allShipments = adminActive ? [...remoteRows, ...shipments.filter(s => s.id.startsWith('ORD') && !remoteRows.some(r => r.id === s.id))] : shipments;
  useEffect(() => { if (isSupabaseConfigured() && hasAdminSession()) { loadRemoteOrders().then(setRemoteRows).catch(e => { setAdminError(e instanceof Error ? e.message : 'Could not load database orders.'); setAdminActive(false); logoutAdmin(); }); } }, []);
  async function signIn(e: FormEvent) { e.preventDefault(); setAdminBusy(true); setAdminError(''); try { await loginAdmin(adminEmail, adminPassword); const rows = await loadRemoteOrders(); setRemoteRows(rows); setAdminActive(true); setAdminPassword(''); } catch (e) { logoutAdmin(); setAdminActive(false); setAdminError(e instanceof Error ? e.message : 'Admin sign-in failed.'); } finally { setAdminBusy(false); } }
  function signOut() { logoutAdmin(); setAdminActive(false); setRemoteRows([]); setAdminError(''); }
  async function changeStatus(id: string, status: Status) { if (id.startsWith('ORD')) { try { await updateRemoteStatus(id, status); setRemoteRows(p => p.map(s => s.id !== id ? s : { ...s, status, onTime: status === 'Delivered' ? s.status !== 'Delayed' : undefined })); setAdminError(''); } catch (e) { setAdminError(e instanceof Error ? e.message : 'Could not update order status.'); } } else updateStatus(id, status); }
  const [q, setQ] = useState(''); const [st, setSt] = useState(''); const [ty, setTy] = useState(''); const [limit, setLimit] = useState(25); const [confirm, setConfirm] = useState(false);
  const k = useMemo(() => {
    const del = allShipments.filter(s => s.status === 'Delivered'); const onT = del.filter(s => s.onTime).length;
    const busy = new Set(allShipments.filter(s => s.status === 'Out for Delivery').map(s => s.partner)).size;
    return { total: allShipments.length, del: del.length, inT: allShipments.filter(s => ACTIVE.includes(s.status)).length, late: allShipments.filter(s => s.status === 'Delayed').length,
      rate: del.length ? (onT / del.length) * 100 : 0, onT, avail: Math.max(0, PARTNERS.length - busy) };
  }, [allShipments]);
  const byStatus = STATUSES.map(s => ({ name: s, value: allShipments.filter(x => x.status === s).length }));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const key = dayKey(d);
    return { day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), orders: allShipments.filter(s => dayKey(new Date(s.bookingDate)) === key).length }; }), [allShipments]);
  const rows = allShipments.filter(s => (!st || s.status === st) && (!ty || s.service === ty) && (!q.trim() || s.id.toLowerCase().includes(q.trim().toLowerCase()) || s.customer.toLowerCase().includes(q.trim().toLowerCase())));
  const clear = () => { setQ(''); setSt(''); setTy(''); setLimit(25); };
  const cards: [string, string | number, string][] = [['Total Orders', k.total, ''], ['Delivered Orders', k.del, 'ok'], ['In-Transit Orders', k.inT, ''], ['Delayed Orders', k.late, 'warn'], ['On-Time Delivery Rate', k.rate.toFixed(1) + '%', 'ok'], ['Available Delivery Partners', `${k.avail} / ${PARTNERS.length}`, '']];
  const pie = byStatus.filter(d => d.value > 0);
  return (<div className="wrap page"><div className="between"><h1>Operations dashboard</h1>
    <div className="row"><Link className="btn" to="/book"><Plus size={16} aria-hidden /> Create Booking</Link>
      {confirm ? <span className="row">Restore the original 250 demo orders? <button className="btn danger" onClick={() => { reset(); clear(); setConfirm(false); }}>Yes, reset</button><button className="btn ghost" onClick={() => setConfirm(false)}>Cancel</button></span>
        : <button className="btn ghost" onClick={() => setConfirm(true)}><RotateCcw size={16} aria-hidden /> Reset Demo Data</button>}</div></div>
    {isSupabaseConfigured() && <div className="card" style={{ marginBottom: 16 }}><div className="between"><div><h2>Database connection</h2><p className="muted">Public bookings are stored in Supabase. Sign in as an administrator to load database orders and update their status.</p></div>{adminActive && <button className="btn ghost" onClick={signOut}>Sign out</button>}</div>
      {!adminActive && <form className="form" onSubmit={signIn}><label className="f">Admin email<input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required /></label><label className="f">Password<input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required /></label><div><button className="btn" type="submit" disabled={adminBusy}>{adminBusy ? 'Signing in…' : 'Sign in and load orders'}</button></div></form>}
      {adminActive && <p className="okmsg">Administrator signed in. {remoteRows.length} database orders loaded.</p>}{adminError && <p className="err" role="alert">{adminError}</p>}</div>}
    <div className="grid6">{cards.map(([l, v, c]) => <div key={l} className={'card kpi ' + c}><span className="num">{v}</span><span>{l}</span></div>)}</div>
    <p className="muted">In transit = Booked, Dispatched, In Transit or Out for Delivery. On-time rate = {k.onT} on-time ÷ {k.del} delivered orders (delayed and active orders are not yet completed, so they are excluded from the denominator). A partner is unavailable while on an Out-for-Delivery order. All values are computed from the shipment table below.</p>
    <div className="grid3 charts">
      <div className="card"><h3>Orders by status</h3><ResponsiveContainer width="100%" height={250}><BarChart data={byStatus}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} height={55} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value">{byStatus.map(d => <Cell key={d.name} fill={COL[d.name]} />)}</Bar></BarChart></ResponsiveContainer></div>
      <div className="card"><h3>Delivery volume, last 7 days (by booking date)</h3><ResponsiveContainer width="100%" height={250}><LineChart data={days}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
      <div className="card"><h3>Status distribution</h3><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>{pie.map(d => <Cell key={d.name} fill={COL[d.name]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div></div>
    <h2>Order management</h2>
    <div className="card row filters">
      <label className="f grow"><span><Search size={14} aria-hidden /> Search Order ID or customer</span><input value={q} onChange={e => { setQ(e.target.value); setLimit(25); }} /></label>
      <label className="f">Status<select value={st} onChange={e => { setSt(e.target.value); setLimit(25); }}><option value="">All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="f">Delivery type<select value={ty} onChange={e => { setTy(e.target.value); setLimit(25); }}><option value="">All</option>{(Object.keys(SERVICES) as Service[]).map(s => <option key={s} value={s}>{SERVICES[s].name}</option>)}</select></label>
      <button className="btn ghost" onClick={clear}>Reset Filters</button></div>
    <p className="muted" aria-live="polite">Showing {Math.min(limit, rows.length)} of {rows.length} matching orders</p>
    {rows.length === 0 ? <div className="card center"><h3>No orders match your filters</h3><p>Change the search or filters, or reset them.</p><button className="btn" onClick={clear}>Reset Filters</button></div> :
      <div className="tablewrap"><table><thead><tr>{['Order ID', 'Customer', 'Pickup', 'Destination', 'Product', 'Weight (g)', 'Product value', 'Partner', 'Status', 'Expected', 'Update status'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.slice(0, limit).map(s => <tr key={s.id}><td><Link to={`/track?id=${s.id}`}>{s.id}</Link></td><td>{s.customer}</td><td>{s.pickup}</td><td>{s.destination}</td><td>{s.packageType} / {SERVICES[s.service].name}</td><td>{s.weightGrams.toLocaleString('en-IN')}</td><td>₹{s.productValue.toLocaleString('en-IN')}</td><td>{s.partner}</td><td><Badge status={s.status} /></td><td>{fmt(s.expected)}</td>
          <td><select aria-label={`Update status for ${s.id}`} value={s.status} disabled={s.id.startsWith('ORD') && !adminActive} onChange={e => changeStatus(s.id, e.target.value as Status)}>{STATUSES.map(x => <option key={x}>{x}</option>)}</select></td></tr>)}</tbody></table></div>}
    {rows.length > limit && <p className="center"><button className="btn ghost" onClick={() => setLimit(l => l + 25)}>Show more</button></p>}</div>);
}
