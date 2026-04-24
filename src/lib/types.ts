import type { LocalizedText } from '@/lib/i18n';

export type VersionStatus = 'stable' | 'beta' | 'experimental';

export type ReleaseFileType = 'rules' | 'cards' | 'driver_pack' | 'bundle';

export interface VersionFile {
  id: string;
  label: LocalizedText;
  fileType: ReleaseFileType;
  href: string;
  size: string;
}

export interface Version {
  id: string;
  name: string;
  title: LocalizedText;
  status: VersionStatus;
  parentVersionId: string | null;
  changelog: LocalizedText[];
  summary: LocalizedText;
  files: VersionFile[];
}

export interface Mod {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  baseVersionId: string;
  tags: LocalizedText[];
  compatibility: LocalizedText;
  author: string;
  downloadUrl: string;
}

export interface Fork {
  id: string;
  name: LocalizedText;
  baseVersionId: string;
  changes: LocalizedText[];
  files: VersionFile[];
  author: string;
}

export interface Thread {
  id: string;
  title: LocalizedText;
  content: LocalizedText;
  linkedVersionId?: string;
  linkedModId?: string;
  author: string;
  createdAt: string;
}

export interface RuleSection {
  id: string;
  title: LocalizedText;
  slug: string;
  content: LocalizedText;
  relatedSectionIds: string[];
}
