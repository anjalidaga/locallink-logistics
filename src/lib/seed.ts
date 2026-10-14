import { Shipment, Status, Service } from '../types';
import { SERVICES, calcPrice } from './pricing';
export const PARTNERS = ['Ravi Patel', 'Imran Shaikh', 'Meera Joshi', 'Kiran Solanki', 'Anil Rathod', 'Sunita Desai', 'Vikram Parmar', 'Hetal Shah', 'Nilesh Bhatt', 'Pooja Mehta'];
const CUSTOMERS = ['Asha Trivedi', 'Rohan Mehta', 'Farida Khan', 'Jignesh Panchal', 'Neha Bhatt', 'Sanjay Rana', 'Pooja Shah', 'Dhruv Amin', 'Kavita Joshi', 'Amit Chauhan'];
const BUSINESSES = ['Sweet Crumbs Bakery', 'HealthFirst Pharmacy', 'Gujarat Wholesale Mart', 'Urban Threads', 'Fresh Basket', 'Print Point', 'Green Leaf Organics', 'City Electronics'];
const AREAS = ['Alkapuri', 'Fatehgunj', 'Manjalpur', 'Gotri', 'Akota', 'Karelibaug', 'Waghodia Road', 'Sayajigunj', 'Makarpura', 'Harni'];
const TYPES = ['Documents', 'Food items', 'Medicines', 'Retail goods', 'Electronics'];
const CYCLE: Status[] = ['Booked', 'Dispatched', 'In Transit', 'Out for Delivery'];
const SPECIAL: Record<number, Status> = { 1025: 'In Transit', 1026: 'Delivered', 1027: 'Delayed', 1028: 'Out for Delivery', 1029: 'Booked' };
// 250 orders: 210 Delivered, 25 active (Booked/Dispatched/In Transit/Out for Delivery), 15 Delayed.
// Out-for-delivery orders only use the first 2 partners, so 8 of 10 partners are available at start.
export function createSeed(now = new Date()): Shipment[] {
  const out: Shipment[] = []; let rest = 0;
  for (let i = 0; i < 250; i++) {
    const num = 1029 - i;
    let status: Status;
    if (SPECIAL[num]) status = SPECIAL[num]; else { rest++; status = rest <= 22 ? CYCLE[rest % 4] : rest <= 36 ? 'Delayed' : 'Delivered'; }
    const service: Service = i % 7 === 0 ? 'bulk' : i % 3 === 0 ? 'express' : 'standard';
    const quantity = service === 'bulk' ? 10 + (i % 6) : 1 + (i % 4);
    const booked = new Date(now.getTime() - Math.min(6, Math.floor(i / 36)) * 864e5 - (i % 5) * 6e5);
    const c = CUSTOMERS[i % CUSTOMERS.length];
    out.push({
      id: 'TRK' + num, customer: c, business: BUSINESSES[i % BUSINESSES.length],
      email: c.split(' ')[0].toLowerCase() + '@demo.example', phone: '+91 90000 0' + String(1000 + i).slice(-4),
      pickup: AREAS[i % AREAS.length] + ', Vadodara', destination: AREAS[(i + 3) % AREAS.length] + ', Vadodara',
      quantity, packageType: TYPES[i % TYPES.length], service, instructions: '', weightGrams: 250 + (i % 20) * 125, productValue: 500 + (i % 12) * 350, location: AREAS[(i + 3) % AREAS.length] + ', Vadodara',
      partner: status === 'Out for Delivery' ? PARTNERS[i % 2] : PARTNERS[i % PARTNERS.length], status,
      bookingDate: booked.toISOString(), expected: new Date(booked.getTime() + SERVICES[service].hours * 36e5).toISOString(),
      price: calcPrice(service, quantity),
      onTime: status === 'Delivered' ? i % 15 !== 0 : undefined,
    });
  }
  return out;
}
