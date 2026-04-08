import Link from "next/link";
import GiftForm from "@/components/admin/GiftForm";
import { createGift } from "@/app/actions/admin-gifts";

export default function NewGiftPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/gifts" className="text-sm text-muted hover:text-primary">
          &larr; Voltar
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
          Novo Presente
        </h1>
      </div>
      <GiftForm action={createGift} />
    </div>
  );
}
