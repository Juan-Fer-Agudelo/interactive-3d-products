import { useEffect } from 'react';
import { X, Box } from 'lucide-react';
import type { ProductItem, ProductModelId } from '../data/products';

interface ProductModalProps {
  product: ProductItem | null;
  onClose: () => void;
  onInspectIn3D: (id: ProductModelId) => void;
}

export function ProductModal({
  product,
  onClose,
  onInspectIn3D,
}: ProductModalProps) {
  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-xl bg-[#111115] border border-white/15 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Studio Photo */}
          <div className="bg-[#0A0A0D] aspect-[4/3] md:aspect-auto md:h-full">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Specifications */}
          <div className="p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>{product.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{product.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>{product.edition}</span>
                  </div>
                  <h3
                    id="modal-product-title"
                    className="font-display text-xl font-semibold text-white"
                  >
                    {product.name}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar ficha técnica"
                  className="w-10 h-10 -mr-2 -mt-2 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">
                {product.description}
              </p>

              {/* Technical Spec List */}
              <dl className="divide-y divide-white/10 border-y border-white/10 text-xs">
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-zinc-500">Dimensiones</dt>
                  <dd className="font-mono text-zinc-200 tabular-nums">
                    {product.dimensions}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-zinc-500">Peso neto</dt>
                  <dd className="font-mono text-zinc-200 tabular-nums">
                    {product.weight}
                  </dd>
                </div>
                {product.specs.map((spec) => (
                  <div key={spec.label} className="py-2.5 flex justify-between gap-4">
                    <dt className="text-zinc-500">{spec.label}</dt>
                    <dd className="text-zinc-200 text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2">
              <div>
                <span className="block text-[11px] text-zinc-500">Precio</span>
                <span className="font-mono text-xl font-medium text-white tabular-nums">
                  ${product.price.toLocaleString('es-ES')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onInspectIn3D(product.id);
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-black bg-[#D4A853] hover:bg-[#E0B866] rounded-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <Box className="w-4 h-4" aria-hidden="true" />
                <span>Inspeccionar en 3D</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
