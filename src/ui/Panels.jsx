import { useState } from 'react';
import { useStore } from '../store';
import { profile } from '../data/profile';
import { projects } from '../world/layout';
import { escape, openPanel } from '../actions';
import { Arrow, Close, Out } from './icons';


function Chips({ items }) {
  return <ul className="chips">{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}

function Project({ id }) {
  const p = projects[id];
  return (
    <>
      <div className="cover" style={{ background: `linear-gradient(135deg, ${p.color}, #2b2233)` }}>
        <span>{String(id + 1).padStart(2, '0')}</span>
        <strong>{p.name}</strong>
      </div>
      <p className="eyebrow">{p.tag}</p>
      <p className="lede">{p.description}</p>
      <h3>Con qué está hecho</h3>
      <Chips items={p.stack} />
      {p.url && <a className="button" href={p.url} target="_blank" rel="noreferrer">Visitar el sitio <Out /></a>}
      <div className="pager">
        <button type="button" onClick={() => openPanel({ type: 'project', id: (id + projects.length - 1) % projects.length })}>← Anterior</button>
        <button type="button" onClick={() => openPanel({ type: 'project', id: (id + 1) % projects.length })}>Siguiente →</button>
      </div>
    </>
  );
}

function About() {
  return (
    <>
      <p className="eyebrow">{profile.location}</p>
      {profile.summary.map((t) => <p key={t} className="lede">{t}</p>)}
      <h3>Resultados</h3>
      <ul className="stats">
        {profile.highlights.map((h) => <li key={h.label}><b>{h.value}</b><span>{h.label}</span></li>)}
      </ul>
      <h3>Me interesa</h3>
      <Chips items={profile.interests} />
    </>
  );
}

function Skills() {
  return (
    <>
      <p className="lede">Lo que uso para construir, medir y automatizar.</p>
      {profile.skills.map((s) => (
        <section key={s.group}>
          <h3>{s.group}</h3>
          <Chips items={s.items} />
        </section>
      ))}
      <h3>Cómo trabajo</h3>
      <ul className="list">{profile.competencies.map((c) => <li key={c}>{c}</li>)}</ul>
    </>
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked: the address is still on screen to select */ }
  };
  return (
    <>
      <p className="lede">¿Tienes un proyecto, una idea para colaborar o una pregunta sobre cómo se hizo algo de esta pradera? El correo es la forma más rápida de encontrarme.</p>
      <div className="mail">
        <a href={`mailto:${profile.email}`}>{profile.email} <Arrow /></a>
        <button type="button" onClick={copy}>{copied ? 'Copiado' : 'Copiar'}</button>
      </div>
      <ul className="links">
        <li><a href={profile.links.linkedin} target="_blank" rel="noreferrer">LinkedIn <Out /></a></li>
        <li><a href={profile.links.github} target="_blank" rel="noreferrer">GitHub <Out /></a></li>
        <li><a href={profile.links.portfolio} target="_blank" rel="noreferrer">Portafolio anterior <Out /></a></li>
        <li><a href={profile.phoneHref}>{profile.phone} <Arrow /></a></li>
      </ul>
      <p className="note">Te respondo.</p>
    </>
  );
}

function Resume() {
  return (
    <>
      <p className="eyebrow">{profile.role}</p>
      <h3>Experiencia</h3>
      {profile.experience.map((e) => (
        <section key={e.company} className="job">
          <header>
            <b>{e.role}</b>
            <span>{e.company} · {e.period}</span>
            <small>{e.place}</small>
          </header>
          <ul className="list">{e.bullets.slice(0, 4).map((b) => <li key={b}>{b}</li>)}</ul>
        </section>
      ))}
      <h3>Educación</h3>
      <ul className="list">
        {profile.education.map((e) => <li key={e.title}><b>{e.title}</b> · {e.school}{e.period ? ` · ${e.period}` : ''}</li>)}
      </ul>
      <h3>Idiomas</h3>
      <Chips items={profile.languages.map((l) => `${l.name}: ${l.level}`)} />
    </>
  );
}

const TITLES = { about: 'Sobre mí', skills: 'Habilidades', contact: 'Escríbeme', resume: 'Mi hoja de vida' };

export default function Panels() {
  const panel = useStore((s) => s.panel);
  const phase = useStore((s) => s.phase);
  if (!panel || phase !== 'meadow') return null;
  const title = panel.type === 'project' ? 'Trabajo seleccionado' : TITLES[panel.type];
  return (
    <>
      <div className="scrim" onClick={escape} />
      <aside className="drawer drawer--right" role="dialog" aria-label={title} key={panel.type + (panel.id ?? '')}>
        <header className="drawer__head">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={escape} aria-label="Cerrar"><Close /></button>
        </header>
        <div className="drawer__body">
          {panel.type === 'project' && <Project id={panel.id} />}
          {panel.type === 'about' && <About />}
          {panel.type === 'skills' && <Skills />}
          {panel.type === 'contact' && <Contact />}
          {panel.type === 'resume' && <Resume />}
        </div>
      </aside>
    </>
  );
}
