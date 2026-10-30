import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const CATALOG = {
  "reel-editing": { title: "Reel Editing", amount: 299 },
  "profile-setup": { title: "Instagram Profile Setup", amount: 499 },
  "content-pack": { title: "5-Post Content Pack", amount: 799 },
  "ad-review": { title: "Ad Campaign Review", amount: 399 },
  "analytics": { title: "Monthly Analytics Report", amount: 599 }
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body)
});

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const zapKey = process.env.ZAPUPI_API_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !zapKey) {
    return json(500, { error: "Payment service is not configured. Contact support." });
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, { error: "Please sign in first." });

  let input;
  try { input = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Invalid request body." }); }

  const service = CATALOG[String(input.service_id || "")];
  const customerLink = String(input.customer_link || "").trim();
  const notes = String(input.notes || "").trim().slice(0, 1000);
  if (!service) return json(400, { error: "Please choose a valid service." });
  try {
    const link = new URL(customerLink);
    if (!["http:", "https:"].includes(link.protocol)) throw new Error();
  } catch { return json(400, { error: "Enter a valid http or https profile link." }); }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user) return json(401, { error: "Your session has expired. Please sign in again." });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const orderId = randomUUID();
  const { data: order, error: insertError } = await admin.from("orders").insert({
    id: orderId,
    user_id: userData.user.id,
    service_id: String(input.service_id),
    service_name: service.title,
    amount: service.amount,
    customer_link: customerLink,
    notes,
    status: "awaiting_payment",
    payment_reference: null
  }).select("id,amount,status").single();

  if (insertError) return json(500, { error: "Could not save your order. Please try again." });

  const siteUrl = (process.env.URL || process.env.DEPLOY_PRIME_URL || "").replace(/\/+$/, "");
  const callback = `${siteUrl}/.netlify/functions/verify-payment?order_id=${encodeURIComponent(order.id)}`;

  let gateway;
  try {
    const response = await fetch("https://pay.zapupi.com/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        zap_key: zapKey,
        order_id: order.id,
        amount: Number(order.amount),
        customer_mobile: String(input.customer_mobile || "").trim() || undefined,
        remark: `SMMTRENDA1 ${service.title}`,
        success_url: callback,
        failed_url: `${siteUrl}/?payment=failed`,
        timeout_url: `${siteUrl}/?payment=pending`
      })
    });
    gateway = await response.json();
    if (!response.ok || gateway?.status !== "success" || !gateway?.payment_url) {
      throw new Error("Gateway did not return a valid payment link.");
    }
  } catch {
    return json(502, { error: "Your order was saved, but the payment link could not be created. Please contact support with order ID " + order.id + "." });
  }

  const { error: updateError } = await admin.from("orders")
    .update({ payment_reference: String(gateway.txn_id || "") })
    .eq("id", order.id).eq("user_id", userData.user.id);
  if (updateError) return json(500, { error: "Payment link created but order update failed. Contact support with order ID " + order.id + "." });

  return json(200, {
    order_id: order.id,
    amount: Number(order.amount),
    payment_url: gateway.payment_url,
    payment_status: "awaiting_payment"
  });
}
