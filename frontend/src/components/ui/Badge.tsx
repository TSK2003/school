import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, Clock, XCircle, FileText } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'outline'
    | 'matched'
    | 'mismatch'
    | 'pending'
    | 'verified'
    | 'rejected';
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  showIcon = false,
  children,
  ...props
}) => {
  const styles = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    outline: 'border border-slate-300 text-slate-700 bg-white',
    matched: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    mismatch: 'bg-rose-50 text-rose-700 border-rose-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  const icons: Record<string, React.ReactNode> = {
    matched: <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />,
    mismatch: <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />,
    pending: <Clock className="w-3 h-3 text-amber-600 shrink-0" />,
    verified: <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />,
    rejected: <XCircle className="w-3 h-3 text-rose-600 shrink-0" />,
    info: <FileText className="w-3 h-3 text-blue-600 shrink-0" />
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        styles[variant],
        className
      )}
      {...props}
    >
      {showIcon && icons[variant]}
      {children}
    </span>
  );
};
