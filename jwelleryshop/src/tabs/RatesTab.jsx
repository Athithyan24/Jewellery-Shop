import { useState, useEffect } from "react";
import axios from "axios";
import { ChartNoAxesCombined, Search } from "lucide-react"; 

export default function RatesTab() {
  const [loans, setLoans] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); 

  const filteredLoans = loans.filter((loan) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();

    return (
      (loan.loanId && loan.loanId.toLowerCase().includes(searchLower)) ||
      (loan.customer?.name && loan.customer.name.toLowerCase().includes(searchLower)) ||
      (loan.product?.name && loan.product.name.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    const fetchLoans = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/loans", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const takenloans = res.data;
      setLoans(takenloans);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };
    fetchLoans();
  }, []);

  return (
    <>
      <div className="p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-800 tracking-wide">
              வட்டி விகித விவரங்கள் (Interest Rate Breakdown)
            </h2>

            <div className="relative w-full sm:w-96">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search by Loan ID, Name, or Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all text-sm font-semibold text-slate-700 shadow-sm"
              />
            </div>

            <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
              Total Records: {filteredLoans?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    புகைப்படம்
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    பெயர் (Name)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    தேதி (Date)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    அடகு பொருள் (Product)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    முதல் 3 மாதங்கள்
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    4 முதல் 6 மாதங்கள்
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    7 முதல் 9 மாதங்கள்
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">
                    தற்போதைய மாத நிலை
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredLoans && filteredLoans.length > 0 ? (
                  filteredLoans.map((loan) => (
                    <tr
                      key={loan._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Customer Photo (Avatar) */}
                      <td className="py-3 px-6 whitespace-nowrap">
                        <img
                          src={`http://localhost:5000/uploads/${loan.customer?.recentimage}`}
                          alt={loan.customer?.name || "Customer"}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                          onError={(e) => {
                            e.target.src =
                              "https://ui-avatars.com/api/?name=" +
                              (loan.customer?.name || "User") +
                              "&background=F1F5F9&color=64748B";
                          }}
                        />
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-slate-800">
                        {loan.customer?.name || "Unknown Customer"}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-fuchsia-500">
                        {loan.loanId || "N/A"}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                        {new Date(loan.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-amber-600">
                        {loan.product?.name || loan.loan?.product || "N/A"}
                      </td>

                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="font-bold text-emerald-600 text-sm">
                          ₹{loan.interestBreakdown?.tier1Gross || 0}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {loan.dateRanges?.tier1 || "-"}
                        </div>
                      </td>

                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="font-bold text-amber-500 text-sm">
                          ₹{loan.interestBreakdown?.tier2Gross || 0}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {loan.dateRanges?.tier2 || "-"}
                        </div>
                      </td>

                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="font-bold text-rose-600 text-sm">
                          ₹{loan.interestBreakdown?.tier3Gross || 0}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {loan.dateRanges?.tier3 || "-"}
                        </div>
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-right bg-indigo-50/50">
                        {(() => {
                          const totalAccrued =
                            loan.interestBreakdown?.total || 0;
                          const paidInterest = loan.interestPaid || 0;

                          const pendingInterest = totalAccrued - paidInterest;

                          const isFullyPaid =
                            totalAccrued > 0 && pendingInterest <= 0;

                          if (isFullyPaid) {
                            return (
                              <div className="flex flex-col items-end">
                                <span className="text-emerald-600 font-bold flex items-center gap-1 text-sm bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                  ✓ Paid
                                </span>
                                <span className="text-xs text-slate-400 line-through mt-1 font-semibold">
                                  ₹{totalAccrued}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div className="flex flex-col items-end">
                              <span className="text-indigo-700 font-black text-sm">
                                ₹{pendingInterest > 0 ? pendingInterest : totalAccrued}
                              </span>
                              {paidInterest > 0 && (
                                <span className="text-[10px] text-emerald-600 mt-1 font-bold">
                                  (Paid so far: ₹{paidInterest})
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="py-12 px-6 text-center text-slate-500 font-medium"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl text-red-500">
                          <ChartNoAxesCombined />
                        </span>
                        <p>
                          எந்த வட்டி விவரங்களும் இல்லை (No interest records
                          found matching your search).
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}