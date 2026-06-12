import { useState, useEffect } from "react";
import axios from "axios";
import { Landmark, Search, Plus, ArrowRightLeft, CheckCircle, Package, HandCoins } from "lucide-react";

export default function LockerTab() {
  const [lockerItems, setLockerItems] = useState([]);
  const [loanSearchQuery, setLoanSearchQuery] = useState("");
  
  // Modal Control States
  const [isBankLoanModalOpen, setIsBankLoanModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isRetrieveModalOpen, setIsRetrieveModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Input Handling States
  const [bankLoanAmount, setBankLoanAmount] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("");
  const [retrieveDescription, setRetrieveDescription] = useState("");
  const [retrieveQuantity, setRetrieveQuantity] = useState("");

  const fetchCustomersLocker = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bankDetails", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setLockerItems(res.data);
    } catch (error) {
      console.error("Error fetching locker items:", error);
    }
  };

  useEffect(() => {
    fetchCustomersLocker();
  }, []);

  useEffect(() => {
    if (selectedItem && selectedItem.loan?.product?.name) {
      const products = selectedItem.loan.product.name.split(',').map(p => p.trim());
      setRetrieveDescription(products[0] || "");
    }
  }, [selectedItem]);

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

  // ADD NEW SETTLEMENT ENTRY
  const handleSettleBankLoan = async () => {
    if (!settlementAmount || !selectedItem) return alert("Please enter the settlement amount");
    try {
      await axios.put(`http://localhost:5000/api/bankDetails/${selectedItem._id}`, 
        { bankSettlementAmount: parseFloat(settlementAmount) },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      alert("Settlement payment added successfully!");
      setIsSettleModalOpen(false);
      setSettlementAmount("");
      fetchCustomersLocker();
    } catch (err) {
      alert("Failed to add settlement payment");
    }
  };

  const handleRetrieveItem = async (type) => {
    if (!retrieveDescription || !retrieveQuantity || !selectedItem) return alert("Fill all fields");
    const finalRetrievedState = type === "Full";

    try {
      await axios.put(`http://localhost:5000/api/bankDetails/${selectedItem._id}`, 
        { 
          retrievalStatus: type, // This sends exactly "Full" or "Partial"
          isRetrieved: finalRetrievedState,
          retrievalDetails: {
            description: retrieveDescription,
            quantity: retrieveQuantity
          }
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      alert(`Items ${type === "Partial" ? "Partially" : "Fully"} Retrieved!`);
      setIsRetrieveModalOpen(false);
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
                placeholder="Search by Loan ID or Customer..."
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
                  <th className="py-3 px-4 text-[10px] font-bold uppercase">Customer</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase">Loan ID</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase">Product in Locker</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase">Bank Info</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase text-center">Locker No</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase w-48">Settlement History</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase text-right w-52">Bank Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-100">
                {filteredLockerByLoan.map((item) => {
                  
                  // Calculate total settled amount
                  const totalSettled = item.bankSettlements?.reduce((sum, s) => sum + s.amount, 0) || 0;

                  return (
                    <tr key={item._id} className="hover:bg-indigo-50 transition-colors duration-200">
                      <td className="py-4 px-4 font-black text-slate-800 uppercase flex items-center gap-3">
                        <img
                          src={`http://localhost:5000/uploads/${item.customer?.recentimage}`}
                          alt="Customer"
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${item.customer?.name || "User"}`; }}
                        />
                        {item.customer?.name}
                      </td>
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
                          <p className="text-[10px] text-indigo-600 font-bold mt-1">Staff: {item.obstaffname || "N/A"}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-black">
                          {item.lockerno || "-"}
                        </span>
                      </td>
                      
                      {/* NEW COLUMN: SETTLEMENT HISTORY */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1 w-full text-xs">
                          {item.bankSettlements && item.bankSettlements.length > 0 ? (
                            <>
                              {item.bankSettlements.map((settle, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-100 shadow-sm">
                                  <span className="text-[9px] text-blue-600 font-bold">{new Date(settle.date).toLocaleDateString('en-GB')}</span>
                                  <span className="font-black">₹{settle.amount.toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="mt-1 pt-1 border-t border-slate-200 flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-500">Total Paid:</span>
                                <span className="font-black text-emerald-600">₹{totalSettled.toFixed(2)}</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic text-center py-2 bg-slate-50 rounded border border-slate-100">No settlements yet</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-right align-top">
                        <div className="flex flex-col items-end gap-1.5 w-full">
                          
                          {/* 1. BANK LOAN RECORD */}
                          {item.retrievalStatus === "Full" ? (
                            item.bankLoanAmount ? (
                              <div className="flex items-center justify-between px-2 bg-slate-100 text-slate-600 py-1 rounded border border-slate-200 w-full text-xs font-bold">
                                <span>Bank Loan:</span>
                                <span>₹{item.bankLoanAmount.toFixed(2)}</span>
                              </div>
                            ) : null
                          ) : (
                            <div className="w-full flex flex-col gap-1">
                              {item.bankLoanAmount && (
                                <div className="flex items-center justify-between px-2 bg-emerald-50 text-emerald-700 py-1 rounded border border-emerald-200 w-full text-xs font-black">
                                  <span>Bank Loan:</span>
                                  <span>₹{item.bankLoanAmount.toFixed(2)}</span>
                                </div>
                              )}
                              <button
                                onClick={() => { setSelectedItem(item); setBankLoanAmount(item.bankLoanAmount || ""); setIsBankLoanModalOpen(true); }}
                                className="flex items-center justify-center gap-1 bg-indigo-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-sm w-full"
                              >
                                <Plus size={12} strokeWidth={3} /> {item.bankLoanAmount ? "Update Bank Loan" : "Add Bank Loan"}
                              </button>
                            </div>
                          )}

                          {/* 2. SETTLEMENT BUTTON (Hides when Fully Retrieved) */}
                          {item.retrievalStatus !== "Full" && (
                            <button
                              onClick={() => { setSelectedItem(item); setSettlementAmount(""); setIsSettleModalOpen(true); }}
                              className="flex items-center justify-center gap-1 bg-blue-600 text-white px-2 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all shadow-sm w-full mb-1"
                            >
                              <HandCoins size={12} strokeWidth={3} /> Add Settlement
                            </button>
                          )}

                          {/* 3. RETRIEVAL HISTORY LIST */}
                          {item.retrievalDetails?.description && (
                            <div className="flex flex-col gap-1 w-full mt-0.5">
                              {item.retrievalDetails.description.split(" || ").map((desc, idx) => {
                                const qty = item.retrievalDetails.quantity?.split(" || ")[idx] || "";
                                return (
                                  <div key={idx} className="text-[10px] text-orange-700 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-200 flex justify-between items-center shadow-sm">
                                    <span>✔ {desc}</span>
                                    <span className="text-[9px] bg-white px-1.5 py-0.5 rounded text-orange-600">{qty}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* 4. RETRIEVAL CONTROL ACTION BUTTON */}
                          {item.retrievalStatus === "Full" ? (
                            <div className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-2 rounded-lg border border-emerald-300 w-full text-center mt-0.5 shadow-sm flex items-center justify-center gap-1.5">
                              <Package size={14} /> Fully Retrieved
                            </div>
                          ) : (
                            <button
                              onClick={() => { setSelectedItem(item); setIsRetrieveModalOpen(true); }}
                              className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-all w-full shadow-sm mt-0.5"
                            >
                              <ArrowRightLeft size={14} /> {item.retrievalStatus === "Partial" ? "Retrieve Remaining" : "Retrieve from Bank"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              <p className="text-xs text-slate-500 font-bold mb-4">Enter the loan amount provided by the bank for this product.</p>
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

      {/* Modal: ADD Settlement */}
      {isSettleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-black flex items-center gap-2"><HandCoins size={18}/> Add Settlement</h3>
              <button onClick={() => setIsSettleModalOpen(false)} className="text-2xl hover:rotate-90 transition-transform">×</button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-800">Bank Loan:</span>
                <span className="text-sm font-black text-blue-900">₹{selectedItem?.bankLoanAmount?.toFixed(2) || "0.00"}</span>
              </div>
              <p className="text-xs text-slate-500 font-bold mb-4">Enter the installment or settlement amount paid to the bank today.</p>
              <input
                type="number"
                placeholder="Payment Amount (₹)"
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-black text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                autoFocus
              />
              <button
                onClick={handleSettleBankLoan}
                className="w-full mt-6 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
              >
                Add Payment
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
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                <p className="text-xs font-bold text-blue-800">Products currently in this Loan:</p>
                <p className="text-sm font-black text-blue-900">{selectedItem?.loan?.product?.name}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Select Item to Retrieve</label>
                <select
                  value={retrieveDescription}
                  onChange={(e) => setRetrieveDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-bold text-slate-800 focus:border-slate-800 transition-all outline-none appearance-none cursor-pointer"
                >
                  {selectedItem?.loan?.product?.name?.split(',').map((prod, idx) => (
                    <option key={idx} value={prod.trim()}>{prod.trim()}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Quantity Retrieved</label>
                <input
                  type="text"
                  placeholder="e.g., 2 Nos, 24 Grams"
                  value={retrieveQuantity}
                  onChange={(e) => setRetrieveQuantity(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-bold text-slate-800 focus:border-slate-800 transition-all outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleRetrieveItem("Partial")}
                  className="flex-1 bg-orange-500 text-white font-black py-3 rounded-xl hover:bg-orange-600 shadow-md active:scale-95 transition-all flex justify-center items-center gap-2 text-sm"
                >
                  <ArrowRightLeft size={16} /> Split Retrieve
                </button>

                <button
                  onClick={() => handleRetrieveItem("Full")}
                  className="flex-1 bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-700 shadow-md active:scale-95 transition-all flex justify-center items-center gap-2 text-sm"
                >
                  <Package size={16} /> Full Retrieve
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center font-bold">
                * Split retrieve adds to the list and keeps the button active. Full retrieve clears the locker.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}