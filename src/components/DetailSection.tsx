import type { ReactNode } from 'react';

interface DetailSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A titled section wrapper that only renders when children are present.
 */
export default function DetailSection({ title, icon, children, className = '' }: DetailSectionProps) {
  return (
    <section className={`detail-section ${className}`}>
      <h2>
        {icon && <span className="section-icon">{icon}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}
