import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  AudioWaveform,
  Cog,
  Droplets,
  Flame,
  Gem,
  Hand,
  Hash,
  Lightbulb,
  Scale,
  SlidersHorizontal,
  Speaker,
  Watch,
  Wifi,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { PRODUCTS, type ProductItem, type ProductModelId } from '../data/products';
import { ShowcaseScene } from '../three/showcaseScene';

gsap.registerPlugin(ScrollTrigger);

interface ShowcaseSectionProps {
  onInspectIn3D: (id: ProductModelId) => void;
  onOpenDetails: (product: ProductItem) => void;
}

interface ShowcaseFeature {
  icon: LucideIcon;
  label: string;
}

interface ShowcasePanel {
  productId: ProductModelId;
  accent: string;
  kicker: string;
  title: string;
  description: string;
  features: ShowcaseFeature[];
}

/**
 * One panel per product, following the "title · description · feature tiles · pill CTA"
 * rhythm of the reference page. The accent colour re-tints the CTA, the rail and the
 * 3D rim light when the panel becomes active.
 */
const PANELS: ShowcasePanel[] = [
  {
    productId: 'monolith-lamp',
    accent: '#D4A853',
    kicker: 'Iluminación · Serie Permanente',
    title: 'Luz que se equilibra sola.',
    description:
      'La Lámpara Monolito M-01 sostiene su brazo articulado con un anillo de latón macizo que hace de contrapeso físico. Sin muelles ni fricción visible: solo geometría y masa.',
    features: [
      { icon: Lightbulb, label: 'LED cálido 2700K con CRI 97' },
      { icon: Scale, label: 'Contrapeso de latón torneado' },
      { icon: SlidersHorizontal, label: 'Atenuador táctil continuo' },
      { icon: Cog, label: 'Aluminio 6061 mecanizado CNC' },
    ],
  },
  {
    productId: 'chronograph-watch',
    accent: '#B4C1D3',
    kicker: 'Relojería · Edición Numerada',
    title: 'Un cronógrafo tallado en bloque.',
    description:
      'El S-04 nace de un solo bloque de titanio grado 5. Bisel escalonado, cristal de zafiro abombado y esfera de obsidiana mate: una caja pensada para absorber la luz, no para reflejarla.',
    features: [
      { icon: Watch, label: 'Calibre automático 28.800 vph' },
      { icon: Gem, label: 'Zafiro abombado antirreflejos' },
      { icon: Droplets, label: 'Hermético hasta 10 ATM' },
      { icon: Hash, label: 'Edición numerada y grabada' },
    ],
  },
  {
    productId: 'acoustic-speaker',
    accent: '#D9925F',
    kicker: 'Acústica · Serie Estudio',
    title: 'Sonido guiado por cobre sólido.',
    description:
      'El Altavoz V-08 corona su recinto cilíndrico con una bocina exponencial torneada en cobre. Controla la dispersión de los agudos y elimina resonancias internas sin tratamientos sintéticos.',
    features: [
      { icon: Speaker, label: 'Woofer 5.25" biamplificado' },
      { icon: AudioWaveform, label: 'Respuesta 42 Hz – 24 kHz' },
      { icon: Wifi, label: 'Wi-Fi Lossless, USB-C y Aux' },
      { icon: Cog, label: 'Guía de ondas en cobre mecanizado' },
    ],
  },
  {
    productId: 'ceramic-vessel',
    accent: '#B9C6B0',
    kicker: 'Objetos · Lote Artesanal',
    title: 'Cerámica negra, vapor silencioso.',
    description:
      'El Difusor K-12 se tornea a mano en gres pigmentado con basalto y se remata con un collar de latón y una cúpula de vidrio ahumado. Difusión ultrasónica sin ruido ni calor.',
    features: [
      { icon: Hand, label: 'Torneado a mano en gres de alta densidad' },
      { icon: Flame, label: 'Vitrificado a 1260 °C' },
      { icon: Wind, label: 'Difusión ultrasónica silenciosa' },
    ],
  },
];

const PANEL_COUNT = PANELS.length;

