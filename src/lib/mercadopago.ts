import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

let warnedAboutTestToken = false;

/**
 * Whether a Mercado Pago access token is present in the server environment.
 * Does NOT reveal the token value — safe to pass to client components.
 */
export function isMercadopagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function getConfig(): MercadoPagoConfig | null {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return null;

  if (accessToken.startsWith("TEST-") && !warnedAboutTestToken) {
    warnedAboutTestToken = true;
    console.warn(
      "[mercadopago] MERCADOPAGO_ACCESS_TOKEN is a TEST- token. " +
        "Checkout Pro will run in sandbox mode; payments will not move real money.",
    );
  }

  return new MercadoPagoConfig({ accessToken });
}

/** Returns a Preference client, or null when no access token is configured. */
export function getPreferenceClient(): Preference | null {
  const config = getConfig();
  return config ? new Preference(config) : null;
}

/** Returns a Payment client, or null when no access token is configured. */
export function getPaymentClient(): Payment | null {
  const config = getConfig();
  return config ? new Payment(config) : null;
}
