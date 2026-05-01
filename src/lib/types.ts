import type { LocalizedText } from '@/lib/i18n';

export type VersionStatus = 'stable' | 'beta' | 'experimental';

export type ReleaseFileType = 'rules' | 'cards' | 'driver_pack' | 'bundle';
export type VersionTransitionType = 'upgrade' | 'fallback';
export type ReleaseFileDeliveryMode = 'public' | 'redeem';
export type VersionPurchaseMode = 'owned' | 'transition' | 'first_purchase';

export interface VersionFile {
  id: string;
  label: LocalizedText;
  fileType: ReleaseFileType;
  href: string;
  size: string;
  deliveryMode?: ReleaseFileDeliveryMode;
  mediafireQuickKey?: string | null;
}

export interface VersionTransitionPrice {
  id: string;
  fromVersionId: string;
  fromVersionName: string;
  toVersionId: string;
  transitionType: VersionTransitionType;
  tokenPrice: number;
}

export interface Version {
  id: string;
  name: string;
  title: LocalizedText;
  status: VersionStatus;
  parentVersionId: string | null;
  changelog: LocalizedText[];
  summary: LocalizedText;
  firstPurchaseTokenPrice: number;
  transitionPrices: VersionTransitionPrice[];
  files: VersionFile[];
  officialReleaseAt?: string | null;
  withdrawnAt?: string | null;
  isLicensed?: boolean;
  effectivePricePreview?: number;
  purchaseModePreview?: VersionPurchaseMode;
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

export interface AuthorProfile {
  id?: string;
  name: string;
  isDeveloper: boolean;
}

export interface Thread {
  id: string;
  title: LocalizedText;
  content: LocalizedText;
  linkedVersionId?: string;
  linkedModId?: string;
  author: AuthorProfile;
  createdAt: string;
  updatedAt: string;
  status: 'published' | 'hidden' | 'locked';
  replyCount: number;
}

export interface ThreadReply {
  id: string;
  threadId: string;
  content: LocalizedText;
  author: AuthorProfile;
  createdAt: string;
  updatedAt: string;
  status: 'published' | 'hidden';
}

export interface ThreadDetail extends Thread {
  replies: ThreadReply[];
}

export interface RuleSection {
  id: string;
  title: LocalizedText;
  slug: string;
  content: LocalizedText;
  relatedSectionIds: string[];
}
