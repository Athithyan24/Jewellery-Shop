import { useState, useEffect } from "react";
import axios from "axios";
import ver from "./assets/approved.png";
import upi from "./assets/upi.png";
import {
  Users,
  ArrowRightLeft,
  UserCircle,
  Wallet,
  Lock,
  TrendingUp,
  LogOut,
} from "lucide-react";
const TABS = [
  {
    id: "பணியாளர்கள்",
    label: "பணியாளர்கள் (Workers)",
    icon: <Users size={18} />,
    allowedRole: "superadmin",
  },

  {
    id: "பரிவர்த்தனைகளின்",
    label: "பரிவர்த்தனைகள்",
    icon: <ArrowRightLeft size={18} />,
    endpoint: "/api/பரிவர்த்தனைகளின்",
    allowedRole: "worker",
  },
  {
    id: "வாடிக்கையாளர்களின்",
    label: "வாடிக்கையாளர்கள்",
    icon: <UserCircle size={18} />,
    endpoint: "/api/வாடிக்கையாளர்களின்",
    allowedRole: "worker",
  },
  {
    id: "கடன்களின்",
    label: "கடன்கள்",
    icon: <Wallet size={18} />,
    endpoint: "/api/கடன்களின்",
    allowedRole: "worker",
  },
  {
    id: "லாக்கர்",
    label: "பெட்டகங்கள்",
    icon: <Lock size={18} />,
    endpoint: "/api/லாக்கர்",
    allowedRole: "worker",
  },
  {
    id: "விகித",
    label: "விகிதங்கள்",
    icon: <TrendingUp size={18} />,
    endpoint: "/api/சுய",
    allowedRole: "worker",
  },
  {
    id: "சுய",
    label: "சுயவிவரம்",
    endpoint: "/api/சுய",
    allowedRole: "worker",
  },
];

