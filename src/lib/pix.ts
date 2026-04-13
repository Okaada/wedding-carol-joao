import QRCode from "qrcode";
import type { PixSettings } from "@/data/types";

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

function normalizeAscii(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export function generatePixPayload(settings: PixSettings): string {
  const gui = tlv("00", "br.gov.bcb.pix");
  const key = tlv("01", settings.keyValue);
  const merchantAccount = tlv("26", gui + key);

  const name = normalizeAscii(settings.recipientName).substring(0, 25);
  const city = normalizeAscii(settings.city).substring(0, 15);

  let payload = "";
  payload += tlv("00", "01"); // Payload Format Indicator
  payload += merchantAccount;
  payload += tlv("52", "0000"); // Merchant Category Code
  payload += tlv("53", "986"); // Transaction Currency (BRL)
  payload += tlv("58", "BR"); // Country Code
  payload += tlv("59", name);
  payload += tlv("60", city);
  payload += tlv("62", tlv("05", "***")); // Additional data

  // CRC16 placeholder
  payload += "6304";
  const checksum = crc16(payload);
  payload += checksum;

  return payload;
}

export async function generatePixQrCodeDataUrl(
  settings: PixSettings,
): Promise<string> {
  const payload = generatePixPayload(settings);
  return QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    color: { dark: "#2c2c2c", light: "#faf8f5" },
  });
}
