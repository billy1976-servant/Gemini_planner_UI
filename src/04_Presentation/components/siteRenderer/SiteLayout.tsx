"use client";

import { CompiledSiteModel, NavItem as NavItemType } from "@/lib/siteCompiler/types";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SiteLayoutProps {
  model: CompiledSiteModel;
  currentPath: string;
  children: React.ReactNode;
}

export default function SiteLayout({
  model,
  currentPath,
  children,
}: SiteLayoutProps) {
  const pathname = usePathname();
  const siteBasePath = `/sites/${model.domain}`;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={siteBasePath} className="text-2xl font-bold text-gray-900">
              {model.brand.name}
            </Link>
            <div className="flex gap-6">
              {model.navigation.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  currentPath={currentPath}
                  siteBasePath={siteBasePath}
                />
              ))}
            </div>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{model.brand.name}</h3>
              {model.brand.description && (
                <p className="text-gray-400">{model.brand.description}</p>
              )}
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2">
                {model.navigation.map((item) => (
                  <li key={item.path}>
                    {item.external ? (
                      <a
                        href={item.path}
                        className="text-gray-400 hover:text-white transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={`${siteBasePath}?page=${item.path}`}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">{model.brand.domain}</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© {new Date().getFullYear()} {model.brand.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavItem({
  item,
  currentPath,
  siteBasePath,
}: {
  item: NavItemType;
  currentPath: string;
  siteBasePath: string;
}) {
  const isActive = currentPath === item.path;

  if (item.external) {
    return (
      <a
        href={item.path}
        className={`px-4 py-2 rounded-lg transition-colors ${
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link
      href={`${siteBasePath}?page=${item.path}`}
      className={`px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? "bg-blue-600 text-white"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {item.label}
    </Link>
  );
}
