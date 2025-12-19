import { supabase } from './supabase';
import { Loan, LoanStatus, RepaymentItem, DBLoan, DBRepayment, RepaymentFrequency } from '../types';

// Helper: map DB loan to frontend Loan
const mapLoanFromDB = (dbLoan: DBLoan, dbSchedule: DBRepayment[]): Loan => {
  const schedule: RepaymentItem[] = dbSchedule.map(item => ({
    id: item.id,
    dueDate: item.due_date,
    amount: item.expected_amount, // DB: expected_amount
    status: item.status as any,
    paidDate: item.paid_at || undefined, // DB: paid_at
    actualAmount: item.actual_paid_amount || 0, // DB: actual_paid_amount
    note: item.note || ''
  }));

  // Calculate status dynamically if needed, but prefer DB status
  const isFullyRepaid = dbLoan.amount_repaid >= (dbLoan.total_repayment_amount - 0.1);
  const derivedStatus = isFullyRepaid ? LoanStatus.Completed : LoanStatus.Active;
  const status = (dbLoan.status as LoanStatus) || derivedStatus;

  return {
    id: dbLoan.id,
    borrowerName: dbLoan.borrower_name,
    borrowerPhone: dbLoan.borrower_phone, 
    borrowerAddress: dbLoan.borrower_address, 
    amount: dbLoan.principal_amount, 
    currencyCode: dbLoan.currency_code,
    interestRate: dbLoan.interest_rate,
    durationValue: dbLoan.duration_value,
    durationUnit: dbLoan.duration_unit,
    frequency: (dbLoan.repayment_frequency as RepaymentFrequency) || RepaymentFrequency.Monthly,
    startDate: dbLoan.start_date,
    endDate: dbLoan.end_date,
    totalRepayment: dbLoan.total_repayment_amount, 
    notes: dbLoan.borrower_note || '', 
    purpose: dbLoan.purpose,
    status: status,
    repaymentSchedule: schedule,
    amountRepaid: dbLoan.amount_repaid,
    createdAt: dbLoan.created_at
  };
};

export const api = {
  // --- Loans ---
  async getLoans(userId: string): Promise<Loan[]> {
    // 1. Fetch Loans
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('lender_id', userId)
      .order('created_at', { ascending: false });

    if (loansError) {
        console.error("Error fetching loans:", loansError);
        throw loansError;
    }
    if (!loans || loans.length === 0) return [];

    const loanIds = loans.map(l => l.id);

    // 2. Fetch Schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('repayment_schedule')
      .select('*')
      .in('loan_id', loanIds)
      .order('due_date', { ascending: true });

    if (scheduleError) {
         console.error("Error fetching schedule:", scheduleError);
         return loans.map(loan => mapLoanFromDB(loan, []));
    }

    // 3. Map Data
    return loans.map(loan => {
      const loanSchedule = schedule?.filter(s => s.loan_id === loan.id) || [];
      return mapLoanFromDB(loan, loanSchedule);
    });
  },

  async createLoan(loan: Loan, userId: string): Promise<void> {
    
    // 1. Insert into 'loans' table
    // RESTORED: repayment_frequency and status are now included because the DB SQL fixes it.
    const { data: loanData, error: loanError } = await supabase
      .from('loans')
      .insert({
        lender_id: userId,
        borrower_name: loan.borrowerName,
        borrower_phone: loan.borrowerPhone,
        borrower_address: loan.borrowerAddress,
        purpose: loan.purpose,
        borrower_note: loan.notes,
        principal_amount: loan.amount,
        currency_code: loan.currencyCode,
        interest_rate: loan.interestRate,
        interest_type: 'Simple',
        duration_value: loan.durationValue,
        duration_unit: loan.durationUnit,
        repayment_frequency: loan.frequency, // Restored
        total_repayment_amount: loan.totalRepayment,
        amount_repaid: 0,
        status: loan.status, // Restored
        start_date: loan.startDate,
        end_date: loan.endDate
      })
      .select()
      .single();

    if (loanError) {
        // Handle missing profile FK error
        if (loanError.code === '23503') {
             console.warn("User profile missing in 'profiles' table, attempting to create...");
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
                 await api.updateProfile(
                     user.id, 
                     user.user_metadata?.name || 'Lender', 
                     user.user_metadata?.phone || '', 
                     undefined, 
                     'lender'
                 );
                 return api.createLoan(loan, userId);
             }
        }
        throw loanError;
    }

    if (!loanData) {
      throw new Error("Failed to create loan: No data returned from database.");
    }

    // 2. Insert into 'repayment_schedule' table
    const scheduleInserts = loan.repaymentSchedule.map(item => ({
      loan_id: loanData.id,
      due_date: item.dueDate,
      expected_amount: item.amount,
      status: item.status,
      actual_paid_amount: 0
    }));

    const { error: scheduleError } = await supabase
      .from('repayment_schedule')
      .insert(scheduleInserts);

    if (scheduleError) throw scheduleError;
  },

  async updateRepayment(loanId: string, scheduleId: string, amount: number, note: string, totalRepaid: number, isCompleted: boolean): Promise<void> {
    // 1. Get current item to calculate status
    const { data: item } = await supabase.from('repayment_schedule').select('expected_amount').eq('id', scheduleId).single();
    if (!item) throw new Error("Payment item not found");

    const status = amount >= item.expected_amount ? 'Paid' : 'Partial';

    // 2. Update 'repayment_schedule'
    const { error: repaymentError } = await supabase
      .from('repayment_schedule')
      .update({
        actual_paid_amount: amount, 
        paid_at: new Date().toISOString(),
        status,
        note
      })
      .eq('id', scheduleId);

    if (repaymentError) throw repaymentError;

    // 3. Log the payment in 'repayment_logs'
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('repayment_logs').insert({
        loan_id: loanId,
        schedule_id: scheduleId,
        amount: amount,
        recorded_by: user.id
      });
    }

    // 4. Update 'loans' totals
    // Restored updating the status to Completed if finished
    const { error: loanError } = await supabase
      .from('loans')
      .update({
        amount_repaid: totalRepaid,
        status: isCompleted ? 'Completed' : 'Active' 
      })
      .eq('id', loanId);

    if (loanError) throw loanError;
  },

  // --- Profile (Using 'profiles' table) ---
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, created_at')
      .eq('id', userId)
      .maybeSingle();
      
    if (data) {
        return { 
            data: { 
                ...data, 
                name: data.full_name 
            }, 
            error 
        };
    }
    return { data: null, error };
  },

  async updateProfile(userId: string, name: string, phone: string, password?: string, role: string = 'lender') {
    const payload: any = {
      id: userId,
      full_name: name,
      phone: phone, 
      role: role
    };

    if (password) {
      payload.password = password;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });
      
    if (error) {
      console.error("Supabase profile upsert error:", error);
      throw error;
    }
  }
};