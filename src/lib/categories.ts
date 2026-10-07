import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import type { TxnType } from './types';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export type CategoryId =
  | 'food'
  | 'groceries'
  | 'shopping'
  | 'transport'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'rent'
  | 'emi'
  | 'investments'
  | 'transfers'
  | 'cash'
  | 'uncategorized'
  | 'salary'
  | 'refund'
  | 'other_income';

export type CategoryKind = 'expense' | 'income' | 'both';

export interface Category {
  id: CategoryId;
  label: string;
  icon: IoniconName;
  color: string;
  kind: CategoryKind;
}

export const CATEGORIES: readonly Category[] = [
  { id: 'food', label: 'Food & dining', icon: 'fast-food', color: '#F97316', kind: 'expense' },
  { id: 'groceries', label: 'Groceries', icon: 'basket', color: '#65A30D', kind: 'expense' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle', color: '#EC4899', kind: 'expense' },
  { id: 'transport', label: 'Travel & transport', icon: 'car', color: '#0891B2', kind: 'expense' },
  { id: 'bills', label: 'Bills & utilities', icon: 'flash', color: '#CA8A04', kind: 'expense' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film', color: '#8B5CF6', kind: 'expense' },
  { id: 'health', label: 'Health', icon: 'medkit', color: '#E11D48', kind: 'expense' },
  { id: 'education', label: 'Education', icon: 'school', color: '#2563EB', kind: 'expense' },
  { id: 'rent', label: 'Rent & home', icon: 'home', color: '#B45309', kind: 'expense' },
  { id: 'emi', label: 'EMI & insurance', icon: 'card', color: '#64748B', kind: 'expense' },
  { id: 'investments', label: 'Investments', icon: 'trending-up', color: '#059669', kind: 'expense' },
  { id: 'cash', label: 'Cash', icon: 'cash', color: '#16A34A', kind: 'expense' },
  { id: 'transfers', label: 'Transfers', icon: 'swap-horizontal', color: '#6B7F99', kind: 'both' },
  { id: 'uncategorized', label: 'Uncategorized', icon: 'pricetag', color: '#8B9691', kind: 'both' },
  { id: 'salary', label: 'Salary', icon: 'briefcase', color: '#15803D', kind: 'income' },
  { id: 'refund', label: 'Refunds & cashback', icon: 'return-down-back', color: '#0284C7', kind: 'income' },
  { id: 'other_income', label: 'Other income', icon: 'wallet', color: '#0D9488', kind: 'income' },
];

const BY_ID = new Map<string, Category>(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category {
  return BY_ID.get(id) ?? BY_ID.get('uncategorized')!;
}

export function categoriesFor(type: TxnType): Category[] {
  const wanted: CategoryKind = type === 'debit' ? 'expense' : 'income';
  return CATEGORIES.filter((c) => c.kind === wanted || c.kind === 'both');
}
