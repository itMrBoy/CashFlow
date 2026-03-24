export interface Transaction {
  id: string;
  type: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  metadata?: string;
  note?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: string;
  first_billing_date: string;
  category: string;
  note?: string;
  created_at: string;
}
