interface NavbarProps {
  onNavigateCatalog: () => void;
}

export function Navbar({ onNavigateCatalog }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 h-16 bg-black border-b border-white/10">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between gap-8">
        <a
          href="#inicio"
          className="font-display text-lg font-semibold tracking-wide text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4A853]"
        >
          Krono Atelier
        </a>

        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400"
        >
          <a
            href="#inicio"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#D4A853]"
          >
            Inicio
          </a>
          <a
            href="#exhibicion"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#D4A853]"
          >
            Exhibición 3D
          </a>
          <a
            href="#catalogo"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#D4A853]"
          >
            Catálogo
          </a>
          <a
            href="#acabados"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#D4A853]"
          >
            Materiales
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onNavigateCatalog}
            className="px-4 py-2 text-xs font-medium text-black bg-[#D4A853] hover:bg-[#E0B866] rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A853]"
          >
            Ver colección
          </button>
        </div>
      </div>
    </header>
  );
}
