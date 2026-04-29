import { UserRole } from '@/types';

export function isBuyerLikeRole(role: UserRole | string | undefined) {
  return role === 'buyer' || role === 'expert';
}

export function getRoleLabel(role: UserRole | string | undefined) {
  if (role === 'supplier') return 'Proveedor';
  if (role === 'expert') return 'Experto Nodus';
  if (role === 'admin') return 'Administrador';
  return 'Comprador';
}

export function getRoleBadgeClass(role: UserRole | string | undefined) {
  if (role === 'supplier') return 'badge-provider hover:bg-[var(--role-provider-bg)]';
  if (role === 'expert') return 'badge-expert hover:bg-[var(--role-expert-bg)]';
  if (role === 'admin') return 'badge-admin hover:bg-[var(--role-admin-bg)]';
  return 'badge-buyer hover:bg-[var(--role-buyer-bg)]';
}
