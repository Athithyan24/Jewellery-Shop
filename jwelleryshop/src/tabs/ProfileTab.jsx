import { useEffect, useState } from "react";
import { ScrollText, Calendar } from "lucide-react";
import axios from "axios";
export default function ProfileTab() {
  const [paidLoan, setPaidLoan] = useState([]);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const fetchPaidLoanDetails = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/payLoan", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setPaidLoan(res.data);
        console.log("PaidLoans: ", res.data);
      } catch (error) {
        console.error("Error fetching PaidLoanDetails:", error);
      }
    };
    fetchPaidLoanDetails();
  }, []);

  const filteredPaidLoans = paidLoan.filter((pl) => {
    if (!filterDate) return true;

    const targetDate = pl.paymentDate || pl.createdAt;
    if (!targetDate) return false;

    const formattedDate = new Date(targetDate).toLocaleDateString("en-CA");

    return formattedDate === filterDate;
  });
  return (
    <>
      <div className="p-6 animate-in fade-in duration-300">
        <div className="bg-white/50 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <ScrollText className="mr-2 text-lime-500" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                செலுத்தப்பட்ட கடன்கள் (Paid Loans History)
              </h2>
            </div>
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-white/50 p-4 rounded-2xl border border-slate-200 shadow-sm gap-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50/10 p-2.5 rounded-xl text-lime-500 shadow-sm border border-indigo-100">
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 tracking-wide">
                    தேதி வாரியாக தேடு
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                    Search by Date
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full sm:w-auto border border-slate-200 rounded-xl pl-4 pr-4 py-2.5 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm cursor-pointer"
                  />
                </div>
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="text-sm font-bold text-rose-500 hover:text-white hover:bg-rose-500 px-4 py-2.5 rounded-xl transition-all shadow-sm border border-rose-100 hover:border-rose-500 active:scale-95">
                    Clear
                  </button>
                )}
              </div>
            </div>
            <span className="bg-white text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
              Total Records: {paidLoan?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="py-3 px-6 text-xs font-bold  uppercase tracking-wider">
                    செலுத்திய தேதி (Paid Date)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider">
                    கடன் தேதி (Loan Date)
                  </th>

                  <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider">
                    கடன் எண் (Loan ID)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider">
                    பெயர் (Name)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider">
                    அடகு பொருள் (Product)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider">
                    கடன் தொகை (Loan Amt)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right">
                    செலுத்தியது (Paid)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/50">
                {filteredPaidLoans && filteredPaidLoans.length > 0 ? (
                  filteredPaidLoans.map((pl, index) => (
                    <tr
                      key={pl._id || index}
                      className="hover:bg-slate-50 transition-colors group">
                      

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-500">
                        {pl.paymentDate
                          ? new Date(pl.paymentDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-500">
                        {pl.loan?.createdAt ? (
                          new Date(pl.loan.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        ) : (
                          <span className="text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded text-xs">
                            Deleted Loan
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-fuchsia-600">
                        {pl.loan?.loanId || "-"}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-slate-800">
                        {pl.customer?.name || "Unknown"}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-amber-600">
                        {/* 🟢 FIX: Safely check for product name */}
                        {pl.loan?.product?.name || (
                          <span className="text-slate-400 italic">
                            Data Removed
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-500">
                        ₹{pl.loan?.loanamount?.toFixed(2) || "0.00"}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-black text-emerald-700 bg-emerald-50/50 text-right">
                        ₹{pl.amountPaid?.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-20 px-6 text-center bg-slate-50/30">
                      <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-5">
                          <ScrollText
                            size={48}
                            className="text-slate-200"
                            strokeWidth={1.5}
                          />
                        </div>

                        <span className="font-bold text-slate-500 text-lg tracking-wide">
                          பணம் செலுத்திய கடன் விவரங்கள் இல்லை
                        </span>

                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                          No paid loan history found{" "}
                          {filterDate
                            ? `for ${new Date(filterDate).toLocaleDateString("en-IN")}`
                            : ""}
                        </span>

                        {filterDate && (
                          <button
                            onClick={() => setFilterDate("")}
                            className="mt-6 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4">
                            அனைத்து விவரங்களையும் பார்க்க (Show All Records)
                          </button>
                        )}
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
