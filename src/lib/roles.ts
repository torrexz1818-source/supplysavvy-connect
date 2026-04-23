import { UserRole } from '@/types';

export function isBuyerLikeRole(role: UserRole | string | undefined) {
  return role === 'buyer' || role === 'expert';
}