export function ShowcaseSection({ onInspectIn3D, onOpenDetails }: ShowcaseSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ShowcaseScene | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [contextLost, setContextLost] = useState(false);

  const activePanel = PANELS[activeIndex];
  const activeProduct =
    PRODUCTS.find((p) => p.id === activePanel.productId) ?? PRODUCTS[0];

  // Mount the dedicated Three.js showcase canvas once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const scene = new ShowcaseScene(mount, PANELS[0].productId, (lost) =>
      setContextLost(lost),
    );
    scene.setAccentColor(PANELS[0].accent);
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Only run the idle render loop while the section is on screen
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => sceneRef.current?.setRunning(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Scroll choreography: the tall section drives which panel is active, with snapping
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        snap: prefersReducedMotion
          ? undefined
          : {
              snapTo: 1 / (PANEL_COUNT - 1),
              duration: { min: 0.25, max: 0.6 },
              delay: 0.05,
              ease: 'power2.inOut',
            },
        onUpdate: (self) => {
          const next = Math.round(self.progress * (PANEL_COUNT - 1));
          setActiveIndex((prev) => (prev === next ? prev : next));
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // Push the active product + accent into the 3D scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setProduct(activePanel.productId);
    scene.setAccentColor(activePanel.accent);
  }, [activePanel]);

  const scrollToPanel = useCallback((index: number) => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    // The stage stays pinned until the section bottom meets the viewport bottom
    const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
    const target = sectionTop + (travel * index) / (PANEL_COUNT - 1);
    window.scrollTo({ top: target, behavior: 'smooth' });
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    sceneRef.current?.setPointerOffset(nx, ny);
  };

  return (
    <section
      id="coleccion"
      ref={sectionRef}
      aria-label="Colección en escena"
      className="relative bg-[#08080A] border-b border-white/10"
      style={
        {
          height: `${PANEL_COUNT * 100}vh`,
          '--accent': activePanel.accent,
        } as React.CSSProperties
      }
    >
      <div
        ref={stageRef}
        onPointerMove={handlePointerMove}
        className="sticky top-16 h-[calc(100vh-4rem)] min-h-[560px] w-full overflow-hidden"
      >
        {/* Background: faint grid + accent glow that follows the active product */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50 transition-[background] duration-700"
          style={{
            backgroundImage: `radial-gradient(circle at 26% 50%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 42%), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 72px 72px, 72px 72px',
          }}
        />

        {/* Left half: live 3D product */}
        <div
          ref={canvasMountRef}
          aria-label={`${activeProduct.name} en 3D`}
          className="absolute inset-x-0 top-0 h-[38%] lg:inset-y-0 lg:left-0 lg:h-full lg:w-1/2"
        />

        {contextLost && (
          <div className="absolute inset-x-0 top-0 h-[38%] lg:inset-y-0 lg:left-0 lg:h-full lg:w-1/2 flex items-center justify-center p-8">
            <img
              src={activeProduct.image}
              alt={activeProduct.name}
              referrerPolicy="no-referrer"
              className="max-h-[60%] object-contain rounded-lg opacity-90"
            />
          </div>
        )}

        {/* Mobile legibility gradient over the canvas */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[24%] h-[16%] bg-gradient-to-b from-transparent to-[#08080A] lg:hidden"
        />

        {/* Left-column labels: section kicker + oversized index watermark */}
        <div className="pointer-events-none absolute left-6 top-6 lg:left-10 lg:top-10 hidden sm:flex items-center gap-2 text-xs text-zinc-400 tracking-wide">
          <span className="font-mono" style={{ color: 'var(--accent)' }}>
            Colección
          </span>
          <span aria-hidden="true">·</span>
          <span>{PANEL_COUNT} piezas en escena</span>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-6 bottom-6 lg:left-10 lg:bottom-10 font-display font-semibold leading-none text-[5rem] lg:text-[8rem] text-white/[0.05] select-none tabular-nums"
        >
          {String(activeIndex + 1).padStart(2, '0')}
        </div>

        {/* Right half: stacked content panels, one visible at a time */}
        <div className="absolute inset-x-0 bottom-0 top-[38%] lg:inset-y-0 lg:left-1/2 lg:right-0 lg:top-0">
          <div className="relative h-full px-6 pb-8 lg:px-14 lg:pb-0 lg:pr-20">
            {PANELS.map((panel, idx) => {
              const product = PRODUCTS.find((p) => p.id === panel.productId) ?? PRODUCTS[0];
              const isActive = idx === activeIndex;
              const revealCount = 2 + panel.features.length + 1;
              let revealIndex = 0;
              const reveal = () => {
                const i = revealIndex++;
                return { '--i': i, '--n': revealCount } as React.CSSProperties;
              };

              return (
                <div
                  key={panel.productId}
                  className={`showcase-panel absolute inset-0 flex flex-col justify-start pt-2 lg:justify-center lg:pt-0 ${
                    isActive ? 'is-active' : ''
                  }`}
                  style={{ '--accent': panel.accent } as React.CSSProperties}
                  aria-hidden={!isActive}
                >
                  <div className="space-y-3 max-w-xl">
                    <div
                      className="reveal flex items-center gap-2 text-xs tracking-wide text-zinc-400"
                      style={reveal()}
                    >
                      <span className="font-mono" style={{ color: panel.accent }}>
                        {product.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{panel.kicker}</span>
                    </div>

                    <h2
                      className="reveal font-display text-2xl sm:text-4xl lg:text-[2.9rem] font-semibold tracking-tight text-white leading-[1.08]"
                      style={{ ...reveal(), textWrap: 'balance' }}
                    >
                      {panel.title}
                    </h2>

                    <p
                      className="reveal text-sm sm:text-base text-zinc-300 leading-relaxed max-w-lg"
                      style={reveal()}
                    >
                      {panel.description}
                    </p>
                  </div>

                  <div className="mt-5 lg:mt-9 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
                    {panel.features.map((feature) => {
                      const Icon = feature.icon;
                      return (
                        <div
                          key={feature.label}
                          className="reveal flex items-center gap-3 sm:block sm:space-y-2"
                          style={reveal()}
                        >
                          <div className="flex items-center justify-center shrink-0 w-11 h-11 rounded-xl bg-[#141418] border border-white/[0.06] sm:w-full sm:max-w-[96px] sm:h-auto sm:aspect-square sm:rounded-2xl">
                            <Icon
                              className="w-6 h-6"
                              strokeWidth={1.5}
                              style={{ color: panel.accent }}
                              aria-hidden="true"
                            />
                          </div>
                          <p className="text-xs leading-snug text-zinc-400">{feature.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="reveal mt-6 lg:mt-10 flex flex-wrap items-center gap-3" style={reveal()}>
                    <button
                      type="button"
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => onInspectIn3D(panel.productId)}
                      className="pill-cta inline-flex items-center gap-2 h-12 px-8 text-xs font-semibold tracking-wide text-black cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{ outlineColor: panel.accent }}
                    >
                      <span className="relative z-10">Inspeccionar en 3D</span>
                      <ArrowRight className="relative z-10 w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => onOpenDetails(product)}
                      className="h-12 px-6 text-xs font-medium text-zinc-200 hover:text-white border border-white/15 hover:border-white/30 rounded-full transition-colors duration-150 cursor-pointer"
                    >
                      Ficha técnica
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right rail: panel navigation dots */}
        <nav
          aria-label="Navegación de la colección"
          className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-center gap-3"
        >
          {PANELS.map((panel, idx) => {
            const product = PRODUCTS.find((p) => p.id === panel.productId);
            const isActive = idx === activeIndex;
            return (
              <button
                key={panel.productId}
                type="button"
                onClick={() => scrollToPanel(idx)}
                aria-label={`Ir a ${product?.name ?? panel.productId}`}
                aria-current={isActive ? 'true' : undefined}
                className="group relative w-6 h-6 flex items-center justify-center cursor-pointer"
              >
                <span
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width: isActive ? 8 : 6,
                    height: isActive ? 8 : 6,
                    backgroundColor: isActive ? panel.accent : 'rgba(255,255,255,0.28)',
                    boxShadow: isActive ? `0 0 0 4px color-mix(in srgb, ${panel.accent} 22%, transparent)` : 'none',
                  }}
                />
              </button>
            );
          })}
        </nav>

        {/* Bottom progress hairline */}
        <div className="absolute top-6 right-6 lg:top-auto lg:bottom-6 lg:right-10 flex items-center gap-3 pointer-events-none">
          <span className="font-mono text-xs text-zinc-400 tabular-nums">
            {String(activeIndex + 1).padStart(2, '0')} / {String(PANEL_COUNT).padStart(2, '0')}
          </span>
          <div className="w-24 h-[2px] bg-white/15 overflow-hidden rounded-full">
            <div
              className="h-full origin-left transition-transform duration-500 ease-out"
              style={{
                backgroundColor: activePanel.accent,
                transform: `scaleX(${(activeIndex + 1) / PANEL_COUNT})`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
