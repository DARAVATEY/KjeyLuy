export enum LoanStatus {
  Active = 'Active',
  Completed = 'Completed',
  Rejected = 'Rejected',
  Pending = 'Pending'
}

export enum RepaymentFrequency {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly'
}

export interface RepaymentItem {
  id: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partial';
  paidDate?: string;
  actualAmount?: number;
  note?: string;
}

export interface Loan {
  id: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerAddress?: string;
  amount: number;
  currencyCode: 'USD' | 'KHR';
  interestRate: number; // Percentage
  durationValue: number;
  durationUnit: 'Days' | 'Months';
  frequency: RepaymentFrequency;
  startDate: string;
  endDate: string;
  totalRepayment: number;
  notes: string;
  purpose: string;
  status: LoanStatus;
  repaymentSchedule: RepaymentItem[];
  amountRepaid: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  joinedDate: string;
  role?: 'lender' | 'borrower';
  // Email removed
}

// --- Database Types (Strictly matching provided SQL Schema) ---

export interface DBLoan {
  id: string;
  lender_id: string; // References profiles(id)
  borrower_name: string;
  borrower_phone?: string;
  borrower_address?: string;
  borrower_note?: string; // Maps to Frontend 'notes'
  principal_amount: number; // Maps to Frontend 'amount'
  interest_rate: number;
  interest_type: string; // 'Simple'
  duration_value: number;
  duration_unit: 'Days' | 'Months';
  total_repayment_amount: number; // Maps to Frontend 'totalRepayment'
  amount_repaid: number;
  currency_code: 'USD' | 'KHR';
  status: LoanStatus;
  purpose: string;
  // ai_decision and ai_reason removed to match schema
  start_date: string;
  end_date: string;
  repayment_frequency: string; // Added via SQL update
  created_at: string;
}

export interface DBRepayment {
  id: string;
  loan_id: string;
  due_date: string;
  expected_amount: number; // Maps to 'amount'
  actual_paid_amount: number; // Maps to 'actualAmount'
  status: string;
  paid_at: string | null; // Maps to 'paidDate'
  note: string | null;
  created_at: string;
}

export interface DBProfile {
  id: string;
  phone: string;
  full_name: string;
  password?: string;
  role?: string;
  created_at: string;
}