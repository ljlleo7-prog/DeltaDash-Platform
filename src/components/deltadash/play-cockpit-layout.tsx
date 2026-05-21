import type { ReactNode } from 'react';
import type { Language } from '@/lib/i18n';

export function PlayCockpitLayout({
  language,
  cardRail,
  standings,
  timeline,
  raceControl,
  driverConsole,
}: {
  language: Language;
  cardRail: ReactNode;
  standings: ReactNode;
  timeline: ReactNode;
  raceControl: ReactNode;
  driverConsole: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-orange-300/20 bg-[radial-gradient(circle_at_top_left,rgba(255,214,10,0.16),transparent_28%),linear-gradient(135deg,rgba(30,41,59,0.96),rgba(49,46,129,0.86)_45%,rgba(20,83,45,0.72))] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.38)] md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-lime-200">{language === 'en' ? 'Race cockpit' : '比赛驾驶舱'}</p>
          <h2 className="mt-1 text-2xl font-black italic tracking-tight text-white md:text-3xl">Delta Dash Live</h2>
        </div>
        <div className="rounded-full border border-orange-300/40 bg-orange-400/15 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-orange-100">
          {language === 'en' ? 'Continuous time delta' : '连续时间差'}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_300px]">
        <aside className="min-w-0 space-y-4">
          {standings}
          {raceControl}
        </aside>
        <main className="min-w-0 space-y-4 overflow-hidden">
          {timeline}
          {driverConsole}
        </main>
        <aside className="min-w-0 space-y-4">{cardRail}</aside>
      </div>
    </section>
  );
}
