'use client';

import { useLanguage } from '@/components/language-provider';
import { LocalizedSectionHeader } from '@/components/localized-section-header';

type Section = { id: string; titleZh: string; titleEn: string; bodyZh: string; bodyEn: string };

const sections: Section[] = [
  {
    id: 'open-source',
    titleZh: '一、开源许可',
    titleEn: 'I. Open-Source License',
    bodyZh:
      'Delta Dash 的规则系统、机制设计及即打即玩（PnP）文件依据 Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International（CC BY-NC-SA 4.0）授权发布。平台代码依据 MIT 许可证开源。\n\n您可以自由复制、分发、改编上述内容，但须满足以下条件：\n• 注明原作者（GeeksProductionStudio）及官方来源链接；\n• 仅限非商业用途；\n• 以相同许可证（CC BY-NC-SA 4.0）分发衍生作品。',
    bodyEn:
      'The Delta Dash rule system, gameplay mechanics, and print-and-play (PnP) materials are released under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) license. The platform source code is open-sourced under the MIT License.\n\nYou are free to copy, distribute, and adapt these materials, provided that:\n• You credit the original authors (GeeksProductionStudio) and link to the official source;\n• You use the materials for non-commercial purposes only;\n• You distribute any derivative works under the same license (CC BY-NC-SA 4.0).',
  },
  {
    id: 'ip-ownership',
    titleZh: '二、品牌与知识产权',
    titleEn: 'II. Brand and Intellectual Property',
    bodyZh:
      '以下内容不在上述开源许可范围之内，版权归 GeeksProductionStudio 所有：\n• "Delta Dash" 名称及其所有变体；\n• 官方 Logo、视觉标识及品牌素材；\n• 官方发布版本文件及其版本编号体系。\n\n未经开发团队书面授权，任何方不得将上述品牌元素用于任何商业或公开发行目的。任何未经授权的修改版、转载版或再分发版，均不得被表述为"官方版本"。',
    bodyEn:
      'The following are not covered by the open-source licenses above and remain the exclusive property of GeeksProductionStudio:\n• The name "Delta Dash" and all its variants;\n• Official logos, visual identity, and brand assets;\n• Official release files and their versioning system.\n\nNo party may use these brand elements for any commercial or public distribution purpose without written authorization from the development team. Any unauthorized modified, reposted, or redistributed version may not be represented as an "official version."',
  },
  {
    id: 'no-commercial',
    titleZh: '三、禁止商业化',
    titleEn: 'III. No Commercialization',
    bodyZh:
      '严格禁止以下行为：\n• 出售、转售或以任何形式对 Delta Dash 内容收取费用；\n• 通过众筹、打赏或订阅等方式对 Delta Dash 内容进行货币化；\n• 将 Delta Dash 内容捆绑至任何付费产品或服务中。\n\n平台内的代币体系仅用于追踪下载行为、防止滥用及维护分发记录，不构成对内容的商业销售。',
    bodyEn:
      'The following are strictly prohibited:\n• Selling, reselling, or charging any fee for Delta Dash content in any form;\n• Monetizing Delta Dash content through crowdfunding, tipping, subscriptions, or similar means;\n• Bundling Delta Dash content into any paid product or service.\n\nThe token system on this platform exists solely to track download activity, prevent overuse, and maintain distribution records. It does not constitute a commercial sale of content.',
  },
  {
    id: 'forks-mods',
    titleZh: '四、分支与模组',
    titleEn: 'IV. Forks and Mods',
    bodyZh:
      '我们欢迎社区在 CC BY-NC-SA 4.0 框架下创作分支规则集与模组，但须遵守以下要求：\n• 明确标注为非官方社区作品，不得冒充官方版本；\n• 保留对原版 Delta Dash 及 GeeksProductionStudio 的署名；\n• 以相同许可证发布衍生作品；\n• 不得将衍生作品用于商业目的。',
    bodyEn:
      'We welcome community-created forks and mods under the CC BY-NC-SA 4.0 framework, subject to the following requirements:\n• Clearly identify the work as an unofficial community creation and not an official version;\n• Retain attribution to the original Delta Dash project and GeeksProductionStudio;\n• Release derivative works under the same license;\n• Do not use derivative works for commercial purposes.',
  },
  {
    id: 'download-policy',
    titleZh: '五、下载政策',
    titleEn: 'V. Download Policy',
    bodyZh:
      '官方发布文件通过本平台的代币体系进行分发管控。代币机制的目的是：\n• 防止自动化批量下载与滥用；\n• 追踪分发行为以维护版本完整性；\n• 确保每次下载均有账户记录，便于后续支持。\n\n下载权限与账户绑定，不可转让。禁止通过任何技术手段绕过下载验证流程。',
    bodyEn:
      'Official release files are distributed through the token system on this platform. The token mechanism exists to:\n• Prevent automated bulk downloads and abuse;\n• Track distribution activity to maintain version integrity;\n• Ensure each download is account-linked for support purposes.\n\nDownload entitlements are tied to your account and are non-transferable. Circumventing the download verification flow by any technical means is prohibited.',
  },
  {
    id: 'disclaimer',
    titleZh: '六、免责声明',
    titleEn: 'VI. Disclaimer',
    bodyZh:
      '本平台及 Delta Dash 内容按"现状"提供，不附带任何明示或暗示的保证。GeeksProductionStudio 对因使用本平台或相关内容而产生的任何直接或间接损失不承担责任，适用法律允许的最大范围内有效。',
    bodyEn:
      'This platform and Delta Dash materials are provided "as-is" without warranties of any kind, express or implied. GeeksProductionStudio shall not be liable for any direct or indirect damages arising from the use of this platform or its content, to the fullest extent permitted by applicable law.',
  },
];

export default function TermsPage() {
  const { language } = useLanguage();

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: { eyebrow: '条款', title: '使用条款与许可声明', description: '关于 Delta Dash 的开源授权、品牌归属、商业限制及下载政策的完整说明。' },
          en: { eyebrow: 'Terms', title: 'Terms of Use & License', description: 'Complete statement on open-source licensing, brand ownership, commercial restrictions, and download policy for Delta Dash.' },
        }}
      />

      <div className="space-y-4">
        {sections.map((section) => (
          <details key={section.id} id={section.id} className="group rounded-3xl border border-white/10 bg-white/5 p-5" open>
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-white">
                  {language === 'zh' ? section.titleZh : section.titleEn}
                </h2>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-300 group-open:text-[var(--accent-hot)]">
                  #{section.id}
                </span>
              </div>
            </summary>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">
              {language === 'zh' ? section.bodyZh : section.bodyEn}
            </p>
          </details>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-xs text-slate-500">
        {language === 'zh'
          ? '本条款依据 CC BY-NC-SA 4.0 及 MIT 许可证制定。如有疑问，请通过官方社区渠道联系 GeeksProductionStudio。最后更新：2026。'
          : 'These terms are governed by CC BY-NC-SA 4.0 and the MIT License. For questions, contact GeeksProductionStudio through official community channels. Last updated: 2026.'}
      </div>
    </div>
  );
}
