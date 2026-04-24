import { LocalizedSectionHeader } from '@/components/localized-section-header';
import { ReleasePublishForm } from '@/components/release-publish-form';
import { getPreferredLanguage } from '@/lib/i18n-server';
import { getVersions } from '@/lib/platform-data';

export default async function PublishVersionPage() {
  const language = await getPreferredLanguage();
  const versions = await getVersions();

  return (
    <div className="space-y-8">
      <LocalizedSectionHeader
        copy={{
          zh: {
            eyebrow: '版本管理',
            title: '发布官方 Delta Dash 版本',
            description: '此页面仅限发布管理员使用，用于写入 dd_version_list、dd_branch_map 与 dd_version_files。',
          },
          en: {
            eyebrow: 'Admin releases',
            title: 'Publish official Delta Dash releases',
            description: 'This route is reserved for release admins and writes to dd_version_list, dd_branch_map, and dd_version_files.',
          },
        }}
      />

      <ReleasePublishForm versions={versions} language={language} />
    </div>
  );
}
