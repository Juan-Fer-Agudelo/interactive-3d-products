import { profile } from '../data/profile';

// The whole portfolio as a plain page: what you get when the browser cannot
// draw the meadow, or when you ask for it with ?plano.
export default function Flat() {
  const forced = new URLSearchParams(location.search).has('plano');
  return (
    <main className="flat">
      <p className="flat__notice">estás leyendo la versión plana de mi portafolio 3d.</p>
      <header>
        <h1>hola, soy <em>juan fer</em></h1>
        <p className="flat__role">{profile.role.toLowerCase()} · {profile.location.toLowerCase()}</p>
        {profile.summary.map((t) => <p key={t}>{t}</p>)}
        <p className="flat__actions">
          <a href={`mailto:${profile.email}`}>escríbeme →</a>
          <a href={profile.links.linkedin} target="_blank" rel="noreferrer">linkedin ↗</a>
          <a href={profile.links.github} target="_blank" rel="noreferrer">github ↗</a>
        </p>
      </header>

      <section>
        <h2>trabajo seleccionado</h2>
        <ol className="flat__work">
          {profile.projects.map((p, i) => (
            <li key={p.name}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3>{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.name.toLowerCase()} →</a> : p.name.toLowerCase()}</h3>
                <small>{p.tag.toLowerCase()}</small>
                <p>{p.description}</p>
                <small>{p.stack.join(' · ').toLowerCase()}</small>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2>experiencia</h2>
        {profile.experience.map((e) => (
          <article key={e.company}>
            <h3>{e.role.toLowerCase()} · {e.company}</h3>
            <small>{e.period.toLowerCase()} · {e.place}</small>
            <ul>{e.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
          </article>
        ))}
      </section>

      <section>
        <h2>habilidades</h2>
        {profile.skills.map((s) => <p key={s.group}><b>{s.group.toLowerCase()}:</b> {s.items.join(', ').toLowerCase()}</p>)}
      </section>

      <section>
        <h2>educación</h2>
        <ul>{profile.education.map((e) => <li key={e.title}>{e.title} · {e.school}{e.period ? ` · ${e.period}` : ''}</li>)}</ul>
      </section>

      <footer>
        {forced
          ? <p>la pradera completa, con pasto, clima y un día que se vuelve noche, está <a href="./">al otro lado de esta página</a>.</p>
          : <p>la pradera se dibuja con webgl y este navegador no entregó un lienzo para dibujarla. otro navegador, o este con la aceleración por hardware activada, la hace crecer completa.</p>}
        <p>{profile.name.toLowerCase()}</p>
      </footer>
    </main>
  );
}
