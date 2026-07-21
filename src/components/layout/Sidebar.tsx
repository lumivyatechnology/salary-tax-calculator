"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainModules, type NavModule } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r bg-background",
        className
      )}
    >
      {/* Logo/Brand */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">MicroApps</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {mainModules.map((module) => (
            <SidebarModule
              key={module.path}
              module={module}
              currentPath={pathname}
            />
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          Nepal Tax Calculator FY 2083/84
        </p>
      </div>
    </aside>
  );
}

interface SidebarModuleProps {
  module: NavModule;
  currentPath: string;
}

function SidebarModule({ module, currentPath }: SidebarModuleProps) {
  const isActive = currentPath.startsWith(module.path);
  const Icon = module.icon;

  return (
    <li>
      <Link
        href={module.subNav?.[0]?.path ?? module.path}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{module.label}</span>
        {module.subNav && (
          <ChevronRight
            className={cn("h-4 w-4 transition-transform", isActive && "rotate-90")}
          />
        )}
      </Link>

      {/* Sub-navigation */}
      {isActive && module.subNav && (
        <ul className="ml-4 mt-1 space-y-1 border-l pl-4">
          {module.subNav.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={cn(
                  "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                  currentPath === item.path
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
