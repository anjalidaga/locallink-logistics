import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });
const statuses = ["Booked", "Dispatched", "In Transit", "Out for Delivery", "Delivered", "Delayed"];
const normalisePhone = (s: string) => String(s || "").replace(/\D/g, "");
const serviceName = (s: string) => s === "local" ? "standard" : s;
function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing Supabase function secrets.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function mapOrder(o: any) {
  return {
    id: o.order_id, customer: o.customer_name, business: o.business_name || '', email: o.email || '', phone: o.phone || '',
    pickup: o.pickup_address || '', destination: o.delivery_address || '', quantity: Number(o.package_count || 1),
    packageType: o.product_type || o.package_description || 'Other', service: serviceName(o.service_type || 'local'),
    instructions: o.instructions || '', partner: o.delivery_partner || 'LocalLink team', status: o.status,
    bookingDate: o.created_at, expected: o.estimated_delivery_at || o.created_at,
    price: Number(o.delivery_charge || 0), productValue: Number(o.order_value || 0), weightGrams: Number(o.weight_grams || 0),
    location: o.location || o.delivery_address || '', onTime: o.status === 'Delivered' ? Boolean(o.delivered_at && o.estimated_delivery_at && new Date(o.delivered_at) <= new Date(o.estimated_delivery_at)) : undefined,
  };
}
async function adminUser(req: Request, db: any) {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return { ok: false, response: respond({ error: 'Sign in with an administrator account.' }, 401) };
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return { ok: false, response: respond({ error: 'Your session is invalid or expired. Please sign in again.' }, 401) };
  
const { data: profile, error: profileError } = await db
  .from('profiles')
  .select('role')
  .eq('user_id', user.id)
  .maybeSingle();

console.log('Admin role check:', {
  userId: user.id,
  profileFound: !!profile,
  role: profile?.role ?? null,
  profileQueryError: profileError?.message ?? null,
});

if (profile?.role !== 'admin') {
  return {
    ok: false,
    response: respond(
      { error: 'This account is not an administrator.' },
      403
    ),
  };
}

  return { ok: true, user };
}
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Use POST.' }, 405);
  try {
    const body = await req.json(), action = body?.action;
    const db = serviceClient();
    if (action === 'create_order') {
      const x = body.order || {};
      if (!x.customer_name || !x.phone || !x.pickup_address || !x.delivery_address || !x.product_type) return respond({ error: 'Please complete the required booking fields.' }, 400);
      if (!Number.isInteger(Number(x.weight_grams)) || Number(x.weight_grams) < 1 || Number(x.order_value) < 0 || Number(x.package_count) < 1) return respond({ error: 'Weight, product value, and package quantity are invalid.' }, 400);
      let orderId = '';
      for (let i = 0; i < 4; i++) {
        orderId = `ORD${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 90 + 10)}`;
        const { data: exists } = await db.from('orders').select('id').eq('order_id', orderId).maybeSingle();
        if (!exists) break;
      }
      const row = {
        order_id: orderId, customer_name: String(x.customer_name).trim(), business_name: String(x.business_name || '').trim(),
        phone: String(x.phone).trim(), email: String(x.email || '').trim() || null, pickup_address: String(x.pickup_address).trim(),
        delivery_address: String(x.delivery_address).trim(), pickup_date: x.pickup_date, pickup_time: x.pickup_time || null,
        package_count: Number(x.package_count), package_description: String(x.package_description || x.product_type), product_type: String(x.product_type),
        weight_grams: Number(x.weight_grams), order_value: Number(x.order_value), service_type: x.service_type,
        delivery_charge: Math.round(Number(x.delivery_charge) || 0), status: 'Booked', estimated_delivery_at: x.estimated_delivery_at || null,
        instructions: String(x.instructions || ''), location: String(x.location || x.delivery_address),
      };
      const { data, error } = await db.from('orders').insert(row).select('*').single();
      if (error) return respond({ error: error.message }, 400);
      await db.from('tracking_events').insert({ order_uuid: data.id, status: 'Booked', checkpoint: 'Booking confirmed', notes: 'Created through LocalLink website' });
      return respond(mapOrder(data), 201);
    }
    if (action === 'track_order') {
      const orderId = String(body.order_id || '').trim().toUpperCase(), phone = normalisePhone(body.phone || '');
      if (!orderId || !phone) return respond({ error: 'Enter the Order ID and the phone number used for booking.' }, 400);
      const { data, error } = await db.from('orders').select('*').eq('order_id', orderId).maybeSingle();
      if (error) return respond({ error: 'Could not look up this order.' }, 400);
      if (!data || normalisePhone(data.phone) !== phone) return respond({ error: 'No order found for that Order ID and phone number.' }, 404);
      return respond(mapOrder(data));
    }
    if (action === 'submit_enquiry') {
      const x = body.enquiry || {};
      if (!x.customer_name || !x.phone || !x.email || !x.message) return respond({ error: 'Complete the required enquiry fields.' }, 400);
      const { error } = await db.from('enquiries').insert({ customer_name: x.customer_name, business_name: x.business_name || '', email: x.email, phone: x.phone, contact: x.phone, category: x.category || 'General enquiry', message: x.message, query: x.message });
      if (error) return respond({ error: error.message }, 400);
      return respond({ ok: true }, 201);
    }
    if (action === 'admin_list_orders' || action === 'admin_update_status') {
      const auth = await adminUser(req, db);
      if (!auth.ok) return auth.response;
      if (action === 'admin_list_orders') {
        const { data, error } = await db.from('orders').select('*').order('created_at', { ascending: false }).limit(1000);
        if (error) return respond({ error: error.message }, 400);
        return respond((data || []).map(mapOrder));
      }
      const orderId = String(body.order_id || '').trim(), status = String(body.status || '');
      if (!statuses.includes(status)) return respond({ error: 'Invalid shipment status.' }, 400);
      const { data: existing } = await db.from('orders').select('id,status').eq('order_id', orderId).maybeSingle();
      if (!existing) return respond({ error: 'Order not found.' }, 404);
      const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === 'Delivered') update.delivered_at = new Date().toISOString();
      else update.delivered_at = null;
      const { error } = await db.from('orders').update(update).eq('order_id', orderId);
      if (error) return respond({ error: error.message }, 400);
      await db.from('tracking_events').insert({ order_uuid: existing.id, status, checkpoint: status, notes: 'Status updated by an administrator' });
      return respond({ ok: true });
    }
    return respond({ error: 'Unknown action.' }, 400);
  } catch (e) {
    return respond({ error: e instanceof Error ? e.message : 'Unexpected server error.' }, 500);
  }
});