export default function AdminPage() {
  const [tabData, setTabData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [CustomerModal, setCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [LoanModal, setLoanModal] = useState(false);
  const [PayLoanModal, setPayLoanModal] = useState(false);
  const [SelectedTypeModal, setSelectedTypeModal] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  const userRole = localStorage.getItem("role");

  const visibleTabs = TABS.filter((tab) => tab.allowedRole === userRole);

  const [activeTab, setActiveTab] = useState(
    userRole === "superadmin" ? "பணியாளர்கள்" : "பரிவர்த்தனைகளின்",
  );

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [loans, setLoans] = useState([]);

  const [ReceiptModal, setReceiptModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const [payAmount, setPayAmount] = useState("");
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedLoanForBank, setSelectedLoanForBank] = useState(null);
  const [bankList, setBankList] = useState([]);
  const [paidLoan, setPaidLoan] = useState([]);

  const [lockerItems, setLockerItems] = useState([]);

  const [dailyStats, setDailyStats] = useState([]);

  const [workers, setWorkers] = useState([]);
  const [workerUsername, setWorkerUsername] = useState("");
  const [workerPassword, setWorkerPassword] = useState("");
  const [workerShopname, setWorkerShopname] = useState("");

  const [form, setForm] = useState({
    name: "",
    dob: "",
    address: "",
    aadhar: "",
    accountnumber: "",
    ifsc: "",
    aadharimage: "",
    recentimage: "",
    email: "",
    phone: "",
  });

  const [loanCalc, setLoanCalc] = useState({
    weight: "",
    stoneweight: "",
    goldrate: "",
    pawnpercentage: "",
  });

  const netWeight =
    (parseFloat(loanCalc.weight) || 0) -
    (parseFloat(loanCalc.stoneweight) || 0);
  const estimatedAmount =
    (netWeight *
      (parseFloat(loanCalc.goldrate) || 0) *
      (parseFloat(loanCalc.pawnpercentage) || 0)) /
    100;

  const handleLoanCalcChange = (e) => {
    setLoanCalc({ ...loanCalc, [e.target.name]: e.target.value });
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

  const fetchWorkers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setWorkers(res.data);
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/users",
        {
          username: workerUsername,
          password: workerPassword,
          shopname: workerShopname,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      alert(res.data.message);

      setWorkerUsername("");
      setWorkerPassword("");
      setWorkerShopname("");

      fetchWorkers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create worker.");
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    try {
      const bankId = e.target.bankId.value;
      const branchname = e.target.branchname.value;
      const accountno = e.target.accountno.value;
      const lockerno = e.target.lockerno.value;

      await axios.post(
        "http://localhost:5000/api/bankDetails",
        {
          loanId: selectedLoanForBank._id,
          bankId,
          branchname,
          accountno,
          lockerno,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      alert("Bank details saved successfully!");
      setIsBankModalOpen(false);
      fetchLoans();
    } catch (error) {
      console.error("Error saving bank details:", error);
      alert("Failed to save bank details");
    }
  };

  const role = localStorage.getItem("role");

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setForm({
      ...form,
      [name]: files ? files[0] : value,
    });
  };

  const fetchPaidLoanDetails = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/payLoan", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setPaidLoan(res.data);
      console.log("PaidLoans: ", paidLoan);
    } catch (error) {
      console.error("Error fetching PaidLoanDetails:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setProducts(res.data);
      console.log("Products:", products);
    } catch (error) {
      console.error("Error fetching products:", error);
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
      console.log("Loans:", loans);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  const fetchCustomersLocker = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/bankDetails", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setLockerItems(res.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
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

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/customers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const customers = res.data;
      setCustomers(customers);
      console.log("Customers:", customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });
    try {
      const res = await axios.post(
        "http://localhost:5000/api/customers",
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      alert(res.data.message);
      setCustomerModal(false);
      fetchCustomers();
    } catch (err) {
      console.error("Server Error:", err.response?.data || err.message);
      alert(
        "Error: " + (err.response?.data?.message || "Something went wrong"),
      );
    }
  };

  const fetchDailyStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/daily-stats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setDailyStats(res.data);
    } catch (error) {
      console.error("Error fetching daily stats:", error);
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

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/loans",
        {
          customerId: selectedCustomer._id,
          product: e.target.productId.value,
          weight: e.target.weight.value,
          stoneweight: e.target.stoneweight.value,
          goldrate: e.target.goldrate.value,
          pawnpercentage: e.target.pawnpercentage.value,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      alert(res.data.message);
      setLoanModal(false);
    } catch (err) {
      console.error("Server Error:", err.response?.data || err.message);
      alert(
        "Error: " + (err.response?.data?.message || "Something went wrong"),
      );
    }
  };

  const calculateDynamicInterest = (principal, createdAt) => {
    if (!principal || !createdAt) return 0;

    const startDate = new Date(createdAt);
    const currentDate = new Date();

    const diffInTime = currentDate.getTime() - startDate.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);

    const exactMonths = diffInDays / 30;
    const months = Math.max(exactMonths, 1);

    let interestAmount = 0;

    if (months <= 3) {
      interestAmount = (principal * 17 * months) / (100 * 12);
    } else {
      const tier1Interest = (principal * 17 * 3) / (100 * 12);

      const remainingMonths = months - 3;
      const tier2Interest = (principal * 24 * remainingMonths) / (100 * 12);

      interestAmount = tier1Interest + tier2Interest;
    }

    return Math.round(interestAmount);
  };

  useEffect(() => {
    const fetchTabData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const currentTab = TABS.find((t) => t.id === activeTab);
        if (activeTab === "பரிவர்த்தனைகளின்") {
          await fetchDailyStats();
        } else if (activeTab === "வாடிக்கையாளர்களின்") {
          await fetchCustomers();
        } else if (activeTab === "கடன்களின்") {
          await fetchLoans();
          await fetchBanks();
        } else if (activeTab === "சுய") {
          await fetchPaidLoanDetails();
        } else if (activeTab === "லாக்கர்") {
          await fetchCustomersLocker();
        } else if (activeTab === "விகித") {
          await fetchLoans();
        }
        await new Promise((resolve) => setTimeout(resolve, 600));
        setTabData(
          `${currentTab.label} டேஷ்போர்டிற்கான தரவு பாதுகாப்பாக பெறப்பட்டது.`,
        );
      } catch (error) {
        console.error("Error fetching tab data:", error);
        setTabData("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTabData();
  }, [activeTab]);

  const [payType, setPayType] = useState("");

  useEffect(() => {
  fetchUser();
}, []);

  useEffect(() => {
    if (payType === "Full Pay" && selectedLoan) {
      const interest = calculateDynamicInterest(
        selectedLoan.loanamount,
        selectedLoan.createdAt,
      );
      const totalDue = selectedLoan.loanamount + interest;

      const alreadyPaid = selectedLoan.totalPaid || 0;
      const remainingBalance = totalDue - alreadyPaid;

      setPayAmount(remainingBalance > 0 ? remainingBalance : 0);
    } else if (payType === "Initial Pay") {
      setPayAmount("");
    }
  }, [payType, selectedLoan]);

  return (
    <>
      {userRole === "superadmin" && (
        <header className="App-header flex  items-center justify-center bg-amber-300">
          <h1
            className=" 
          justify-center text-5xl h-18 content-center  uppercase font-bold
          font-serif text-red-500">
            InfoZenX IT
          </h1>
        </header>
      )}
      {userRole === "worker"&& currentUser &&(
        <header className="App-header flex flex-col items-center justify-center bg-amber-300 py-6">
          <h1 className="text-5xl font-bold uppercase font-serif text-red-600 tracking-wide text-center">
            {currentUser.shopname || "Shop Name Loading..."}
          </h1>

          {currentUser.username && (
            <p className="mt-2 text-lg font-bold text-slate-700 bg-white/50 px-4 py-1 rounded-full border border-amber-400">
              Proprietor:{" "}
              <span className="text-indigo-800">{currentUser.username}</span>
            </p>
          )}
        </header>
      )}
      <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
        <div
          className={`max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 ${ReceiptModal ? "print:hidden" : ""}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
            {/* 🧭 TABS SECTION (Scrollable on small screens) */}
            <div className="flex flex-row overflow-x-auto scrollbar-hide w-full md:w-auto">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 px-6 py-4 font-bold text-sm transition-all duration-200 border-b-4 whitespace-nowrap ${
                      isActive
                        ? "border-amber-500 text-amber-600 bg-amber-50/50" // ✨ Active state: Gold underline, text, and soft background
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50" // ⚪ Inactive state
                    }`}>
                    {/* ICON COLOR LOGIC */}
                    <span
                      className={
                        isActive ? "text-amber-600" : "text-slate-400"
                      }>
                      {tab.icon}
                    </span>

                    {/* LABEL */}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 👤 USER PROFILE & LOGOUT SECTION */}
            <div className="flex items-center gap-4 px-6 py-3 md:py-0 border-t md:border-t-0 border-slate-100 bg-slate-50 md:bg-transparent">
              {/* Name and Role */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {localStorage.getItem("username") || "User"}
                </p>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  {userRole}
                </p>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/";
                }}
                className="flex items-center gap-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-slate-200 shadow-sm">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 min-h-100">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="text-gray-600 text-lg">
              {activeTab === "பணியாளர்கள்" && userRole === "superadmin" && (
                <div className="animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 📝 Left Side: Create Worker Form Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="text-lg font-bold text-slate-800">
                          புதிய பணியாளர் (Add Worker)
                        </h2>
                      </div>

                      <div className="p-6">
                        <form
                          onSubmit={handleCreateWorker}
                          className="space-y-5">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                              கடை பெயர் (Shop Name)
                            </label>
                            <input
                              required
                              type="text"
                              value={workerShopname}
                              onChange={(e) =>
                                setWorkerShopname(e.target.value)
                              }
                              placeholder="E.g., Kovai Branch"
                              className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                              பயனர் பெயர் (Username)
                            </label>
                            <input
                              required
                              type="text"
                              value={workerUsername}
                              onChange={(e) =>
                                setWorkerUsername(e.target.value)
                              }
                              placeholder="Enter unique username"
                              className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                              கடவுச்சொல் (Password)
                            </label>
                            <input
                              required
                              type="password"
                              value={workerPassword}
                              onChange={(e) =>
                                setWorkerPassword(e.target.value)
                              }
                              placeholder="Enter secure password"
                              className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                            />
                          </div>
                          <button
                            type="submit"
                            className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm">
                            உருவாக்கு (Create)
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* 📊 Right Side: View Workers Table Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden col-span-1 lg:col-span-2">
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">
                          பணியாளர்கள் பட்டியல் (Workers List)
                        </h2>
                        <span className="bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                          Total: {workers.length}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-3 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">
                                பயனர் பெயர் (Username)
                              </th>
                              <th className="px-6 py-3 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">
                                கடை பெயர் (Shop)
                              </th>
                              <th className="px-6 py-3 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">
                                பங்கு (Role)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {workers.length > 0 ? (
                              workers.map((worker) => (
                                <tr
                                  key={worker._id}
                                  className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-semibold">
                                    {worker.username}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                                    {worker.shoptype}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-200">
                                      {worker.role}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="3"
                                  className="px-6 py-8 text-center text-slate-500 font-medium">
                                  நீங்கள் இன்னும் பணியாளர்களை உருவாக்கவில்லை (No
                                  workers found).
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "பரிவர்த்தனைகளின்" && userRole === "worker" && (
                <div className="p-6 overflow-x-auto animate-in fade-in duration-300">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* 🏷️ Card Header */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                        தினசரி பரிவர்த்தனைகள் (Daily Ledger)
                      </h2>
                      <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        Total Days: {dailyStats?.length || 0}
                      </span>
                    </div>

                    {/* 📊 Table Section */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                              தேதி (Date)
                            </th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                              வழங்கிய கடன் (Cash Out)
                            </th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                              வரவு / வட்டி (Cash In)
                            </th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                              நிகர இருப்பு (Net Balance)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {dailyStats && dailyStats.length > 0 ? (
                            dailyStats.map((stat) => {
                              const netBalance = stat.income - stat.loanGiven;

                              return (
                                <tr
                                  key={stat.date}
                                  className="hover:bg-slate-50 transition-colors">
                                  {/* Formatted Date */}
                                  <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-800">
                                    {new Date(stat.date).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )}
                                  </td>

                                  {/* Cash Out (Money Leaving - Rose Color) */}
                                  <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-rose-600">
                                    {stat.loanGiven > 0
                                      ? `- ₹${stat.loanGiven.toFixed(2)}`
                                      : "-"}
                                  </td>

                                  {/* Cash In (Money Entering - Emerald Color) */}
                                  <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-emerald-600">
                                    {stat.income > 0
                                      ? `+ ₹${stat.income.toFixed(2)}`
                                      : "-"}
                                  </td>

                                  {/* Net Balance (Dynamic Styling Pill) */}
                                  <td className="py-4 px-6 whitespace-nowrap text-sm font-black">
                                    <span
                                      className={`px-3 py-1.5 rounded-full border text-xs tracking-wide ${
                                        netBalance > 0
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                          : netBalance < 0
                                            ? "bg-rose-50 text-rose-700 border-rose-200"
                                            : "bg-slate-50 text-slate-700 border-slate-200"
                                      }`}>
                                      {netBalance > 0 ? "+" : ""}₹
                                      {netBalance.toFixed(2)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan="4"
                                className="py-12 px-6 text-center text-slate-500 font-medium">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <span className="text-2xl">📊</span>
                                  <p>
                                    எந்த பரிவர்த்தனைகளும் இல்லை (No transactions
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
              )}

              {activeTab === "வாடிக்கையாளர்களின்" &&
                !CustomerModal &&
                userRole === "worker" && (
                  <div className="mt-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      {/* 🏷️ Card Header */}
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                          வாடிக்கையாளர்கள் (Customers List)
                        </h2>
                        <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                          Total: {customers?.length || 0}
                        </span>
                      </div>

                      {/* 📊 Table Section */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                புகைப்படம் (Photo)
                              </th>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                பெயர் (Name)
                              </th>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                தொலைபேசி எண் (Phone)
                              </th>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                ஆதார் எண் (Aadhar)
                              </th>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                முகவரி (Address)
                              </th>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">
                                விருப்பங்கள் (Actions)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {customers && customers.length > 0 ? (
                              customers.map((customer) => (
                                <tr
                                  key={customer._id}
                                  className="hover:bg-slate-50 transition-colors">
                                  {/* Photo (Upgraded to Circle Avatar) */}
                                  <td className="py-3 px-6 whitespace-nowrap">
                                    <img
                                      src={`http://localhost:5000/uploads/${customer.recentimage}`}
                                      alt={customer.name}
                                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                                      onError={(e) => {
                                        e.target.src =
                                          "https://ui-avatars.com/api/?name=" +
                                          customer.name +
                                          "&background=F1F5F9&color=64748B";
                                      }}
                                    />
                                  </td>

                                  {/* Name */}
                                  <td className="py-3 px-6 whitespace-nowrap font-bold text-slate-800">
                                    {customer.name}
                                  </td>

                                  {/* Phone */}
                                  <td className="py-3 px-6 whitespace-nowrap font-semibold text-slate-600">
                                    {customer.phone}
                                  </td>

                                  {/* Aadhar */}
                                  <td className="py-3 px-6 whitespace-nowrap font-medium text-slate-500">
                                    {customer.aadhar}
                                  </td>

                                  {/* Address (Allows text wrapping if long) */}
                                  <td className="py-3 px-6 min-w-[200px] text-slate-600 leading-relaxed">
                                    {customer.address}
                                  </td>

                                  {/* Actions Button */}
                                  <td className="py-3 px-6 whitespace-nowrap text-center">
                                    <button
                                      onClick={() => {
                                        setSelectedCustomer(customer);
                                        setLoanModal(true);
                                        fetchProducts();
                                      }}
                                      className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 border border-emerald-200 hover:border-emerald-600 shadow-sm">
                                      கடன் வாங்கு (Loan)
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                {/* Fixed colSpan bug (changed from 4 to 6) */}
                                <td
                                  colSpan="6"
                                  className="py-12 px-6 text-center text-slate-500 font-medium">
                                  <div className="flex flex-col items-center justify-center gap-2">
                                    <span className="text-3xl text-slate-300">
                                      👥
                                    </span>
                                    <p>
                                      எந்த வாடிக்கையாளர்களும் இல்லை (No
                                      customers found).
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
                )}

              {activeTab === "வாடிக்கையாளர்களின்" && userRole === "worker" && (
                <div className="mt-4 mb-2 flex justify-start animate-in fade-in duration-300">
                  <button
                    onClick={() => setCustomerModal(true)}
                    className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all duration-200 hover:shadow-md active:scale-95">
                    {/* சுழலும் பிளஸ் (+) ஐகான் அனிமேஷன் */}
                    <span className="text-xl leading-none group-hover:rotate-90 transition-transform duration-300">
                      +
                    </span>
                    <span>புதிய வாடிக்கையாளர் (Add Customer)</span>
                  </button>
                </div>
              )}

              {activeTab === "கடன்களின்" && userRole === "worker" && (
                <div className="p-6 animate-in fade-in duration-300">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* 🏷️ Card Header */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                        கடன்கள் பட்டியல் (Loans Ledger)
                      </h2>
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
                              வட்டி
                            </th>
                            <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">
                              மொத்தம்
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {loans && loans.length > 0 ? (
                            loans.map((loan) => (
                              <tr
                                key={loan._id}
                                className="hover:bg-slate-50 transition-colors">
                                {/* Date */}
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                                  {new Date(
                                    loan.paymentDate,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </td>

                                {/* Customer */}
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-slate-800">
                                  {loan.customer?.name || "Unknown"}
                                </td>

                                {/* Product Details */}
                                <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <span className="text-amber-600 font-bold">
                                      {loan.product.name}
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

                                {/* Gold Rate */}
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-semibold text-slate-600">
                                  ₹{loan.goldrate}
                                </td>

                                {/* Pawn Percentage */}
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-slate-500 text-center">
                                  <span className="bg-slate-100 px-2 py-1 rounded-md">
                                    {loan.pawnpercentage}%
                                  </span>
                                </td>

                                {/* Loan Amount */}
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-black text-emerald-600">
                                  ₹{loan.loanamount?.toFixed(2)}
                                </td>

                                {/* Actions (Pay / Receipt) */}
                                <td className="py-4 px-4 whitespace-nowrap text-sm">
                                  {loan.isClosed ? (
                                    <div className="flex justify-start items-center">
                                      <span className="inline-block border-2 border-emerald-500 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest py-1 px-2 rounded-md transform -rotate-3 shadow-sm pointer-events-none">
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
                                        className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm">
                                        கடனை செலுத்து (Pay)
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedLoan(loan);
                                          setReceiptModal(true);
                                        }}
                                        className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm">
                                        ரசீது (Receipt)
                                      </button>
                                    </div>
                                  )}
                                </td>

                                {/* Locker Status / Bank */}
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

                                {/* Interest */}
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-bold text-rose-600 text-right">
                                  + ₹
                                  {calculateDynamicInterest(
                                    loan.loanamount,
                                    loan.createdAt,
                                  )}
                                </td>

                                {/* Total */}
                                <td className="py-4 px-4 whitespace-nowrap text-sm font-black text-emerald-700 bg-emerald-50/50 text-right">
                                  ₹
                                  {(
                                    loan.loanamount +
                                    calculateDynamicInterest(
                                      loan.loanamount,
                                      loan.createdAt,
                                    )
                                  ).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="10"
                                className="py-12 px-6 text-center text-slate-500 font-medium">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <span className="text-3xl text-slate-300">
                                    📄
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
              )}

              {activeTab === "சுய" && userRole === "worker" && (
                <div className="p-6 animate-in fade-in duration-300">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* 🏷️ Card Header */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                        செலுத்தப்பட்ட கடன்கள் (Paid Loans History)
                      </h2>
                      <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        Total Records: {paidLoan?.length || 0}
                      </span>
                    </div>

                    {/* 📊 Table Section */}
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
                                {/* Loan Date */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                                  {pl.loan?.createdAt
                                    ? new Date(
                                        pl.loan.createdAt,
                                      ).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "-"}
                                </td>

                                {/* Payment Date */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-slate-800">
                                  {new Date(pl.paymentDate).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </td>

                                {/* Customer Photo */}
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

                                {/* Customer Name */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-slate-800">
                                  {pl.customer?.name || "Unknown"}
                                </td>

                                {/* Product */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-amber-600">
                                  {pl.loan?.product?.name || "-"}
                                </td>

                                {/* Original Loan Amount */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-500">
                                  ₹{pl.loan?.loanamount?.toFixed(2) || "0.00"}
                                </td>

                                {/* Amount Paid (Highlighted) */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-black text-emerald-700 bg-emerald-50/50 text-right">
                                  ₹{pl.amountPaid?.toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              {/* Fixed colSpan from 6 to 7 to match headers */}
                              <td
                                colSpan="7"
                                className="py-12 px-6 text-center text-slate-500 font-medium">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <span className="text-3xl text-slate-300">
                                    🧾
                                  </span>
                                  <p>
                                    எந்த செலுத்தப்பட்ட கடன்களும் இல்லை (No paid
                                    loans found).
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
              )}

              {activeTab === "லாக்கர்" && userRole === "worker" && (
                <div className="p-6 animate-in fade-in duration-300">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* 🏷️ Card Header */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                        வங்கி பெட்டக விவரங்கள் (Bank Locker Details)
                      </h2>
                      <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        Total Items: {lockerItems?.length || 0}
                      </span>
                    </div>

                    {/* 📊 Table Section */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                              புகைப்படம் (Photo)
                            </th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                              பெயர் (Name)
                            </th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                              அடகு பொருள் (Product)
                            </th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                              வங்கி பெயர் (Bank Name)
                            </th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                              கிளை பெயர் (Branch)
                            </th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">
                              பெட்டக எண் (Locker No)
                            </th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">
                              கடன் தொகை (Amount)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {lockerItems && lockerItems.length > 0 ? (
                            lockerItems.map((item) => (
                              <tr
                                key={item._id}
                                className="hover:bg-slate-50 transition-colors">
                                {/* Customer Photo */}
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

                                {/* Customer Name */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-slate-800">
                                  {item.customer?.name || "Unknown Customer"}
                                </td>

                                {/* Product */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-amber-600">
                                  {item.loan?.product?.name ||
                                    item.loan?.product ||
                                    "N/A"}
                                </td>

                                {/* Bank Name */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-700">
                                  {item.bank?.name || "N/A"}
                                </td>

                                {/* Branch Name */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500 font-medium">
                                  {item.branchname || "-"}
                                </td>

                                {/* Locker No (Styled Pill) */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm text-center">
                                  <span className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-md font-bold shadow-sm">
                                    {item.lockerno || "-"}
                                  </span>
                                </td>

                                {/* Loan Amount */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-black text-emerald-600 text-right">
                                  ₹{item.loan?.loanamount?.toFixed(2) || "0.00"}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              {/* Fixed colSpan from 6 to 7 */}
                              <td
                                colSpan="7"
                                className="py-12 px-6 text-center text-slate-500 font-medium">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <span className="text-3xl text-slate-300">
                                    🏦
                                  </span>
                                  <p>
                                    தற்போது வங்கியில் எந்த பொருட்களும் இல்லை (No
                                    items currently in the bank locker).
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
              )}

              {activeTab === "விகித" && userRole === "worker" && (
                <div className="p-6 animate-in fade-in duration-300">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* 🏷️ Card Header */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                        வட்டி விகித விவரங்கள் (Interest Rate Breakdown)
                      </h2>
                      <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        Total Records: {loans?.length || 0}
                      </span>
                    </div>

                    {/* 📊 Table Section */}
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
                          {loans && loans.length > 0 ? (
                            loans.map((loan) => (
                              <tr
                                key={loan._id}
                                className="hover:bg-slate-50 transition-colors">
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

                                {/* Name */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-slate-800">
                                  {loan.customer?.name || "Unknown Customer"}
                                </td>

                                {/* Date */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-semibold text-slate-600">
                                  {new Date(loan.createdAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </td>

                                {/* Product */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-amber-600">
                                  {loan.product?.name ||
                                    loan.loan?.product ||
                                    "N/A"}
                                </td>

                                {/* Tier 1: 1 to 3 Months */}
                                <td className="py-3 px-6 whitespace-nowrap">
                                  <div className="font-bold text-emerald-600 text-sm">
                                    ₹{loan.interestBreakdown?.tier1 || 0}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    {loan.dateRanges?.tier1 || "-"}
                                  </div>
                                </td>

                                {/* Tier 2: 4 to 6 Months */}
                                <td className="py-3 px-6 whitespace-nowrap">
                                  <div className="font-bold text-amber-500 text-sm">
                                    ₹{loan.interestBreakdown?.tier2 || 0}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    {loan.dateRanges?.tier2 || "-"}
                                  </div>
                                </td>

                                {/* Tier 3: 7 to 9 Months */}
                                <td className="py-3 px-6 whitespace-nowrap">
                                  <div className="font-bold text-rose-600 text-sm">
                                    ₹{loan.interestBreakdown?.tier3 || 0}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    {loan.dateRanges?.tier3 || "-"}
                                  </div>
                                </td>

                                {/* Total Current Interest */}
                                <td className="py-4 px-6 whitespace-nowrap text-sm font-black text-indigo-700 bg-indigo-50/50 text-right">
                                  ₹{loan.interestBreakdown?.total || 0}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              {/* Fixed colSpan bug (6 to 8) and fixed the wrong text */}
                              <td
                                colSpan="8"
                                className="py-12 px-6 text-center text-slate-500 font-medium">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <span className="text-3xl text-slate-300">
                                    📈
                                  </span>
                                  <p>
                                    எந்த வட்டி விவரங்களும் இல்லை (No interest
                                    records found).
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
              )}

              {CustomerModal &&
                activeTab === "வாடிக்கையாளர்களின்" &&
                userRole === "worker" && (
                  <form
                    onSubmit={handleSubmit}
                    className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      புதிய வாடிக்கையாளர் விவரங்கள்
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold mb-1 text-green-600">
                          Customer Name
                        </p>
                        <input
                          name="name"
                          placeholder="Full Name"
                          onChange={handleChange}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-600 mb-1">
                          Date of Birth
                        </p>
                        <input
                          name="dob"
                          type="date"
                          onChange={handleChange}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-600 mb-1">
                          Address
                        </p>
                        <input
                          name="address"
                          placeholder="Enter"
                          onChange={handleChange}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-600 mb-1">
                          Aadhar Number
                        </p>
                        <input
                          name="aadhar"
                          placeholder="Enter Customer's Aadhar Number"
                          onChange={handleChange}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                      {/* <input
                        name="accountnumber"
                        placeholder="Enter Customer's Account Number"
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                      <input
                        name="ifsc"
                        placeholder="Enter Customer's IFSC Code"
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      /> */}
                      <div>
                        <p className="text-sm font-semibold text-green-600 mb-1">
                          Email
                        </p>
                        <input
                          name="email"
                          type="email"
                          placeholder="Enter Customer's Email Address"
                          onChange={handleChange}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-600 mb-1">
                          Phone Number
                        </p>
                        <input
                          name="phone"
                          placeholder="Enter Customer's Phone Number"
                          onChange={handleChange}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>

                      {/* File Inputs */}
                      <div className="flex flex-col">
                        <label className="text-sm font-semibold text-green-600 mb-1">
                          Aadhar Image
                        </label>
                        <input
                          name="aadharimage"
                          type="file"
                          accept="image/*"
                          onChange={handleChange}
                          className="p-1 border border-gray-300 rounded bg-white"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-sm font-semibold text-green-600 mb-1">
                          Recent Photo
                        </label>
                        <input
                          name="recentimage"
                          type="file"
                          accept="image/*"
                          onChange={handleChange}
                          className="p-1 border border-gray-300 rounded bg-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="mt-6 flex gap-3">
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 transition">
                        Save Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerModal(false)}
                        className="bg-red-500 text-white px-6 py-2 rounded font-semibold hover:bg-red-400 transition">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
            </div>
          )}
        </div>

        <section>
          {LoanModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                {/* 🏷️ Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-800">
                    புதிய கடன் (New Loan Application)
                  </h3>
                  <button
                    onClick={() => {
                      setLoanModal(false);
                      setLoanCalc({
                        weight: "",
                        stoneweight: "",
                        goldrate: "",
                        pawnpercentage: "",
                      });
                    }}
                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                    ✕
                  </button>
                </div>

                <div className="p-6">
                  {/* 👤 Customer Info Card */}
                  <div className="mb-6 flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg shadow-sm border border-indigo-200">
                      👤
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        வாடிக்கையாளர் (Customer)
                      </p>
                      <p className="text-sm font-black text-slate-800">
                        {selectedCustomer?.name}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleLoanSubmit} className="space-y-4">
                    {/* Product Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                        அடகு பொருள் (Product)
                      </label>
                      <select
                        name="productId"
                        className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                        required>
                        <option value="">
                          பொருளை தேர்ந்தெடுக்கவும் (Select Product)
                        </option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Weight Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                          மொத்த எடை (Gross Wt)
                        </label>
                        <div className="relative">
                          <input
                            name="weight"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            onChange={handleLoanCalcChange}
                            className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all outline-none pr-8"
                            required
                          />
                          <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-bold">
                            g
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                          கல் எடை (Stone Wt)
                        </label>
                        <div className="relative">
                          <input
                            name="stoneweight"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            onChange={handleLoanCalcChange}
                            className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all outline-none pr-8"
                            required
                          />
                          <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-bold">
                            g
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rate & Percentage Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                          தங்கம் விலை (Rate/g)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-bold">
                            ₹
                          </span>
                          <input
                            name="goldrate"
                            type="number"
                            placeholder="0.00"
                            onChange={handleLoanCalcChange}
                            className="block w-full rounded-lg border-slate-300 bg-slate-50 pl-7 pr-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                          அடகு சதவீதம் (Pawn %)
                        </label>
                        <div className="relative">
                          <input
                            name="pawnpercentage"
                            type="number"
                            placeholder="0"
                            onChange={handleLoanCalcChange}
                            className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 transition-all outline-none pr-8"
                            required
                          />
                          <span className="absolute right-3 top-2.5 text-slate-400 text-sm font-bold">
                            %
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 💰 Estimated Loan Display */}
                    <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center shadow-inner">
                      <p className="text-xs text-emerald-600 font-extrabold uppercase tracking-widest mb-1">
                        மதிப்பிடப்பட்ட கடன் (Estimated Loan)
                      </p>
                      <p className="text-3xl font-black text-emerald-700 tracking-tight">
                        ₹
                        {estimatedAmount > 0
                          ? estimatedAmount.toFixed(2)
                          : "0.00"}
                      </p>
                    </div>

                    {/* 🛑 Actions */}
                    <div className="flex gap-3 mt-6 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setLoanModal(false);
                          setLoanCalc({
                            weight: "",
                            stoneweight: "",
                            goldrate: "",
                            pawnpercentage: "",
                          });
                        }}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                        ரத்து (Cancel)
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 shadow-sm transition-all active:scale-95">
                        உறுதி செய் (Submit)
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </section>

        {ReceiptModal && selectedLoan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-300 print:p-0 print:bg-white print:block">
            {/* 🌟 FIX: Added flex-col, max-h-[95vh] and prevented overall overflow to allow inner scrolling */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none relative flex flex-col max-h-[95vh] print:max-h-none print:block overflow-hidden">
              {/* 📄 Printable Area Starts Here - 🌟 FIX: Added overflow-y-auto flex-1 to make ONLY this area scrollable */}
              <div
                id="printable-receipt"
                className="p-8 print:p-0 relative bg-white overflow-y-auto flex-1 print:overflow-visible print:block custom-scrollbar">
                {/* 🔲 Print Background Watermark (Only visible when printing) */}
                <div className="hidden print:flex absolute inset-0 items-center justify-center opacity-[0.03] pointer-events-none z-0">
                  <span className="text-8xl font-black uppercase tracking-widest transform -rotate-45">
                    INFOSENX IT
                  </span>
                </div>

                <div className="relative z-10">
                  {/* 🏢 Header Section */}
                  <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-6 print:border-black">
                    <div className="inline-flex items-center justify-center bg-amber-100 text-amber-600 w-12 h-12 rounded-full mb-3 print:hidden shadow-sm">
                      <span className="text-2xl">🏦</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest print:text-black">
                      இன்ஃபோசென்x ஐடி அடகுக் கடை
                    </h2>
                    <p className="text-slate-500 font-bold mt-1 text-xs tracking-widest uppercase print:text-black">
                      பில் ரசீது (Official Receipt)
                    </p>
                    <p className="text-slate-600 font-medium mt-3 text-sm print:text-black">
                      Nagercoil, Kanyakumari (District) <br /> Phone: +91 98765
                      43210
                    </p>
                  </div>

                  {/* 📅 Receipt No & Date Box */}
                  <div className="flex justify-between items-center mb-6 px-6 py-4 bg-slate-50 rounded-xl border border-slate-100 print:bg-transparent print:border-b print:border-t print:border-slate-300 print:rounded-none print:px-0 print:py-2">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest print:text-slate-600">
                        ரசீது எண் (Receipt No)
                      </p>
                      <p className="text-xl font-black text-slate-800 print:text-black font-mono tracking-wider">
                        #{selectedLoan._id.slice(-6).toUpperCase()}
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

                  {/* 👤 Customer Details */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                    <div className="flex-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 w-full">
                      <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 print:border-black print:text-black uppercase text-xs tracking-widest">
                        வாடிக்கையாளர் விவரங்கள்
                      </h4>
                      <div className="space-y-2 text-sm text-slate-700 print:text-black">
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

                    {/* Avatar */}
                    <div className="flex-shrink-0">
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

                  {/* 📦 Product Table */}
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

                  {/* 💰 Amounts & Pricing Summary */}
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

                      <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100 print:bg-transparent print:border-black print:rounded-none print:p-2">
                        <p className="text-indigo-700 font-bold text-xs uppercase tracking-widest print:text-black">
                          செலுத்திய தொகை
                        </p>
                        {(() => {
                          const relatedPayments = paidLoan.filter(
                            (pl) => pl.loan?._id === selectedLoan._id,
                          );
                          const totalPaid = relatedPayments.reduce(
                            (sum, pl) => sum + (pl.amountPaid || 0),
                            0,
                          );
                          return (
                            <p className="text-2xl font-black text-indigo-800 print:text-black">
                              ₹{totalPaid.toFixed(2)}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 📜 Terms and Conditions */}
                  <div className="mt-8 pt-4 border-t border-slate-200 print:border-black text-[9px] text-slate-400 print:text-slate-600 leading-relaxed uppercase tracking-wider text-justify">
                    <span className="font-bold text-slate-500 print:text-black">
                      கவனத்திற்கு:
                    </span>{" "}
                    1. அடகு வைத்த பொருளை மீட்க வரும்போது இந்த ரசீதை கட்டாயம்
                    கொண்டு வர வேண்டும். 2. குறிப்பிட்ட காலக்கெடுவிற்குள் வட்டி
                    அல்லது அசலை செலுத்தாவிட்டால் பொருள் ஏலம் விடப்படும்.
                  </div>

                  {/* ✍️ Signatures */}
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

              {/* 🛑 Screen Only Buttons (Hidden in Print) - 🌟 FIX: Added flex-shrink-0 so buttons don't disappear */}
              <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex gap-4 print:hidden flex-shrink-0">
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
                  className="flex-[2] bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm flex justify-center items-center gap-2 active:scale-95">
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
                  {/* Bank Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                      வங்கி (Bank)
                    </label>
                    <select
                      name="bankId"
                      required
                      className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 font-semibold focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all outline-none cursor-pointer">
                      <option value="" disabled selected>
                        வங்கியை தேர்ந்தெடுக்கவும் (Select Bank)
                      </option>
                      {bankList.map((bank) => (
                        <option key={bank._id} value={bank._id}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Branch Name */}
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
      </div>
    </>
  );
}
