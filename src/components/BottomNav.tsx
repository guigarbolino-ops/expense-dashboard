"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PieChart, ListFilter, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: PieChart },
    { href: "/history", label: "Historial", icon: ListFilter },
    { href: "/ai", label: "Asistente", icon: Sparkles },
  ];

  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto bg-[#232429] text-white p-1.5 rounded-full shadow-2xl border border-white/10 flex items-center justify-between w-full max-w-sm backdrop-blur-md">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-full text-xs font-medium transition-all duration-300 text-center",
                isActive
                  ? "bg-white/15 text-white shadow-inner font-semibold scale-105"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-transform duration-200",
                  isActive ? "text-indigo-300" : "text-gray-400"
                )}
              />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
