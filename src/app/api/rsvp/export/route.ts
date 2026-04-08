import { auth } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response("Não autorizado", { status: 401 });
  }

  const client = await getMongoClient();
  const rsvps = await client
    .db("carol-joao")
    .collection("rsvp")
    .find()
    .sort({ submittedAt: -1 })
    .toArray();

  const csv = toCsv(
    ["Nome", "Celular", "Data de Confirmação"],
    rsvps.map((r) => [
      r.name as string,
      r.cellphone as string,
      r.submittedAt as string,
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=confirmacoes.csv",
    },
  });
}
