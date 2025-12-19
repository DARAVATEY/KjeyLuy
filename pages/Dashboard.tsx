import React, { useState } from 'react';
import { Loan, LoanStatus } from '../types';
import { translations, Language } from '../translations';
import { Plus, TrendingUp, Users, DollarSign, ChevronRight, Search, LayoutDashboard } from 'lucide-react';

interface DashboardProps {
  loans: Loan[];
  onNavigate: (page: string, loanId?: string) => void;
  lang: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({ loans, onNavigate, lang }) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate stats
  // NOTE: For a real multi-currency app, you would separate totals by currency. 
  // For this prototype, we just sum raw numbers which might mix currencies.
  const totalLent = loans.filter(l => l.status === LoanStatus.Active || l.status === LoanStatus.Completed).reduce((sum, loan) => sum + loan.amount, 0);
  const activeLoans = loans.filter(l => l.status === LoanStatus.Active).length;
  const totalRepaid = loans.reduce((sum, loan) => sum + loan.amountRepaid, 0);
  
  const totalExpectedInterest = loans
    .filter(l => l.status !== LoanStatus.Rejected)
    .reduce((sum, loan) => sum + (loan.totalRepayment - loan.amount), 0);

  const filteredLoans = loans.filter(loan => 
    loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCurrencySymbol = (code: string) => code === 'USD' ? '$' : '៛';

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t.dashboard}</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
             <LayoutDashboard size={16}/> {t.welcome_back}
          </p>
        </div>
        <button
          onClick={() => onNavigate('create-loan')}
          className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-gray-200 transition-all hover:scale-105 font-medium w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          {t.create_loan}
        </button>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title={t.total_lent} 
          value={totalLent.toLocaleString()} 
          icon={<DollarSign className="text-white" size={24} />} 
          bg="bg-gradient-to-br from-aqua-400 to-aqua-600"
          textColor="text-white"
          subTextColor="text-aqua-100"
        />
        <StatCard 
          title={t.active_loans} 
          value={activeLoans.toString()} 
          icon={<Users className="text-blue-600" size={24} />} 
          bg="bg-white border border-blue-100"
          iconBg="bg-blue-50"
        />
        <StatCard 
          title={t.total_repaid} 
          value={totalRepaid.toLocaleString()} 
          icon={<TrendingUp className="text-green-600" size={24} />} 
          bg="bg-white border border-green-100"
           iconBg="bg-green-50"
        />
        <StatCard 
          title={t.expected_interest} 
          value={totalExpectedInterest.toLocaleString()} 
          icon={<DollarSign className="text-purple-600" size={24} />} 
          bg="bg-white border border-purple-100"
           iconBg="bg-purple-50"
        />
      </div>

      {/* Loan Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">{t.recent_loans}</h2>
          
          <div className="relative w-full md:w-72">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder={t.search_placeholder}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-200 focus:outline-none focus:border-aqua-500 focus:ring-1 focus:ring-aqua-500 text-sm transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {filteredLoans.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
               <Search size={32} />
            </div>
            <p className="text-lg font-medium">{searchTerm ? 'No borrowers found' : 'No loans yet'}</p>
            <p className="text-sm mt-1">{searchTerm ? 'Try adjusting your search terms.' : t.no_loans}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">{t.borrower}</th>
                  <th className="px-6 py-4">{t.amount}</th>
                  <th className="px-6 py-4 hidden sm:table-cell">{t.interest}</th>
                  <th className="px-6 py-4 hidden md:table-cell">{t.duration}</th>
                  <th className="px-6 py-4">{t.status}</th>
                  <th className="px-6 py-4 hidden lg:table-cell">{t.progress}</th>
                  <th className="px-6 py-4 text-right">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLoans.map((loan) => {
                   const progress = Math.min(100, (loan.amountRepaid / loan.totalRepayment) * 100);
                   const symbol = getCurrencySymbol(loan.currencyCode);
                   return (
                    <tr key={loan.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => onNavigate('loan-detail', loan.id)}>
                      <td className="px-6 py-4">
                         <div className="font-bold text-gray-900 text-base">{loan.borrowerName}</div>
                         <div className="text-xs text-gray-400 mt-0.5 md:hidden">
                            Due {new Date(loan.endDate).toLocaleDateString()}
                         </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{symbol}{loan.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 hidden sm:table-cell">{loan.interestRate}%</td>
                      <td className="px-6 py-4 hidden md:table-cell">{loan.durationValue} {loan.durationUnit}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold
                          ${loan.status === LoanStatus.Active ? 'bg-green-100 text-green-700' : 
                            loan.status === LoanStatus.Rejected ? 'bg-red-100 text-red-700' :
                            loan.status === LoanStatus.Completed ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell w-48">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-aqua-500 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-500 w-8">{Math.round(progress)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          className="text-gray-400 hover:text-aqua-600 transition-colors bg-white hover:bg-aqua-50 p-2 rounded-full border border-gray-100 hover:border-aqua-200"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bg, iconBg, textColor = 'text-gray-900', subTextColor = 'text-gray-500' }: any) => (
  <div className={`p-6 rounded-2xl shadow-sm transition-all hover:shadow-md ${bg}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-sm font-medium mb-1 ${subTextColor}`}>{title}</p>
        <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${textColor}`}>{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${iconBg || 'bg-white/20'}`}>
        {icon}
      </div>
    </div>
  </div>
);