import { useState } from 'react';
import {
  PRODUCTS,
  type FinishId,
  type ProductItem,
  type ProductModelId,
} from './data/products';
import { Navbar } from './components/Navbar';
import { ExhibitionStage } from './components/ExhibitionStage';
import { CatalogSection } from './components/CatalogSection';
import { MaterialsSection } from './components/MaterialsSection';
import { Footer } from './components/Footer';
import { ProductModal } from './components/ProductModal';

export default function App() {
  const [activeProductId, setActiveProductId] =
    useState<ProductModelId>('monolith-lamp');
  const [activeFinish, setActiveFinish] = useState<FinishId>('obsidiana');
  const [modalProduct, setModalProduct] = useState<ProductItem | null>(null);

  const activeProduct =
    PRODUCTS.find((item) => item.id === activeProductId) ?? PRODUCTS[0];

  const handleInspectIn3D = (id: ProductModelId) => {
    setActiveProductId(id);
    const stage = document.getElementById('exhibicion');
    stage?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleNavigateCatalog = () => {
    const catalog = document.getElementById('catalogo');
    catalog?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08080A] text-zinc-100">
      <Navbar onNavigateCatalog={handleNavigateCatalog} />

      <main className="flex-1">
        <ExhibitionStage
          activeProduct={activeProduct}
          activeFinish={activeFinish}
          onSelectProduct={setActiveProductId}
          onSelectFinish={setActiveFinish}
          onOpenSpecSheet={setModalProduct}
        />

        <CatalogSection
          activeProductId={activeProductId}
          onInspectIn3D={handleInspectIn3D}
          onOpenDetails={setModalProduct}
        />

        <MaterialsSection />
      </main>

      <Footer />

      <ProductModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onInspectIn3D={handleInspectIn3D}
      />
    </div>
  );
}
