import { useState, useEffect } from "react";
import axios from "axios";
import { Landmark, Search } from "lucide-react";

export default function LockerTab() {
  const [lockerItems, setLockerItems] = useState([]);
  const [loanSearchQuery, setLoanSearchQuery] = useState("");

  // 🟢 FIXED: Filter 'lockerItems' and change 'loan' to 'item' inside the loop
  const filteredLockerByLoan = lockerItems.filter((item) => {
    if (!loanSearchQuery) return true; // If search is empty, show all

    const searchLower = loanSearchQuery.toLowerCase();

    return (
      (item.loan?.loanId && item.loan.loanId.toLowerCase().includes(searchLower)) ||
      (item.customer?.name && item.customer.name.toLowerCase().includes(searchLower)) ||
      (item.customer?.phone && item.customer.phone.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    const fetchCustomersLocker = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/bankDetails", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        // 🟢 FIXED: Set the data to 'lockerItems', not the search query!
        setLockerItems(res.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };
    fetchCustomersLocker();
  }, []);

  return (
    <>
      <div className="p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 tracking-wide">
              வங்கி பெட்டக விவரங்கள் (Bank Locker Details)
            </h2>
              <div className="relative w-full sm:w-96">
                <span className="absolute left-3 top-2.5 text-slate-400">
                <Search size={18} />
              </span>
                <input
                  type="text"
                  placeholder="Search by ID (LOAN001), Name, or Phone..."
                  value={loanSearchQuery}
                  onChange={(e) => setLoanSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all text-sm font-semibold text-slate-700"
                />
              </div>
            <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
              Total Items: {filteredLockerByLoan.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">புகைப்படம் (Photo)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">பெயர் (Name)</th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">Loan ID</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Product kept in vault date</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">அடகு பொருள் (Product)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">வங்கி பெயர் (Bank Name)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">ஸ்டாஃப் பெயர் (OB Staff)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">ob அக்கவுண்ட் எண் (OB Account No)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">கிளை பெயர் (Branch)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-center">பெட்டக எண் (Locker No)</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider text-right">கடன் தொகை (Amount)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredLockerByLoan.length > 0 ? (
                  filteredLockerByLoan.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-6 whitespace-nowrap">
                        <img
                          src={`http://localhost:5000/uploads/${item.customer?.recentimage}`}
                          alt={item.customer?.name || "Customer"}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                          onError={(e) => {
                            e.target.src =
                              "https://ui-avatars.com/api/?name=" +
                              (item.customer?.name || "User") +
                              "&background=F1F5F9&color=64748B";
                          }}
                        />
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-slate-800">
                        {item.customer?.name || "Unknown Customer"}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-fuchsia-500">
                        {item.loan?.loanId || "Unknown"}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                        {item.ledgercreationdate || "N/A"}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-amber-600">
                        {item.loan?.product?.name || item.loan?.product || "N/A"}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                        {item.bank?.name || "N/A"}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                        {item.obstaffname || "N/A"}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                        {item.obaccountno || "N/A"}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                        {item.branchname || "-"}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm text-center">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-md font-bold shadow-sm">
                          {item.lockerno || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm font-black text-emerald-600 text-right">
                        ₹{item.loan?.loanamount?.toFixed(2) || "0.00"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="py-12 px-6 text-center content-center justify-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl text-orange-300">
                          <Landmark />
                        </span>
                        <p>
                          தற்போது வங்கியில் எந்த பொருட்களும் இல்லை (No items currently in the bank locker).
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