import { useState, useEffect } from "react";
import { Search, Trash2, FileChartColumn } from "lucide-react";
import upi from "../assets/upi.png";
import ver from "../assets/approved.png";
import axios from "axios";
export default function LoansTab() {
  const [loanSearchQuery, setLoanSearchQuery] = useState("");
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [ReceiptModal, setReceiptModal] = useState(false);
  const [PayLoanModal, setPayLoanModal] = useState(false);
  const [selectedLoanForBank, setSelectedLoanForBank] = useState(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState(null);
  const [deleteLoanModal, setDeleteLoanModal] = useState(false);
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [shopProfile, setShopProfile] = useState(null);
  const [payType, setPayType] = useState("");
  const [paidLoan, setPaidLoan] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [bankList, setBankList] = useState([]);

  const filteredLoans = loans.filter((loan) => {
    if (!loanSearchQuery) return true;

    const searchLower = loanSearchQuery.toLowerCase();

    return (
      (loan.loanId && loan.loanId.toLowerCase().includes(searchLower)) ||
      (loan.customer &&
        loan.customer.name.toLowerCase().includes(searchLower)) ||
      (loan.customer && loan.customer.phone.toLowerCase().includes(searchLower))
    );
  });

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const bankData = Object.fromEntries(formData.entries());

    bankData.loanId = selectedLoanForBank?._id;

    console.log("Sending to server:", bankData);

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/bankDetails", bankData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ வங்கி விவரங்கள் சேமிக்கப்பட்டன!");
      setIsBankModalOpen(false);
      fetchLoans();
    } catch (error) {
      console.error("Server says:", error.response?.data);
      alert(
        "❌ பிழை: " + (error.response?.data?.message || "சேமிக்க முடியவில்லை"),
      );
    }
  };

  const handlePayLoanSubmit = async (e) => {
    e.preventDefault();
    const payAmount = e.target.payAmount.value;
    try {
      const res = await axios.post(
        "http://localhost:5000/api/payLoan",
        {
          loanId: selectedLoan._id,
          amountPaid: parseFloat(payAmount),
          payType: payType,
          cretedBy: localStorage.getItem("userId"),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      alert(res.data.message);
      setPayLoanModal(false);

      fetchLoans();
      fetchPaidLoanDetails();
    } catch (err) {
      console.error("Server Error:", err.response?.data || err.message);
      alert(
        "Error: " + (err.response?.data?.message || "Something went wrong"),
      );
    }
  };

  const confirmDeleteLoan = async () => {
    if (!deletePasswordInput)
      return alert("கடவுச்சொல்லை உள்ளிடவும்! (Enter password)");

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/loans/${loanToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { password: deletePasswordInput },
        },
      );

      alert("கடன் வெற்றிகரமாக நீக்கப்பட்டது! (Loan deleted successfully!)");
      setDeleteLoanModal(false);
      setDeletePasswordInput("");
      setLoanToDelete(null);

      fetchLoans();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete loan.");
    }
  };

  const fetchLoans = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/loans", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const takenloans = res.data;
      setLoans(takenloans);
      console.log("Loans:", takenloans);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  const fetchShopProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/shop-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShopProfile(res.data);
    } catch (error) {
      console.error("Error fetching shop profile:", error);
    }
  };

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

  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/loguser", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCurrentUser(res.data);
    } catch (error) {
      console.error("Error fetching Logged in User:", error);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/banks", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBankList(res.data);
    } catch (error) {
      console.error("Failed to fetch banks", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchLoans();
      await fetchShopProfile();
      await fetchPaidLoanDetails();
      await fetchBanks();
      await fetchUser();
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h2 className="lg:text-lg md:text-sm font-bold text-slate-800 tracking-wide">
              கடன்கள் பட்டியல் (Loans Ledger)
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
              Total Loans: {loans?.length || 0}
            </span>
          </div>

          {/* 📊 Table Section */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    தேதி
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    வாடிக்கையாளர்
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    அடகு பொருள்
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    தங்கம் விலை
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">
                    அடகு%
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    கடன் தொகை
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    நடவடிக்கை
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">
                    பெட்டக நிலை
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">
                    வட்டி / வட்டி நிலை
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">
                    மீதமுள்ள தொகை
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredLoans && filteredLoans.length > 0 ? (
                  filteredLoans.map((loan) => {
                    const activePendingInterest = loan.pendingInterest || 0;
                    const currentBalance = loan.currentBalance || 0;
                    const interestPaid = loan.interestPaid || 0;

                    return (
                      <tr
                        key={loan._id}
                        className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                          {loan.paymentDate || loan.createdAt
                            ? new Date(
                                loan.paymentDate || loan.createdAt,
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "No Date"}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-fuchsia-500">
                          {loan.loanId || "Unknown"}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-slate-800">
                          {loan.customer?.name || "Unknown"}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <span className="text-amber-600 font-bold">
                              {loan.product?.name || "Product"}
                            </span>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-800 font-semibold">
                              {loan.weight}g
                            </span>
                            <span className="text-slate-400">/</span>
                            <span
                              className="text-rose-500 font-semibold text-xs"
                              title="Stone Weight">
                              {loan.stoneweight}g
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-slate-600">
                          ₹{loan.goldrate}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-slate-500 text-center">
                          <span className="bg-slate-100 px-2 py-1 rounded-md">
                            {loan.pawnpercentage}%
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-sm font-black text-emerald-600">
                          ₹{loan.loanamount?.toFixed(2)}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-sm">
                          {loan.isClosed ? (
                            <div className="relative inline-flex justify-start items-center mt-2">
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setReceiptModal(true);
                                }}
                                className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 py-2 px-5 rounded-lg text-xs font-bold transition-all shadow-sm relative z-0">
                                ரசீது (Receipt)
                              </button>
                              <span className="absolute -top-3 -left-3 z-10 inline-block border-2 border-emerald-500 bg-emerald-50/90 backdrop-blur-sm text-emerald-600 font-black text-[10px] uppercase tracking-widest py-1 px-2 rounded-md transform -rotate-6 shadow-md pointer-events-none">
                                செலுத்தப்பட்டது (PAID)
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setPayLoanModal(true);
                                }}
                                className="bg-rose-50 hover:bg-rose-600 cursor-pointer duration-150 hover:scale-105 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm">
                                கடனை செலுத்து (Pay)
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setReceiptModal(true);
                                }}
                                className="bg-blue-50 cursor-pointer duration-150 hover:scale-105 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm">
                                ரசீது (Receipt)
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          {!loan.isBanked ? (
                            <div
                              onClick={() => {
                                setSelectedLoanForBank(loan);
                                setIsBankModalOpen(true);
                              }}
                              className="cursor-pointer inline-flex items-center justify-center p-1.5 bg-slate-50 hover:bg-amber-50 rounded-full transition-all border border-transparent hover:border-amber-200"
                              title="Add to Owner's Bank">
                              <img
                                src={upi}
                                alt="UPI"
                                className="w-8 h-8 hover:scale-110 transition duration-150"
                              />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center p-1.5">
                              <img
                                src={ver}
                                alt="Verified"
                                className="w-8 h-8 drop-shadow-sm"
                              />
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-right">
                          {loan.isClosed ||
                          (interestPaid > 0 && activePendingInterest <= 0) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-black bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm">
                              ✓ Paid Interest
                            </span>
                          ) : (
                            <span className="text-rose-600">
                              + ₹{activePendingInterest.toFixed(2)}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-sm font-black text-emerald-700 bg-emerald-50/50 text-right">
                          ₹
                          {loan.isClosed || currentBalance <= 0
                            ? "0.00"
                            : currentBalance.toFixed(2)}
                        </td>
                        <td className="py-3 px-6 whitespace-nowrap text-center">
                          <button
                            onClick={() => {
                              setLoanToDelete(loan); 
                              setDeleteLoanModal(true);
                            }}
                            className="text-rose-500 hover:scale-105 cursor-pointer hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors border border-rose-200 shadow-sm"
                            title="Delete Loan">
                            <Trash2 />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      className="py-12 px-6 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl text-blue-300">
                          <FileChartColumn />
                        </span>
                        <p>எந்த கடன்களும் இல்லை (No loans found).</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {ReceiptModal && selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-300 print:p-0 print:bg-white print:block">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none relative flex flex-col max-h-[95vh] print:max-h-none print:block overflow-hidden">
            <div
              id="printable-receipt"
              className="p-8 print:p-0 relative bg-white overflow-y-auto flex-1 print:overflow-visible print:block custom-scrollbar">
              <div className="hidden print:flex absolute inset-0 items-center justify-center opacity-[0.03] pointer-events-none z-0">
                <span className="text-4xl font-black uppercase tracking-widest transform -rotate-45 text-center leading-relaxed">
                  {shopProfile?.shopName || currentUser.username} <br />
                  {shopProfile?.phone}
                </span>
              </div>

              <div className="relative z-10">
                <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-6 print:border-black flex flex-col items-center">
                  {shopProfile?.shopimage ? (
                    <img
                      src={`http://localhost:5000/uploads/${shopProfile.shopimage}`}
                      alt="Shop Logo"
                      className="w-16 h-16 object-contain mb-3 rounded-xl print:w-16 print:h-16"
                    />
                  ) : (
                    <div className="inline-flex items-center justify-center bg-amber-100 text-amber-600 w-12 h-12 rounded-full mb-3 print:hidden shadow-sm">
                      <span className="text-2xl">
                        <Landmark />
                      </span>
                    </div>
                  )}

                  <h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest print:text-black">
                    {shopProfile?.shopName ||
                      `${currentUser.username} ${currentUser.shoptype || ""}`}
                  </h2>
                  <p className="text-slate-500 font-bold mt-1 text-xs tracking-widest uppercase print:text-black">
                    பில் ரசீது (Official Receipt)
                  </p>
                  <p className="text-slate-600 font-bold mt-3 text-sm print:text-black max-w-md mx-auto leading-relaxed">
                    {shopProfile?.address || "Address not updated"} <br />
                    <span className="font-mono">
                      Phone: {shopProfile?.phone || "+91 XXXXXXXXXX"}
                    </span>
                  </p>
                </div>

                {/* 🟢 LOAN ID & DATE */}
                <div className="flex justify-between items-center mb-6 px-6 py-4 bg-slate-50 rounded-xl border border-slate-100 print:bg-transparent print:border-b print:border-t print:border-slate-300 print:rounded-none print:px-0 print:py-2">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest print:text-slate-600">
                      கடன் எண் (Loan No)
                    </p>
                    <p className="text-xl font-black text-indigo-700 print:text-black font-mono tracking-wider">
                      {selectedLoan.loanId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest print:text-slate-600">
                      தேதி (Date)
                    </p>
                    <p className="text-lg font-black text-slate-800 print:text-black">
                      {new Date(selectedLoan.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                  <div className="flex-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 w-full">
                    <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 print:border-black print:text-black uppercase text-xs tracking-widest">
                      வாடிக்கையாளர் விவரங்கள்
                    </h4>

                    {/* 🟢 CUSTOMER DETAILS INCLUDING CUSTOMER ID */}
                    <div className="space-y-2 text-sm text-slate-700 print:text-black">
                      <p className="flex items-center">
                        <span className="font-semibold w-24 text-slate-500 print:text-slate-600">
                          எண் (ID):
                        </span>
                        <span className="font-black uppercase text-indigo-700 print:text-black bg-indigo-50 px-2 py-0.5 rounded print:p-0 print:bg-transparent">
                          {selectedLoan.customer?.customerIdy ||
                            selectedLoan.customer?.id}
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="font-semibold w-24 text-slate-500 print:text-slate-600">
                          பெயர்:
                        </span>
                        <span className="font-bold uppercase">
                          {selectedLoan.customer?.name}
                        </span>
                      </p>
                      <p className="flex items-center">
                        <span className="font-semibold w-24 text-slate-500 print:text-slate-600">
                          மொபைல்:
                        </span>
                        <span className="font-bold font-mono">
                          {selectedLoan.customer?.phone}
                        </span>
                      </p>
                      <p className="flex items-start">
                        <span className="font-semibold w-24 text-slate-500 print:text-slate-600">
                          முகவரி:
                        </span>
                        <span className="flex-1 leading-snug">
                          {selectedLoan.customer?.address}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <img
                      src={`http://localhost:5000/uploads/${selectedLoan.customer?.recentimage}`}
                      alt="Customer"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-slate-200 shadow-sm print:border-black print:rounded-none"
                      onError={(e) => {
                        e.target.src =
                          "https://ui-avatars.com/api/?name=" +
                          (selectedLoan.customer?.name || "User") +
                          "&background=F1F5F9&color=64748B";
                      }}
                    />
                  </div>
                </div>

                <table className="w-full mb-8 text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 print:border-black bg-slate-50 print:bg-transparent">
                      <th className="py-3 px-2 text-left font-bold text-slate-700 uppercase tracking-wider text-xs print:text-black">
                        பொருள் விளக்கம்
                      </th>
                      <th className="py-3 px-2 text-right font-bold text-slate-700 uppercase tracking-wider text-xs print:text-black">
                        மொத்த Wt
                      </th>
                      <th className="py-3 px-2 text-right font-bold text-slate-700 uppercase tracking-wider text-xs print:text-black">
                        கல் எடை
                      </th>
                      <th className="py-3 px-2 text-right font-bold text-slate-700 uppercase tracking-wider text-xs print:text-black">
                        நிகர எடை
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-dashed border-slate-200 print:border-black">
                      <td className="py-4 px-2 font-bold text-slate-800 print:text-black">
                        {selectedLoan.product?.name || "Gold Item"}
                      </td>
                      <td className="py-4 px-2 text-right font-semibold text-slate-600 print:text-black">
                        {selectedLoan.weight}g
                      </td>
                      <td className="py-4 px-2 text-right font-semibold text-slate-600 print:text-black">
                        {selectedLoan.stoneweight}g
                      </td>
                      <td className="py-4 px-2 text-right font-black text-slate-800 print:text-black bg-slate-50 print:bg-transparent">
                        {(
                          selectedLoan.weight - selectedLoan.stoneweight
                        ).toFixed(2)}
                        g
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-6">
                  <div className="space-y-3 print:pt-2">
                    <p className="flex justify-between text-sm border-b border-slate-100 pb-2 print:border-slate-300">
                      <span className="text-slate-500 font-semibold print:text-slate-600">
                        தங்கம் விலை (Gold Rate):
                      </span>
                      <span className="font-bold text-slate-800 print:text-black font-mono">
                        ₹{selectedLoan.goldrate}/g
                      </span>
                    </p>
                    <p className="flex justify-between text-sm border-b border-slate-100 pb-2 print:border-slate-300">
                      <span className="text-slate-500 font-semibold print:text-slate-600">
                        அடகு சதவீதம் (Pawn %):
                      </span>
                      <span className="font-bold text-slate-800 print:text-black font-mono">
                        {selectedLoan.pawnpercentage}%
                      </span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100 print:bg-transparent print:border-black print:rounded-none print:p-2">
                      <p className="text-emerald-700 font-bold text-xs uppercase tracking-widest print:text-black">
                        மொத்த கடன்
                      </p>
                      <p className="text-2xl font-black text-emerald-800 print:text-black">
                        ₹{selectedLoan.loanamount?.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 print:bg-transparent print:border-black print:rounded-none print:p-2 flex flex-col">
                      <p className="text-indigo-700 font-bold text-xs uppercase tracking-widest print:text-black mb-3 border-b border-indigo-200 pb-2 print:border-black">
                        செலுத்திய விவரங்கள் (Payment History)
                      </p>

                      {(() => {
                        const relatedPayments =
                          paidLoan?.filter(
                            (pl) =>
                              pl.loan?._id === selectedLoan._id ||
                              pl.loan === selectedLoan._id,
                          ) || [];

                        if (relatedPayments.length === 0) {
                          return (
                            <div className="text-sm font-semibold text-indigo-400 print:text-slate-500 py-2">
                              பணம் எதுவும் செலுத்தப்படவில்லை (No payments yet)
                            </div>
                          );
                        }

                        const totalPaid = relatedPayments.reduce(
                          (sum, pl) => sum + (pl.amountPaid || 0),
                          0,
                        );

                        return (
                          <div className="space-y-2 w-full">
                            {relatedPayments.map((payment, index) => (
                              <div
                                key={payment._id || index}
                                className="flex justify-between items-center text-sm font-semibold text-slate-700 print:text-black">
                                <span className="text-slate-500 print:text-black text-xs">
                                  {payment.paymentDate
                                    ? new Date(
                                        payment.paymentDate,
                                      ).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "Unknown Date"}
                                </span>
                                <span className="font-bold text-indigo-800 print:text-black">
                                  ₹{payment.amountPaid?.toFixed(2)}
                                </span>
                              </div>
                            ))}

                            <div className="flex flex-col gap-2 mt-4 pt-4 border-t-2 border-dashed border-indigo-200 print:border-black">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-indigo-900 print:text-black uppercase tracking-widest">
                                  மொத்தம் (Total Paid)
                                </span>
                                <span className="text-xl font-black text-indigo-800 print:text-black">
                                  ₹{totalPaid.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-rose-600 print:text-black uppercase tracking-widest">
                                  மீதமுள்ள தொகை (Remaining)
                                </span>
                                <span className="text-xl font-black text-rose-600 print:text-black">
                                  ₹
                                  {selectedLoan.currentBalance?.toFixed(2) ||
                                    (
                                      selectedLoan.loanamount - totalPaid
                                    ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200 print:border-black text-[9px] text-slate-400 print:text-slate-600 leading-relaxed uppercase tracking-wider text-justify">
                  <span className="font-bold text-slate-500 print:text-black">
                    கவனத்திற்கு:
                  </span>{" "}
                  1. அடகு வைத்த பொருளை மீட்க வரும்போது இந்த ரசீதை கட்டாயம்
                  கொண்டு வர வேண்டும். 2. குறிப்பிட்ட காலக்கெடுவிற்குள் வட்டி
                  அல்லது அசலை செலுத்தாவிட்டால் பொருள் ஏலம் விடப்படும்.
                </div>

                <div className="mt-16 flex justify-between text-center text-sm font-bold text-slate-400 print:text-black pb-4 print:pb-0">
                  <div className="border-t-2 border-slate-300 w-40 pt-2 print:border-black uppercase tracking-wider text-[10px]">
                    வாடிக்கையாளர் கையொப்பம்
                  </div>
                  <div className="border-t-2 border-slate-300 w-40 pt-2 print:border-black uppercase tracking-wider text-[10px]">
                    உரிமையாளர் கையொப்பம்
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex gap-4 print:hidden shrink-0">
              <button
                onClick={() => {
                  setReceiptModal(false);
                  setSelectedLoan(null);
                }}
                className="flex-1 bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-sm">
                மூடு (Close)
              </button>
              <button
                onClick={() => window.print()}
                className="flex-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm flex justify-center items-center gap-2 active:scale-95">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                ரசீதை அச்சிடு (Print Receipt)
              </button>
            </div>
          </div>
        </div>
      )}
      {PayLoanModal && selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200 print:p-0 print:bg-white print:block">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none">
            {/* 🏷️ Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center print:bg-transparent print:border-black">
              <h3 className="text-xl font-bold text-slate-800 print:text-black">
                கடன் செலுத்துதல் (Pay Loan)
              </h3>
              <button
                onClick={() => setPayLoanModal(false)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors print:hidden">
                ✕
              </button>
            </div>

            <div className="p-6 print:p-0 print:mt-6">
              {/* 👤 Customer Info & Receipt Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 shadow-sm print:bg-transparent print:border-black print:shadow-none">
                <div className="flex items-center gap-4">
                  <img
                    src={`http://localhost:5000/uploads/${selectedLoan.customer?.recentimage}`}
                    alt="Customer"
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm print:border-slate-300 print:shadow-none"
                    onError={(e) => {
                      e.target.src =
                        "https://ui-avatars.com/api/?name=" +
                        (selectedLoan.customer?.name || "User") +
                        "&background=F1F5F9&color=64748B";
                    }}
                  />
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5 print:text-black">
                      வாடிக்கையாளர் (Customer)
                    </p>
                    <p className="font-black text-slate-800 text-base print:text-black">
                      {selectedLoan.customer?.name}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-slate-200 pt-3 sm:pt-0 print:border-transparent">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5 print:text-black">
                    ரசீது எண் (Receipt No)
                  </p>
                  <p className="font-bold text-slate-700 print:text-black">
                    #{selectedLoan._id?.slice(-6).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* 💰 Total Loan Amount Highlight */}
              <div className="flex flex-col items-center justify-center mb-8">
                <p className="text-slate-500 uppercase text-xs font-bold tracking-widest mb-1 print:text-black">
                  மொத்த கடன் தொகை (Total Loan Amount)
                </p>
                <p className="text-4xl font-black text-slate-900 tracking-tight print:text-black border-b-4 border-double border-transparent print:border-black pb-1">
                  <span className="text-slate-400 font-medium mr-1 print:text-black">
                    ₹
                  </span>
                  {selectedLoan.loanamount?.toFixed(2)}
                </p>
              </div>

              {/* 📝 Payment Form */}
              <form onSubmit={handlePayLoanSubmit}>
                <div className="space-y-5">
                  {/* Pay Type Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide print:text-black">
                      செலுத்தும் முறை (Pay Type)
                    </label>
                    <select
                      name="payType"
                      className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 font-bold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all outline-none cursor-pointer print:bg-transparent print:border-black print:appearance-none print:text-black"
                      value={payType}
                      onChange={(e) => setPayType(e.target.value)}
                      required>
                      <option value="" disabled>
                        செலுத்தும் முறையை தேர்ந்தெடுக்கவும் (Select Pay Type)
                      </option>
                      <option value="Full Pay">
                        முழுத் தொகை (Full Pay - Auto Calc)
                      </option>
                      <option value="Initial Pay">
                        பகுதித் தொகை (Partial Pay)
                      </option>
                    </select>
                  </div>

                  {/* Pay Amount Input & Estimation */}
                  {payType && (
                    <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide print:text-black">
                          செலுத்தும் தொகை (Pay Amount)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3 text-slate-500 text-sm font-bold print:text-black">
                            ₹
                          </span>
                          <input
                            name="payAmount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={payAmount}
                            onChange={(e) =>
                              setPayAmount(parseFloat(e.target.value) || 0)
                            }
                            readOnly={payType === "Full Pay"}
                            className={`block w-full rounded-lg pl-8 pr-4 py-3 text-sm font-bold outline-none transition-all print:bg-transparent print:border-black print:text-black ${
                              payType === "Full Pay"
                                ? "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed"
                                : "bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                            }`}
                            required
                          />
                        </div>
                      </div>

                      {/* Final Calculation Box */}
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center shadow-inner print:bg-transparent print:border-black print:shadow-none">
                        <p className="text-xs text-emerald-700 font-extrabold uppercase tracking-widest mb-1 print:text-black">
                          {payType === "Full Pay"
                            ? "மொத்த நிலுவைத் தொகை (Total Balance)"
                            : "கணக்கிடப்பட்ட தொகை (Estimated Pay)"}
                        </p>
                        <p className="text-3xl font-black text-emerald-700 tracking-tight print:text-black">
                          ₹
                          {payAmount > 0
                            ? Number(payAmount).toFixed(2)
                            : "0.00"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🛑 Actions - இந்த பகுதி பிரிண்ட் செய்யும் போது மறைந்துவிடும் (print:hidden) */}
                <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100 print:hidden">
                  <button
                    type="button"
                    onClick={() => setPayLoanModal(false)}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                    ரத்து (Cancel)
                  </button>

                  {/* 🖨️ பிரிண்ட் பட்டன் சேர்க்கப்பட்டுள்ளது */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 font-bold py-3 rounded-lg hover:bg-blue-100 transition-colors shadow-sm">
                    🖨️ பிரிண்ட்
                  </button>

                  <button
                    type="submit"
                    disabled={!payType || payAmount <= 0}
                    className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 disabled:active:scale-100">
                    பணம் செலுத்து
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isBankModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            {/* 🏷️ Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                வங்கி விவரங்கள் (Bank Details)
              </h2>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleBankSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    வங்கி (Bank)
                  </label>
                  <select
                    name="bankId"
                    required
                    defaultValue=""
                    className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none cursor-pointer">
                    <option value="" disabled>
                      வங்கியை தேர்ந்தெடுக்கவும் (Select Bank)
                    </option>

                    {bankList.map((bank) => (
                      <option key={bank._id} value={bank._id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    கிளை (Branch Name)
                  </label>
                  <input
                    required
                    name="branchname"
                    type="text"
                    placeholder="எ.கா: Main Branch"
                    className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>

                {/*Ledger creation date*/}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    லாக்கரில் வைக்கப்பட்ட பொருளின் தேதி (Ledger Creation) Date
                  </label>
                  <input
                    required
                    name="ledgercreationdate"
                    type="text"
                    placeholder="எ.கா: 10/10/2026"
                    className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>

                {/*OB Staff Name*/}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    பணியாளர் பெயர் (OB Staff Name)
                  </label>
                  <input
                    required
                    name="obstaffname"
                    type="text"
                    placeholder="எ.கா: Selvi"
                    className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>

                {/*OB Account Number*/}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    கணக்கு எண் (OB Account Number)
                  </label>
                  <input
                    required
                    name="obaccountno"
                    type="text"
                    placeholder="எ.கா: 65100xxxxx67809"
                    className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    கணக்கு எண் (Account No)
                  </label>
                  <input
                    required
                    name="accountno"
                    type="text"
                    placeholder="எ.கா: 1234567890"
                    className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none tracking-wider"
                  />
                </div>

                {/* Locker Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    லாக்கர் எண் (Locker Number)
                  </label>
                  <input
                    required
                    name="lockerno"
                    type="text"
                    placeholder="எ.கா: A-12"
                    className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-bold focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>

                {/* 🛑 Actions */}
                <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBankModalOpen(false)}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                    ரத்து (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 shadow-sm transition-all active:scale-95">
                    சேமி (Save)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteLoanModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-transform">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm border-4 border-rose-50">
                🔒
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                பாதுகாப்பு சரிபார்ப்பு
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                இந்த கடனை நீக்க உரிமையாளரின்{" "}
                <span className="font-bold text-rose-600">
                  ரகசிய கடவுச்சொல்லை
                </span>{" "}
                உள்ளிடவும்.
              </p>

              <input
                type="password"
                placeholder="Enter Secret Password"
                value={deletePasswordInput}
                onChange={(e) => setDeletePasswordInput(e.target.value)}
                className="w-full text-center tracking-widest text-lg rounded-xl border-slate-300 bg-slate-50 px-4 py-3 font-bold focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition-all outline-none shadow-inner mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteLoanModal(false);
                    setDeletePasswordInput("");
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                  ரத்து (Cancel)
                </button>
                <button
                  onClick={confirmDeleteLoan}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-sm">
                  நீக்கு (Delete)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
