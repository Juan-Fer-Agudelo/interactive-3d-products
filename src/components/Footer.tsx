export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2">
          <a
            href="#exhibicion"
            className="font-display text-base font-semibold tracking-wide text-white inline-block"
          >
            Krono Atelier
          </a>
          <p className="text-sm text-zinc-400 max-w-md">
            Objetos de diseño industrial en serie limitada. Exhibición digital en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
          <a
            href="#exhibicion"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap"
          >
            Exhibición 3D
          </a>
          <a
            href="#catalogo"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap"
          >
            Catálogo
          </a>
          <a
            href="#acabados"
            className="hover:text-white transition-colors duration-150 whitespace-nowrap"
          >
            Materiales
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <span>© 2026 Krono Atelier. Todos los derechos reservados.</span>
          <span>Edición en Modo Oscuro</span>
        </div>
      </div>
    </footer>
  );
}
