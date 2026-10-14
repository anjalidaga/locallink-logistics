import { useState, ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Truck, Menu, X } from 'lucide-react';
import { CO, DEMO_NOTE } from '../lib/config';
const NAV = [['/', 'Home'], ['/about', 'About'], ['/services', 'Services'], ['/book', 'Book'], ['/track', 'Track Order'], ['/dashboard', 'Dashboard'], ['/contact', 'Contact']];
export default function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (<>
    <div className="demo-bar" role="note">{DEMO_NOTE}</div>
    <header className="top"><div className="wrap bar">
      <Link to="/" className="logo" onClick={() => setOpen(false)}><Truck aria-hidden size={24} /> {CO.name}</Link>
      <button className="menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="nav" onClick={() => setOpen(o => !o)}>{open ? <X /> : <Menu />}</button>
      <nav id="nav" className={open ? 'open' : ''} aria-label="Main">
        {NAV.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>)}
      </nav></div></header>
    <main>{children}</main>
    <footer><div className="wrap foot">
      <div><strong>{CO.name}</strong><p>{CO.tagline}</p><p>{DEMO_NOTE}</p></div>
      <div><strong>Quick links</strong>{NAV.slice(1).map(([to, l]) => <Link key={to} to={to}>{l}</Link>)}</div>
      <div><strong>Contact (demo)</strong><a href={`mailto:${CO.email}`}>{CO.email}</a><a href={`tel:${CO.phoneTel}`}>{CO.phone}</a><a href={CO.maps} target="_blank" rel="noreferrer">{CO.location}</a><span>{CO.hours}</span></div>
    </div></footer></>);
}
