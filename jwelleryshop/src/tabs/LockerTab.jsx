import { useState, useEffect } from "react";
import axios from "axios";
import { Landmark, Search, Plus, ArrowRightLeft, CheckCircle, Package } from "lucide-react";

export default function LockerTab() {
  const [lockerItems, setLockerItems] = useState([]);
  const [loanSearchQuery, setLoanSearchQuery] = useState("");
  
  // Modal States
  const [isBankLoanModalOpen, setIsBankLoanModalOpen] = useState(false);
  const [isRetrieveModalOpen, setIsRetrieveModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Input States
  const [bankLoanAmount, setBankLoanAmount] = useState("");
  const [retrieveDescription, setRetrieveDescription] = useState("");
  const [retrieveQuantity, setRetrieveQuantity] = useState("");

  const fetchCustomersLocker = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bankDetails", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setLockerItems(res.data);
    } catch (error) {
      console.error("Error fetching locker items:", error);
    }
  };

  useEffect(() => {
    fetchCustomersLocker();
  }, []);

  const handleUpdateBankLoan = async () => {
    if (!bankLoanAmount || !selectedItem) return alert("Please enter an amount");
    try {
      await axios.put(`http://localhost:5000/api/bankDetails/${selectedItem._id}`, 
        { bankLoanAmount: parseFloat(bankLoanAmount) },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      alert("Bank loan recorded successfully!");
      setIsBankLoanModalOpen(false);
      setBankLoanAmount("");
      fetchCustomersLocker();
    } catch (err) {
      alert("Failed to update bank loan");
    }
  };

  const handleRetrieveItem = async () => {
    if (!retrieveDescription || !retrieveQuantity || !selectedItem) return alert("Fill all fields");
    try {
      await axios.put(`http://localhost:5000/api/bankDetails/${selectedItem._id}`, 
        { 
          isRetrieved: true,
          retrievalDetails: {
            description: retrieveDescription,
            quantity: retrieveQuantity,
            date: new Date().toISOString()
          }
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      alert("Item retrieval recorded!");
      setIsRetrieveModalOpen(false);
      setRetrieveDescription("");
      setRetrieveQuantity("");
      fetchCustomersLocker();
    } catch (err) {
      alert("Failed to record retrieval");
    }
  };

  const filteredLockerByLoan = lockerItems.filter((item) => {
    if (!loanSearchQuery) return true;
    const searchLower = loanSearchQuery.toLowerCase();
    return (
      (item.loan?.loanId && item.loan.loanId.toLowerCase().includes(searchLower)) ||
      (item.customer?.name && item.customer.name.toLowerCase().includes(searchLower)) ||
      (item.customer?.phone && item.customer.phone.toLowerCase().includes(searchLower))
    );
  });

  return (
    <>
      <div className="p-6 animate-in fade-in duration-300">
        <div className="bg-white/50 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Landmark className="mr-2 text-red-600" />
              <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                Bank Locker Management
              </h2>
            </div>
            <div className="relative w-full sm:w-96 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={loanSearchQuery}
                onChange={(e) => setLoanSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase">Photo</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase">Customer</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase">Loan ID</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase">Product</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase">Bank Info</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase">OB Staff</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase text-center">Locker No</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase text-right">Bank Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-100">
                {filteredLockerByLoan.map((item) => (
                  <tr key={item._id} className="hover:bg-indigo-50 transition-colors duration-200 group">
                    <td className="py-3 px-4">
                      <img
                        src={`http://localhost:5000/uploads/${item.customer?.recentimage}`}
                        alt="Customer"
                        className="w-12 h-14 rounded-lg object-cover border border-slate-200"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${item.customer?.name || "User"}`; }}
                      />
                    </td>
                    <td className="py-4 px-4 font-black text-slate-800 uppercase">{item.customer?.name}</td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-100 border border-slate-200">
                        {item.loan?.loanId || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="text-amber-700 font-bold">{item.loan?.product?.name || "Product N/A"}</span>
                        <span className="text-[10px] text-slate-400 italic">Vault Date: {item.ledgercreationdate}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-xs">
                        <p className="font-bold text-slate-700">{item.bank?.name}</p>
                        <p className="text-slate-500">{item.branchname}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-bold text-slate-700">{item.obstaffname}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg text-xs font-black">
                        {item.lockerno || "-"}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <div className="flex flex-col items-end gap-2">
                        {/* BANK LOAN SECTION */}
                        {item.bankLoanAmount ? (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                            <CheckCircle size={14} />
                            <span className="font-black text-sm">₹{item.bankLoanAmount.toFixed(2)}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setSelectedItem(item); setIsBankLoanModalOpen(true); }}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-md"
                          >
                            <Plus size={14} strokeWidth={3} /> Add Bank Loan
                          </button>
                        )}

                        {/* RETRIEVAL SECTION */}
                        {item.isRetrieved ? (
                          <div className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-200">
                            Retrieved: {item.retrievalDetails?.quantity} {item.retrievalDetails?.description}
                          </div>
                        ) : (
                          <button
                            onClick={() => { setSelectedItem(item); setIsRetrieveModalOpen(true); }}
                            className="flex items-center gap-2 bg-slate-100 text-slate-600 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                          >
                            <ArrowRightLeft size={14} /> Retrieve Item
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: Add Bank Loan */}
      {isBankLoanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-black flex items-center gap-2"><Landmark size={18}/> Bank Loan Amount</h3>
              <button onClick={() => setIsBankLoanModalOpen(false)} className="text-2xl hover:rotate-90 transition-transform">×</button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-500 font-bold mb-4">Enter the amount provided by the bank for this product.</p>
              <input
                type="number"
                placeholder="Amount (₹)"
                value={bankLoanAmount}
                onChange={(e) => setBankLoanAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-black text-slate-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                autoFocus
              />
              <button
                onClick={handleUpdateBankLoan}
                className="w-full mt-6 bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 shadow-lg active:scale-95 transition-all"
              >
                Save Bank Loan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Retrieve Item */}
      {isRetrieveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
              <h3 className="font-black flex items-center gap-2"><Package size={18}/> Record Retrieval</h3>
              <button onClick={() => setIsRetrieveModalOpen(false)} className="text-2xl hover:rotate-90 transition-transform">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Item Description</label>
                <input
                  type="text"
                  placeholder="e.g., Gold Bangle, Chain"
                  value={retrieveDescription}
                  onChange={(e) => setRetrieveDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-bold text-slate-800 focus:border-slate-800 transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Quantity</label>
                <input
                  type="text"
                  placeholder="e.g., 2 Nos, 24 Grams"
                  value={retrieveQuantity}
                  onChange={(e) => setRetrieveQuantity(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-bold text-slate-800 focus:border-slate-800 transition-all outline-none"
                />
              </div>
              <button
                onClick={handleRetrieveItem}
                className="w-full bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-slate-900 shadow-lg active:scale-95 transition-all mt-2"
              >
                Confirm Retrieval
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}