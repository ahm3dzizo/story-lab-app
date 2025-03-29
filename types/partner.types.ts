export type Partner = {
  id: number;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone_number?: string;
  profile_picture_url?: string;
  specialization?: string;
  shares_percentage?: number;
  status: 'active' | 'inactive' | 'pending';
  join_date: string;
  total_distributions?: number;
  last_distribution_date?: string | null;
  this_month_profit?: number;
  this_month_expenses?: number;
  total_month?: number;
  partner_profit_distributions?: {
    distribution_amount: number;
    distribution_date: string;
    payment_method: string;
  }[];
};

export type PartnerInsert = Omit<Partner, 'id' | 'total_distributions' | 'last_distribution_date' | 'partner_profit_distributions'>;

export type ProfitDistribution = {
  partner_id: number;
  distribution_amount: number;
  distribution_date: string;
  payment_method: string;
}; 