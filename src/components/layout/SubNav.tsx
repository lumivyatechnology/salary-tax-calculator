"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SubNavItem } from "@/config/navigation";

interface SubNavProps {
  items: SubNavItem[];
  className?: string;
}

export function SubNav({ items, className }: SubNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex gap-1 overflow-x-auto border-b bg-muted/30 px-4 py-2",
        className
      )}
    >
      {items.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={cn(
            "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === item.path
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
