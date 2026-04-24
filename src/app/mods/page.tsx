import { EmptyState } from '@/components/empty-state';
import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { ModGrid, UploadCard } from '@/components/workshop';
import { getPreferredLanguage } from '@/lib/i18n-server';
import { getMods } from '@/lib/platform-data';

export default async function ModsPage() {
  const language = await getPreferredLanguage();
  const mods = await getMods();

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '模组',
            title: '社区创意工坊',
            description: '按兼容性与内容方向浏览社区模组。正式投稿入口会在工坊提交流程开放后提供。',
          },
          en: {
            eyebrow: 'Mods',
            title: 'Community workshop',
            description: 'Browse community mods by compatibility and category. Submission entry will appear once the workshop publishing flow is available.',
          },
        }}
      />

      <UploadCard
        title={language === 'en' ? 'Workshop submission status' : '工坊投稿状态'}
        description={language === 'en' ? 'Direct mod publishing is not open in this build yet. Use the catalog below to review currently available community content.' : '当前版本尚未开放直接投稿模组，请先通过下方目录查看已上线的社区内容。'}
        cta={{ href: '/community', label: language === 'en' ? 'Open community discussions' : '前往社区讨论' }}
      />

      {mods.length ? (
        <ModGrid mods={mods} language={language} />
      ) : (
        <EmptyState
          title={language === 'en' ? 'No mods published yet' : '暂无已发布模组'}
          description={language === 'en' ? 'Community workshop entries will appear here after they are added to the platform.' : '当社区模组上线后，会显示在这里。'}
        />
      )}
    </div>
  );
}
