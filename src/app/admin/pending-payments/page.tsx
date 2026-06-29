import { listPendingPayments } from "@/lib/pending-payments";
import PendingPaymentActions from "@/components/admin/PendingPaymentActions";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const BUYER_TYPE_LABEL: Record<"individual" | "couple" | "group", string> = {
  individual: "Individual",
  couple: "Casal",
  group: "Grupo",
};

export const dynamic = "force-dynamic";

export default async function PendingPaymentsPage() {
  const rows = await listPendingPayments();

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
        Pagamentos pendentes
      </h1>

      <p className="mb-6 max-w-3xl text-sm text-muted">
        Lista de presentes reservados via Mercado Pago aguardando confirmação manual.
        Cruze a lista com o painel do Mercado Pago e clique em <strong>Confirmar</strong>{" "}
        para registrar a compra ou <strong>Cancelar</strong> para liberar o presente.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-accent/40 bg-section-alt/40 px-6 py-12 text-center text-sm text-muted">
          Nenhum pagamento pendente.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-accent bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-section-alt text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Comprador</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Presente</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-t border-accent/40">
                  <td className="px-4 py-3 text-foreground">
                    {row.buyerInfo.buyerNames.length > 1
                      ? row.buyerInfo.buyerNames.join(", ")
                      : row.buyerInfo.buyerName || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {BUYER_TYPE_LABEL[row.buyerInfo.buyerType]}
                  </td>
                  <td className="px-4 py-3 text-foreground">{row.giftName}</td>
                  <td className="px-4 py-3 text-foreground">
                    {BRL.format(row.amount)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(row.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PendingPaymentActions pendingId={row._id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
