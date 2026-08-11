import { 
  ShoppingBag, 
  Home, 
  Dog, 
  Car, 
  HeartPulse, 
  Sparkles, 
  Gamepad2, 
  MoreHorizontal,
  Tag,
  LucideIcon
} from "lucide-react";

export function getCategoryIcon(categoryName: string): LucideIcon {
  const norm = (categoryName || "").toLowerCase().trim();

  // 1. Alimentación
  if (norm.includes("alimentac") || norm.includes("comida") || norm.includes("super")) return ShoppingBag;
  
  // 2. Vivienda
  if (norm.includes("vivienda") || norm.includes("casa") || norm.includes("alquiler")) return Home;

  // 3. Mascotas
  if (norm.includes("mascota") || norm.includes("perra")) return Dog;

  // 4. Transporte
  if (norm.includes("transport") || norm.includes("auto") || norm.includes("nafta")) return Car;

  // 5. Salud y cuidado personal
  if (norm.includes("salud") || norm.includes("cuidado") || norm.includes("farmacia")) return HeartPulse;

  // 6. Limpieza
  if (norm.includes("limpieza") || norm.includes("higiene")) return Sparkles;

  // 7. Ocio
  if (norm.includes("ocio") || norm.includes("entretenimiento") || norm.includes("salida")) return Gamepad2;

  // 8. Otros
  if (norm.includes("otro")) return MoreHorizontal;

  return Tag;
}
