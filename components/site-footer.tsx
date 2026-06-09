import { WC_BRAND } from "@/lib/pdf/brand";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[#d4e0ed] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-6 py-8 text-center text-sm text-muted-foreground">
        <p>
          © {year} {WC_BRAND.agencyName}. All rights reserved.
        </p>
        <a
          href={`https://${WC_BRAND.website}`}
          className="text-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {WC_BRAND.website}
        </a>
      </div>
    </footer>
  );
}
