import Image from "next/image";
import { GalleryPhoto } from "@/data/types";

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  return (
    <section id="galeria" className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 text-center font-[family-name:var(--font-playfair)] text-4xl font-bold text-foreground">
          Galeria
        </h2>
        <p className="mx-auto mb-12 max-w-lg text-center text-muted">
          Alguns dos nossos momentos favoritos juntos.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="group relative aspect-square overflow-hidden rounded-lg"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
