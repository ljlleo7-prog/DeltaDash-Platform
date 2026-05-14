import type { Language } from '@/lib/i18n';

export function RulesDisclaimer({ language }: { language: Language }) {
  return (
    <section className="rounded-3xl border border-yellow-300/30 bg-yellow-500/10 p-5 text-sm leading-6 text-yellow-50">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-yellow-200">
        {language === 'en' ? 'Disclaimer' : '免责声明'}
      </p>
      <h2 className="mt-2 text-lg font-semibold text-white">
        {language === 'en' ? 'AI-Processed, not reviewed by developers' : 'AI 处理内容，尚未由开发者审核'}
      </h2>
      <p className="mt-2 text-yellow-50/85">
        {language === 'en'
          ? 'This interpretation is for design and prototype review. Treat published rule sections and developer-reviewed updates as authoritative.'
          : '此解释仅用于设计与原型评审。正式规则章节与开发者审核后的更新才是权威内容。'}
      </p>
    </section>
  );
}
