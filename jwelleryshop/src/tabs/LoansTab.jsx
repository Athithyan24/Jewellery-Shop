import { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  FileChartColumn,
  HeartHandshakeIcon,
  Printer,
} from "lucide-react";
import upi from "/upi.png";
import ver from "/approved.png";
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

  // 🟢 1. PERFECT PAWN SHOP MATH (Calendar Months + Leftover Days)
  // 🟢 SECURE MATH FROM BACKEND
  const pendingInterest = selectedLoan?.pendingInterest || 0;
  const totalBalance = selectedLoan?.currentBalance || 0;

  const originalPrincipal = selectedLoan?.loanamount || 0;
  const principalPaid = selectedLoan?.principalPaid || 0;
  const remainingPrincipal = originalPrincipal - principalPaid;
  const principalToCalculate = remainingPrincipal > 0 ? remainingPrincipal : 0;

  useEffect(() => {
    if (payType === "Full Pay") {
      setPayAmount(totalBalance);
    } else if (payType === "Initial Pay" || payType === "Partially Pay") {
      setPayAmount("");
    }
  }, [payType, totalBalance]);

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
    // Use the payAmount state instead of raw event target to prevent bugs
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
      setPayType("");
      setPayAmount("");

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
      setLoans((prevLoans) =>
        prevLoans.filter((loan) => loan._id !== loanToDelete._id),
      );
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
      <div className="p-6 animate-in fade-in duration-300 print:hidden">
        <div className="bg-white/50 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <HeartHandshakeIcon className="mr-2 text-pink-600" />
              <h2 className="lg:text-lg md:text-sm font-bold text-blue-800 tracking-wide">
                கடன்கள் பட்டியல் (Loans Ledger)
              </h2>
            </div>

            <div className="relative w-full sm:w-96 group">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-300"
                size={18}
              />

              <input
                type="text"
                placeholder="Search by ID (LOAN001), Name, or Phone..."
                value={loanSearchQuery}
                onChange={(e) => setLoanSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner"
              />
            </div>

            <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
              Total Loans: {loans?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-800 sticky top-0 z-10 shadow-md">
                <tr>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    தேதி
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    வாடிக்கையாளர்
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    அடகு பொருள்
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    தங்கம் விலை
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider text-center">
                    அடகு%
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    கடன் தொகை
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    நடவடிக்கை
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider text-center">
                    பெட்டக நிலை
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider text-right">
                    வட்டி / வட்டி நிலை
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider text-right">
                    மீதமுள்ள தொகை
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-white uppercase tracking-wider text-right">
                    அழி
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-100">
                {filteredLoans && filteredLoans.length > 0 ? (
                  filteredLoans.map((loan) => {
                    const activePendingInterest = loan.pendingInterest || 0;
                    const currentBalance = loan.currentBalance || 0;
                    const interestPaid = loan.interestPaid || 0;

                    return (
                      <tr
                        key={loan._id}
                        className="hover:bg-indigo-50 transition-colors duration-200 group border-b border-slate-100/50">
                        <td className="py-4 px-4 whitespace-nowrap text-xs font-semibold text-slate-500">
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

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-700 group-hover:bg-white transition-all">
                            {loan.loanId || "Unknown"}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap font-black text-slate-800 uppercase tracking-wide">
                          {loan.customer?.name || "Unknown"}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600 font-bold tracking-tight">
                              {loan.product?.name || "Product"}
                            </span>
                            <div className="flex items-center gap-1 border-l-2 border-slate-200 pl-2">
                              <span className="text-slate-600 font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-xs shadow-inner">
                                {loan.weight}g
                              </span>
                              <span
                                className="text-rose-600 font-mono font-semibold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded text-xs shadow-sm"
                                title="Stone Weight">
                                {loan.stoneweight}g
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap font-mono text-sm font-semibold text-slate-600">
                          ₹{loan.goldrate}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <span className="bg-slate-800 text-white px-2.5 py-1 rounded-md text-xs font-black shadow-sm">
                            {loan.pawnpercentage}%
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap font-black text-emerald-600 text-base">
                          ₹{loan.loanamount?.toFixed(2)}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          {loan.isClosed ? (
                            <div className="relative inline-flex">
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setReceiptModal(true);
                                }}
                                className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 py-2 px-5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 duration-200">
                                ரசீது (Receipt)
                              </button>
                              <span className="absolute -top-2.5 -right-2 z-10 border border-emerald-400 bg-emerald-100/95 backdrop-blur-sm text-emerald-700 font-black text-[9px] uppercase tracking-widest py-0.5 px-2 rounded-md shadow-sm pointer-events-none">
                                PAID
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setPayLoanModal(true);
                                }}
                                className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 py-1.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-rose-600/20 hover:-translate-y-0.5 active:scale-95">
                                கடனை செலுத்து (Pay)
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setReceiptModal(true);
                                }}
                                className="bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white border border-slate-200 hover:border-indigo-600 py-1.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-indigo-600/20 hover:-translate-y-0.5 active:scale-95">
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
                              className="cursor-pointer inline-flex items-center justify-center p-1.5 bg-white hover:bg-indigo-50 rounded-xl transition-all border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                              title="Add to Owner's Bank">
                              <img src={upi} alt="UPI" className="w-7 h-7" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center rounded-xl ">
                              <img
                                src={ver}
                                alt="Verified"
                                className="w-15 h-15 drop-shadow-sm"
                              />
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          {loan.isClosed ||
                          (interestPaid > 0 && activePendingInterest <= 0) ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm uppercase tracking-widest">
                              ✓ Paid
                            </span>
                          ) : (
                            <span className="text-rose-600 font-mono font-bold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 text-xs shadow-sm">
                              + ₹{activePendingInterest.toFixed(2)}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap font-black text-emerald-700 bg-emerald-50/40 text-right font-mono text-base border-l border-emerald-100/50">
                          ₹
                          {loan.isClosed || currentBalance <= 0
                            ? "0.00"
                            : currentBalance.toFixed(2)}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <button
  onClick={() => {
    setLoanToDelete(loan);
    setDeleteLoanModal(true);
  }}
  className="group relative flex h-12 w-12 flex-col items-center justify-center overflow-hidden rounded-full bg-[#141414] border-none cursor-pointer transition-all duration-300 shadow-lg hover:bg-rose-600 active:scale-90 shrink-0"
  title="Delete"
>
  {/* 1. The "Paper" SVG - Hidden at top, drops on hover */}
  <svg
    viewBox="0 0 1.625 1.625"
    className="absolute -top-7 fill-white delay-100 transition-all duration-500 group-hover:top-3 group-hover:animate-[spin_1.4s_linear_infinite]"
    height="12"
    width="12"
  >
    <path d="M.471 1.024v-.52a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099h-.39c-.107 0-.195 0-.195-.195" />
    <path d="M1.219.601h-.163A.1.1 0 0 1 .959.504V.341A.033.033 0 0 0 .926.309h-.26a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099v-.39a.033.033 0 0 0-.032-.033" />
    <path d="m1.245.465-.15-.15a.02.02 0 0 0-.016-.006.023.023 0 0 0-.023.022v.108c0 .036.029.065.065.065h.107a.023.023 0 0 0 .023-.023.02.02 0 0 0-.007-.016" />
  </svg>

  {/* 2. The Trash Lid - Flips open */}
  <svg
    width="16"
    fill="none"
    viewBox="0 0 39 7"
    className="origin-right duration-500 transition-transform group-hover:rotate-90 group-hover:translate-x-1 group-hover:translate-y-2 z-10"
  >
    <line strokeWidth="4" stroke="white" y2="5" x2="39" y1="5" />
    <line strokeWidth="3" stroke="white" y2="1.5" x2="26.0357" y1="1.5" x1="12" />
  </svg>

  {/* 3. The Trash Body */}
  <svg width="16" fill="none" viewBox="0 0 33 39" className="transition-all duration-300">
    <mask fill="white" id="bin-mask-fixed">
      <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z" />
    </mask>
    <path
      mask="url(#bin-mask-fixed)"
      fill="white"
      d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
    />
    <path strokeWidth="4" stroke="white" d="M12 6L12 29" />
    <path strokeWidth="4" stroke="white" d="M21 6V29" />
  </svg>
</button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="12"
                      className="text-center py-12 text-slate-500">
                      எந்த கடன்களும் காணப்படவில்லை (No loans found)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {ReceiptModal && selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-300 print:static print:inset-auto print:p-0 print:m-0 print:h-fit print:bg-white print:block">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none relative flex flex-col max-h-[95vh] print:max-h-none print:h-auto print:block overflow-hidden print:overflow-visible">
            <div
              id="printable-receipt"
              className="p-8 print:p-0 relative bg-white print:bg-transparent overflow-y-auto print:overflow-visible print:block custom-scrollbar">
              <div className="hidden print:flex fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-[0.04] pointer-events-none z-[-1]">
                <span className="text-5xl font-black uppercase tracking-widest transform -rotate-45 text-center leading-relaxed whitespace-nowrap">
                  {shopProfile?.shopName || currentUser?.username} <br />
                  {shopProfile?.phone}
                </span>
              </div>

              <div className="relative z-10 print:bg-transparent">
                <div className="text-center mb-6 print:mb-2 border-b-2 border-dashed border-slate-300 pb-6 print:pb-2 print:border-black flex flex-col items-center">
                  {shopProfile?.shopimage ? (
                    <img
                      src={`http://localhost:5000/uploads/${shopProfile.shopimage}`}
                      alt="Shop Logo"
                      className="w-16 h-16 object-contain mb-3 print:mb-1 rounded-xl print:w-14 print:h-14"
                    />
                  ) : (
                    <div className="inline-flex items-center justify-center bg-amber-100 text-amber-600 w-12 h-12 rounded-full mb-3 print:hidden shadow-sm">
                      <span className="text-2xl">
                        <FileChartColumn />
                      </span>
                    </div>
                  )}

                  <h2 className="text-3xl print:text-2xl font-black text-slate-800 uppercase tracking-widest print:text-black">
                    {shopProfile?.shopName ||
                      `${currentUser?.username || "Shop"} ${
                        currentUser?.shoptype || ""
                      }`}
                  </h2>
                  <p className="text-slate-500 font-bold mt-1 text-xs tracking-widest uppercase print:text-black">
                    பில் ரசீது (Official Receipt)
                  </p>
                  <p className="text-slate-600 font-bold mt-3 print:mt-1 text-sm print:text-xs print:text-black max-w-md mx-auto leading-relaxed">
                    {shopProfile?.address || "Address not updated"} <br />
                    <span className="font-mono">
                      Phone: {shopProfile?.phone || "+91 XXXXXXXXXX"}
                    </span>
                  </p>
                </div>

                <div className="flex justify-between items-center mb-6 print:mb-3 px-6 py-4 bg-slate-50 rounded-xl border border-slate-100 print:bg-transparent print:border-b print:border-t print:border-slate-300 print:rounded-none print:px-0 print:py-1">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest print:text-slate-600">
                      கடன் எண் (Loan No)
                    </p>
                    <p className="text-xl print:text-lg font-black text-indigo-700 print:text-black font-mono tracking-wider">
                      {selectedLoan.loanId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest print:text-slate-600">
                      தேதி (Date)
                    </p>
                    <p className="text-lg print:text-base font-black text-slate-800 print:text-black">
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

                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 print:gap-2 mb-8 print:mb-3 print:break-inside-avoid">
                  <div className="flex-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:bg-transparent print:p-0 w-full">
                    <h4 className="font-bold text-slate-800 mb-3 print:mb-1 border-b border-slate-100 pb-2 print:pb-1 print:border-black print:text-black uppercase text-xs tracking-widest">
                      வாடிக்கையாளர் விவரங்கள்
                    </h4>

                    <div className="space-y-2 print:space-y-1 text-sm print:text-xs text-slate-700 print:text-black">
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
                      className="w-24 h-24 print:w-16 print:h-16 rounded-lg object-cover border-2 border-slate-200 shadow-sm print:border-black print:rounded-none"
                      onError={(e) => {
                        e.target.src =
                          "https://ui-avatars.com/api/?name=" +
                          (selectedLoan.customer?.name || "User") +
                          "&background=F1F5F9&color=64748B";
                      }}
                    />
                  </div>
                </div>

                <table className="w-full mb-8 print:mb-3 text-sm print:text-xs border-collapse print:break-inside-avoid">
                  <thead>
                    <tr className="border-b-2 border-slate-300 print:border-black bg-slate-50 print:bg-transparent">
                      <th className="py-3 print:py-1 px-2 text-left font-bold text-slate-700 uppercase tracking-wider text-xs print:text-[10px] print:text-black">
                        பொருள் விளக்கம்
                      </th>
                      <th className="py-3 print:py-1 px-2 text-right font-bold text-slate-700 uppercase tracking-wider text-xs print:text-[10px] print:text-black">
                        மொத்த Wt
                      </th>
                      <th className="py-3 print:py-1 px-2 text-right font-bold text-slate-700 uppercase tracking-wider text-xs print:text-[10px] print:text-black">
                        கல் எடை
                      </th>
                      <th className="py-3 print:py-1 px-2 text-right font-bold text-slate-700 uppercase tracking-wider text-xs print:text-[10px] print:text-black">
                        நிகர எடை
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-dashed border-slate-200 print:border-black print:break-inside-avoid">
                      <td className="py-4 print:py-2 px-2 font-bold text-slate-800 print:text-black">
                        {selectedLoan.product?.name || "Gold Item"}
                      </td>
                      <td className="py-4 print:py-2 px-2 text-right font-semibold text-slate-600 print:text-black">
                        {selectedLoan.weight}g
                      </td>
                      <td className="py-4 print:py-2 px-2 text-right font-semibold text-slate-600 print:text-black">
                        {selectedLoan.stoneweight}g
                      </td>
                      <td className="py-4 print:py-2 px-2 text-right font-black text-slate-800 print:text-black bg-slate-50 print:bg-transparent">
                        {(
                          selectedLoan.weight - selectedLoan.stoneweight
                        ).toFixed(2)}
                        g
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 print:gap-4 mt-6 print:mt-2">
                  <div className="space-y-3 print:space-y-1 print:pt-1 print:break-inside-avoid">
                    <p className="flex justify-between text-sm print:text-xs border-b border-slate-100 pb-2 print:pb-1 print:border-slate-300">
                      <span className="text-slate-500 font-semibold print:text-slate-600">
                        தங்கம் விலை (Gold Rate):
                      </span>
                      <span className="font-bold text-slate-800 print:text-black font-mono">
                        ₹{selectedLoan.goldrate}/g
                      </span>
                    </p>
                    <p className="flex justify-between text-sm print:text-xs border-b border-slate-100 pb-2 print:pb-1 print:border-slate-300">
                      <span className="text-slate-500 font-semibold print:text-slate-600">
                        அடகு சதவீதம் (Pawn %):
                      </span>
                      <span className="font-bold text-slate-800 print:text-black font-mono">
                        {selectedLoan.pawnpercentage}%
                      </span>
                    </p>
                  </div>

                  <div className="space-y-4 print:space-y-2">
                    <div className="flex justify-between items-center bg-emerald-50 p-4 print:p-2 rounded-xl border border-emerald-100 print:bg-transparent print:border-black print:rounded-none print:break-inside-avoid">
                      <p className="text-emerald-700 font-bold text-xs print:text-[10px] uppercase tracking-widest print:text-black">
                        மொத்த கடன்
                      </p>
                      <p className="text-2xl print:text-xl font-black text-emerald-800 print:text-black">
                        ₹{selectedLoan.loanamount?.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-indigo-50 p-4 print:p-2 rounded-xl border border-indigo-100 print:bg-transparent print:border-black print:rounded-none flex flex-col">
                      <p className="text-indigo-700 font-bold text-xs print:text-[10px] uppercase tracking-widest print:text-black mb-3 print:mb-1 border-b border-indigo-200 pb-2 print:pb-1 print:border-black">
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
                            <div className="text-sm print:text-xs font-semibold text-indigo-400 print:text-slate-500 py-2 print:py-1">
                              பணம் எதுவும் செலுத்தப்படவில்லை (No payments yet)
                            </div>
                          );
                        }

                        const totalPaid = relatedPayments.reduce(
                          (sum, pl) => sum + (pl.amountPaid || 0),
                          0,
                        );

                        return (
                          <div className="space-y-2 print:space-y-1 w-full">
                            {relatedPayments.map((payment, index) => (
                              <div
                                key={payment._id || index}
                                className="flex justify-between items-center text-sm print:text-xs font-semibold text-slate-700 print:text-black print:break-inside-avoid">
                                <span className="text-slate-500 print:text-black text-xs print:text-[10px]">
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

                            <div className="flex flex-col gap-2 print:gap-1 mt-4 print:mt-2 pt-4 print:pt-2 border-t-2 border-dashed border-indigo-200 print:border-black print:break-inside-avoid">
                              <div className="flex justify-between items-center">
                                <span className="text-xs print:text-[10px] font-bold text-indigo-900 print:text-black uppercase tracking-widest">
                                  மொத்தம் (Total Paid)
                                </span>
                                <span className="text-xl print:text-lg font-black text-indigo-800 print:text-black">
                                  ₹{totalPaid.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-xs print:text-[10px] font-bold text-rose-600 print:text-black uppercase tracking-widest">
                                  மீதமுள்ள தொகை (Remaining)
                                </span>
                                <span className="text-xl print:text-lg font-black text-rose-600 print:text-black">
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

                <div className="mt-8 print:mt-4 pt-4 print:pt-2 border-t border-slate-200 print:border-black text-[9px] print:text-[8px] text-slate-400 print:text-slate-600 leading-relaxed uppercase tracking-wider text-justify print:break-inside-avoid">
                  <span className="font-bold text-slate-500 print:text-black">
                    கவனத்திற்கு:
                  </span>{" "}
                  1. அடகு வைத்த பொருளை மீட்க வரும்போது இந்த ரசீதை கட்டாயம்
                  கொண்டு வர வேண்டும். 2. குறிப்பிட்ட காலக்கெடுவிற்குள் வட்டி
                  அல்லது அசலை செலுத்தாவிட்டால் பொருள் ஏலம் விடப்படும்.
                </div>

                <div className="mt-16 print:mt-6 flex justify-between text-center text-sm font-bold text-slate-400 print:text-black pb-4 print:pb-0 print:break-inside-avoid">
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
                <Printer size={18} />
                ரசீதை அச்சிடு (Print Receipt)
              </button>
            </div>
          </div>
        </div>
      )}

      {PayLoanModal && selectedLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200 print:p-0 print:bg-white print:block">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none">
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

              <div className="flex flex-col items-center justify-center mb-8">
                <p className="text-slate-500 uppercase text-xs font-bold tracking-widest mb-1 print:text-black">
                  மொத்த கடன் தொகை (Original Loan Amount)
                </p>
                <p className="text-4xl font-black text-slate-900 tracking-tight print:text-black border-b-4 border-double border-transparent print:border-black pb-1">
                  <span className="text-slate-400 font-medium mr-1 print:text-black">
                    ₹
                  </span>
                  {selectedLoan.loanamount?.toFixed(2)}
                </p>
              </div>

              <div className="flex justify-between items-end mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500">
                    அசல் (Principal Remaining):{" "}
                    <span className="text-slate-800">
                      ₹{principalToCalculate.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    வட்டி (Interest Remaining):{" "}
                    <span className="text-rose-600">
                      + ₹{pendingInterest.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    மொத்த இருப்பு (Total Balance)
                  </p>
                  <p className="text-2xl font-black text-indigo-700">
                    ₹{totalBalance.toFixed(2)}
                  </p>
                </div>
              </div>

              <form onSubmit={handlePayLoanSubmit}>
                <div className="space-y-5">
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
                            value={
                              payType === "Full Pay" ? totalBalance : payAmount
                            }
                            onChange={(e) =>
                              setPayAmount(parseFloat(e.target.value) || 0)
                            }
                            readOnly={payType === "Full Pay"}
                            className={`block w-full rounded-lg pl-8 pr-4 py-3 text-sm font-bold outline-none transition-all print:bg-transparent print:border-black print:text-black ${
                              payType === "Full Pay"
                                ? "bg-slate-100 border-slate-200 text-indigo-700 cursor-not-allowed shadow-inner"
                                : "bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                            }`}
                            required
                          />
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center shadow-inner print:bg-transparent print:border-black print:shadow-none">
                        <p className="text-xs text-emerald-700 font-extrabold uppercase tracking-widest mb-1 print:text-black">
                          {payType === "Full Pay"
                            ? "மொத்த நிலுவைத் தொகை (Total Balance)"
                            : "கணக்கிடப்பட்ட தொகை (Estimated Pay)"}
                        </p>
                        <p className="text-3xl font-black text-emerald-700 tracking-tight print:text-black">
                          ₹
                          {payType === "Full Pay"
                            ? totalBalance.toFixed(2)
                            : payAmount > 0
                              ? Number(payAmount).toFixed(2)
                              : "0.00"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100 print:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setPayLoanModal(false);
                      setPayType("");
                      setPayAmount("");
                    }}
                    className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                    ரத்து (Cancel)
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 font-bold py-3 rounded-lg hover:bg-blue-100 transition-colors shadow-sm">
                    🖨️ பிரிண்ட்
                  </button>

                  <button
                    type="submit"
                    disabled={
                      !payType ||
                      (payType === "Initial Pay" && payAmount <= 0) ||
                      (payType === "Full Pay" && totalBalance <= 0)
                    }
                    className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 disabled:active:scale-100">
                    பணம் செலுத்து
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isBankModalOpen && selectedLoanForBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                உரிமையாளர் வங்கி விவரங்கள்
              </h3>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleBankSubmit} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    வங்கி பெயரைத் தேர்ந்தெடுக்கவும் (Select Bank)
                  </label>
                  <select
                    name="bankId"
                    className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    required>
                    <option value="" disabled selected>
                      -- வங்கியைக் குறிக்கவும் --
                    </option>
                    {bankList.map((bank) => (
                      <option key={bank._id} value={bank._id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      கிளை பெயர் (Branch)
                    </label>
                    <input
                      name="branchname"
                      type="text"
                      className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      தேதி (Date)
                    </label>
                    <input
                      name="ledgercreationdate"
                      type="date"
                      className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    ஊழியர் பெயர் (Staff Name)
                  </label>
                  <input
                    name="obstaffname"
                    type="text"
                    className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      கணக்கு எண் (Account No)
                    </label>
                    <input
                      name="obaccountno"
                      type="number"
                      className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      கடனுக்கான கணக்கு எண் (Loan A/C No)
                    </label>
                    <input
                      name="accountno"
                      type="number"
                      className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    பெட்டக எண் (Locker No)
                  </label>
                  <input
                    name="lockerno"
                    type="text"
                    className="w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                  ரத்து செய் (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                  சேமி (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteLoanModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 border-4 border-rose-50">
                <Trash2 className="text-rose-600" size={28} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">
                கடன் நீக்கம்!
              </h2>
              <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                இந்த கடனை நிரந்தரமாக நீக்க கடை உரிமையாளரின்
                <br />
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

              <div className="flex gap-3 w-full">
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
