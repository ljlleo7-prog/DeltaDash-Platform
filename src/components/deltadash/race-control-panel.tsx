import { Link } from 'react-router-dom';
import type { Language } from '@/lib/i18n';
import { deltaDashExplanationSlides } from '@/lib/deltadash/explanation-catalog';
import { DELTADASH_RESPONSE_WINDOW_SECONDS, DELTADASH_WHEEL_TO_WHEEL_SECONDS, type DeltaDashEvent, type DeltaDashMatchState, type DeltaDashStewardNote } from '@/lib/deltadash/types';
import { EventLogPanel } from './event-log-panel';
import { StewardPanel } from './steward-panel';

function formatTurnStep(step: DeltaDashMatchState['turnStep'], language: Language): string {
  const labels = {
    planning: { en: 'Planning', zh: '计划' },
    locked: { en: 'Locked', zh: '锁定' },
    reveal: { en: 'Reveal', zh: '揭示' },
    choice: { en: 'Choice', zh: '选择' },
    steward: { en: 'Steward', zh: '裁判' },
    cleanup: { en: 'Cleanup', zh: '清理' },
    roundEnd: { en: 'Round end', zh: '回合结束' },
  } satisfies Record<DeltaDashMatchState['turnStep'], Record<Language, string>>;
  return labels[step][language];
}

function getFlowHint(state: DeltaDashMatchState, language: Language): string {
  if (state.pendingChoice) return language === 'en' ? 'Your input is required before automatic resolution can continue.' : '需要你做出选择后，自动结算才会继续。';
  if (state.turnStep === 'planning') return language === 'en' ? 'Deploy cards, then confirm your turn. Bot cards will resolve automatically unless you need to choose.' : '部署卡牌后确认回合。机器人卡牌会自动结算，除非需要你选择。';
  if (state.turnStep === 'reveal') return language === 'en' ? `Resolving queue ${Math.min(state.resolutionIndex + 1, state.resolutionQueue.length)}/${state.resolutionQueue.length}.` : `正在结算队列 ${Math.min(state.resolutionIndex + 1, state.resolutionQueue.length)}/${state.resolutionQueue.length}。`;
  if (state.turnStep === 'cleanup') return language === 'en' ? 'Cleanup is checking hand limits and preparing the next round.' : '清理阶段正在检查手牌上限并准备下一回合。';
  if (state.turnStep === 'roundEnd') return language === 'en' ? 'Round ended; next round setup is being applied.' : '回合结束；正在应用下一回合准备。';
  return language === 'en' ? 'The engine is advancing the round flow.' : '引擎正在推进回合流程。';
}

export function RaceFlowPanel({ state, language }: { state: DeltaDashMatchState; language: Language }) {
  return (
    <section className="rounded-3xl border border-lime-300/25 bg-lime-300/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-lime-200">{language === 'en' ? 'Round flow' : '回合流程'}</p>
          <h3 className="mt-2 text-xl font-black text-white">{language === 'en' ? `Round ${state.round}` : `第 ${state.round} 回合`}</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2 text-right text-xs text-lime-100">
          <p className="font-black uppercase tracking-[0.16em]">{language === 'en' ? 'Now' : '当前'}</p>
          <p className="mt-1 text-white">{formatTurnStep(state.turnStep, language)}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[0.62rem] font-black uppercase tracking-[0.12em] sm:grid-cols-7">
        {(['planning', 'locked', 'reveal', 'choice', 'steward', 'cleanup', 'roundEnd'] as const).map((step) => (
          <span key={step} className={`rounded-full border px-2 py-1 ${state.turnStep === step ? 'border-lime-200 bg-lime-300 text-slate-950' : 'border-white/10 bg-white/5 text-slate-400'}`}>{formatTurnStep(step, language)}</span>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-lime-50/75">
        {getFlowHint(state, language)}
      </p>
    </section>
  );
}

export function RaceControlPanel({
  latestNote,
  events,
  language,
}: {
  latestNote: DeltaDashStewardNote | null;
  events: DeltaDashEvent[];
  language: Language;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-orange-300/25 bg-orange-500/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-orange-200">{language === 'en' ? 'Race engineer' : '比赛工程师'}</p>
        <h3 className="mt-2 text-xl font-black text-white">{language === 'en' ? 'Hints & rules' : '提示与规则'}</h3>
        <p className="mt-2 text-xs leading-5 text-orange-50/80">
          {language === 'en'
            ? `Target ranges use direct time gaps. A 1.5s card range means cars within 1.5 seconds, with ${DELTADASH_WHEEL_TO_WHEEL_SECONDS.toFixed(1)}s treated as wheel-to-wheel margin. Response cards have a ${DELTADASH_RESPONSE_WINDOW_SECONDS}s window after lock.`
            : `目标范围使用直接时间差。1.5 秒卡牌范围表示彼此相差不超过 1.5 秒，${DELTADASH_WHEEL_TO_WHEEL_SECONDS.toFixed(1)} 秒内视为并排缠斗余量。响应牌在锁定后有 ${DELTADASH_RESPONSE_WINDOW_SECONDS} 秒窗口。`}
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {deltaDashExplanationSlides.map((slide) => (
            <a key={slide.id} href={slide.imageUrl} target="_blank" rel="noreferrer" className="block min-w-20 overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 transition hover:border-lime-300/50">
              <img src={slide.imageUrl} alt={slide.title} className="h-14 w-20 object-cover" />
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-300/25 bg-cyan-500/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">{language === 'en' ? 'Feedback loop' : '反馈通道'}</p>
        <h3 className="mt-2 text-xl font-black text-white">{language === 'en' ? 'Community side-by-side' : '边玩边反馈'}</h3>
        <p className="mt-2 text-xs leading-5 text-cyan-50/80">
          {language === 'en'
            ? 'Have balance notes, bugs, or playtest thoughts while racing? Open the community hub or official site without losing this local match.'
            : '比赛中发现平衡建议、问题或试玩想法？可打开社区反馈中心或官网，同时保留当前本地比赛。'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/community" className="rounded-full border border-[var(--accent-hot)]/35 bg-[rgba(255,77,90,0.12)] px-3 py-2 text-xs font-black text-[var(--text-main)] transition hover:bg-[rgba(255,77,90,0.2)]">
            {language === 'en' ? 'Open community' : '进入社区'}
          </Link>
          <a href="https://geeksproductionstudio.com" target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-200/50">
            {language === 'en' ? 'Official site' : '官方网站'}
          </a>
        </div>
      </div>

      <StewardPanel latestNote={latestNote} language={language} />
      <EventLogPanel events={events} language={language} />
    </section>
  );
}
