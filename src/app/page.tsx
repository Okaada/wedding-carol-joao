import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Timeline from "@/components/Timeline";
import PhotoGallery from "@/components/PhotoGallery";
import RsvpForm from "@/components/RsvpForm";
import { coupleData } from "@/data/couple";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero data={coupleData.hero} />
        <Timeline events={coupleData.timeline} />
        <PhotoGallery photos={coupleData.gallery} />
        <section id="rsvp" className="bg-section-alt py-20">
          <div className="mx-auto max-w-md px-6">
            <h2 className="mb-2 text-center font-[family-name:var(--font-playfair)] text-3xl text-foreground">
              Confirmar Presença
            </h2>
            <p className="mb-10 text-center text-sm text-muted">
              Confirme sua presença até 15 de outubro de 2026.
            </p>
            <RsvpForm />
          </div>
        </section>
      </main>
      <footer className="bg-section-alt py-10 text-center">
        <p className="font-[family-name:var(--font-playfair)] text-lg text-foreground">
          Carol &amp; João
        </p>
        <p className="mt-1 text-sm text-muted">
          {coupleData.hero.date}
        </p>
      </footer>
    </>
  );
}
