import { Link } from 'react-router-dom';

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 border-b border-[rgba(85,199,255,0.18)] pb-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="dd-eyebrow">{eyebrow}</p>
          <h1 className="dd-title">{title}</h1>
          <p className="dd-description max-w-3xl">{description}</p>
        </div>
        {action ? (
          <Link to={action.href} className="dd-action">
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
