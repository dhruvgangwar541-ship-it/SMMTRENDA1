import { createClient } from "@supabase/supabase-js";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body)
});

export async function handler(event) {
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  const orderId = event.queryStringParameters?.order_id;
  if (!orderId) return json(400, { error: "Missing order_id." });

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const zapKey = process.env.ZAPUPI_API_KEY;
  if (!url || !serviceKey || !zapKey) return json(500, { error: "Payment verification is not configured." });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: order, error } = await admin.from("orders")
    .select("id,amount,status").eq("id", orderId).maybeSingle();
  if (error || !order) return json(404, { error: "Order not found." });

  let result;
  try {
    const response = await fetch("https://pay.zapupi.com/api/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zap_key: zapKey, order_id: order.id })
    });
    result = await response.json();
    if (!response.ok || result?.status !== "success") throw new Error();
  } catch {
    return json(502, { error: "Could not verify payment with the payment provider. Please try again." });
  }

  const payment = result?.data;
  const paidOrderId = String(payment?.order_id ?? result?.order_id ?? "");
  const paidAmount = Number(payment?.amount ?? result?.amount);
  const paidStatus = String(payment?.status ?? "").toLowerCase();

  if (paidStatus === "success" && paidOrderId === String(order.id) &&
      Number.isFinite(paidAmount) && Math.abs(paidAmount - Number(order.amount)) < 0.005) {
    if (order.status !== "paid") {
      const { error: updateError } = await admin.from("orders")
        .update({ status: "paid" }).eq("id", order.id).neq("status", "paid");
      if (updateError) return json(500, { error: "Payment was verified, but order status could not be updated. Contact support." });
    }
    return {
      statusCode: 303,
      headers: { Location: `${(process.env.URL || process.env.DEPLOY_PRIME_URL || "").replace(/\/+$/, "")}/?payment=success&order_id=${encodeURIComponent(order.id)}`, "Cache-Control": "no-store" },
      body: ""
    };
  }

  return {
    statusCode: 303,
    headers: { Location: `${(process.env.URL || process.env.DEPLOY_PRIME_URL || "").replace(/\/+$/, "")}/?payment=${encodeURIComponent(paidStatus === "failed" ? "failed" : "pending")}&order_id=${encodeURIComponent(order.id)}`, "Cache-Control": "no-store" },
    body: ""
  };
}
