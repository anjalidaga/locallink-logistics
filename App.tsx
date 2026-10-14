import { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Book from './pages/Book';
import Track from './pages/Track';
import Dashboard from './pages/Dashboard';
import Contact from './pages/Contact';

function ScrollTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
export default function App() {
  return (<Layout><ScrollTop />
    <Routes>
      <Route path="/" element={<Home />} /><Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} /><Route path="/book" element={<Book />} />
      <Route path="/track" element={<Track />} /><Route path="/dashboard" element={<Dashboard />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<div className="wrap page"><h1>Page not found</h1><p><Link to="/" className="btn">Back to Home</Link></p></div>} />
    </Routes></Layout>);
}
