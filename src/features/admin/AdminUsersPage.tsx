import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/StatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { formatDate, formatDateTime } from '@/lib/format';
import { getPrimaryAccountType, getRoleLabels } from '@/lib/user-display';
import { Users, Edit, Eye, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type SortConfig = {
  column: string;
  order: 'asc' | 'desc';
};

function SortIcon({ sort, column }: { sort: SortConfig; column: string }) {
  if (sort.column !== column) return <ArrowUpDown className="h-3 w-3 text-text-secondary" />;
  return sort.order === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

export function AdminUsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState<SortConfig>({ column: 'created_at', order: 'desc' });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', { search, status: statusFilter, sort_by: sort.column, sort_order: sort.order }],
    queryFn: () => usersService.listUsers({ search: search || undefined, status: statusFilter || undefined, sort_by: sort.column, sort_order: sort.order }),
  });

  const handleSort = (column: string) => {
    setSort((prev) => ({
      column,
      order: prev.column === column ? (prev.order === 'asc' ? 'desc' : 'asc') : 'desc',
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('admin.users.title')}</h1>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-[var(--radius-input)] bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder={t('admin.users.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select options={[{ value: '', label: t('common.allStatuses') }, { value: 'active', label: 'Active' }, { value: 'pending', label: 'Pending' }, { value: 'suspended', label: 'Suspended' }]}
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40" />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? <div className="p-4"><SkeletonTable /></div> : users && users.length > 0 ? (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => handleSort('email')}>
                  <div className="flex items-center gap-1">{t('admin.users.email')} <SortIcon sort={sort} column="email" /></div>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">{t('admin.users.status')} <SortIcon sort={sort} column="status" /></div>
                </th>
                <th className="text-left px-4 py-3 font-medium">{t('admin.users.roles')}</th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => handleSort('created_at')}>
                  <div className="flex items-center gap-1">{t('admin.users.createdAt')} <SortIcon sort={sort} column="created_at" /></div>
                </th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer select-none" onClick={() => handleSort('last_login_at')}>
                  <div className="flex items-center gap-1">{t('admin.users.lastLogin')} <SortIcon sort={sort} column="last_login_at" /></div>
                </th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                    <td className="px-4 py-3">
                      {user.roles?.length
                        ? `${getPrimaryAccountType(user.roles, t)}${getRoleLabels(user.roles, t).length > 1 ? ` (${getRoleLabels(user.roles, t).join(', ')})` : ''}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{user.createdAt ? formatDate(user.createdAt) : '-'}</td>
                    <td className="px-4 py-3 text-text-secondary">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '-'}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/users/${user.id}/profile`)}><Eye className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/edit/${user.id}`)}><Edit className="h-3 w-3" /></Button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="p-8"><EmptyState icon={<Users className="h-12 w-12" />} title={t('admin.users.empty')} /></div>}
        </CardContent>
      </Card>
    </div>
  );
}
