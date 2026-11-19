import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { PRODUCTS, type ProductModelId } from '../data/products';
import { HeroParallaxScene } from '../three/heroParallaxScene';

gsap.registerPlugin(ScrollTrigger);

interface HeroParallaxProps {
  onExploreExhibition: (id: ProductModelId) => void;
  onExploreCatalog: () => void;
}

const PARALLAX_BEATS = [
  {
    index: '01',
    kicker: 'Edición Numerada · Titanio Grado 5',
    title: 'Geometría tallada para permanecer.',
    body: 'Cronógrafo S-04. Un estudio sobre la proporción arquitectónica, la absorción de la luz en superficies oscuras y la precisión mecánica.',
  },
  {
    index: '02',
    kicker: 'Ingeniería de Superficie',
    title: 'Cada bisel responde a la luz.',
    body: 'Caja mecanizada en bloque sólido con acabado cepillado direccional, agujas en tono bronce y esfera de obsidiana mate sin reflejos parásitos.',
  },
  {
    index: '03',
    kicker: 'Despiece Estructural',
    title: 'Arquitectura interior visible.',
    body: 'Cristal de zafiro abombado, subesferas empotradas y corona estriada ensamblados con tolerancias milimétricas.',
  },
];

export function HeroParallax({
  onExploreExhibition,
  onExploreCatalog,
}: HeroParallaxProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinnedRef = useRef<HTMLDivElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const bgGridRef = useRef<HTMLDivElement | null>(null);
  const beatRefs = useRef<Array<HTMLDivElement | null>>([]);

  const sceneRef = useRef<HeroParallaxScene | null>(null);
  const [activeBeat, setActiveBeat] = useState(0);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [contextLost, setContextLost] = useState(false);

  const heroWatch = PRODUCTS.find((p) => p.id === 'chronograph-watch') ?? PRODUCTS[1];

  // Mount dedicated Hero Three.js canvas
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const scene = new HeroParallaxScene(mount, (lost) => setContextLost(lost));
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // GSAP ScrollTrigger Pinned Parallax Choreography
  useEffect(() => {
    const section = sectionRef.current;
    const pinned = pinnedRef.current;
    if (!section || !pinned) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        sceneRef.current?.setScrollProgress(0.2);
        return;
      }

      // Subtle background parallax layer moving slower than scroll
      if (bgGridRef.current) {
        gsap.to(bgGridRef.current, {
          yPercent: -14,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
          },
        });
      }

      // Main ScrollTrigger driving Three.js 3D product & 3-beat parallax text layers
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.85,
        onUpdate: (self) => {
          const p = self.progress;
          setScrollRatio(p);
          sceneRef.current?.setScrollProgress(p);

          const beatIndex = p < 0.34 ? 0 : p < 0.68 ? 1 : 2;
          setActiveBeat(beatIndex);

          // Parallax text beat transitions (compositor-only y + opacity)
          beatRefs.current.forEach((el, idx) => {
            if (!el) return;
            const center = idx === 0 ? 0.14 : idx === 1 ? 0.5 : 0.86;
            const dist = p - center;
            const absDist = Math.abs(dist);
            const opacity =
              idx === 0 && p < 0.14
                ? 1
                : idx === 2 && p > 0.86
                  ? 1
                  : gsap.utils.clamp(0, 1, 1 - Math.max(0, absDist - 0.08) * 4.5);
            const yOffset =
              idx === 0 && p < 0.14
                ? 0
                : idx === 2 && p > 0.86
                  ? 0
                  : -dist * 110;

            gsap.set(el, {
              opacity,
              y: yOffset,
              pointerEvents: opacity > 0.4 ? 'auto' : 'none',
            });
          });
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    sceneRef.current?.setPointerOffset(nx, ny);
  };

  return (
    <section
      id="inicio"
      ref={sectionRef}
      className="relative h-[280vh] bg-[#08080A] border-b border-white/10"
    >
      {/* Sticky Full-Viewport Parallax Stage */}
      <div
        ref={pinnedRef}
        onPointerMove={handlePointerMove}
        className="sticky top-16 h-[calc(100vh-4rem)] min-h-[540px] w-full overflow-hidden"
      >
        {/* Background Layer (Parallax Depth Grid & Radial Studio Glow) */}
        <div
          ref={bgGridRef}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-y-16 inset-x-0 opacity-45"
          style={{
            backgroundImage:
              'radial-gradient(circle at 62% 48%, rgba(212, 168, 83, 0.11), transparent 46%), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '100% 100%, 72px 72px, 72px 72px',
          }}
        />

        {/* Midground Layer: Live Three.js 3D Product Canvas */}
        <div
          ref={canvasMountRef}
          className="absolute inset-x-0 -top-12 h-[65%] lg:top-0 lg:left-[26%] lg:w-[74%] lg:h-full"
          aria-label="Producto protagonista 3D con efecto parallax"
        />

        {/* Subtle legibility gradient on mobile only */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08080A] via-[#08080A]/55 to-transparent lg:hidden"
        />

        {/* Context Lost Fallback */}
        {contextLost && (
          <div className="absolute inset-0 lg:left-[30%] flex items-center justify-center p-8">
            <img
              src={heroWatch.image}
              alt={heroWatch.name}
              referrerPolicy="no-referrer"
              className="max-h-[420px] object-contain rounded-lg opacity-90"
            />
          </div>
        )}

        {/* Foreground Layer: Parallax Editorial Copy Beats */}
        <div className="relative z-10 max-w-7xl mx-auto h-full px-6 flex items-end pb-20 lg:items-center lg:pb-0 pointer-events-none">
          <div className="relative w-full max-w-lg min-h-[260px] sm:min-h-[290px]">
            {PARALLAX_BEATS.map((beat, idx) => (
              <div
                key={beat.index}
                ref={(el) => {
                  beatRefs.current[idx] = el;
                }}
                style={{ opacity: idx === 0 ? 1 : 0 }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 space-y-5 pointer-events-auto"
              >
                <div className="flex items-center gap-2 text-xs text-[#D4A853] tracking-wide">
                  <span className="font-mono">{beat.index}.</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-zinc-400">{beat.kicker}</span>
                </div>

                <h1
                  className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold tracking-tight text-white leading-[1.06]"
                  style={{ textWrap: 'balance' }}
                >
                  {beat.title}
                </h1>

                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-md">
                  {beat.body}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onExploreExhibition('chronograph-watch')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-black bg-[#D4A853] hover:bg-[#E0B866] rounded-md transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A853]"
                  >
                    <span>Inspeccionar en 3D</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={onExploreCatalog}
                    className="px-4 py-2.5 text-xs font-medium text-zinc-200 hover:text-white bg-[#121216] hover:bg-[#1A1A20] border border-white/15 rounded-md transition-colors duration-150 whitespace-nowrap cursor-pointer"
                  >
                    Ver catálogo completo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Scroll Indicator & Progress Hairline */}
        <div className="absolute bottom-6 inset-x-0 z-10 pointer-events-none">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <ArrowDown className="w-3.5 h-3.5 text-[#D4A853]" aria-hidden="true" />
              <span>Desliza para explorar el despiece</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-zinc-400 tabular-nums">
                0{activeBeat + 1} / 03
              </span>
              <div className="w-24 h-[2px] bg-white/15 overflow-hidden rounded-full">
                <div
                  className="h-full bg-[#D4A853] origin-left transition-transform duration-75"
                  style={{ transform: `scaleX(${Math.max(0.08, scrollRatio)})` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
