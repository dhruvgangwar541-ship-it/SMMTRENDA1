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
  if (!supabase) throw new Error("Supabase is not configured. Please contact support.");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Please log in before creating an order.");

  const response = await fetch("/.netlify/functions/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      service_id: service.id,
      customer_link: customerLink,
      notes
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Could not create payment.");
  if (!result.payment_url) throw new Error("Payment link was not returned.");
  window.location.assign(result.payment_url);
  return result;
}
