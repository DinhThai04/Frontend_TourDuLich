import type { ReactNode } from 'react';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: 'left' | 'center';
  action?: ReactNode;
  className?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className = '',
}: SectionHeaderProps) {
  if (align === 'center') {
    return (
      <div className={`text-center max-w-[720px] mx-auto mb-8 md:mb-10 ${className}`.trim()}>
        {eyebrow && (
          <p className="m-0 mb-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1F7A6E]">
            {eyebrow}
          </p>
        )}
        <h2 className="m-0 mb-3 text-[26px] leading-[34px] md:text-[36px] md:leading-[44px] font-bold text-[#134E48] tracking-[-0.02em]">
          {title}
        </h2>
        {description && (
          <div className="m-0 text-[15px] md:text-[16px] leading-[1.65] text-[#6B7280]">
            {description}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-10 ${className}`.trim()}>
      <div className="max-w-[680px]">
        {eyebrow && (
          <p className="m-0 mb-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#1F7A6E]">
            {eyebrow}
          </p>
        )}
        <h2 className="m-0 mb-2.5 text-[26px] leading-[34px] md:text-[36px] md:leading-[44px] font-bold text-[#134E48] tracking-[-0.02em]">
          {title}
        </h2>
        {description && (
          <div className="m-0 text-[15px] md:text-[16px] leading-[1.65] text-[#6B7280]">
            {description}
          </div>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3 shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
