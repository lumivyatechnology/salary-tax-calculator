"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainModules, type NavModule } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        }
      />
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 font-semibold"
            >
              MicroApps
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {mainModules.map((module) => (
              <MobileNavModule
                key={module.path}
                module={module}
                currentPath={pathname}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

interface MobileNavModuleProps {
  module: NavModule;
  currentPath: string;
  onNavigate: () => void;
}

function MobileNavModule({
  module,
  currentPath,
  onNavigate,
}: MobileNavModuleProps) {
  const isActive = currentPath.startsWith(module.path);
  const Icon = module.icon;

  return (
    <li>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{module.label}</span>
      </div>

      {/* Always show sub-nav items */}
      {module.subNav && (
        <ul className="ml-4 mt-1 space-y-1 border-l pl-4">
          {module.subNav.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                onClick={onNavigate}
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
