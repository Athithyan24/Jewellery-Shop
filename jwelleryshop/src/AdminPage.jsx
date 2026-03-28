import { useState, useEffect } from "react";
import axios from "axios";
import ver from "./assets/approved.png";
import upi from "./assets/upi.png";
import { getDatabase } from "./db";
import { useNavigate } from "react-router-dom";
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

const dataURLtoFile = (dataurl, filename) => {
  if (!dataurl || !dataurl.includes(",")) return null;
  let arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [CustomerModal, setCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [LoanModal, setLoanModal] = useState(false);
  const [PayLoanModal, setPayLoanModal] = useState(false);
  const [offlineCustomers, setOfflineCustomers] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

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

  const [loanCalc, setLoanCalc] = useState({
    weight: "",
    stoneweight: "",
    goldrate: "",
    pawnpercentage: "",
    interestRate: "",
    firstinterest: "",
    secondinterest: "",
    thirdinterest: "",
    firstInterestTo: "",
    firstInterestFrom: "",
    secondInterestFrom: "",
    secondInterestTo: "",
    thirdInterestFrom: "",
    thirdInterestTo: "",
  });

  const netWeight =
    (parseFloat(loanCalc.weight) || 0) -
    (parseFloat(loanCalc.stoneweight) || 0);
  const estimatedAmount =
    (netWeight *
      (parseFloat(loanCalc.goldrate) || 0) *
      (parseFloat(loanCalc.pawnpercentage) || 0)) /
    100;
  // 3. Calculate Simple Interest for 1, 2, and 3 months
  const t1Days =
    (parseFloat(loanCalc.firstInterestTo) || 90) -
    (parseFloat(loanCalc.firstInterestFrom) || 1) +
    1;
  const t2Days =
    (parseFloat(loanCalc.secondInterestTo) || 180) -
    (parseFloat(loanCalc.secondInterestFrom) || 91) +
    1;
  const t3Days =
    (parseFloat(loanCalc.thirdInterestTo) || 270) -
    (parseFloat(loanCalc.thirdInterestFrom) || 181) +
    1;
  // Formula: (Principal * Rate * Time) / 100
  const interest1Month =
    (estimatedAmount *
      (parseFloat(loanCalc.firstinterest) || 0) *
      (t1Days / 30)) /
    100;
  const interest2Months =
    (estimatedAmount *
      (parseFloat(loanCalc.secondinterest) || 0) *
      (t2Days / 30)) /
    100;
  const interest3Months =
    (estimatedAmount *
      (parseFloat(loanCalc.thirdinterest) || 0) *
      (t3Days / 30)) /
    100;

  // 4. (Optional) If you want to show the TOTAL amount the customer has to pay back
  const totalPayable1Month = estimatedAmount + interest1Month;
  const totalPayable2Months = estimatedAmount + interest2Months;
  const totalPayable3Months = estimatedAmount + interest3Months;
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
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create worker.");
    }
  };

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

  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        customerId: selectedCustomer._id,
        product: e.target.productId
          ? e.target.productId.value
          : e.target.product?.value,
        weight: e.target.weight.value,
        stoneweight: e.target.stoneweight.value,
        goldrate: e.target.goldrate.value,
        pawnpercentage: e.target.pawnpercentage.value,
        firstinterest: e.target.firstinterest.value,
        secondinterest: e.target.secondinterest.value,
        thirdinterest: e.target.thirdinterest.value,
        firstinterestAmount: interest1Month,
        secondinterestAmount: interest2Months,
        thirdinterestAmount: interest3Months,
        firstInterestFrom: e.target.firstInterestFrom?.value || 1,
        firstInterestTo: e.target.firstInterestTo?.value || 90,
        secondInterestFrom: e.target.secondInterestFrom?.value || 91,
        secondInterestTo: e.target.secondInterestTo?.value || 180,
        thirdInterestFrom: e.target.thirdInterestFrom?.value || 181,
        thirdInterestTo: e.target.thirdInterestTo?.value || 270,
      };

      const res = await axios.post("http://localhost:5000/api/loans", payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      alert(res.data.message || "🎉 Loan created successfully!");

      setLoanModal(false);

      // Reset your calculation states
      setLoanCalc({
        weight: "",
        stoneweight: "",
        goldrate: "",
        pawnpercentage: "",
        interestRate: "",
        firstinterest: "",
        secondinterest: "",
        thirdinterest: "",
        firstInterestFrom: "",
        firstInterestTo: "",
        secondInterestFrom: "",
        secondInterestTo: "",
        thirdInterestFrom: "",
      });

      if (typeof fetchLoans === "function") {
        fetchLoans();
      }
    } catch (err) {
      console.error("Server Error:", err.response?.data || err.message);
      alert(
        "Error: " + (err.response?.data?.message || "Something went wrong"),
      );
    }
  };

  const calculateDynamicInterest = (
    principal,
    createdAt,
    r1,
    r2,
    r3,
    t1From = 1,
    t1To = 90,
    t2From = 91,
    t2To = 180,
    t3From = 181,
    t3To = 270,
  ) => {
    if (!principal || !createdAt) return 0;

    const startDate = new Date(createdAt);
    const currentDate = new Date();

    const diffInTime = currentDate.getTime() - startDate.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);

    const exactMonths = diffInDays / 30;
    const months = Math.max(exactMonths, 1);

    const tier1Rate = parseFloat(r1) || 1;
    const tier2Rate = parseFloat(r2) || 1;
    const tier3Rate = parseFloat(r3) || 1;

    const daysInTier1 = Math.max(0, Math.min(diffInDays, t1To) - (t1From - 1));
    const daysInTier2 = Math.max(0, Math.min(diffInDays, t2To) - (t2From - 1));
    const daysInTier3 = Math.max(0, Math.min(diffInDays, t3To) - (t3From - 1));

    const m1 = daysInTier1 / 30;
    const m2 = daysInTier2 / 30;
    const m3 = daysInTier3 / 30;

    // Divide by 100 for monthly pawn shop calculation
    const tier1Interest = (principal * tier1Rate * m1) / 100;
    const tier2Interest = (principal * tier2Rate * m2) / 100;
    const tier3Interest = (principal * tier3Rate * m3) / 100;

    return Math.round(tier1Interest + tier2Interest + tier3Interest);
  };

  useEffect(() => {
    const fetchTabData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "பரிவர்த்தனைகளின்") {
          await fetchDailyStats();
        } else if (activeTab === "வாடிக்கையாளர்களின்") {
          await fetchCustomers();
        } else if (activeTab === "கடன்களின்") {
          await fetchLoans();
          await fetchBanks();
          await fetchPaidLoanDetails();
        } else if (activeTab === "சுய") {
          await fetchPaidLoanDetails();
        } else if (activeTab === "லாக்கர்") {
          await fetchCustomersLocker();
        } else if (activeTab === "விகித") {
          await fetchLoans();
        }
        await new Promise((resolve) => setTimeout(resolve, 600));
      } catch (error) {
        console.error("Error fetching tab data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTabData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const [payType, setPayType] = useState("");

  useEffect(() => {
    fetchUser();
    fetchWorkers();
    fetchCustomers();
    fetchOfflineCustomers();
    fetchPaidLoanDetails();
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

  useEffect(() => {
    let subscription;
    const loadOfflineDB = async () => {
      const db = await getDatabase();

      subscription = db.customers.find().$.subscribe((customers) => {
        setOfflineCustomers(customers);
      });
    };

    loadOfflineDB();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const fetchOfflineCustomers = async () => {
    try {
      const db = await getDatabase();
      const docs = await db.customers.find().exec();

      const data = docs.map((doc) => doc.toJSON());
      setOfflineCustomers(data);
    } catch (error) {
      console.error("Error fetching offline customers from RxDB:", error);
    }
  };

  const saveCustomerOffline = async (e) => {
    e.preventDefault();
    const db = await getDatabase();

    const formValues = new FormData(e.target);

    const aadharInput = document.querySelector('input[name="aadharimage"]');
    const recentInput = document.querySelector('input[name="recentimage"]');

    const aadharFile =
      aadharInput && aadharInput.files.length > 0 ? aadharInput.files[0] : null;
    const recentFile =
      recentInput && recentInput.files.length > 0 ? recentInput.files[0] : null;

    const aadharBase64 = aadharFile ? await fileToBase64(aadharFile) : "";
    const recentBase64 = recentFile ? await fileToBase64(recentFile) : "";

    await db.customers.insert({
      id: Date.now().toString(),
      name: formValues.get("name") || "பெயர் இல்லை", // Gets the <input name="name">
      dob: formValues.get("dob") || "",
      address: formValues.get("address") || "",
      aadhar: formValues.get("aadhar") || "",
      email: formValues.get("email") || "",
      phone: formValues.get("phone") || "",

      createdBy: localStorage.getItem("userId") || "unknown_worker",

      updatedAt: Date.now(),
      aadharimage: aadharBase64,
      recentimage: recentBase64,
      isSynced: false,
    });

    alert(
      "✅ வாடிக்கையாளர் விவரங்கள் ஆஃப்லைனில் சேமிக்கப்பட்டன! (Saved Offline)",
    );

    e.target.reset();

    if (typeof fetchOfflineCustomers === "function") fetchOfflineCustomers();
    setCustomerModal(false);
  };

  const syncOfflineCustomersToCloud = async () => {
    try {
      const unsynced = offlineCustomers.filter((c) => !c.isSynced);
      if (unsynced.length === 0) {
        alert("ஒத்திசைக்க எந்த தரவும் இல்லை! (No offline data to sync)");
        return;
      }

      const db = await getDatabase();

      for (const customer of unsynced) {
        const formData = new FormData();
        formData.append("name", customer.name);
        formData.append("dob", customer.dob);
        formData.append("address", customer.address);
        formData.append("aadhar", customer.aadhar);
        formData.append("email", customer.email);
        formData.append("phone", customer.phone);

        if (customer.recentimage) {
          const recentFile = dataURLtoFile(
            customer.recentimage,
            "recentimage.jpg",
          );
          if (recentFile) formData.append("recentimage", recentFile);
        }
        if (customer.aadharimage) {
          const aadharFile = dataURLtoFile(
            customer.aadharimage,
            "aadharimage.jpg",
          );
          if (aadharFile) formData.append("aadharimage", aadharFile);
        }

        await axios.post("http://localhost:5000/api/customers", formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        });

        const doc = await db.customers
          .findOne({ selector: { id: customer.id } })
          .exec();
        if (doc) {
          await doc.patch({ isSynced: true });
        }
      }

      alert(
        "🎉 அனைத்து தரவுகளும் வெற்றிகரமாக ஒத்திசைக்கப்பட்டன! (Sync Complete!)",
      );

      fetchOfflineCustomers();
      fetchCustomers();
      setCustomerModal(false);
    } catch (error) {
      console.error("Sync Error:", error);
      alert("Sync failed! Console-ஐ பார்க்கவும்.");
    }
  };

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

      {userRole === "worker" && currentUser && (
        <div className="relative overflow-hidden bg-slate-50 py-16 px-4 flex items-center justify-center min-h-75">
          <div className="absolute top-4 left-1/4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute top-4 right-1/4 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
          <div className="fixed inset-0 z-50 pointer-events-none flex items-end overflow-hidden opacity-20 select-none">
            <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-slate-900  whitespace-nowrap">
              infoZenX IT
            </h1>
          </div>
          <header className="relative z-10 bg-white/60 backdrop-blur-2xl border border-white/60 shadow-xl rounded-3xl p-10 max-w-2xl w-full flex flex-col items-center justify-center transition-all duration-300 hover:shadow-2xl hover:bg-white/70">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight text-center mb-6 drop-shadow-sm">
              {currentUser.username}{" "}
              <span className="inline-block mt-2 sm:mt-0 text-indigo-700 bg-indigo-100/80 px-4 py-1.5 rounded-xl shadow-sm border border-indigo-200/50">
                {currentUser.shoptype || "Shop"}
              </span>
            </h1>
            {currentUser.username && (
              <div className="flex items-center gap-2 px-5 py-2 bg-white/80 border border-slate-200/60 rounded-full text-sm font-medium text-slate-600 shadow-sm backdrop-blur-md">
                <svg
                  className="w-5 h-5 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span className="tracking-wide">
                  Proprietor:{" "}
                  <span className="font-bold text-slate-900">
                    {currentUser.username}
                  </span>
                </span>
              </div>
            )}
          </header>
        </div>
      )}

      <button
        onClick={syncOfflineCustomersToCloud}
        className="mb-4 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 font-bold transition-all active:scale-95">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M21 2v6h-6"></path>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v6h6"></path>
        </svg>
        தரவை ஒத்திசை (Sync to Cloud)
      </button>
      <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
        <div
          className={`max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 ${ReceiptModal ? "print:hidden" : ""}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full">
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
                    <span
                      className={
                        isActive ? "text-amber-600" : "text-slate-400"
                      }>
                      {tab.icon}
                    </span>

                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4 px-6 py-3 md:py-0 border-t md:border-t-0 border-slate-100 bg-slate-50 md:bg-transparent">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">
                  {localStorage.getItem("username") || "User"}
                </p>
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  {userRole}
                </p>
              </div>

              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/");
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
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-fit">
                      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                          <span className="text-2xl">👨‍💼</span> புதிய பணியாளர்
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          கடைக்கான புதிய பணியாளரை உருவாக்கவும்
                        </p>
                      </div>

                      <div className="p-6">
                        <form
                          onSubmit={handleCreateWorker}
                          className="space-y-5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                              கடை பெயர் (Shop Name)
                            </label>
                            <input
                              required
                              type="text"
                              value={workerShopname}
                              onChange={(e) =>
                                setWorkerShopname(e.target.value)
                              }
                              placeholder="எ.கா: Kovai Branch"
                              className="block w-full rounded-xl border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 font-bold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                              பயனர் பெயர் (Username)
                            </label>
                            <input
                              required
                              type="text"
                              value={workerUsername}
                              onChange={(e) =>
                                setWorkerUsername(e.target.value)
                              }
                              placeholder="எ.கா: worker_01"
                              className="block w-full rounded-xl border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 font-bold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                              கடவுச்சொல் (Password)
                            </label>
                            <input
                              required
                              type="password"
                              value={workerPassword}
                              onChange={(e) =>
                                setWorkerPassword(e.target.value)
                              }
                              placeholder="••••••••"
                              className="block w-full rounded-xl border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 font-bold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full mt-4 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex justify-center items-center gap-2">
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
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            உருவாக்கு (Create)
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden col-span-1 lg:col-span-2 flex flex-col">
                      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                            <span className="text-2xl">📋</span> பணியாளர்கள்
                            பட்டியல்
                          </h2>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            கடையின் அனைத்து பணியாளர்கள்
                          </p>
                        </div>
                        <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                          Total: {workers.length}
                        </span>
                      </div>

                      <div className="overflow-x-auto p-6 flex-1">
                        <table className="min-w-full divide-y divide-slate-200 text-sm border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-6 py-4 text-left font-extrabold text-slate-600 uppercase tracking-wider text-xs">
                                வ.எண்
                              </th>
                              <th className="px-6 py-4 text-left font-extrabold text-slate-600 uppercase tracking-wider text-xs">
                                பயனர் பெயர்
                              </th>
                              <th className="px-6 py-4 text-left font-extrabold text-slate-600 uppercase tracking-wider text-xs">
                                கடை பெயர்
                              </th>
                              <th className="px-6 py-4 text-left font-extrabold text-slate-600 uppercase tracking-wider text-xs">
                                பங்கு
                              </th>
                              <th className="px-6 py-4 text-center font-extrabold text-slate-600 uppercase tracking-wider text-xs">
                                செயல்
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {workers.length > 0 ? (
                              workers.map((worker, index) => (
                                <tr
                                  key={worker._id}
                                  className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-bold">
                                    {index + 1}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-black text-base">
                                    {worker.username}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-bold">
                                    {worker.shoptype}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm">
                                      {worker.role}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button
                                      className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all"
                                      title="பணியாளரை நீக்கு">
                                      <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="5"
                                  className="px-6 py-16 text-center">
                                  <div className="flex flex-col items-center justify-center gap-3">
                                    <span className="text-5xl opacity-50">
                                      📭
                                    </span>
                                    <p className="text-slate-500 font-bold text-lg">
                                      பணியாளர்கள் யாரும் இல்லை
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                      இடதுபுறம் உள்ள படிவத்தை பயன்படுத்தி புதிய
                                      பணியாளரை உருவாக்கவும்.
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
                </div>
              )}

              {activeTab === "பரிவர்த்தனைகளின்" && userRole === "worker" && (
                <div className="p-6 overflow-x-auto animate-in fade-in duration-300">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                        தினசரி பரிவர்த்தனைகள் (Daily Ledger)
                      </h2>
                      <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        Total Days: {dailyStats?.length || 0}
                      </span>
                    </div>

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

                                  <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-rose-600">
                                    {stat.loanGiven > 0
                                      ? `- ₹${stat.loanGiven.toFixed(2)}`
                                      : "-"}
                                  </td>

                                  <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-emerald-600">
                                    {stat.income > 0
                                      ? `+ ₹${stat.income.toFixed(2)}`
                                      : "-"}
                                  </td>

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
                    {offlineCustomers.filter((c) => !c.isSynced).length > 0 && (
                      <div className="flex justify-end mb-4">
                        <button
                          onClick={syncOfflineCustomersToCloud}
                          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-indigo-700 font-bold transition-all animate-pulse">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                          </svg>
                          தரவை ஒத்திசை (
                          {offlineCustomers.filter((c) => !c.isSynced).length}{" "}
                          Unsynced)
                        </button>
                      </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                          வாடிக்கையாளர்கள் (Customers List)
                        </h2>
                        <span className="bg-white text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                          Total:{" "}
                          {(customers?.length || 0) +
                            offlineCustomers.filter((c) => !c.isSynced).length}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                புகைப்படம்
                              </th>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                பெயர்
                              </th>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                தொலைபேசி எண்
                              </th>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                ஆதார் எண்
                              </th>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                முகவரி
                              </th>
                              <th className="py-3 px-6 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">
                                விருப்பங்கள்
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {/* 🔴 OFFLINE / UNSYNCED CUSTOMERS (Shows at the top in Rose Color) */}
                            {offlineCustomers &&
                              offlineCustomers
                                .filter((c) => !c.isSynced)
                                .map((customer) => (
                                  <tr
                                    key={customer.id}
                                    className="bg-rose-50/40 hover:bg-rose-50 transition-colors border-l-4 border-l-rose-400">
                                    <td className="py-3 px-6 whitespace-nowrap">
                                      {/* Offline images are already Base64 strings */}
                                      <img
                                        src={
                                          customer.recentimage ||
                                          `https://ui-avatars.com/api/?name=${customer.name}&background=F1F5F9&color=64748B`
                                        }
                                        alt={customer.name}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-rose-200 shadow-sm opacity-80"
                                      />
                                    </td>
                                    <td className="py-3 px-6 whitespace-nowrap font-bold text-slate-800">
                                      {customer.name}
                                      <span className="ml-2 text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold tracking-widest uppercase shadow-sm border border-rose-200">
                                        Not Synced
                                      </span>
                                    </td>
                                    <td className="py-3 px-6 whitespace-nowrap font-semibold text-slate-600">
                                      {customer.phone}
                                    </td>
                                    <td className="py-3 px-6 whitespace-nowrap font-medium text-slate-500">
                                      {customer.aadhar}
                                    </td>
                                    <td className="py-3 px-6 min-w-50 text-slate-600 leading-relaxed">
                                      {customer.address}
                                    </td>
                                    <td className="py-3 px-6 whitespace-nowrap text-center">
                                      <span className="text-xs font-bold text-rose-500 bg-white px-3 py-1.5 rounded-lg border border-rose-100">
                                        Sync to enable Loan
                                      </span>
                                    </td>
                                  </tr>
                                ))}

                            {/* 🟢 ONLINE CUSTOMERS */}
                            {customers && customers.length > 0
                              ? customers.map((customer) => (
                                  <tr
                                    key={customer._id}
                                    className="hover:bg-slate-50 transition-colors">
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
                                    <td className="py-3 px-6 whitespace-nowrap font-bold text-slate-800">
                                      {customer.name}
                                    </td>
                                    <td className="py-3 px-6 whitespace-nowrap font-semibold text-slate-600">
                                      {customer.phone}
                                    </td>
                                    <td className="py-3 px-6 whitespace-nowrap font-medium text-slate-500">
                                      {customer.aadhar}
                                    </td>
                                    <td className="py-3 px-6 min-w-50 text-slate-600 leading-relaxed">
                                      {customer.address}
                                    </td>
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
                              : // Empty State
                                offlineCustomers.filter((c) => !c.isSynced)
                                  .length === 0 && (
                                  <tr>
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
                              வட்டி / வட்டி நிலை
                            </th>
                            <th className="py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-right">
                              மீதமுள்ள தொகை
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {loans && loans.length > 0 ? (
  loans.map((loan) => {
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
      </tr>
    );
  })) : (
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
                                    ₹{loan.interestBreakdown?.tier1Gross || 0}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    {loan.dateRanges?.tier1 || "-"}
                                  </div>
                                </td>

                                {/* Tier 2: 4 to 6 Months */}
                                <td className="py-3 px-6 whitespace-nowrap">
                                  <div className="font-bold text-amber-500 text-sm">
                                    ₹{loan.interestBreakdown?.tier2Gross || 0}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    {loan.dateRanges?.tier2 || "-"}
                                  </div>
                                </td>

                                <td className="py-3 px-6 whitespace-nowrap">
                                  <div className="font-bold text-rose-600 text-sm">
                                    ₹{loan.interestBreakdown?.tier3Gross || 0}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    {loan.dateRanges?.tier3 || "-"}
                                  </div>
                                </td>

                                <td className="py-4 px-6 whitespace-nowrap text-right bg-indigo-50/50">
                                  {(() => {
                                    const totalAccrued =
                                      loan.interestBreakdown?.total || 0;
                                    const paidInterest = loan.interestPaid || 0;

                                    const pendingInterest =
                                      totalAccrued - paidInterest;

                                    const isFullyPaid =
                                      totalAccrued > 0 && pendingInterest <= 0;

                                    if (isFullyPaid) {
                                      return (
                                        <div className="flex flex-col items-end">
                                          <span className="text-emerald-600 font-bold flex items-center gap-1 text-sm bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                            ✓ Paid
                                          </span>
                                          <span className="text-xs text-slate-400 line-through mt-1 font-semibold">
                                            ₹{totalAccrued}
                                          </span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="flex flex-col items-end">
                                        <span className="text-indigo-700 font-black text-sm">
                                          ₹
                                          {pendingInterest > 0
                                            ? pendingInterest
                                            : totalAccrued}
                                        </span>
                                        {paidInterest > 0 && (
                                          <span className="text-[10px] text-emerald-600 mt-1 font-bold">
                                            (Paid so far: ₹{paidInterest})
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
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
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-2xl">👤</span> புதிய
                          வாடிக்கையாளர் (Add Customer)
                        </h2>
                        <button
                          onClick={() => setCustomerModal(false)}
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                          ✕
                        </button>
                      </div>

                      <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                        <form
                          onSubmit={saveCustomerOffline}
                          className="space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                                பெயர் (Name)
                              </label>
                              <input
                                type="text"
                                name="name"
                                required
                                placeholder="எ.கா: Kumar"
                                className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                                தொலைபேசி எண் (Phone)
                              </label>
                              <input
                                type="tel"
                                name="phone"
                                required
                                placeholder="எ.கா: 9876543210"
                                className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                                ஆதார் எண் (Aadhar No)
                              </label>
                              <input
                                type="text"
                                name="aadhar"
                                required
                                placeholder="எ.கா: 1234 5678 9012"
                                className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                                பிறந்த தேதி (DOB)
                              </label>
                              <input
                                type="date"
                                name="dob"
                                required
                                className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none cursor-pointer"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                              முகவரி (Address)
                            </label>
                            <textarea
                              name="address"
                              required
                              rows="2"
                              placeholder="முழு முகவரி..."
                              className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none resize-none"></textarea>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                              மின்னஞ்சல் (Email)
                            </label>
                            <input
                              type="email"
                              name="email"
                              required
                              placeholder="எ.கா: abc@gmail.com"
                              className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-semibold focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                புகைப்படம் (Recent Photo)
                              </label>
                              <input
                                type="file"
                                name="recentimage"
                                accept="image/*"
                                required
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 transition-all cursor-pointer"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                ஆதார் படம் (Aadhar Image)
                              </label>
                              <input
                                type="file"
                                name="aadharimage"
                                accept="image/*"
                                required
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-all cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                            <p className="text-xs text-amber-700 font-bold flex items-center gap-2">
                              <span className="text-lg">⚡</span>
                              இணையம் இல்லாவிட்டாலும் (Offline) வாடிக்கையாளரை
                              சேமிக்கலாம். இணையம் வந்ததும் Sync செய்துகொள்ளவும்.
                            </p>
                          </div>

                          <div className="flex gap-3 pt-6 mt-4 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setCustomerModal(false)}
                              className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                              ரத்து (Cancel)
                            </button>
                            <button
                              type="submit"
                              className="flex-2 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-sm transition-all active:scale-95">
                              சேமி (Save Customer)
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        <section>
          {LoanModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[95vh]">
                {/* 🏷️ Modal Header (Fixed at top) */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
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
                        firstinterest: "",
                        secondinterest: "",
                        thirdinterest: "",
                        firstInterestFrom: "",
                        firstInterestTo: "",
                        secondInterestFrom: "",
                        secondInterestTo: "",
                        thirdInterestFrom: "",
                        thirdInterestTo: "",
                      });
                    }}
                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                    ✕
                  </button>
                </div>

                {/* 📝 Modal Body (Scrollable if needed, but landscape prevents it) */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">
                  <form
                    id="loan-form"
                    onSubmit={handleLoanSubmit}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* ================= LEFT COLUMN (Basic Details) ================= */}
                    <div className="lg:col-span-5 space-y-5">
                      {/* 👤 Customer Info Card */}
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
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

                      {/* Product Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide">
                          அடகு பொருள் (Product)
                        </label>
                        <select
                          name="productId"
                          className="block w-full rounded-lg border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none shadow-sm"
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
                              className="block w-full rounded-lg border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none pr-8 shadow-sm"
                              required
                            />
                            <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">
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
                              className="block w-full rounded-lg border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none pr-8 shadow-sm"
                              required
                            />
                            <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">
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
                            <span className="absolute left-3 top-2 text-slate-500 text-sm font-bold">
                              ₹
                            </span>
                            <input
                              name="goldrate"
                              type="number"
                              placeholder="0.00"
                              onChange={handleLoanCalcChange}
                              className="block w-full rounded-lg border-slate-300 bg-white pl-7 pr-4 py-2 text-sm text-slate-900 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none shadow-sm"
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
                              className="block w-full rounded-lg border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none pr-8 shadow-sm"
                              required
                            />
                            <span className="absolute right-3 top-2 text-slate-400 text-sm font-bold">
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 💰 Estimated Loan Display */}
                      <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center shadow-sm">
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
                    </div>

                    {/* ================= RIGHT COLUMN (Interest Configuration) ================= */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                          வட்டி அமைப்புகள் (Interest Settings)
                        </h4>

                        <div className="space-y-5">
                          {/* ---------------- முதல் வட்டி ---------------- */}
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="text-xs font-bold text-indigo-700 uppercase">
                                முதல் வட்டி (INT: 1)
                              </h5>
                              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-md">
                                மதிப்பீடு: ₹
                                {interest1Month > 0
                                  ? interest1Month.toFixed(2)
                                  : "0.00"}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                  வட்டி வீதம்
                                </label>
                                <div className="relative">
                                  <input
                                    name="firstinterest"
                                    type="number"
                                    placeholder="0"
                                    value={loanCalc.firstinterest || ""}
                                    onChange={handleLoanCalcChange}
                                    className="block w-full rounded border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    required
                                  />
                                  <span className="absolute right-2 top-1.5 text-slate-400 text-xs font-bold">
                                    %
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                  முதல் (From)
                                </label>
                                <input
                                  name="firstInterestFrom"
                                  type="number"
                                  placeholder="1"
                                  value={loanCalc.firstInterestFrom || ""}
                                  onChange={handleLoanCalcChange}
                                  className="block w-full rounded border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                  வரை (To)
                                </label>
                                <input
                                  name="firstInterestTo"
                                  type="number"
                                  placeholder="90"
                                  value={loanCalc.firstInterestTo || ""}
                                  onChange={handleLoanCalcChange}
                                  className="block w-full rounded border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          {/* ---------------- இரண்டாவது வட்டி ---------------- */}
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="text-xs font-bold text-indigo-700 uppercase">
                                இரண்டாவது வட்டி (INT: 2)
                              </h5>
                              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-md">
                                மதிப்பீடு: ₹
                                {interest2Months > 0
                                  ? interest2Months.toFixed(2)
                                  : "0.00"}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                  வட்டி வீதம்
                                </label>
                                <div className="relative">
                                  <input
                                    name="secondinterest"
                                    type="number"
                                    placeholder="0"
                                    value={loanCalc.secondinterest || ""}
                                    onChange={handleLoanCalcChange}
                                    className="block w-full rounded border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    required
                                  />
                                  <span className="absolute right-2 top-1.5 text-slate-400 text-xs font-bold">
                                    %
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                  முதல் (From)
                                </label>
                                <input
                                  name="secondInterestFrom"
                                  type="number"
                                  placeholder="91"
                                  value={loanCalc.secondInterestFrom || ""}
                                  onChange={handleLoanCalcChange}
                                  className="block w-full rounded border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                  வரை (To)
                                </label>
                                <input
                                  name="secondInterestTo"
                                  type="number"
                                  placeholder="180"
                                  value={loanCalc.secondInterestTo || ""}
                                  onChange={handleLoanCalcChange}
                                  className="block w-full rounded border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          {/* ---------------- மூன்றாவது வட்டி ---------------- */}
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                              <h5 className="text-xs font-bold text-indigo-700 uppercase">
                                மூன்றாவது வட்டி (INT: 3)
                              </h5>
                              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-md">
                                மதிப்பீடு: ₹
                                {interest3Months > 0
                                  ? interest3Months.toFixed(2)
                                  : "0.00"}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                  வட்டி வீதம்
                                </label>
                                <div className="relative">
                                  <input
                                    name="thirdinterest"
                                    type="number"
                                    placeholder="0"
                                    value={loanCalc.thirdinterest || ""}
                                    onChange={handleLoanCalcChange}
                                    className="block w-full rounded border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    required
                                  />
                                  <span className="absolute right-2 top-1.5 text-slate-400 text-xs font-bold">
                                    %
                                  </span>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                  முதல் (From)
                                </label>
                                <input
                                  name="thirdInterestFrom"
                                  type="number"
                                  placeholder="181"
                                  value={loanCalc.thirdInterestFrom || ""}
                                  onChange={handleLoanCalcChange}
                                  className="block w-full rounded border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                  வரை (To)
                                </label>
                                <input
                                  name="thirdInterestTo"
                                  type="number"
                                  placeholder="270"
                                  value={loanCalc.thirdInterestTo || ""}
                                  onChange={handleLoanCalcChange}
                                  className="block w-full rounded border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* 🛑 Footer Actions (Fixed at bottom) */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-4 shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setLoanModal(false);
                      setLoanCalc({});
                    }}
                    className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition-colors shadow-sm w-32">
                    ரத்து (Cancel)
                  </button>
                  <button
                    type="submit"
                    form="loan-form" // This links the button to the form above!
                    className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm transition-all active:scale-95 w-48">
                    உறுதி செய் (Submit)
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {ReceiptModal && selectedLoan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-300 print:p-0 print:bg-white print:block">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-none relative flex flex-col max-h-[95vh] print:max-h-none print:block overflow-hidden">
              <div
                id="printable-receipt"
                className="p-8 print:p-0 relative bg-white overflow-y-auto flex-1 print:overflow-visible print:block custom-scrollbar">
                <div className="hidden print:flex absolute inset-0 items-center justify-center opacity-[0.03] pointer-events-none z-0">
                  <span className="text-3xl font-black uppercase tracking-widest transform -rotate-45">
                    {currentUser.username} {currentUser.shoptype}
                  </span>
                </div>

                <div className="relative z-10">
                  <div className="text-center mb-6 border-b-2 border-dashed border-slate-300 pb-6 print:border-black">
                    <div className="inline-flex items-center justify-center bg-amber-100 text-amber-600 w-12 h-12 rounded-full mb-3 print:hidden shadow-sm">
                      <span className="text-2xl">🏦</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-widest print:text-black">
                      {currentUser.username} {currentUser.shoptype}
                    </h2>
                    <p className="text-slate-500 font-bold mt-1 text-xs tracking-widest uppercase print:text-black">
                      பில் ரசீது (Official Receipt)
                    </p>
                    <p className="text-slate-600 font-medium mt-3 text-sm print:text-black">
                      Nagercoil, Kanyakumari (District) <br /> Phone: +91 98765
                      43210
                    </p>
                  </div>

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
                          // 1. Get all payments for this specific loan
                          const relatedPayments = paidLoan.filter(
                            (pl) =>
                              pl.loan?._id === selectedLoan._id ||
                              pl.loan === selectedLoan._id,
                          );

                          // 2. If no payments yet, show a simple message
                          if (relatedPayments.length === 0) {
                            return (
                              <div className="text-sm font-semibold text-indigo-400 print:text-slate-500 py-2">
                                பணம் எதுவும் செலுத்தப்படவில்லை (No payments yet)
                              </div>
                            );
                          }

                          // 3. Calculate total paid
                          const totalPaid = relatedPayments.reduce(
                            (sum, pl) => sum + (pl.amountPaid || 0),
                            0,
                          );

                          // 4. Display the list of payments with Dates
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
                                    ₹{selectedLoan.currentBalance?.toFixed(2)}
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
