import { useState, useEffect } from "react";
import axios from "axios";
import {
  Landmark,
  Search,
  Plus,
  ArrowRightLeft,
  CheckCircle,
  Package,
  HandCoins,
  X,
  Calendar,
} from "lucide-react";

export default function LockerTab() {
  const [lockerItems, setLockerItems] = useState([]);
  const [loanSearchQuery, setLoanSearchQuery] = useState("");

  // Modal Control States
  const [isBankLoanModalOpen, setIsBankLoanModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isRetrieveModalOpen, setIsRetrieveModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 🟢 NEW: Added States to control full-expanded history ledger modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Input Handling States
  const [bankLoanAmount, setBankLoanAmount] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("");
  const [retrieveDescription, setRetrieveDescription] = useState("");
  const [retrieveQuantity, setRetrieveQuantity] = useState("");

  const [viewImageModalOpen, setViewImageModalOpen] = useState(false);
  const [activeLockerItemImages, setActiveLockerItemImages] = useState([]);
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [bankLoanDate, setBankLoanDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [bankSettlementDate, setBankSettlementDate] = useState(
    new Date().toISOString().split("T")[0],
  );

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

  // BUG FIX: Safely auto-select the first item for BOTH single products AND multiple items arrays
  useEffect(() => {
    if (selectedItem) {
      let firstItemName = "";

      if (selectedItem.loan?.items && selectedItem.loan.items.length > 0) {
        // Handle new multiple items format
        const rawName =
          selectedItem.loan.items[0].productId?.name ||
          selectedItem.loan.items[0].productId;
        const isRawId =
          typeof rawName === "string" && /^[0-9a-fA-F]{24}$/.test(rawName);
        firstItemName = isRawId || !rawName ? "Item 1" : rawName;
      } else {
        // Handle old single product format
        const rawProduct =
          selectedItem.loan?.product?.name || selectedItem.loan?.product;
        if (typeof rawProduct === "string") {
          firstItemName = rawProduct.split(",")[0].trim();
        }
      }

      setRetrieveDescription(firstItemName || "Gold Item");
    }
  }, [selectedItem]);

  const handleUpdateBankLoan = async () => {
    if (!bankLoanAmount || !selectedItem)
      return alert("Please enter an amount");
    try {
      await axios.put(
        `http://localhost:5000/api/bankDetails/${selectedItem._id}`,
        { 
          bankLoanAmount: parseFloat(bankLoanAmount),
          bankLoanDate: bankLoanDate
         },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      alert("Bank loan recorded successfully!");
      setIsBankLoanModalOpen(false);
      setBankLoanAmount("");

      if (typeof setBankLoanDate === 'function') {
        setBankLoanDate(new Date().toISOString().split("T")[0]);
      }

      fetchCustomersLocker();
    } catch (err) {
      alert("Failed to update bank loan");
    }
  };

  const handleSettleBankLoan = async (paymentType) => {
    if (!settlementAmount || !selectedItem)
      return alert("Please enter the settlement amount");
    try {
      await axios.put(
        `http://localhost:5000/api/bankDetails/${selectedItem._id}`,
        { 
          bankSettlementAmount: parseFloat(settlementAmount),
          bankSettlementDate: bankSettlementDate,
          paymentType: paymentType
         },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      alert(`${paymentType} payment added successfully!`);
      setIsSettleModalOpen(false);
      setSettlementAmount("");

      if (typeof setBankSettlementDate === 'function') {
        setBankSettlementDate(new Date().toISOString().split("T")[0]);
      }

      fetchCustomersLocker();

    } catch (err) {
      alert("Failed to add settlement payment");
    }
  };

  const handleRetrieveItem = async (type) => {
    if (!retrieveDescription || !retrieveQuantity || !selectedItem) {
      return alert("Fill all fields");
    }

    const finalRetrievedState = type === "Full";

    const dateToFormat = transactionDate
      ? new Date(transactionDate)
      : new Date();

    const currentDateStr = dateToFormat.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    let updatedDescription = retrieveDescription;
    let updatedQuantity = retrieveQuantity;
    let updatedDate = currentDateStr;

    // 2. Concatenate with existing string history using " || " if previous data exists
    if (selectedItem.retrievals?.description) {
      updatedDescription = `${selectedItem.retrievals.description} || ${retrieveDescription}`;
    }
    if (selectedItem.retrievals?.quantity) {
      updatedQuantity = `${selectedItem.retrievals.quantity} || ${retrieveQuantity}`;
    }
    if (selectedItem.retrievals?.date) {
      updatedDate = `${selectedItem.retrievals.date} || ${currentDateStr}`;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/bankDetails/${selectedItem._id}`,
        {
          retrievalStatus:
            type === "Partial" ? "Partially Retrieved" : "Fully Retrieved",
          isRetrieved: finalRetrievedState,
          retrievals: {
            description: updatedDescription,
            quantity: updatedQuantity,
            date: updatedDate,
          },
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      alert(`Items ${type === "Partial" ? "Partially" : "Fully"} Retrieved!`);

      setIsRetrieveModalOpen(false);
      setRetrieveDescription("");
      setRetrieveQuantity("");
      setTransactionDate(new Date().toISOString().split("T")[0]);
      fetchCustomersLocker();
    } catch (err) {
      console.error("Retrieval error:", err);
      alert("Failed to record retrieval");
    }
  };

  const filteredLockerByLoan = lockerItems.filter((item) => {
    if (!loanSearchQuery) return true;
    const searchLower = loanSearchQuery.toLowerCase();
    return (
      (item.loan?.loanId &&
        item.loan.loanId.toLowerCase().includes(searchLower)) ||
      (item.customer?.name &&
        item.customer.name.toLowerCase().includes(searchLower)) ||
      (item.customer?.phone &&
        item.customer.phone.toLowerCase().includes(searchLower))
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
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by Loan ID or Customer..."
                value={loanSearchQuery}
                onChange={(e) => setLoanSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold"
              />
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left table-fixed">
              <thead className="bg-slate-800 text-white selection:bg-indigo-500">
                <tr>
                  <th className="w-[13%] py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="w-[7%] py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="w-[14%] py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                    Product in Locker
                  </th>
                  <th className="w-[9%] py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-center">
                    Product Image
                  </th>
                  <th className="w-[11%] py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                    Bank Info
                  </th>
                  <th className="w-[7%] py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-center">
                    Locker No
                  </th>
                  <th className="w-[13%] py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                    Bank Loan History
                  </th>
                  <th className="w-[13%] py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                    Settlement History
                  </th>
                  <th className="w-[13%] py-3 px-4 text-[10px] font-bold uppercase tracking-wider">
                    Retrieval Details
                  </th>
                  <th className="w-[10%] py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-right">
                    Bank Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-slate-100">
                {filteredLockerByLoan.map((item) => {
                  const totalLoans =
                    item.bankLoans?.reduce((sum, l) => sum + l.amount, 0) || 0;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 transition-colors duration-150 group">
                      {/* Customer info */}
                      <td className="py-3.5 px-4 font-black text-slate-800 uppercase align-middle">
                        <div className="flex items-center gap-3">
                          <img
                            src={`http://localhost:5000/uploads/${item.customer?.recentimage}`}
                            alt="Customer"
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${item.customer?.name || "User"}&background=f1f5f9&color=475569`;
                            }}
                          />
                          <span className="truncate max-w-[130px] block text-xs tracking-wide">
                            {item.customer?.name}
                          </span>
                        </div>
                      </td>

                      {/* Loan ID */}
                      <td className="py-3.5 px-4 align-middle">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200/60 text-slate-700">
                          {item.loan?.loanId || "N/A"}
                        </span>
                      </td>

                      {/* Products */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-col gap-1 max-w-full overflow-hidden">
                          {item.loan?.items && item.loan.items.length > 0 ? (
                            item.loan.items.map((loanItem, idx) => {
                              const rawName =
                                loanItem.productId?.name || loanItem.productId;
                              const isRawId =
                                typeof rawName === "string" &&
                                /^[0-9a-fA-F]{24}$/.test(rawName);
                              const productName =
                                isRawId || !rawName
                                  ? `Item ${idx + 1}`
                                  : rawName;

                              return (
                                <span
                                  key={idx}
                                  className="truncate block bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded text-[11px] text-amber-800 font-bold w-fit max-w-full">
                                  {idx + 1}. {productName}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[11px] bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded text-amber-800 font-bold w-fit">
                              {(() => {
                                const rawSingleName =
                                  item.loan?.product?.name ||
                                  item.loan?.product;
                                const isSingleId =
                                  typeof rawSingleName === "string" &&
                                  /^[0-9a-fA-F]{24}$/.test(rawSingleName);
                                return isSingleId || !rawSingleName
                                  ? "Product N/A"
                                  : rawSingleName;
                              })()}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium italic mt-0.5 pt-0.5 border-t border-slate-100 block">
                            Vault: {item.ledgercreationdate}
                          </span>
                        </div>
                      </td>

                      {/* Images */}
                      <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                        {item.loan?.items &&
                        item.loan.items.some((li) => li.image) ? (
                          <button
                            type="button"
                            onClick={() => {
                              const extractedImages = item.loan.items
                                .map((li) => li.image)
                                .filter(Boolean);
                              setActiveLockerItemImages(extractedImages);
                              setViewImageModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100/80 text-rose-700 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs transition-all active:scale-95">
                            Images (
                            {item.loan.items.filter((li) => li.image).length})
                          </button>
                        ) : (
                          <span className="inline-block text-[10px] text-slate-400 font-semibold italic bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                            No Image
                          </span>
                        )}
                      </td>

                      {/* Bank Info */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="text-xs leading-normal">
                          <p className="font-bold text-slate-700 truncate">
                            {item.bank?.name}
                          </p>
                          <p className="text-slate-500 truncate text-[11px]">
                            {item.branchname}
                          </p>
                          <p className="text-[10px] text-indigo-600 font-bold mt-0.5 truncate">
                            Staff: {item.obstaffname || "N/A"}
                          </p>
                        </div>
                      </td>

                      {/* Locker No */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-black min-w-[40px]">
                          {item.lockerno || "-"}
                        </span>
                      </td>

                      {/* BANK LOAN HISTORY */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-col gap-1 w-full text-xs">
                          {item.bankLoans && item.bankLoans.length > 0 ? (
                            <>
                              <div className="max-h-[72px] overflow-y-auto flex flex-col gap-1 pr-0.5 custom-scrollbar">
                                {item.bankLoans.map((loanEntry, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center bg-emerald-50/70 text-emerald-900 px-2 py-0.5 rounded border border-emerald-100 shadow-2xs">
                                    <span className="text-[9px] text-emerald-600 font-bold">
                                      {loanEntry.date
                                        ? new Date(
                                            loanEntry.date,
                                          ).toLocaleDateString("en-GB")
                                        : "Recent"}
                                    </span>
                                    <span className="font-black text-[11px]">
                                      ₹
                                      {Number(loanEntry.amount || 0).toFixed(0)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-0.5 pt-0.5 border-t border-slate-200 flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-400">
                                  Grand Total:
                                </span>
                                <span className="font-black text-emerald-700 text-[11px]">
                                  ₹{totalLoans.toFixed(0)}
                                </span>
                              </div>
                            </>
                          ) : item.bankLoanAmount ? (
                            <>
                              <div className="bg-emerald-50/70 text-emerald-900 px-2 py-1 rounded border border-emerald-100 shadow-2xs flex justify-between items-center">
                                <span className="text-[9px] text-emerald-600 font-bold">
                                  Initial Loan
                                </span>
                                <span className="font-black text-[11px]">
                                  ₹{Number(item.bankLoanAmount).toFixed(0)}
                                </span>
                              </div>
                              <div className="mt-0.5 pt-0.5 border-t border-slate-200 flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-400">
                                  Grand Total:
                                </span>
                                <span className="font-black text-emerald-700 text-[11px]">
                                  ₹{Number(item.bankLoanAmount).toFixed(0)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic text-center py-1 bg-slate-50/50 rounded border border-slate-100 block">
                              No loans issued
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 🟢 NEW: Clean View History Button instead of crowded list */}
                      <td className="py-3.5 px-4 align-middle">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHistoryItem(item);
                            setIsHistoryModalOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-all font-bold text-xs shadow-sm active:scale-95">
                          View History
                        </button>
                      </td>

                      {/* Retrieval Details */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-col gap-1 w-full max-h-[95px] overflow-y-auto pr-0.5 custom-scrollbar">
                          {item.retrievals?.description ? (
                            item.retrievals.description
                              .split(" || ")
                              .map((desc, idx) => {
                                const qty =
                                  item.retrievals.quantity?.split(" || ")[
                                    idx
                                  ] || "";
                                const date =
                                  item.retrievals.date?.split(" || ")[idx] ||
                                  "";
                                return (
                                  <div
                                    key={idx}
                                    className="text-[10px] text-orange-800 font-bold bg-orange-50/70 px-2 py-1 rounded border border-orange-200/70 flex justify-between items-center shadow-2xs gap-1">
                                    <span className="truncate max-w-[55px]">
                                      ✔ {desc}
                                    </span>
                                    <div className="flex gap-0.5 shrink-0">
                                      <span className="text-[9px] bg-white px-1 py-0.5 rounded text-orange-600 border border-orange-100 font-medium">
                                        {qty}
                                      </span>
                                      <span className="text-[9px] bg-white px-1 py-0.5 rounded text-orange-600 border border-orange-100 font-medium">
                                        {date}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                          ) : (
                            <span className="text-[10px] text-slate-400 italic text-center py-1 bg-slate-50/50 rounded border border-slate-100 block">
                              No items retrieved
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bank Actions */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex flex-col items-end gap-1 w-full">
                          {item.retrievalStatus !== "Full" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItem(item);
                                setBankLoanAmount("");
                                setIsBankLoanModalOpen(true);
                              }}
                              className="flex items-center justify-center gap-1 bg-indigo-600 text-white px-2 py-1 rounded border border-indigo-700 text-[10px] font-bold hover:bg-indigo-700/90 transition-all shadow-xs w-full">
                              <Plus size={10} strokeWidth={3} /> Add Bank Loan
                            </button>
                          )}

                          {item.retrievalStatus !== "Fully Retrieved" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItem(item);
                                setSettlementAmount("");
                                setIsSettleModalOpen(true);
                              }}
                              className="flex items-center justify-center gap-1 bg-blue-600 text-white px-2 py-1 rounded border border-blue-700 text-[10px] font-bold hover:bg-blue-700/90 transition-all shadow-xs w-full">
                              <HandCoins size={11} strokeWidth={3} /> Settlement
                            </button>
                          )}

                          {item.retrievalStatus === "Fully Retrieved" ? (
                            <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded border border-emerald-200 w-full text-center shadow-2xs flex items-center justify-center gap-1">
                              <Package size={12} strokeWidth={2.5} /> Done
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedItem(item);
                                setIsRetrieveModalOpen(true);
                              }}
                              className="flex items-center justify-center gap-1 bg-slate-100 text-slate-700 border border-slate-300 px-2 py-1.5 rounded text-[10px] font-bold hover:bg-slate-200 transition-all w-full shadow-2xs">
                              <ArrowRightLeft size={11} strokeWidth={2.5} />
                              <span className="truncate">
                                {item.retrievalStatus === "Partially Retrieved"
                                  ? "Remaining"
                                  : "Retrieve"}
                              </span>
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
              <h3 className="font-black flex items-center gap-2">
                <Landmark size={18} /> Bank Loan Amount
              </h3>
              <button
                onClick={() => setIsBankLoanModalOpen(false)}
                className="text-2xl hover:rotate-90 transition-transform">
                ×
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-slate-100/50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="text-slate-500" size={20} />
                <h2 className="text-lg font-black text-slate-700">
                  Daily Operations
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Entry Date:
                </label>
                <input
                  type="date"
                  value={bankLoanDate}
                  onChange={(e) => setBankLoanDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
                />
              </div>
            </div>

            <div className="p-6">
              <p className="text-xs text-slate-500 font-bold mb-4">
                Enter the loan amount provided by the bank for this product.
              </p>
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
                className="w-full mt-6 bg-indigo-600 text-white font-black py-3 rounded-xl hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">
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
              <h3 className="font-black flex items-center gap-2">
                <HandCoins size={18} /> Add Settlement
              </h3>
              <button
                onClick={() => setIsSettleModalOpen(false)}
                className="text-2xl hover:rotate-90 transition-transform">
                ×
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-slate-100/50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="text-slate-500" size={20} />
                <h2 className="text-lg font-black text-slate-700">
                  Daily Operations
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Entry Date:
                </label>
                <input
                  type="date"
                  value={bankSettlementDate}
                  onChange={(e) => setBankSettlementDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
                />
              </div>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-800">
                  Latest Loan Input:
                </span>
                <span className="text-sm font-black text-blue-900">
                  ₹{selectedItem?.bankLoanAmount?.toFixed(2) || "0.00"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mb-4">
                Enter the installment or settlement amount paid to the bank
                today.
              </p>
              <input
                type="number"
                placeholder="Payment Amount (₹)"
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-black text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                autoFocus
              />
              <div className="mt-6 flex gap-3">
                {/* 1. The Loan (Principal) Button */}
                <button
                  type="button"
                  onClick={() => handleSettleBankLoan("Principal")}
                  className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl hover:bg-slate-900 shadow-lg active:scale-95 transition-all">
                  Loan
                </button>

                {/* 2. The Interest Button */}
                <button
                  type="button"
                  onClick={() => handleSettleBankLoan("Interest")}
                  className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
                  Interest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Retrieve Item */}
      {isRetrieveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
              <h3 className="font-black flex items-center gap-2">
                <Package size={18} /> Record Retrieval
              </h3>
              <button
                onClick={() => setIsRetrieveModalOpen(false)}
                className="text-2xl hover:rotate-90 transition-transform">
                ×
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-slate-100/50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="text-slate-500" size={20} />
                <h2 className="text-lg font-black text-slate-700">
                  Daily Operations
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Entry Date:
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
                />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                <p className="text-xs font-bold text-blue-800">
                  Products currently in this Loan:
                </p>
                <div className="flex flex-col gap-1 mt-1">
                  {selectedItem?.loan?.items &&
                  selectedItem.loan.items.length > 0 ? (
                    selectedItem.loan.items.map((li, idx) => {
                      const rawName = li.productId?.name || li.productId;
                      const isRawId =
                        typeof rawName === "string" &&
                        /^[0-9a-fA-F]{24}$/.test(rawName);
                      return (
                        <span
                          key={idx}
                          className="text-sm font-black text-blue-900">
                          {isRawId || !rawName ? `Item ${idx + 1}` : rawName}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-sm font-black text-blue-900">
                      {typeof selectedItem?.loan?.product === "string"
                        ? selectedItem.loan.product
                        : selectedItem?.loan?.product?.name || "Product"}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                  Select Item to Retrieve
                </label>
                <select
                  value={retrieveDescription}
                  onChange={(e) => setRetrieveDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-bold text-slate-800 focus:border-slate-800 transition-all outline-none appearance-none cursor-pointer">
                  {selectedItem?.loan?.items &&
                  selectedItem.loan.items.length > 0
                    ? selectedItem.loan.items.map((li, idx) => {
                        const rawName = li.productId?.name || li.productId;
                        const isRawId =
                          typeof rawName === "string" &&
                          /^[0-9a-fA-F]{24}$/.test(rawName);
                        const pName =
                          isRawId || !rawName ? `Item ${idx + 1}` : rawName;
                        return (
                          <option key={idx} value={pName}>
                            {pName}
                          </option>
                        );
                      })
                    : (
                        selectedItem?.loan?.product?.name ||
                        selectedItem?.loan?.product ||
                        ""
                      )
                        .toString()
                        .split(",")
                        .map((prod, idx) => (
                          <option key={idx} value={prod.trim()}>
                            {prod.trim()}
                          </option>
                        ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                  Quantity Retrieved
                </label>
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
                  className="flex-1 bg-orange-500 text-white font-black py-3 rounded-xl hover:bg-orange-600 shadow-md active:scale-95 transition-all flex justify-center items-center gap-2 text-sm">
                  <ArrowRightLeft size={16} /> Split Retrieve
                </button>

                <button
                  onClick={() => handleRetrieveItem("Full")}
                  className="flex-1 bg-emerald-600 text-white font-black py-3 rounded-xl hover:bg-emerald-700 shadow-md active:scale-95 transition-all flex justify-center items-center gap-2 text-sm">
                  <Package size={16} /> Full Retrieve
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center font-bold">
                * Split retrieve adds to the list and keeps the button active.
                Full retrieve clears the locker.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Loan Item Images Viewer Modal */}
      {viewImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Loan Item Images
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Showing all uploaded item images for this custom record
                </p>
              </div>
              <button
                onClick={() => {
                  setViewImageModalOpen(false);
                  setActiveLockerItemImages([]);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-2 gap-4 bg-slate-50/50">
              {activeLockerItemImages.length > 0 ? (
                activeLockerItemImages.map((imgStr, idx) => (
                  <div
                    key={idx}
                    className="relative bg-white p-2 rounded-xl border border-slate-200 shadow-sm group">
                    <img
                      src={imgStr}
                      alt={`Loan item attachment ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg shadow-inner border border-slate-100 transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-4 left-4 bg-slate-900/70 text-white text-[10px] font-black px-2 py-0.5 rounded backdrop-blur-xs">
                      Item #{idx + 1}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-12 text-center">
                  <p className="text-sm font-bold text-slate-400 italic">
                    No renderable asset attachment files found.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setViewImageModalOpen(false);
                  setActiveLockerItemImages([]);
                }}
                className="px-5 py-2 bg-slate-800 text-white text-sm font-black rounded-xl hover:bg-slate-900 transition-all active:scale-95 shadow-md">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 NEW: Payment History Expanded Modal Panel Layout */}
      {isHistoryModalOpen && selectedHistoryItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-black flex items-center gap-2">
                <Calendar size={18} /> Payment History Ledger
              </h3>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-2xl hover:rotate-90 transition-transform outline-none">
                ×
              </button>
            </div>

            <div className="p-6 bg-slate-50">
              {/* Summary Metrics Banner Block */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Loan Paid</span>
                  <span className="text-base font-black text-slate-800">
                    ₹{(selectedHistoryItem.bankSettlements?.filter(s => s.paymentType === "Principal").reduce((sum, s) => sum + s.amount, 0) || 0).toFixed(0)}
                  </span>
                </div>
                <div className="flex-1 bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-xs flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">Total Interest Paid</span>
                  <span className="text-base font-black text-blue-700">
                    ₹{(selectedHistoryItem.bankSettlements?.filter(s => s.paymentType !== "Principal").reduce((sum, s) => sum + s.amount, 0) || 0).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Ledger Items Scroll View */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-[260px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Date Paid</th>
                        <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Payment Type</th>
                        <th className="p-3 text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedHistoryItem.bankSettlements && selectedHistoryItem.bankSettlements.length > 0 ? (
                        selectedHistoryItem.bankSettlements.map((settle, idx) => {
                          const isPrincipal = settle.paymentType === "Principal";
                          return (
                            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-3 text-xs font-bold text-slate-700">
                                {new Date(settle.date).toLocaleDateString("en-GB")}
                              </td>
                              <td className="p-3">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                  isPrincipal 
                                    ? "bg-slate-100 text-slate-700 border border-slate-200" 
                                    : "bg-blue-100 text-blue-700 border border-blue-200"
                                }`}>
                                  {isPrincipal ? "Loan" : "Interest"}
                                </span>
                              </td>
                              <td className="p-3 text-xs font-black text-slate-800 text-right">
                                ₹{settle.amount.toFixed(0)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="3" className="p-6 text-center text-xs font-bold text-slate-400 italic bg-slate-50/50">
                            No payment ledger records saved yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-full mt-5 bg-slate-800 text-white font-black py-2.5 rounded-xl hover:bg-slate-900 shadow-md active:scale-95 transition-all text-sm">
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}