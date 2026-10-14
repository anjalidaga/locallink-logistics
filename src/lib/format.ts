export const fmt = (iso: string) => { const d = new Date(iso); return isNaN(+d) ? '-' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); };
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => dayKey(new Date());
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isPhone = (v: string) => /^\+?[\d\s-]{10,16}$/.test(v.trim()) && v.replace(/\D/g, '').length >= 10;
