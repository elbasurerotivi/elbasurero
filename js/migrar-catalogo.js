// migrar-catalogo.js
import { videosPremium, categoriasData } from "./js/videos-premium.js";
import { db, ref, set } from "./js/firebase-config.js";

console.log("Migrando videoCatalog...");

// Migrar videos a /videoCatalog
videosPremium.forEach(video => {
  const cleanVideo = {
    id: video.id,
    title: video.title,
    title2: video.title2 || "",
    description: video.description || "",
    category: video.name || "Sin categoría",  // Usamos 'name' como categoría inicial
    temporada: video.temporada || "",
    episodio: video.episodio || "",
    thumbnail: video.thumbnail,
    source: video.source,
    type: video.type
  };

  set(ref(db, `videoCatalog/${video.id}`), cleanVideo)
    .then(() => console.log(`OK: ${video.id}`))
    .catch(err => console.error(`Error ${video.id}:`, err));
});

// Migrar categorías
Object.entries(categoriasData).forEach(([slug, data]) => {
  set(ref(db, `categories/${slug}`), data)
    .then(() => console.log(`Categoría OK: ${slug}`))
    .catch(err => console.error(`Error categoría ${slug}:`, err));
});

console.log("Migración completada.");