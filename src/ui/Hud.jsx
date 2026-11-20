import { store, useStore } from '../store';
import { profile } from '../data/profile';
import { PLACES } from '../world/terrain';
import { projects } from '../world/layout';
import { cycleQuality, escape, goTo, interact, openPanel, setRain, setSound, setView, toggleMenu } from '../actions';
import { Arrow, Close, Doc, Eye, Leaf, Pad, Person, Rain, Screen, Signpost, Sound, Sun } from './icons';

const QUALITY = { high: 'alta', medium: 'media', low: 'baja' };
const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

function Tool({ icon, label, value, onClick, title }) {
  return (
    <button type="button" className="tool" onClick={onClick} aria-label={title}>
      <span className="tool__icon">{icon}</span>
      <span className="tool__text">
        <small>{label}</small>
        <b>{value}</b>
      </span>
    </button>
  );
}

function Switch({ options, value, onChange, label }) {
  return (
    <div className="switch" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={'switch__option' + (o.value === value ? ' is-on' : '')} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.icon}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Controls() {
  const rows = touch
    ? [['mitad izquierda', 'arrastra para caminar; empuja lejos para correr'], ['mitad derecha', 'desliza para mirar alrededor'], ['toque', 'abre lo que tengas cerca']]
    : [['W A S D · flechas', 'caminar'], ['shift', 'correr'], ['espacio', 'saltar'], ['arrastrar', 'mirar alrededor'], ['E · clic', 'abrir lo que tengas cerca'], ['G', 'trabajo y lugares'], ['C', 'cambiar de cámara'], ['esc', 'cerrar']];
  return (
    <div className="popover popover--help" role="dialog" aria-label="Controles">
      <h3>controles</h3>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
    </div>
  );
}

function Credits() {
  return (
    <div className="popover popover--credits" role="dialog" aria-label="Créditos">
      <h3>hecho por gusto.</h3>
      <p>pradera construida con three.js, react three fiber, gsap y rapier. todo se dibuja con código: no hay modelos ni texturas descargadas, y el sonido se sintetiza en el navegador.</p>
      <p>la idea y el formato vienen del portafolio de vipin pathak, <a href="https://www.curllmooha.com/" target="_blank" rel="noreferrer">curllmooha.com</a>.</p>
      <a className="link" href="?plano">ver la versión plana <Arrow /></a>
    </div>
  );
}

function Menu() {
  return (
    <aside className="drawer drawer--left" aria-label="Trabajo y lugares">
      <header className="drawer__head">
        <h2>trabajo y lugares</h2>
        <button type="button" className="icon-button" onClick={toggleMenu} aria-label="Cerrar"><Close /></button>
      </header>
      <div className="drawer__body">
        <p className="eyebrow">seguir un sendero</p>
        <ul className="tiles">
          {PLACES.map((p) => (
            <li key={p.id}>
              <button type="button" className="tile" onClick={() => goTo(p.id)}>
                <b>{p.label}</b>
                <small>{p.note}</small>
              </button>
            </li>
          ))}
        </ul>
        <p className="eyebrow">o abrir directamente</p>
        <ul className="rows">
          {projects.map((p, i) => (
            <li key={p.name}>
              <button type="button" className="row" onClick={() => openPanel({ type: 'project', id: i })}>
                <i style={{ background: p.color }} />
                <span><b>{p.name.toLowerCase()}</b><small>{p.tag.toLowerCase()}</small></span>
                <Arrow />
              </button>
            </li>
          ))}
          {[['about', 'sobre mí'], ['skills', 'habilidades'], ['contact', 'contacto']].map(([type, label]) => (
            <li key={type}>
              <button type="button" className="row" onClick={() => openPanel({ type })}>
                <i />
                <span><b>{label}</b></span>
                <Arrow />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default function Hud() {
  const s = useStore((state) => state);
  if (s.phase === 'loading' || s.phase === 'flat') return null;

  if (s.phase === 'opening') {
    return (
      <div className="hud">
        <p className="title-pill"><b>{profile.shortName.toLowerCase()}</b><i />desarrollador full-stack</p>
        <button type="button" className="pill skip" onClick={escape}>saltar la intro <kbd>esc</kbd></button>
      </div>
    );
  }

  const quiet = s.panel || s.menu;
  return (
    <div className="hud">
      <h1 className="sr-only">La pradera de {profile.shortName}: portafolio 3D interactivo</h1>

      <div className="tools">
        <Tool icon={<Sound on={s.sound} />} label="sonido" value={s.sound ? 'sí' : 'no'} title={`Sonido ${s.sound ? 'encendido' : 'apagado'}. Cambiar.`} onClick={() => setSound(!s.sound)} />
        <Tool icon={<Screen />} label="gráficos" value={QUALITY[s.quality]} title={`Gráficos: ${QUALITY[s.quality]}. Cambiar.`} onClick={cycleQuality} />
        <Tool icon={<Pad />} label="controles" value={touch ? 'táctil' : 'teclas'} title="Mostrar los controles" onClick={() => store.set({ help: !s.help, credits: false })} />
      </div>
      {s.help && <Controls />}

      <div className="deck">
        <Switch label="Clima" value={s.rain ? 'rain' : 'sun'} onChange={(v) => setRain(v === 'rain')} options={[{ value: 'sun', label: 'soleado', icon: <Sun /> }, { value: 'rain', label: 'lluvia', icon: <Rain /> }]} />
        <span className="deck__seam" />
        <Switch label="Cámara" value={s.view} onChange={setView} options={[{ value: 'third', label: '3.ª persona', icon: <Person /> }, { value: 'first', label: '1.ª persona', icon: <Eye /> }]} />
      </div>

      <button type="button" className="pill resume" onClick={() => openPanel({ type: 'resume' })}><Doc /> hoja de vida</button>

      {!s.menu && (
        <button type="button" className="pill places" onClick={toggleMenu}><Signpost /> trabajo y lugares <kbd>G</kbd></button>
      )}
      {s.menu && <Menu />}

      {!quiet && s.following && (
        <button type="button" className="pill prompt" onClick={escape}>siguiendo el sendero… <kbd>esc</kbd></button>
      )}
      {!quiet && !s.following && s.near && (
        <button type="button" className="pill prompt prompt--go" onClick={interact}><kbd>{touch ? 'toca' : 'E'}</kbd> {s.near.label}</button>
      )}

      <button type="button" className="icon-button credits-button" onClick={() => store.set({ credits: !s.credits, help: false })} aria-label="Créditos"><Leaf /></button>
      {s.credits && <Credits />}
    </div>
  );
}
