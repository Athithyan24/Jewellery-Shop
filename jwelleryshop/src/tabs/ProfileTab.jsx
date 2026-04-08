import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import axios from "axios";
export default function ProfileTab() {
  const [paidLoan, setPaidLoan] = useState([]);

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
  return (
    <>
      <div className="p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 tracking-wide">
              செலுத்தப்பட்ட கடன்கள் (Paid Loans History)
            </h2>
            <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
              Total Records: {paidLoan?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    கடன் தேதி (Loan Date)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    செலுத்திய தேதி (Paid Date)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    படம் (Photo)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    பெயர் (Name)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    அடகு பொருள் (Product)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    கடன் தொகை (Loan Amt)
                  </th>
                  <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">
                    செலுத்தியது (Paid)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {paidLoan && paidLoan.length > 0 ? (
                  paidLoan.map((pl) => (
                    <tr
                      key={pl._id}
                      className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                        {pl.loan?.createdAt
                          ? new Date(pl.loan.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-slate-800">
                        {new Date(pl.paymentDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap">
                        <img
                          src={`http://localhost:5000/uploads/${pl.customer?.recentimage}`}
                          alt={pl.customer?.name || "Customer"}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                          onError={(e) => {
                            e.target.src =
                              "https://ui-avatars.com/api/?name=" +
                              (pl.customer?.name || "User") +
                              "&background=F1F5F9&color=64748B";
                          }}
                        />
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-slate-800">
                        {pl.customer?.name || "Unknown"}
                      </td>

                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-amber-600">
                        {pl.loan?.product?.name || "-"}
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
                      colSpan="7"
                      className="py-12 px-6 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl text-green-500">
                          <ScrollText />
                        </span>
                        <p>
                          எந்த செலுத்தப்பட்ட கடன்களும் இல்லை (No paid loans
                          found).
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
