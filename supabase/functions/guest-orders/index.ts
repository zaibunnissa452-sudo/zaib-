import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-razorpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tokenPattern = /^[0-9a-f]{64}$/;
const razorpayOrderPattern = /^order_[A-Za-z0-9]+$/;
const razorpayPaymentPattern = /^pay_[A-Za-z0-9]+$/;

type RazorpayPayment = {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  captured?: boolean;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function publicOrderError(message: string) {
  if (message.includes("CANTEEN_CLOSED")) {
    return { status: 409, message: "This canteen is closed and is not accepting orders." };
  }
  if (message.includes("CANTEEN_NOT_FOUND")) {
    return { status: 404, message: "This canteen could not be found. Refresh the page and try again." };
  }
  if (message.includes("ITEM_UNAVAILABLE")) {
    return { status: 409, message: "One or more items are no longer available. Refresh the menu and try again." };
  }
  if (message.includes("INVALID_ORDER")) {
    return { status: 400, message: "Your cart has an invalid item. Refresh the menu and try again." };
  }
  return { status: 500, message: "We couldn't place the order. Please try again." };
}

function getGatewayCredentials() {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret, authorization: "Basic " + btoa(keyId + ":" + keySecret) };
}

async function razorpayRequest(path: string, method = "GET", body?: Record<string, unknown>) {
  const credentials = getGatewayCredentials();
  if (!credentials) return { ok: false, status: 503, data: null as Record<string, unknown> | null };

  try {
    const response = await fetch("https://api.razorpay.com/v1" + path, {
      method,
      headers: {
        Authorization: credentials.authorization,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => null) as Record<string, unknown> | null;
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 502, data: null };
  }
}

async function verifyCapturedPayment(
  supabase: SupabaseClient,
  orderId: string,
  paymentId: string,
) {
  const { data: intent, error } = await supabase
    .from("guest_payment_intents")
    .select("id,amount_paise,razorpay_order_id,payment_status")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (error || !intent) return { error: "We couldn't find this payment. Please contact the canteen.", status: 404 };
  if (intent.payment_status !== "pending" && intent.payment_status !== "paid") {
    return { error: "This payment is no longer available. Please start checkout again.", status: 409 };
  }

  const firstCheck = await razorpayRequest("/payments/" + encodeURIComponent(paymentId));
  if (!firstCheck.ok || !firstCheck.data) {
    return { error: "We couldn't confirm the payment yet. Please try again.", status: 502 };
  }

  let payment = firstCheck.data as RazorpayPayment;
  if (
    payment.id !== paymentId ||
    payment.order_id !== orderId ||
    payment.amount !== Number(intent.amount_paise) ||
    payment.currency !== "INR"
  ) {
    return { error: "The payment details did not match this order.", status: 400 };
  }

  if (payment.status === "authorized" && payment.captured !== true) {
    const capture = await razorpayRequest(
      "/payments/" + encodeURIComponent(paymentId) + "/capture",
      "POST",
      { amount: Number(intent.amount_paise), currency: "INR" },
    );
    if (capture.ok && capture.data) {
      payment = capture.data as RazorpayPayment;
    } else {
      const refreshed = await razorpayRequest("/payments/" + encodeURIComponent(paymentId));
      if (refreshed.ok && refreshed.data) payment = refreshed.data as RazorpayPayment;
    }
  }

  if (payment.status !== "captured" || payment.captured !== true) {
    return { error: "Your payment has not been captured yet. No order was placed.", status: 409 };
  }

  return { intent, payment };
}

async function finalizePaidOrder(
  supabase: SupabaseClient,
  orderId: string,
  paymentId: string,
) {
  const { data, error } = await supabase.rpc("finalize_guest_payment", {
    p_razorpay_order_id: orderId,
    p_razorpay_payment_id: paymentId,
  });
  if (error || !data) {
    const mapped = publicOrderError(error?.message ?? "");
    return { error: mapped.message, status: mapped.status };
  }
  return { order: data as Record<string, unknown> };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Order service is not configured yet." }, 503);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const webhookSignature = req.headers.get("x-razorpay-signature");
  if (webhookSignature) {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret) return json({ error: "Payment notifications are not configured yet." }, 503);

    const rawBody = await req.text();
    const expectedSignature = await hmacHex(webhookSecret, rawBody);
    if (!safeEqual(expectedSignature, webhookSignature.toLowerCase())) {
      return json({ error: "Invalid payment notification." }, 401);
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return json({ error: "Invalid payment notification." }, 400);
    }

    if (event.event !== "payment.captured") return json({ received: true });

    const payload = event.payload as Record<string, unknown> | undefined;
    const paymentContainer = payload?.payment as Record<string, unknown> | undefined;
    const payment = paymentContainer?.entity as RazorpayPayment | undefined;
    if (!payment?.id || !payment.order_id || !razorpayPaymentPattern.test(payment.id) ||
        !razorpayOrderPattern.test(payment.order_id)) {
      return json({ error: "Invalid payment notification." }, 400);
    }

    const check = await verifyCapturedPayment(supabase, payment.order_id, payment.id);
    if ("error" in check) return json({ error: check.error }, check.status);
    const result = await finalizePaidOrder(supabase, payment.order_id, payment.id);
    if ("error" in result) return json({ error: result.error }, result.status);
    return json({ received: true });
  }

  const payload = await req.json().catch(() => null);
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json({ error: "Invalid request." }, 400);
  }
  const body = payload as Record<string, unknown>;

  if (body.action === "create-payment") {
    const credentials = getGatewayCredentials();
    if (!credentials) return json({ error: "Online payment is not configured yet." }, 503);

    const canteenId = typeof body.canteenId === "string" ? body.canteenId : "";
    const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 80) : "";
    const rawItems = body.items;
    if (!uuidPattern.test(canteenId) || !Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 30) {
      return json({ error: "Your cart is empty or invalid. Refresh the menu and try again." }, 400);
    }

    const { data: paymentAccount, error: accountError } = await supabase
      .from("canteen_payment_accounts")
      .select("razorpay_linked_account_id")
      .eq("canteen_id", canteenId)
      .maybeSingle();
    const linkedAccountId = typeof paymentAccount?.razorpay_linked_account_id === "string"
      ? paymentAccount.razorpay_linked_account_id
      : "";
    if (accountError || !/^acc_[A-Za-z0-9]+$/.test(linkedAccountId)) {
      return json({ error: "Online payments are not configured for this stall yet." }, 503);
    }

    const trackingToken = makeToken();
    const { data: intentData, error: intentError } = await supabase.rpc("create_guest_payment_intent", {
      p_canteen_id: canteenId,
      p_items: rawItems,
      p_customer_name: customerName,
      p_guest_token_hash: await hashToken(trackingToken),
    });

    if (intentError || !intentData) {
      const mapped = publicOrderError(intentError?.message ?? "");
      return json({ error: mapped.message }, mapped.status);
    }

    const intent = intentData as { id?: string; amount_paise?: number; currency?: string };
    if (!intent.id || !uuidPattern.test(intent.id) || !Number.isSafeInteger(intent.amount_paise) || !intent.amount_paise || intent.amount_paise < 1) {
      return json({ error: "We couldn't prepare the payment. Please try again." }, 500);
    }

    const gatewayOrder = await razorpayRequest("/orders", "POST", {
      amount: intent.amount_paise,
      currency: "INR",
      receipt: intent.id,
      notes: { canteen_id: canteenId },
      transfers: [{
        account: linkedAccountId,
        amount: intent.amount_paise,
        currency: "INR",
      }],
    });

    const gatewayOrderId = typeof gatewayOrder.data?.id === "string" ? gatewayOrder.data.id : "";
    if (!gatewayOrder.ok || !razorpayOrderPattern.test(gatewayOrderId) ||
        gatewayOrder.data?.amount !== intent.amount_paise || gatewayOrder.data?.currency !== "INR") {
      await supabase.from("guest_payment_intents")
        .update({ payment_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", intent.id);
      return json({ error: "We couldn't start secure payment. Please try again." }, 502);
    }

    const { data: attached, error: attachError } = await supabase.rpc("attach_razorpay_order", {
      p_intent_id: intent.id,
      p_razorpay_order_id: gatewayOrderId,
    });
    if (attachError || attached !== true) {
      return json({ error: "We couldn't secure the payment session. Please try again." }, 500);
    }

    return json({
      keyId: credentials.keyId,
      payment: {
        orderId: gatewayOrderId,
        amount: intent.amount_paise,
        currency: "INR",
      },
      trackingToken,
    });
  }

  if (body.action === "verify-payment") {
    const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
    const credentials = getGatewayCredentials();

    if (!credentials) return json({ error: "Online payment is not configured yet." }, 503);
    if (!razorpayOrderPattern.test(orderId) || !razorpayPaymentPattern.test(paymentId) || !/^[0-9a-f]{64}$/i.test(signature)) {
      return json({ error: "The payment response is invalid. Please try again." }, 400);
    }

    const expectedSignature = await hmacHex(credentials.keySecret, orderId + "|" + paymentId);
    if (!safeEqual(expectedSignature, signature.toLowerCase())) {
      return json({ error: "We couldn't verify this payment. No order was placed.", }, 400);
    }

    const check = await verifyCapturedPayment(supabase, orderId, paymentId);
    if ("error" in check) return json({ error: check.error }, check.status);

    const result = await finalizePaidOrder(supabase, orderId, paymentId);
    if ("error" in result) return json({ error: result.error }, result.status);
    return json({ order: result.order });
  }

  if (body.action === "track") {
    const trackingToken = typeof body.trackingToken === "string" ? body.trackingToken : "";
    if (!tokenPattern.test(trackingToken)) {
      return json({ error: "This tracking link is invalid. Use the link from your order confirmation." }, 400);
    }

    const guestTokenHash = await hashToken(trackingToken);
    const { data, error } = await supabase
      .from("orders")
      .select("id,canteen_id,order_number,items,total,status,customer_name,queue_position,estimated_wait_minutes,created_at,updated_at")
      .eq("guest_token_hash", guestTokenHash)
      .maybeSingle();

    if (error) return json({ error: "We couldn't load this order right now. Please try again." }, 500);
    if (!data) return json({ error: "We couldn't find this order. Check that you opened the correct tracking link." }, 404);
    return json({ order: data });
  }

  if (body.action === "create") {
    return json({ error: "Online payment is required before an order can be placed." }, 410);
  }

  return json({ error: "Unknown order action." }, 400);
});
