import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';

interface RoleBadgeProps {
  role: string;
  className?: string;
}

const roleVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent' | 'earth'> = {
  individual: 'default',
  legal_entity: 'accent',
  producer: 'earth',
  analyst: 'warning',
  administrator: 'info',
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const { t } = useTranslation();
  const variant = roleVariants[role] || 'default';

  return (
    <Badge variant={variant} className={className}>
      {t(`common.roles.${role}`, role)}
    </Badge>
  );
}
