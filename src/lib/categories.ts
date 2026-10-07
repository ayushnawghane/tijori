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
  { id: 'food', label: 'Food & dining', icon: 'fast-food-outline', color: '#C27B66', kind: 'expense' },
  { id: 'groceries', label: 'Groceries', icon: 'basket-outline', color: '#7D9A6B', kind: 'expense' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle-outline', color: '#B47D8C', kind: 'expense' },
  { id: 'transport', label: 'Travel & transport', icon: 'car-outline', color: '#5F8A8B', kind: 'expense' },
  { id: 'bills', label: 'Bills & utilities', icon: 'flash-outline', color: '#C49A48', kind: 'expense' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline', color: '#8C7A9E', kind: 'expense' },
  { id: 'health', label: 'Health', icon: 'medkit-outline', color: '#B5584F', kind: 'expense' },
  { id: 'education', label: 'Education', icon: 'school-outline', color: '#5D7896', kind: 'expense' },
  { id: 'rent', label: 'Rent & home', icon: 'home-outline', color: '#9C6B45', kind: 'expense' },
  { id: 'emi', label: 'EMI & insurance', icon: 'card-outline', color: '#7A8278', kind: 'expense' },
  { id: 'investments', label: 'Investments', icon: 'trending-up-outline', color: '#4F7A5E', kind: 'expense' },
  { id: 'cash', label: 'Cash', icon: 'cash-outline', color: '#8C9A84', kind: 'expense' },
  { id: 'transfers', label: 'Transfers', icon: 'swap-horizontal-outline', color: '#7E8A97', kind: 'both' },
  { id: 'uncategorized', label: 'Uncategorized', icon: 'pricetag-outline', color: '#A39C90', kind: 'both' },
  { id: 'salary', label: 'Salary', icon: 'briefcase-outline', color: '#5A7D55', kind: 'income' },
  { id: 'refund', label: 'Refunds & cashback', icon: 'return-down-back-outline', color: '#6B8FA3', kind: 'income' },
  { id: 'other_income', label: 'Other income', icon: 'wallet-outline', color: '#6E9486', kind: 'income' },
];

const BY_ID = new Map<string, Category>(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category {
  return BY_ID.get(id) ?? BY_ID.get('uncategorized')!;
}

export function categoriesFor(type: TxnType): Category[] {
  const wanted: CategoryKind = type === 'debit' ? 'expense' : 'income';
  return CATEGORIES.filter((c) => c.kind === wanted || c.kind === 'both');
}
