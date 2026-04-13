import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function getConfig() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  }
  return new MercadoPagoConfig({ accessToken });
}

export function getPreferenceClient() {
  return new Preference(getConfig());
}

export function getPaymentClient() {
  return new Payment(getConfig());
}
