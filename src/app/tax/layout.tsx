import { SubNav } from "@/components/layout/SubNav";
import { mainModules } from "@/config/navigation";

export default function TaxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get tax module sub-nav
  const taxModule = mainModules.find((m) => m.path === "/tax");
  const subNavItems = taxModule?.subNav ?? [];

  return (
    <div className="flex h-full flex-col">
      <SubNav items={subNavItems} />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
    </div>
  );
}
