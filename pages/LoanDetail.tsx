import React, { useMemo, useState } from 'react';
import { Loan, LoanStatus, RepaymentItem } from '../types';
import { translations, Language } from '../translations';
import { ArrowLeft, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, FileText, X, Check, Circle, TrendingUp, Phone, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface LoanDetailProps {
  loan: Loan;
  onBack: () => void;
  onRepay: (loanId: string, paymentId: string, amount: number, note: string) => void;
  lang: Language;
}

export const LoanDetail: React.FC<LoanDetailProps> = ({ loan, onBack, onRepay, lang }) => {
  const t = translations[lang];
  const progress = Math.min(100, (loan.amountRepaid / loan.totalRepayment) * 100);
  const remaining = loan.totalRepayment - loan.amountRepaid;
  const currencySymbol = loan.currencyCode === 'USD' ? '$' : '៛';

  const [selectedPayment, setSelectedPayment] = useState<RepaymentItem | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');
  
  const handleOpenPayment = (item: RepaymentItem) => {
    setSelectedPayment(item);
    setPayAmount(item.amount.toString());
    setPayNote('');
  };

  const submitPayment = () => {
    if (!selectedPayment) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount < 0) return;
    
    onRepay(loan.id, selectedPayment.id, amount, payNote);
    setSelectedPayment(null);
  };

  // Chart Data Preparation
  const chartData = useMemo(() => {
    let runningTotal = 0;
    return loan.repaymentSchedule.map((item, index) => {
      // Use actualAmount if available, otherwise assume full amount if Paid
      const paidAmt = item.actualAmount !== undefined ? item.actualAmount : (item.status === 'Paid' ? item.amount : 0);
      runningTotal += paidAmt;
      
      return {
        name: index + 1,
        date: item.dueDate,
        expected: (index + 1) * item.amount,
        actual: runningTotal,
        amt: item.amount
      };
    });
  }, [loan.repaymentSchedule]);

  return (
    <div className="space-y-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Payment Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">{t.record_payment}</h3>
              <button onClick={() => setSelectedPayment(null)} className="text-white/70 hover:text-white transition-colors bg-white/10 p-1 rounded-full hover:bg-white/20">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                 <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Expected Amount</p>
                 <p className="text-xl font-bold text-gray-900">{currencySymbol}{selectedPayment.amount.toFixed(2)}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">{t.payment_date}</label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm flex items-center gap-2">
                   <Calendar size={18} className="text-gray-400"/> {new Date().toLocaleDateString()}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">{t.payment_amount} ({currencySymbol})</label>
                <div className="relative">
                   <span className="absolute left-4 top-3.5 text-gray-400 font-bold">{currencySymbol}</span>
                   <input 
                    type="number" 
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aqua-500 outline-none font-bold text-gray-900 text-lg transition-all"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    autoFocus
                   />
                </div>
                {parseFloat(payAmount) < selectedPayment.amount && parseFloat(payAmount) > 0 && (
                  <p className="text-xs text-orange-600 mt-2 flex items-center gap-1.5 bg-orange-50 p-2 rounded-lg">
                    <AlertCircle size={14} /> <span>Marking as <b>Partial Payment</b></span>
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">{t.payment_note}</label>
                <textarea 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aqua-500 outline-none text-sm min-h-[80px]"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>
              
              <button 
                onClick={submitPayment}
                className="w-full bg-aqua-600 text-white py-3.5 rounded-xl font-bold hover:bg-aqua-700 transition-all shadow-lg shadow-aqua-500/20 active:scale-[0.98]"
              >
                {t.save_payment}
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={onBack}
        className="group flex items-center text-gray-500 hover:text-gray-900 transition-colors font-medium text-sm mb-2 px-1"
      >
        <div className="bg-gray-100 p-1.5 rounded-full mr-2 group-hover:bg-gray-200 transition-colors">
          <ArrowLeft size={14} />
        </div>
        Back to Dashboard
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
               <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{loan.borrowerName}</h1>
               <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                  ${loan.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 
                    loan.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                 {loan.status}
               </span>
            </div>
            <p className="text-gray-500 mt-2 flex items-center gap-2 text-sm bg-gray-50 inline-block px-3 py-1.5 rounded-lg border border-gray-100">
               <span className="font-semibold text-gray-400 uppercase text-xs">Purpose</span> 
               <span className="text-gray-900 font-medium">"{loan.purpose}"</span>
            </p>
          </div>
          <div className="text-left md:text-right bg-aqua-50/50 p-4 rounded-xl border border-aqua-100 min-w-[200px]">
            <p className="text-xs font-bold text-aqua-800 uppercase tracking-wide opacity-70">{t.total_repayment}</p>
            <p className="text-3xl font-extrabold text-aqua-700 mt-1">{currencySymbol}{loan.totalRepayment.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex justify-between text-sm font-bold mb-2">
            <span className="text-gray-700">{t.progress}</span>
            <span className="text-aqua-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-aqua-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(20,184,166,0.5)]" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs font-medium text-gray-500 mt-2">
            <span>{currencySymbol}{loan.amountRepaid.toLocaleString()} {t.paid}</span>
            <span>{currencySymbol}{remaining.toLocaleString()} Remaining</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
               <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <TrendingUp size={20} />
               </div>
               <h3 className="text-lg font-bold text-gray-900">Repayment Trend</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currencySymbol}${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Area type="monotone" dataKey="actual" stroke="#14b8a6" fillOpacity={1} fill="url(#colorActual)" strokeWidth={3} name="Repaid" />
                  <Line type="monotone" dataKey="expected" stroke="#cbd5e1" strokeDasharray="5 5" strokeWidth={2} name="Target" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
               <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Clock size={20} />
               </div>
               <h3 className="text-lg font-bold text-gray-900">Repayment Schedule</h3>
            </div>
            
            <div className="p-6 relative">
              {/* Vertical Line */}
              <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-gray-100"></div>

              <div className="space-y-6">
                {loan.repaymentSchedule.map((item, idx) => {
                   const isLate = new Date(item.dueDate) < new Date() && item.status === 'Pending';
                   const isPartial = item.status === 'Partial';
                   const isPaid = item.status === 'Paid';
                   
                   let statusColor = 'bg-gray-100 text-gray-400 border-gray-200';
                   if (isPaid) statusColor = 'bg-green-100 text-green-600 border-green-200';
                   else if (isPartial) statusColor = 'bg-orange-100 text-orange-600 border-orange-200';
                   else if (isLate) statusColor = 'bg-red-50 text-red-500 border-red-200';

                   return (
                    <div key={item.id} className="relative pl-12 group">
                      {/* Dot */}
                      <div className={`absolute left-0 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${statusColor} ${isPaid ? 'bg-green-500 border-green-100 text-white' : ''}`}>
                         {isPaid && <Check size={12} strokeWidth={4} />}
                         {!isPaid && <div className={`w-2 h-2 rounded-full ${isLate ? 'bg-red-500' : isPartial ? 'bg-orange-500' : 'bg-gray-300'}`}></div>}
                      </div>

                      <div className={`p-4 rounded-xl border transition-all ${isPaid ? 'bg-gray-50/50 border-gray-100' : 'bg-white border-gray-200 hover:border-aqua-300 hover:shadow-md'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-gray-900">Payment #{idx + 1}</span>
                              <span className="text-xs text-gray-400 font-medium">{item.dueDate}</span>
                              {isLate && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">Overdue</span>}
                            </div>
                            
                            {item.note && (
                              <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-600 bg-yellow-50/50 p-2 rounded-lg border border-yellow-100/50 max-w-md">
                                 <FileText size={12} className="mt-0.5 shrink-0 text-yellow-600" /> 
                                 <span className="italic">{item.note}</span>
                              </div>
                            )}
                          </div>

                          <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-0">
                             <div>
                                <div className="font-bold text-gray-900 text-lg">{currencySymbol}{item.amount.toFixed(2)}</div>
                                {item.actualAmount !== undefined && (
                                   <div className={`text-xs font-bold ${isPartial ? 'text-orange-500' : 'text-green-600'}`}>
                                     Paid: {currencySymbol}{item.actualAmount.toFixed(2)}
                                   </div>
                                )}
                             </div>

                             {(item.status === 'Pending' || item.status === 'Partial') && (
                                <button 
                                  onClick={() => handleOpenPayment(item)}
                                  className="text-xs font-bold bg-aqua-500 text-white hover:bg-aqua-600 px-4 py-2 rounded-lg transition-colors shadow-sm shadow-aqua-200"
                                >
                                  {t.record_payment}
                                </button>
                              )}
                              {item.status === 'Paid' && (
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                  Completed
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">Loan Details</h3>
            <ul className="space-y-5 text-sm">
              <li className="flex justify-between items-center group">
                <span className="text-gray-500 flex items-center gap-2"><Calendar size={14}/> Start Date</span>
                <span className="font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-gray-100 transition-colors">{loan.startDate}</span>
              </li>
              <li className="flex justify-between items-center group">
                <span className="text-gray-500 flex items-center gap-2"><Calendar size={14}/> End Date</span>
                <span className="font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-gray-100 transition-colors">{loan.endDate}</span>
              </li>
              <li className="flex justify-between items-center group">
                <span className="text-gray-500 flex items-center gap-2"><Clock size={14}/> Frequency</span>
                <span className="font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-gray-100 transition-colors">{loan.frequency}</span>
              </li>
              <li className="flex justify-between items-center group">
                <span className="text-gray-500 flex items-center gap-2"><DollarSign size={14}/> Interest Rate</span>
                <span className="font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-gray-100 transition-colors">{loan.interestRate}%</span>
              </li>
              {loan.borrowerPhone && (
                <li className="flex justify-between items-center group">
                   <span className="text-gray-500 flex items-center gap-2"><Phone size={14}/> Phone</span>
                   <span className="font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-gray-100 transition-colors">{loan.borrowerPhone}</span>
                </li>
              )}
              {loan.borrowerAddress && (
                <li className="flex justify-between items-start group">
                   <span className="text-gray-500 flex items-center gap-2 mt-0.5"><MapPin size={14}/> Address</span>
                   <span className="font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded-md group-hover:bg-gray-100 transition-colors text-right max-w-[150px]">{loan.borrowerAddress}</span>
                </li>
              )}
               <li className="pt-4 border-t border-gray-50">
                <span className="text-gray-400 font-bold text-xs uppercase block mb-2">Notes</span>
                <p className="text-gray-600 bg-yellow-50/30 border border-yellow-100 p-4 rounded-xl text-xs leading-relaxed italic">
                  {loan.notes || "No notes provided."}
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};