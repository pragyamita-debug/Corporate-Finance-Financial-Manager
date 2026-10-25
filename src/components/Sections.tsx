import { useEffect, useState, type CSSProperties } from 'react';
import lightsLayer from '../assets/photos/night-lights.webp';
import skyline from '../assets/photos/night-skyline.jpg';
import commercial from '../assets/photos/project-commercial.jpg';
import interior from '../assets/photos/project-interior.jpg';
import villa from '../assets/photos/project-villa.jpg';
import { useCountUp } from '../hooks/useCountUp';
import { useInView } from '../hooks/useInView';
import { iconFor, leadNumber, splitHeadline } from '../lib/finance';
import type { Resume } from '../lib/types';
import { CityLights } from './CityLights';
import { GlowCard } from './GlowCard';
import { Icon, type IconName } from './Icon';
import { Logo } from './Logo';

/* ================= top bar ================= */

export const NAV = [
  { id: 'home', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'insights', label: 'Insights' },
  { id: 'projects', label: 'Projects' },
];

export function TopBar({ resume, active, isExample, onUpload }: { resume: Resume; active: string; isExample: boolean; onUpload: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const [first, ...rest] = resume.name.toUpperCase().split(' ');
  return (
    <header className={`top ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="wrap top__inner">
        <a className="top__brand" href="#home">
          <Logo />
          <span className="top__name">
            <b>{first}</b> {rest.join(' ')}
          </span>
        </a>
        <nav className={`top__links ${open ? 'is-open' : ''}`} aria-label="Sections">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={active === n.id ? 'is-active' : ''} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
        </nav>
        {isExample ? (
          <button className="pill pill--glass pill--sm top__cta" onClick={onUpload}>
            Upload CV
          </button>
        ) : (
          <a className="pill pill--glass pill--sm top__cta" href="#contact">
            Get in Touch
          </a>
        )}
        <button className="icon-btn top__burger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <Icon name={open ? 'close' : 'menu'} size={17} />
        </button>
      </div>
    </header>
  );
}

/* ================= hero: the city at night ================= */

export function Hero({ resume, isExample, onUpload }: { resume: Resume; isExample: boolean; onUpload: () => void }) {
  const [role, focus] = splitHeadline(resume.headline);
  const words = (focus || 'Corporate Finance').split(/\s+&\s+|\s*[,·]\s*|\s+and\s+/i).filter(Boolean).slice(0, 3);
  return (
    <section className="hero" id="home" aria-label="Introduction">
      <div className="hero__scene" aria-hidden>
        <div className="hero__photo">
          <img src={skyline} alt="" />
          {/* a warm glow rising on the horizon behind the spire */}
          <span className="hero__sun" />
          {/* the photo's own lights, cut out, with a shimmer sweeping along the lit strips */}
          <img className="hero__shine" src={lightsLayer} alt="" />
          {/* flowing river + every window and lamp twinkling on its own */}
          <CityLights src={skyline} />
        </div>
        <span className="hero__shade" />
      </div>
      <div className="wrap hero__copy">
        <p className="hero__eyebrow">
          {words.map((w, i) => (
            <span key={w + i}>{w}</span>
          ))}
        </p>
        <h1 className="hero__title">{role}</h1>
        <span className="hero__rule" aria-hidden />
        <p className="hero__lede">{resume.tagline}</p>
        <div className="hero__actions">
          {isExample ? (
            <button className="pill pill--line" onClick={onUpload}>
              Upload your CV <Icon name="arrowRight" size={16} />
            </button>
          ) : (
            <a className="pill pill--line" href="#insights">
              Explore experience <Icon name="arrowRight" size={16} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/* ================= counted figures under the hero ================= */

function Figure({ value, plus, label, run, delay, phase }: { value: number; plus?: boolean; label: string; run: boolean; delay: number; phase: number }) {
  const v = useCountUp(value, run, { duration: 2000, delay });
  return (
    <GlowCard className="fig" accent="teal" speed={9} phase={phase}>
      <b>
        {Math.round(v)}
        {plus && <sup>+</sup>}
      </b>
      <small>{label}</small>
    </GlowCard>
  );
}

export function Figures({ resume }: { resume: Resume }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const s = resume.stats;
  return (
    <div className="wrap figs" ref={ref}>
      <Figure value={s.years} plus={s.yearsPlus} label="Years in finance" run={inView} delay={0} phase={0} />
      <Figure value={resume.projects.length} plus={s.projectsPlus} label="Projects delivered" run={inView} delay={150} phase={0.25} />
      <Figure value={resume.certifications.length} label="Certifications" run={inView} delay={300} phase={0.5} />
      <Figure value={resume.skills.length} label="Skills & tools" run={inView} delay={450} phase={0.75} />
    </div>
  );
}

/* ================= services: three core skills ================= */

function lineFor(skill: string, resume: Resume) {
  const word = skill.split(/[\s&/,]+/).find((w) => w.length > 4);
  if (word) {
    const re = new RegExp(word.slice(0, 6), 'i');
    for (const e of resume.experience) {
      const hit = e.bullets.find((b) => re.test(b));
      if (hit) return hit.replace(/\.$/, '');
    }
  }
  return 'Applied across every role';
}

export function Services({ resume }: { resume: Resume }) {
  const core = resume.skills.slice(0, 3);
  // three different icons, even when two skills match the same rule
  const icons: IconName[] = [];
  core.forEach((s, i) => {
    const pick = iconFor(s, i);
    icons.push(icons.includes(pick) ? (['search', 'target', 'gauge2', 'chart', 'coins', 'pie'] as IconName[]).find((x) => !icons.includes(x))! : pick);
  });
  const extra = resume.skills.slice(3);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="services" id="services" aria-label="Core expertise">
      <div className="wrap services__row">
        {core.map((s, i) => {
          const more = extra.filter((_, k) => k % 3 === i);
          return (
            <GlowCard key={s} className="service" accent="teal" speed={8} phase={i * 0.33}>
              <span className="service__icon">
                <Icon name={icons[i]} size={44} />
              </span>
              <h3>{s}</h3>
              <p>{lineFor(s, resume)}</p>
              {more.length > 0 && (
                <>
                  <button className="service__more" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                    Learn More <Icon name="chevronDown" size={13} />
                  </button>
                  <ul className={`service__list ${open === i ? 'is-open' : ''}`}>
                    {more.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </>
              )}
            </GlowCard>
          );
        })}
      </div>
    </section>
  );
}

/* ================= insights: roles as photo cards ================= */

const PHOTOS = [villa, commercial, interior];

export function Insights({ resume }: { resume: Resume }) {
  const [open, setOpen] = useState<number | null>(null);
  const roles = resume.experience.slice(0, 3);
  return (
    <section className="wrap section" id="insights" aria-label="Experience">
      <h2 className="section__title">
        Driving results <span>through</span> <em>financial insight</em>
      </h2>
      <div className="insights">
        {roles.map((r, i) => (
          <GlowCard key={r.role + i} as="article" className="insight" accent={r.current ? 'amber' : 'teal'} speed={10} phase={i * 0.3}>
            <div className="insight__photo">
              <img src={PHOTOS[i % PHOTOS.length]} alt="" loading="lazy" />
              {r.period && <span className="insight__when">{r.period}</span>}
            </div>
            <div className="insight__body">
              <h3>{r.role}</h3>
              <p className="insight__co">{r.company}</p>
              {r.bullets[0] && <p>{r.bullets[0]}</p>}
              {r.bullets.length > 1 && (
                <>
                  <ul className={`insight__more ${open === i ? 'is-open' : ''}`}>
                    {r.bullets.slice(1).map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <button className="insight__link" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                    {open === i ? 'Show less' : 'Discover more'} <Icon name="chevronRight" size={12} />
                  </button>
                </>
              )}
            </div>
          </GlowCard>
        ))}
      </div>
    </section>
  );
}

/* ================= recent projects strip ================= */

export function Projects({ resume }: { resume: Resume }) {
  const [ref, inView] = useInView<HTMLElement>(0.2);
  if (!resume.projects.length) return null;
  return (
    <section ref={ref} className={`projects ${inView ? 'is-in' : ''}`} id="projects" aria-label="Recent projects">
      <span className="projects__flare" aria-hidden />
      <div className="wrap projects__grid">
        {resume.projects.slice(0, 6).map((p, i) => (
          <div key={p.title} className="project" style={{ '--i': i } as CSSProperties}>
            <p className="project__label">Recent project</p>
            <div className="project__row">
              <span className="project__icon">
                <Icon name={iconFor(`${p.title} ${p.tags.join(' ')}`, i)} size={26} />
              </span>
              <div>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ================= track record: achievements with counting numbers ================= */

function Outcome({ text, run, delay }: { text: string; run: boolean; delay: number }) {
  const lead = leadNumber(text);
  const v = useCountUp(lead?.n ?? 0, run, { duration: 1800, delay });
  const shown = lead ? `${lead.pre}${lead.n % 1 ? v.toFixed(1) : Math.round(v)}${lead.post}` : '';
  return (
    <li>
      <b>{lead ? shown : <Icon name="trophy" size={28} />}</b>
      <span>{text}</span>
    </li>
  );
}

export function Record({ resume }: { resume: Resume }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.25);
  if (!resume.achievements.length && !resume.certifications.length) return null;
  return (
    <section className="wrap section" aria-label="Track record">
      <h2 className="section__title">
        Track record <span>&amp;</span> <em>credentials</em>
      </h2>
      <div className="record" ref={ref}>
        <GlowCard className="record__card" accent="amber" speed={11} phase={0.1} tilt={false}>
          <p className="record__label">Outcomes</p>
          <ul className="outcomes">
            {resume.achievements.map((a, i) => (
              <Outcome key={a} text={a} run={inView} delay={i * 150} />
            ))}
          </ul>
        </GlowCard>
        <GlowCard className="record__card" accent="teal" speed={11} phase={0.6} tilt={false}>
          <p className="record__label">Certifications</p>
          <ul className="creds">
            {resume.certifications.map((c) => (
              <li key={c}>
                <Icon name="award" size={16} /> {c}
              </li>
            ))}
          </ul>
          <p className="record__label">Education</p>
          <ul className="creds">
            {resume.education.map((e) => (
              <li key={e.degree}>
                <Icon name="graduation" size={16} />
                <span>
                  {e.degree}
                  <small>{[e.institution, e.year].filter(Boolean).join(' · ')}</small>
                </span>
              </li>
            ))}
          </ul>
        </GlowCard>
      </div>
    </section>
  );
}

/* ================= footer ================= */

interface FooterProps {
  resume: Resume;
  isExample: boolean;
  onUpload: () => void;
  onEdit: () => void;
  onReset: () => void;
  onDownloadCv: () => void;
}

export function Footer({ resume, isExample, onUpload, onEdit, onReset, onDownloadCv }: FooterProps) {
  const web = (u: string) => (u.startsWith('http') ? u : `https://${u}`);
  const links = [
    resume.email && { icon: 'mail' as const, label: resume.email, href: `mailto:${resume.email}` },
    resume.phone && { icon: 'phone' as const, label: resume.phone, href: `tel:${resume.phone.replace(/[^\d+]/g, '')}` },
    resume.location && { icon: 'pin' as const, label: resume.location },
    resume.links.linkedin && { icon: 'linkedin' as const, label: 'LinkedIn', href: web(resume.links.linkedin) },
  ].filter(Boolean) as { icon: 'mail' | 'phone' | 'pin' | 'linkedin'; label: string; href?: string }[];
  return (
    <footer className="foot" id="contact">
      <div className="wrap foot__inner">
        <div>
          {resume.motto && <p className="foot__motto">{resume.motto}</p>}
          <ul className="foot__links">
            {links.map((l) => (
              <li key={l.label}>
                {l.href ? (
                  <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                    <Icon name={l.icon} size={15} /> {l.label}
                  </a>
                ) : (
                  <span>
                    <Icon name={l.icon} size={15} /> {l.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="foot__actions">
          {isExample ? (
            <button className="pill pill--sm" onClick={onUpload}>
              <Icon name="upload" size={15} /> Upload your CV
            </button>
          ) : (
            <>
              <button className="pill pill--glass pill--sm" onClick={onEdit}>
                <Icon name="edit" size={15} /> Edit details
              </button>
              <button className="pill pill--glass pill--sm" onClick={onDownloadCv}>
                <Icon name="download" size={15} /> Download CV
              </button>
              <button className="pill pill--glass pill--sm" onClick={onUpload}>
                <Icon name="upload" size={15} /> New CV
              </button>
              <button className="pill pill--glass pill--sm" onClick={onReset}>
                <Icon name="refresh" size={15} /> Example
              </button>
            </>
          )}
        </div>
      </div>
      <p className="wrap foot__note">Your CV is read in your browser and stored only on this device.</p>
    </footer>
  );
}
