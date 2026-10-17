import React from 'react';
import { Percent, BarChart3, Building2, Leaf, BookOpen } from 'lucide-react';

interface SubjectIconProps {
  subjectId: string;
  className?: string;
  size?: number;
}

export const SubjectIcon: React.FC<SubjectIconProps> = ({
  subjectId,
  className = '',
  size = 16,
}) => {
  switch (subjectId) {
    case 'accountancy':
      return <Percent className={className} size={size} />;
    case 'statistics':
      return <BarChart3 className={className} size={size} />;
    case 'math':
      return <span className={`font-mono font-bold leading-none select-none text-[13px] ${className}`}>∑</span>;
    case 'business-studies':
      return <Building2 className={className} size={size} />;
    case 'micro-economics':
      return <Leaf className={className} size={size} />;
    default:
      return <BookOpen className={className} size={size} />;
  }
};
