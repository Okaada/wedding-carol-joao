"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  confirmPendingPayment,
  cancelPendingPayment,
} from "@/lib/pending-payments";

export type PendingActionResult = { success: boolean; error?: string };

export async function confirmPendingPaymentAction(
  pendingId: string,
): Promise<PendingActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Não autorizado." };

  const result = await confirmPendingPayment(pendingId);
  if (result.success) {
    revalidatePath("/admin/pending-payments");
    revalidatePath("/admin/gifts");
  }
  return result;
}

export async function cancelPendingPaymentAction(
  pendingId: string,
): Promise<PendingActionResult> {
  const session = await auth();
  if (!session) return { success: false, error: "Não autorizado." };

  const result = await cancelPendingPayment(pendingId);
  if (result.success) {
    revalidatePath("/admin/pending-payments");
    revalidatePath("/admin/gifts");
  }
  return result;
}
