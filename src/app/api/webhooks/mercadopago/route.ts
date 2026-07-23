import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";
import { getPaymentClient } from "@/lib/mercadopago";
import { confirmPendingPayment } from "@/lib/pending-payments";
import { checkRate, getClientIp } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_MAX = 60;
const RATE_WINDOW_SECONDS = 60;
// Reject signatures older than this to mitigate replay of a captured request.
const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRate({
    key: `${ip}:mp-webhook`,
    max: RATE_MAX,
    windowSeconds: RATE_WINDOW_SECONDS,
  });
  if (!rate.allowed) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  // Fail closed: an unauthenticated webhook endpoint that "processes anyway"
  // when the secret isn't configured is worse than one that visibly rejects
  // everything until an admin finishes setup.
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET is not set; rejecting all webhook traffic.",
    );
    return Response.json({ error: "Not configured." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Payload too large." }, { status: 400 });
  }

  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id");
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  try {
    WebhookSignatureValidator.validate({
      xSignature,
      xRequestId,
      dataId,
      secret,
      toleranceSeconds: SIGNATURE_TOLERANCE_SECONDS,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      console.warn(
        `[mp-webhook] Signature rejected (${err.reason}) request-id=${err.requestId ?? "?"}`,
      );
      return Response.json({ error: "Invalid signature." }, { status: 401 });
    }
    throw err;
  }

  let body: { type?: string; topic?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Some MP notifications carry no useful body beyond the query string;
    // that's fine, data.id from the query string is authoritative.
  }

  if (body.type && body.type !== "payment" && body.topic !== "payment") {
    // Not a payment event (e.g. merchant_order) — ack fast, nothing to do.
    return Response.json({ received: true });
  }

  if (!dataId) {
    return Response.json({ received: true });
  }

  const paymentClient = getPaymentClient();
  if (!paymentClient) {
    // Token got unset between signature setup and now — nothing we can do.
    console.error("[mp-webhook] Signature valid but no access token configured.");
    return Response.json({ received: true });
  }

  let payment;
  try {
    payment = await paymentClient.get({ id: dataId });
  } catch (err) {
    console.error("[mp-webhook] Failed to fetch payment from Mercado Pago:", err);
    return Response.json({ error: "Failed to fetch payment" }, { status: 500 });
  }

  if (payment.status !== "approved") {
    return Response.json({ received: true });
  }

  const pendingId = payment.external_reference;
  if (!pendingId) {
    console.warn(`[mp-webhook] Approved payment ${dataId} has no external_reference.`);
    return Response.json({ received: true });
  }

  // confirmPendingPayment is idempotent: a row that's already "confirmed"
  // (duplicate webhook delivery) returns success: false and is a no-op here,
  // not an error worth surfacing to Mercado Pago's retry logic.
  const result = await confirmPendingPayment(pendingId, {
    paymentId: String(payment.id),
  });
  if (!result.success) {
    console.log(
      `[mp-webhook] confirmPendingPayment no-op for ${pendingId}: ${result.error}`,
    );
  }

  return Response.json({ received: true });
}
