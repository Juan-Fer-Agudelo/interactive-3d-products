import { useState } from 'react';
import { useStore } from '../store';
import { profile } from '../data/profile';
import { projects } from '../world/layout';
import { escape, openPanel } from '../actions';
import { Arrow, Close, Out } from './icons';

const lower = (text) => text.toLowerCase();

function Chips({ items }) {
  return <ul className="chips">{items.map((i) => <li key={i}>{lower(i)}</li>)}</ul>;
}

function Project({ id }) {
  const p = projects[id];
  return (
    <>
      <div className="cover" style={{ background: `linear-gradient(135deg, ${p.color}, #2b2233)` }}>
        <span>{String(id + 1).padStart(2, '0')}</span>
        <strong>{lower(p.name)}</strong>
      </div>
      <p className="eyebrow">{lower(p.tag)}</p>
      <p className="lede">{p.description}</p>
      <h3>con qué está hecho</h3>
      <Chips items={p.stack} />
      {p.url && <a className="button" href={p.url} target="_blank" rel="noreferrer">visitar el sitio <Out /></a>}
      <div className="pager">
        <button type="button" onClick={() => openPanel({ type: 'project', id: (id + projects.length - 1) % projects.length })}>← anterior</button>
        <button type="button" onClick={() => openPanel({ type: 'project', id: (id + 1) % projects.length })}>siguiente →</button>
      </div>
    </>
  );
}

function About() {
  return (
    <>
      <p className="eyebrow">{lower(profile.location)}</p>
      {profile.summary.map((t) => <p key={t} className="lede">{t}</p>)}
      <h3>resultados</h3>
      <ul className="stats">
        {profile.highlights.map((h) => <li key={h.label}><b>{h.value}</b><span>{h.label}</span></li>)}
      </ul>
      <h3>me interesa</h3>
      <Chips items={profile.interests} />
    </>
  );
}

function Skills() {
  return (
    <>
      <p className="lede">lo que uso para construir, medir y automatizar.</p>
      {profile.skills.map((s) => (
        <section key={s.group}>
          <h3>{lower(s.group)}</h3>
          <Chips items={s.items} />
        </section>
      ))}
      <h3>cómo trabajo</h3>
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
      <p className="lede">¿tienes un proyecto, una idea para colaborar o una pregunta sobre cómo se hizo algo de esta pradera? el correo es la forma más rápida de encontrarme.</p>
      <div className="mail">
        <a href={`mailto:${profile.email}`}>{profile.email} <Arrow /></a>
        <button type="button" onClick={copy}>{copied ? 'copiado' : 'copiar'}</button>
      </div>
      <ul className="links">
        <li><a href={profile.links.linkedin} target="_blank" rel="noreferrer">linkedin <Out /></a></li>
        <li><a href={profile.links.github} target="_blank" rel="noreferrer">github <Out /></a></li>
        <li><a href={profile.links.portfolio} target="_blank" rel="noreferrer">portafolio anterior <Out /></a></li>
        <li><a href={profile.phoneHref}>{profile.phone} <Arrow /></a></li>
      </ul>
      <p className="note">te respondo.</p>
    </>
  );
}

function Resume() {
  return (
    <>
      <p className="eyebrow">{lower(profile.role)}</p>
      <h3>experiencia</h3>
      {profile.experience.map((e) => (
        <section key={e.company} className="job">
          <header>
            <b>{lower(e.role)}</b>
            <span>{e.company} · {lower(e.period)}</span>
            <small>{e.place}</small>
          </header>
          <ul className="list">{e.bullets.slice(0, 4).map((b) => <li key={b}>{b}</li>)}</ul>
        </section>
      ))}
      <h3>educación</h3>
      <ul className="list">
        {profile.education.map((e) => <li key={e.title}><b>{e.title}</b> · {e.school}{e.period ? ` · ${e.period}` : ''}</li>)}
      </ul>
      <h3>idiomas</h3>
      <Chips items={profile.languages.map((l) => `${l.name}: ${l.level}`)} />
    </>
  );
}

const TITLES = { about: 'sobre mí', skills: 'habilidades', contact: 'escríbeme.', resume: 'mi hoja de vida' };

export default function Panels() {
  const panel = useStore((s) => s.panel);
  const phase = useStore((s) => s.phase);
  if (!panel || phase !== 'meadow') return null;
  const title = panel.type === 'project' ? 'trabajo seleccionado' : TITLES[panel.type];
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
