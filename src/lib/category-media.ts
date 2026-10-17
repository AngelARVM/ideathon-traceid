import type { Category } from "@/generated/prisma/enums";

// Imágenes por categoría (M6, F5): el modelo no tiene fotos por oferta. Son locales, en
// `public/images/categories/`, descargadas una vez de las que usaba codigo-ui (Unsplash).

export const CATEGORY_IMAGE: Record<Category, { src: string; alt: string }> = {
  cascarilla_arroz: {
    src: "/images/categories/cascarilla_arroz.jpg",
    alt: "Granos de arroz a granel",
  },
  chips_forestales: {
    src: "/images/categories/chips_forestales.jpg",
    alt: "Bosque de pinos",
  },
  aserrin_virutas: {
    src: "/images/categories/aserrin_virutas.jpg",
    alt: "Copas de pinos vistas desde abajo",
  },
  biomasa_pellets: {
    src: "/images/categories/biomasa_pellets.jpg",
    alt: "Manos sosteniendo tierra con un brote",
  },
  orujos_bagazos: {
    src: "/images/categories/orujos_bagazos.jpg",
    alt: "Mandarina con hojas",
  },
};
