import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Box, ArrowUpRight } from 'lucide-react';
import {
  CATEGORIES,
  PRODUCTS,
  type ProductCategory,
  type ProductItem,
  type ProductModelId,
} from '../data/products';

gsap.registerPlugin(ScrollTrigger);

interface CatalogSectionProps {
  activeProductId: ProductModelId;
  onInspectIn3D: (id: ProductModelId) => void;
  onOpenDetails: (product: ProductItem) => void;
}

export function CatalogSection({
  activeProductId,
  onInspectIn3D,
  onOpenDetails,
}: CatalogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | ProductCategory>('Todos');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const gridRef = useRef<HTMLDivElement | null>(null);

  const filteredProducts =
    selectedCategory === 'Todos'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === selectedCategory);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from('.catalog-card', {
        y: 20,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          once: true,
        },
      });
    }, grid);

    return () => ctx.revert();
  }, []);

  return (
    <section id="catalogo" className="py-16 lg:py-24 bg-[#08080A] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Catalog Header + Interactive Category Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="block text-xs text-zinc-400 tracking-wide">
              Archivo de Piezas
            </span>
            <h2
              className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Catálogo de Objetos
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Selecciona cualquier pieza para inspeccionar su geometría en el visor 3D o consultar sus especificaciones de fabricación.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filtrar por categoría"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#111114] border border-white/10 rounded-lg self-start md:self-auto"
          >
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A853] ${
                    isSelected
                      ? 'bg-[#D4A853] text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filteredProducts.map((product) => {
            const isSelected3D = product.id === activeProductId;
            const hasBrokenImage = brokenImages[product.id];

            return (
              <article
                key={product.id}
                className={`catalog-card group flex flex-col rounded-xl bg-[#101014] border transition-all duration-200 hover:-translate-y-0.5 ${
                  isSelected3D
                    ? 'border-[#D4A853]/60'
                    : 'border-white/10 hover:border-white/25'
                }`}
              >
                {/* 4:3 Studio Photograph Container */}
                <button
                  type="button"
                  onClick={() => onInspectIn3D(product.id)}
                  className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-[#0D0D10] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D4A853]"
                  aria-label={`Ver ${product.name} en el visor 3D`}
                >
                  {!hasBrokenImage ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [product.id]: true }))
                      }
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#16161B] to-[#0B0B0E] text-center">
                      <Box className="w-8 h-8 text-zinc-600 mb-2" aria-hidden="true" />
                      <span className="text-xs font-medium text-zinc-400">
                        {product.name}
                      </span>
                    </div>
                  )}
                </button>

                {/* Clean Card Body (Zero Pill Badges) */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>{product.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-zinc-500">{product.code}</span>
                    </div>

                    <h3 className="font-display text-base font-semibold text-white">
                      {product.name}
                    </h3>

                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {product.shortDescription}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-medium text-zinc-100 tabular-nums">
                      ${product.price.toLocaleString('es-ES')}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenDetails(product)}
                        className="px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white border border-white/12 hover:border-white/25 rounded transition-colors duration-150 whitespace-nowrap cursor-pointer"
                      >
                        Ficha
                      </button>
                      <button
                        type="button"
                        onClick={() => onInspectIn3D(product.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#D4A853] hover:text-black hover:bg-[#D4A853] border border-[#D4A853]/35 rounded transition-colors duration-150 whitespace-nowrap cursor-pointer"
                      >
                        <span>3D</span>
                        <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
