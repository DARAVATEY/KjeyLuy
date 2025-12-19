import React, { useState, useEffect } from 'react';
import { Loan, LoanStatus, RepaymentFrequency, RepaymentItem } from '../types';
import { translations, Language } from '../translations';
import { Calendar, DollarSign, Clock, AlertCircle, CheckCircle, Loader2, User, FileText, ArrowLeft, Coins, Phone, MapPin } from 'lucide-react';

interface CreateLoanProps {
  onSave: (loan: Loan) => Promise<void>; // Updated to return Promise
  onCancel: () => void;
  lang: Language;
}

export const CreateLoan: React.FC<CreateLoanProps> = ({ onSave, onCancel, lang }) => {
  const t = translations[lang];
  const [loading, setLoading] = useState(false);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerAddress, setBorrowerAddress] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [currencyCode, setCurrencyCode] = useState<'USD' | 'KHR'>('USD');
  const [interestRate, setInterestRate] = useState<number>(5);
  const [durationValue, setDurationValue] = useState<number>(30);
  const [durationUnit, setDurationUnit] = useState<'Days' | 'Months'>('Days');
  const [frequency, setFrequency] = useState<RepaymentFrequency>(RepaymentFrequency.Daily);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Derived state
  const [totalRepayment, setTotalRepayment] = useState(0);
  const [paymentPerPeriod, setPaymentPerPeriod] = useState(0);
  const [endDate, setEndDate] = useState('');

  const currencySymbol = currencyCode === 'USD' ? '$' : '៛';

  // Calculations
  useEffect(() => {
    // 1. Total Repayment (Simple Interest)
    const interestAmt = amount * (interestRate / 100);
    const total = amount + interestAmt;
    setTotalRepayment(total);

    // 2. End Date
    const start = new Date(startDate);
    const end = new Date(start);
    if (durationUnit === 'Days') {
      end.setDate(start.getDate() + durationValue);
    } else {
      end.setMonth(start.getMonth() + durationValue);
    }
    setEndDate(end.toISOString().split('T')[0]);

    // 3. Payment Per Period
    let periods = 0;
    const durationInDays = durationUnit === 'Days' ? durationValue : durationValue * 30; // approx

    if (frequency === RepaymentFrequency.Daily) periods = durationInDays;
    if (frequency === RepaymentFrequency.Weekly) periods = Math.floor(durationInDays / 7);
    if (frequency === RepaymentFrequency.Monthly) periods = Math.floor(durationInDays / 30);

    // Prevent division by zero
    periods = Math.max(1, periods);
    setPaymentPerPeriod(total / periods);

  }, [amount, interestRate, durationValue, durationUnit, frequency, startDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName || amount <= 0) return;

    setLoading(true);
    setError('');

    // Generate Repayment Schedule Mock
    const schedule: RepaymentItem[] = [];
    const periods = Math.round(totalRepayment / paymentPerPeriod);
    const start = new Date(startDate);
    
    for (let i = 1; i <= periods; i++) {
        const date = new Date(start);
        if (frequency === RepaymentFrequency.Daily) date.setDate(start.getDate() + i);
        if (frequency === RepaymentFrequency.Weekly) date.setDate(start.getDate() + (i * 7));
        if (frequency === RepaymentFrequency.Monthly) date.setMonth(start.getMonth() + i);
        
        schedule.push({
            id: Math.random().toString(36).substr(2, 9),
            dueDate: date.toISOString().split('T')[0],
            amount: paymentPerPeriod,
            status: 'Pending'
        });
    }

    const newLoan: Loan = {
      id: '', // Will be assigned by DB
      borrowerName,
      borrowerPhone,
      borrowerAddress,
      amount,
      currencyCode,
      interestRate,
      durationValue,
      durationUnit,
      frequency,
      startDate,
      endDate,
      totalRepayment,
      notes,
      purpose: '', // Purpose removed from UI, setting to empty string
      status: LoanStatus.Active,
      repaymentSchedule: schedule,
      amountRepaid: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await onSave(newLoan);
      // Success is handled by parent unmounting this component
    } catch (err) {
      // If error occurs, stop loading so user can try again
      setLoading(false);
      // Error alert is handled in App.tsx, but we can also show a local message if we want
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onCancel}
        className="group flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm mb-4 px-1"
      >
        <div className="bg-gray-100 p-1.5 rounded-full mr-2 group-hover:bg-gray-200 transition-colors">
          <ArrowLeft size={14} />
        </div>
        Cancel
      </button>

      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">{t.create_loan_title}</h2>
          <p className="text-gray-300 text-sm mt-1">{t.create_loan_subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          
          {/* Section: Borrower Info */}
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Borrower Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">{t.borrower_name}</label>
                <div className="relative">
                   <span className="absolute left-3.5 top-3 text-gray-400"><User size={18} /></span>
                   <input 
                    type="text" 
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-500 focus:border-aqua-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
                    placeholder="e.g. Sokha Chan"
                    value={borrowerName}
                    onChange={e => setBorrowerName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Phone Number (Optional)</label>
                <div className="relative">
                   <span className="absolute left-3.5 top-3 text-gray-400"><Phone size={18} /></span>
                   <input 
                    type="tel" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
                    placeholder="012 345 678"
                    value={borrowerPhone}
                    onChange={e => setBorrowerPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Address (Optional)</label>
                <div className="relative">
                   <span className="absolute left-3.5 top-3 text-gray-400"><MapPin size={18} /></span>
                   <input 
                    type="text" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
                    placeholder="e.g. #123 St 456, Phnom Penh"
                    value={borrowerAddress}
                    onChange={e => setBorrowerAddress(e.target.value)}
                  />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">{t.loan_amount}</label>
                <div className="flex gap-3">
                   <div className="relative flex-1">
                    <span className="absolute left-3.5 top-3 text-gray-400 font-bold text-sm">{currencySymbol}</span>
                    <input 
                      type="number" 
                      min="1"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-500 outline-none transition-all bg-gray-50/50 focus:bg-white font-medium"
                      placeholder="0.00"
                      value={amount || ''}
                      onChange={e => setAmount(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="w-32 bg-gray-50 rounded-xl border border-gray-200 p-1 flex relative">
                     <button
                       type="button"
                       onClick={() => setCurrencyCode('USD')}
                       className={`flex-1 rounded-lg text-sm font-bold transition-all ${currencyCode === 'USD' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                     >
                       USD
                     </button>
                     <button
                       type="button"
                       onClick={() => setCurrencyCode('KHR')}
                       className={`flex-1 rounded-lg text-sm font-bold transition-all ${currencyCode === 'KHR' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                     >
                       KHR
                     </button>
                  </div>
                </div>
              </div>
            
             <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Notes (Optional)</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-500 outline-none min-h-[60px] bg-gray-50/50 focus:bg-white transition-all text-sm"
                  placeholder="Additional details..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
          </div>

          {/* Section: Terms */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Loan Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">{t.interest_rate}</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-500 outline-none bg-gray-50/50 focus:bg-white"
                    value={interestRate}
                    onChange={e => setInterestRate(parseFloat(e.target.value))}
                  />
                  <span className="absolute right-4 top-2.5 text-gray-400 font-medium">%</span>
                </div>
              </div>
               <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700 block">{t.duration}</label>
                <div className="flex gap-3">
                  <input 
                    type="number" 
                    min="1"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-500 outline-none bg-gray-50/50 focus:bg-white"
                    value={durationValue}
                    onChange={e => setDurationValue(parseInt(e.target.value))}
                  />
                  <select 
                    className="w-32 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white outline-none focus:ring-2 focus:ring-aqua-500 cursor-pointer"
                    value={durationUnit}
                    onChange={e => setDurationUnit(e.target.value as any)}
                  >
                    <option value="Days">Days</option>
                    <option value="Months">Months</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">{t.repayment_freq}</label>
                <div className="relative">
                   <span className="absolute left-3.5 top-3 text-gray-400"><Clock size={18} /></span>
                   <select 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-aqua-500 outline-none cursor-pointer appearance-none"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as RepaymentFrequency)}
                  >
                    <option value={RepaymentFrequency.Daily}>Daily</option>
                    <option value={RepaymentFrequency.Weekly}>Weekly</option>
                    <option value={RepaymentFrequency.Monthly}>Monthly</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">{t.start_date}</label>
                <div className="relative">
                   <input 
                    type="date" 
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-aqua-500 outline-none bg-gray-50/50 focus:bg-white"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Auto-Calculated Summary */}
          <div className="bg-aqua-50/50 rounded-2xl p-6 border border-aqua-100/50">
            <h4 className="text-xs font-bold text-aqua-800 uppercase tracking-widest mb-4">Summary Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t.total_repayment}</p>
                <p className="text-xl font-extrabold text-gray-900 tracking-tight">{currencySymbol}{totalRepayment.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{t.per_period}</p>
                <p className="text-xl font-extrabold text-gray-900 tracking-tight">{currencySymbol}{paymentPerPeriod.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{t.end_date}</p>
                <p className="text-lg font-bold text-gray-900">{endDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">{t.interest}</p>
                <p className="text-lg font-bold text-gray-900 text-green-600">+{currencySymbol}{(totalRepayment - amount).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-4 border-t border-gray-100">
             {error && (
               <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2 text-sm font-medium animate-in slide-in-from-bottom-2">
                 <AlertCircle size={18} className="shrink-0" />
                 {error}
               </div>
             )}
             <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 rounded-xl bg-aqua-600 text-white hover:bg-aqua-700 font-bold shadow-lg shadow-aqua-500/30 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-lg active:scale-[0.99]"
             >
               {loading ? (
                 <>
                  <Loader2 className="animate-spin" size={24}/> {t.saving || "Processing..."}
                 </>
               ) : (
                 <>
                  <CheckCircle size={24}/> {t.save_loan}
                 </>
               )}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};