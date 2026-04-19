import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Obrigado! — Carol & João",
};

export default function ObrigadoPage() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center bg-background px-6 pt-20">
        <div className="max-w-md text-center">
          <h1 className="mb-4 font-[family-name:var(--font-playfair)] text-4xl font-bold text-foreground">
            Obrigado!
          </h1>
          <p className="mb-8 text-muted">
            Seu presente foi confirmado com sucesso. Agradecemos de coração pela
            sua generosidade!
          </p>
          <Link
            href="/presentes"
            className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-light"
          >
            Voltar para a lista
          </Link>
        </div>
      </div>
    </>
  );
}
