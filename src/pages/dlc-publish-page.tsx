import { DlcPublishForm } from '@/components/dlc-publish-form';
import { useLanguage } from '@/components/language-provider';

export function DlcPublishClientPage() {
  const { language } = useLanguage();
  return (
    <div className="space-y-8">
      <DlcPublishForm language={language} />
    </div>
  );
}
