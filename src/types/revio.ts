// Revio data type definitions

export interface RevioCustomer {
  id: string;
  name: string;
  email: string;
  company?: string;
  subscription_tier?: string;
  monthly_revenue?: number;
  sla_tier?: string;
  status: 'active' | 'trial' | 'churned';
}

export interface CustomersByTicket {
  status: string;
  count: number;
  customers: RevioCustomer[];
}

export interface CustomersBySLA {
  sla_tier: string;
  count: number;
  customers: RevioCustomer[];
}

export interface CustomersByRevenue {
  revenue_tier: string;
  count: number;
  total_revenue: number;
  customers: RevioCustomer[];
}

export interface SubscriptionStats {
  active: number;
  trial: number;
  churned: number;
}

export interface CustomerInteraction {
  customer_name: string;
  interaction_type: 'payment_received' | 'ticket_created' | 'subscription_upgraded' | 'subscription_downgraded';
  amount?: number;
  timestamp: string;
  details?: string;
}

export interface RevioDataResponse {
  customers_by_ticket: CustomersByTicket[];
  customers_by_sla: CustomersBySLA[];
  customers_by_revenue: CustomersByRevenue[];
  subscriptions: SubscriptionStats;
  recent_interactions: CustomerInteraction[];
}
