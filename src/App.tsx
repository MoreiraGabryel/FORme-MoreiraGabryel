import {useState} from 'react';
import {LoadingScreen} from './components/sections/LoadingScreen';

const featurePreview = [
  'Paleta global aplicada',
  'Tipografia Inter + Inter Tight',
  'Keyframes base preparados',
];

export default function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <LoadingScreen onDone={() => setLoaded(true)} />}
      <main className="app-shell px-4 py-6 text-white sm:px-6 lg:px-8">
        <section className="section-frame hero-noise fade-in-soft mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-between rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-[#555555] sm:text-sm">
              <span className="accent-dot lightning-pulse" />
              Bloco 2
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-white/70 sm:text-xs">
              Base visual global
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs uppercase tracking-[0.45em] text-[#555555] sm:text-sm">
                Guarulhos, São Paulo
              </p>
              <h1 className="display-font text-4xl font-bold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Fundação visual pronta para o portfolio.
              </h1>
              <p className="body-muted mt-6 max-w-2xl text-base leading-7 sm:text-lg">
                Este bloco prepara a atmosfera escura, a paleta definitiva, a tipografia e os keyframes que vão sustentar
                loading, hero, ícones flutuantes e transições dos próximos blocos.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-[#E8FF00]/20 bg-[#E8FF00]/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[#E8FF00]">
                  Background #0A0A0A
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/75">
                  Surface #111111
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/75">
                  Primary #FFFFFF
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {featurePreview.map((item, index) => (
                <article
                  key={item}
                  className={`section-frame rounded-[1.5rem] px-5 py-6 ${index % 2 === 0 ? 'float-soft' : 'float-soft-delayed'}`}
                >
                  <p className="text-[0.7rem] uppercase tracking-[0.32em] text-[#555555]">Preview</p>
                  <h2 className="display-font mt-4 text-xl font-semibold text-white">{item}</h2>
                  <p className="body-muted mt-3 text-sm leading-6">
                    Bloco visual pronto para receber loading, hero com raios e seção de tecnologias sem retrabalho de
                    base.
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
