const MATERIAL_PILLARS = [
  {
    index: '01.',
    title: 'Aluminio y Titanio Cepillado',
    detail:
      'Mecanizado CNC de tolerancia milimétrica con anodizado profundo que preserva el grano direccional del metal bajo luz tenue.',
  },
  {
    index: '02.',
    title: 'Latón y Cobre Sólido',
    detail:
      'Componentes torneados en aleaciones cálidas sin recubrimientos sintéticos, aportando equilibrio físico y contraste acústico.',
  },
  {
    index: '03.',
    title: 'Gres Basalto y Zafiro Óptico',
    detail:
      'Cerámica vitrificada a alta temperatura combinada con cristales minerales de baja distorsión para una durabilidad permanente.',
  },
];

export function MaterialsSection() {
  return (
    <section id="acabados" className="py-16 lg:py-20 bg-[#08080A]">
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="max-w-xl space-y-2">
          <span className="block text-xs text-zinc-400 tracking-wide">
            Materia Prima
          </span>
          <h2
            className="font-display text-2xl sm:text-3xl font-semibold text-white tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Materiales y Acabados
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2 border-t border-white/10">
          {MATERIAL_PILLARS.map((item) => (
            <div key={item.index} className="pt-4 space-y-2.5">
              <h3 className="font-display text-base font-semibold text-white">
                {item.index} {item.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
