import { supabase } from "./supabase.js";

const ORDERS_KEY = "smmtrenda1_demo_orders";
const USER_KEY = "smmtrenda1_demo_user";

export function getDemoUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
  catch { return null; }
}

export async function signIn(email, password) {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }
  // Preview-only demo login. Do not use this as production authentication.
  const user = { email, demo: true };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function signUp(email, password) {
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
  }
  const user = { email, demo: true };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function signOut() {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  localStorage.removeItem(USER_KEY);
}

export async function getOrders() {
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]"); }
  catch { return []; }
}

export async function createDemoOrder(service, customerLink, notes = "") {
  const user = supabase ? (await supabase.auth.getUser()).data.user : getDemoUser();
  if (!user) throw new Error("Please log in before creating an order.");
  const order = {
    id: `SM-${Date.now().toString().slice(-8)}`,
    user_id: user.id || user.email,
    service_id: service.id,
    service_name: service.title,
    amount: Number(service.price),
    customer_link: customerLink,
    notes,
    status: "awaiting_payment",
    created_at: new Date().toISOString()
  };
  if (supabase) {
    const { data, error } = await supabase.from("orders").insert({
      service_id: order.service_id,
      service_name: order.service_name,
      amount: order.amount,
      customer_link: order.customer_link,
      notes: order.notes,
      status: order.status
    }).select().single();
    if (error) throw error;
    return data;
  }
  const existing = await getOrders();
  localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...existing]));
  return order;
}