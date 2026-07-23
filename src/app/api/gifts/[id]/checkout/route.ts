import { getMongoClient } from "@/lib/mongodb";
import { releaseExpiredReservations } from "@/lib/gifts";
import {
  getMercadopagoCheckoutProEnabled,
  getMercadopagoPaymentLink,
} from "@/lib/settings";
import {
  attachMpPreference,
  createPendingPayment,
} from "@/lib/pending-payments";
import { getPreferenceClient, isMercadopagoConfigured } from "@/lib/mercadopago";
import type { BuyerInfo } from "@/data/types";
import { ObjectId } from "mongodb";
import { ensureSecurityIndexes } from "@/lib/auth-utils";
import {
  checkRate,
  countActiveReservationsByIp,
  getClientIp,
} from "@/lib/rate-limit";

/**
 * Attempts a Mercado Pago Checkout Pro Preference for this pending payment.
 * Returns the init_point URL on success, or null on ANY failure — the caller
 * always has the open-link response as a safe fallback. Never throws.
 */
async function tryCreateCheckoutProPreference({
  pendingId,
  giftId,
  giftName,
  amount,
}: {
  pendingId: string;
  giftId: string;
  giftName: string;
  amount: number;
}): Promise<string | null> {
  try {
    const enabled = await getMercadopagoCheckoutProEnabled();
    if (!enabled || !isMercadopagoConfigured()) return null;

    const preferenceClient = getPreferenceClient();
    if (!preferenceClient) return null;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: giftId,
            title: giftName,
            quantity: 1,
            unit_price: amount,
            currency_id: "BRL",
          },
        ],
        external_reference: pendingId,
        ...(baseUrl && {
          notification_url: `${baseUrl}/api/webhooks/mercadopago`,
          back_urls: {
            success: `${baseUrl}/presentes/obrigado`,
            failure: `${baseUrl}/presentes`,
            pending: `${baseUrl}/presentes`,
          },
          auto_return: "approved",
        }),
      },
    });

    if (!preference.init_point) return null;

    if (preference.id) {
      await attachMpPreference(pendingId, preference.id);
    }

    return preference.init_point;
  } catch (err) {
    console.error(
      `[checkout-pro] Preference creation failed for gift ${giftId}, pending ${pendingId}:`,
      err,
    );
    return null;
  }
}

const MAX_BUYER_NAMES = 20;
const MAX_NAME_LENGTH = 80;
const MAX_BODY_BYTES = 8 * 1024;
const RATE_MAX = 10;
const RATE_WINDOW_SECONDS = 10 * 60;
const RESERVATION_WINDOW_SECONDS = 30 * 60;
const MAX_ACTIVE_RESERVATIONS_PER_IP = 5;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureSecurityIndexes();

  const ip = getClientIp(request);
  const rate = await checkRate({
    key: `${ip}:checkout`,
    max: RATE_MAX,
    windowSeconds: RATE_WINDOW_SECONDS,
  });
  if (!rate.allowed) {
    return Response.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
      { status: 429 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Requisição muito grande." }, { status: 400 });
  }

  const { id } = await params;

  let buyerName: string | null = null;
  let buyerType: string | null = null;
  let buyerNames: string[] | null = null;
  try {
    const body = await request.json();
    buyerName = (body.buyerName as string)?.trim() || null;
    buyerType = body.buyerType || null;
    buyerNames = body.buyerNames || null;
  } catch {
    // Body is optional for backwards compatibility
  }

  if (buyerName && buyerName.length > MAX_NAME_LENGTH) {
    return Response.json({ error: "Nome muito longo." }, { status: 400 });
  }
  if (buyerNames !== null) {
    if (!Array.isArray(buyerNames)) {
      return Response.json({ error: "Lista de nomes inválida." }, { status: 400 });
    }
    if (buyerNames.length > MAX_BUYER_NAMES) {
      return Response.json({ error: "Muitos nomes informados." }, { status: 400 });
    }
    if (buyerNames.some((n) => typeof n !== "string" || n.length > MAX_NAME_LENGTH)) {
      return Response.json({ error: "Algum nome é inválido." }, { status: 400 });
    }
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return Response.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  await releaseExpiredReservations();

  const client = await getMongoClient();
  const collection = client.db("carol-joao").collection("gifts");

  const gift = await collection.findOne({ _id: objectId });
  if (!gift) {
    return Response.json({ error: "Presente não encontrado." }, { status: 404 });
  }

  const buyerInfo: BuyerInfo | null =
    buyerName && buyerType && ["individual", "couple", "group"].includes(buyerType)
      ? {
          buyerType: buyerType as BuyerInfo["buyerType"],
          buyerName,
          buyerNames: buyerNames ?? [buyerName],
        }
      : null;

  if (gift.singlePurchase === true) {
    if (ip !== "unknown") {
      const active = await countActiveReservationsByIp(
        ip,
        RESERVATION_WINDOW_SECONDS,
      );
      if (active >= MAX_ACTIVE_RESERVATIONS_PER_IP) {
        return Response.json(
          {
            error:
              "Você já tem reservas em aberto. Conclua o pagamento antes de reservar outro presente.",
          },
          { status: 429 },
        );
      }
    }

    const reservation = await collection.findOneAndUpdate(
      { _id: objectId, status: "available" },
      {
        $set: {
          status: "reserved",
          reservedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(buyerInfo && {
            buyerName: buyerInfo.buyerName,
            buyerType: buyerInfo.buyerType,
            buyerNames: buyerInfo.buyerNames,
          }),
        },
      },
      { returnDocument: "after" },
    );

    if (!reservation) {
      return Response.json(
        { error: "Este presente já foi reservado." },
        { status: 409 },
      );
    }
  }

  const amount = (gift.price as number) / 100;

  const pendingId = await createPendingPayment({
    giftId: id,
    buyerInfo: buyerInfo ?? {
      buyerType: "individual",
      buyerName: "",
      buyerNames: [],
    },
    amount,
    ip,
  });

  const checkoutUrl = await tryCreateCheckoutProPreference({
    pendingId,
    giftId: id,
    giftName: gift.name as string,
    amount,
  });

  if (checkoutUrl) {
    return Response.json({ checkoutUrl, amount, pendingId });
  }

  const paymentLinkUrl = getMercadopagoPaymentLink();

  return Response.json({ paymentLinkUrl, amount, pendingId });
}
