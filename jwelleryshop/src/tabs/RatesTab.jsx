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
      (loan.customer?.name &&
        loan.customer.name.toLowerCase().includes(searchLower)) ||
      (loan.product?.name &&
        loan.product.name.toLowerCase().includes(searchLower))
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

  const formatTierDate = (startDate, daysToAdd) => {
    if (!startDate) return "";
    const d = new Date(startDate);
    d.setDate(d.getDate() + parseInt(daysToAdd || 0));
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="p-6 animate-in fade-in duration-300">
        <div className="bg-white/50 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <ChartNoAxesCombined className="mr-2 text-violet-600" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                வட்டி விகித விவரங்கள் (Interest Rate Breakdown)
              </h2>
            </div>

            <div className="relative w-full sm:w-96 group">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-300"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by Loan ID, Name, or Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner"
              />
            </div>

            <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">
              Total Records: {filteredLoans?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-800 sticky top-0 z-10 shadow-md">
                <tr>
                  <th className="py-3 px-6 text-xs font-bold text-white uppercase tracking-wider">
                    புகைப்படம்
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-white uppercase tracking-wider">
                    பெயர் (Name)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-white uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-white uppercase tracking-wider">
                    தேதி (Date)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-white uppercase tracking-wider">
                    அடகு பொருள் (Product)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-white uppercase tracking-wider text-center">
                    முதல் தவணை
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-white uppercase tracking-wider text-center">
                    இரண்டாம் தவணை
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-white uppercase tracking-wider text-center">
                    மூன்றாம் தவணை
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-white uppercase tracking-wider text-right">
                    தற்போதைய மாத நிலை
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-100">
                {filteredLoans && filteredLoans.length > 0 ? (
                  filteredLoans.map((loan) => {
                    const createdDate = new Date(loan.createdAt);
                    const today = new Date();
                    const diffDays = Math.ceil(
                      Math.abs(today - createdDate) / (1000 * 60 * 60 * 24),
                    );

                    const t1End = loan.firstInterestTo || 90;
                    const t2End = loan.secondInterestTo || 180;
                    const t3End = loan.thirdInterestTo || 270;

                    return (
                      <tr
                        key={loan._id}
                        className="hover:bg-indigo-50 transition-colors duration-200 group border-b border-slate-100/50">
                        {/* 1. Customer Photo */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <img
                            src={`http://localhost:5000/uploads/${loan.customer?.recentimage}`}
                            alt={loan.customer?.name || "Customer"}
                            className="w-14 h-16 rounded-xl object-cover border-2 border-slate-200 shadow-sm group-hover:border-indigo-300 transition-all"
                            onError={(e) => {
                              e.target.src =
                                "https://ui-avatars.com/api/?name=" +
                                (loan.customer?.name || "User") +
                                "&background=F1F5F9&color=64748B";
                            }}
                          />
                        </td>

                        {/* 2. Customer Name */}
                        <td className="py-4 px-4 whitespace-nowrap text-sm font-black text-slate-800 uppercase tracking-wide">
                          {loan.customer?.name || "Unknown Customer"}
                        </td>

                        {/* 3. Loan ID Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-700 group-hover:bg-white transition-all">
                            {loan.loanId || "N/A"}
                          </span>
                        </td>

                        {/* 4. Date */}
                        <td className="py-4 px-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                          {new Date(loan.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </td>

                        {/* 5. Product Name Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="text-amber-700 font-bold tracking-tight bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md text-xs shadow-sm">
                            {loan.product?.name || loan.loan?.product || "N/A"}
                          </span>
                        </td>

                        {/* 🟢 6. Tier 1 (Backend data) */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          {!loan.isClosed ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shadow-sm text-sm">
                                ₹{loan.interestBreakdown?.tier1Gross || 0}
                              </span>
                              <div className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
                                {formatTierDate(loan.createdAt, 0)} -{" "}
                                {formatTierDate(loan.createdAt, t1End)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        {/* 🟢 7. Tier 2 (Backend data + Active/Upcoming check) */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          {!loan.isClosed ? (
                            <div className="flex flex-col items-center gap-1.5">
                              {diffDays > t1End ? (
                                <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 shadow-sm text-sm">
                                  ₹{loan.interestBreakdown?.tier2Gross || 0}
                                </span>
                              ) : (
                                <span className="font-mono font-bold text-slate-300 px-2 py-0.5 text-sm">
                                  -
                                </span>
                              )}
                              <div className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
                                {formatTierDate(loan.createdAt, t1End + 1)} -{" "}
                                {formatTierDate(loan.createdAt, t2End)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        {/* 🟢 8. Tier 3 (Backend data + Active/Upcoming check) */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          {!loan.isClosed ? (
                            <div className="flex flex-col items-center gap-1.5">
                              {diffDays > t2End ? (
                                <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 shadow-sm text-sm">
                                  ₹{loan.interestBreakdown?.tier3Gross || 0}
                                </span>
                              ) : (
                                <span className="font-mono font-bold text-slate-300 px-2 py-0.5 text-sm">
                                  -
                                </span>
                              )}
                              <div className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">
                                {formatTierDate(loan.createdAt, t2End + 1)} -{" "}
                                {formatTierDate(loan.createdAt, t3End)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-right bg-indigo-50/30 border-l border-indigo-100/50">
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
                                  <span className="text-emerald-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 shadow-sm">
                                    ✓ Fully Paid
                                  </span>
                                  <span className="text-xs text-slate-400 line-through mt-1.5 font-mono font-semibold">
                                    ₹{totalAccrued}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div className="flex flex-col items-end">
                                <span className="text-indigo-700 font-mono font-black text-base">
                                  ₹
                                  {pendingInterest > 0
                                    ? pendingInterest
                                    : totalAccrued}
                                </span>
                                {paidInterest > 0 && (
                                  <span className="text-[10px] font-mono text-emerald-600 mt-0.5 font-bold bg-white px-1.5 py-0.5 rounded shadow-sm border border-emerald-100">
                                    Paid: ₹{paidInterest}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="9"
                      className="py-12 px-6 text-center text-slate-500 font-medium">
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
