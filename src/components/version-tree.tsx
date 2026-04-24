import type { Version } from '@/lib/types';
import { localize, statusLabel, type Language } from '@/lib/i18n';

const statusClasses: Record<Version['status'], string> = {
  stable: 'dd-badge dd-status-stable',
  beta: 'dd-badge dd-status-beta',
  experimental: 'dd-badge dd-status-experimental',
};

export function VersionTree({ versions, language }: { versions: Version[]; language: Language }) {
  const roots = versions.filter((version) => !version.parentVersionId);

  return (
    <div className="space-y-4">
      {roots.map((root) => (
        <VersionNode key={root.id} version={root} versions={versions} depth={0} language={language} />
      ))}
    </div>
  );
}

function VersionNode({
  version,
  versions,
  depth,
  language,
}: {
  version: Version;
  versions: Version[];
  depth: number;
  language: Language;
}) {
  const children = versions.filter((candidate) => candidate.parentVersionId === version.id);

  return (
    <div className="space-y-3" style={{ marginLeft: depth * 20 }}>
      <div className="dd-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-[var(--font-heading)] text-lg uppercase tracking-[0.08em] text-[var(--text-main)]">{version.name}</h3>
              <span className={statusClasses[version.status]}>{statusLabel(version.status, language)}</span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-main)]">{localize(version.title, language)}</p>
            <p className="dd-copy mt-3 text-sm">{localize(version.summary, language)}</p>
          </div>
          <div className="dd-subpanel min-w-28 text-xs text-[var(--text-dim)]">
            <p className="dd-label">{language === 'en' ? 'Files' : '文件'}</p>
            <p className="mt-2 text-base font-semibold text-[var(--text-main)]">{version.files.length}</p>
          </div>
        </div>
      </div>

      {children.length > 0 ? (
        <div className="border-l border-dashed border-[rgba(85,199,255,0.25)] pl-4">
          {children.map((child) => (
            <VersionNode key={child.id} version={child} versions={versions} depth={depth + 1} language={language} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
