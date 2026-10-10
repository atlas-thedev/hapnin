import type { Category } from "./types";

export const CATEGORIES: Record<Category, { label: string; color: string; emoji: string }> = {
  sports: { label: "Sports", color: "#ff7a2f", emoji: "🏃" },
  debate: { label: "Debate", color: "#ff5ca8", emoji: "🎤" },
  tech: { label: "Tech", color: "#4de1ff", emoji: "💻" },
  music: { label: "Music", color: "#ffc93d", emoji: "🎻" },
  arts: { label: "Arts", color: "#b78cff", emoji: "🎨" },
  science: { label: "Science", color: "#d7ff3d", emoji: "🔬" },
  drama: { label: "Drama", color: "#ff4d4d", emoji: "🎭" },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export const COVERS = ["track", "debate", "ict", "cricket", "concert", "science", "art", "drama", "royal", "regatta"].map((n) => `/img/${n}.webp`);

export const thumb = (cover: string) => (cover.startsWith("/img/") ? cover.replace(/\.webp$/, "-sm.webp") : cover);
