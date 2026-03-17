import { useState, useEffect } from "react";
import axios from "axios";
import ver from "./assets/approved.png";
import upi from "./assets/upi.png";
const TABS = [
  {
    id: "பரிவர்த்தனைகளின்",
    label: "பரிவர்த்தனைகள்",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 text-black mr-1",
    endpoint: "/api/பரிவர்த்தனைகளின்",
  },
  {
    id: "வாடிக்கையாளர்களின்",
    label: "வாடிக்கையாளர்கள்",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 mx-1 text-black",
    endpoint: "/api/வாடிக்கையாளர்களின்",
  },
  {
    id: "கடன்களின்",
    label: "கடன்கள்",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 mx-1 text-black",
    endpoint: "/api/கடன்களின்",
  },
  {
    id: "லாக்கர்",
    label: "பெட்டகங்கள்",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 mx-1 text-black",
    endpoint: "/api/லாக்கர்",
  },
  {
    id: "விகித",
    label: "விகிதங்கள்",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 mx-1 text-black",
    endpoint: "/api/சுய",
  },
  {
    id: "சுய",
    label: "சுயவிவரம்",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 mx-1 text-black",
    endpoint: "/api/சுய",
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [tabData, setTabData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [CustomerModal, setCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [LoanModal, setLoanModal] = useState(false);
  const [PayLoanModal, setPayLoanModal] = useState(false);
  const [SelectedTypeModal, setSelectedTypeModal] = useState(false);

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
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      <div
        className={`max-w-9xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden ${ReceiptModal ? "print:hidden" : ""}`}>
        <div className="flex flex-wrap w-full">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 p-5 gap-5 hover:shadow-black  font-bold transition-all duration-250 ${tab.colorClass} ${
                activeTab === tab.id
                  ? "opacity-100 scale-105 shadow-md z-10"
                  : "opacity-80 hover:scale-105 hover:opacity-100"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8 min-h-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 capitalize">
            {activeTab} விவரங்கள்
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="text-gray-600 text-lg">
              <p className="mb-4">{tabData}</p>

              {activeTab === "பரிவர்த்தனைகளின்" && (
                <div className="p-6 overflow-x-auto">
                  <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-blue-600 p-4">
                      <h2 className="text-white font-bold text-lg tracking-wide">
                        தினசரி பரிவர்த்தனைகள் (Daily Ledger)
                      </h2>
                    </div>
                    <table className="min-w-full bg-white text-left">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="py-3 px-6 text-sm font-semibold text-gray-700">
                            தேதி (Date)
                          </th>
                          <th className="py-3 px-6 text-sm font-semibold text-gray-700">
                            வழங்கிய கடன் (Cash Out)
                          </th>
                          <th className="py-3 px-6 text-sm font-semibold text-gray-700">
                            வரவு / வட்டி (Cash In)
                          </th>
                          <th className="py-3 px-6 text-sm font-semibold text-gray-700">
                            நிகர இருப்பு (Net Balance)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {dailyStats.length > 0 ? (
                          dailyStats.map((stat) => {
                            const netBalance = stat.income - stat.loanGiven;

                            return (
                              <tr
                                key={stat.date}
                                className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 text-sm font-bold text-gray-800">
                                  {new Date(stat.date).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </td>

                                <td className="py-4 px-6 text-sm font-bold text-red-600">
                                  {stat.loanGiven > 0
                                    ? `- ₹${stat.loanGiven.toFixed(2)}`
                                    : "-"}
                                </td>

                                <td className="py-4 px-6 text-sm font-bold text-green-600">
                                  {stat.income > 0
                                    ? `+ ₹${stat.income.toFixed(2)}`
                                    : "-"}
                                </td>

                                <td className="py-4 px-6 text-sm font-black">
                                  <span
                                    className={`px-3 py-1 rounded-full ${
                                      netBalance > 0
                                        ? "bg-green-100 text-green-800"
                                        : netBalance < 0
                                          ? "bg-red-100 text-red-800"
                                          : "bg-gray-100 text-gray-800"
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
                              className="py-8 text-center text-gray-500 font-medium">
                              எந்த பரிவர்த்தனைகளும் இல்லை (No transactions
                              found).
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "வாடிக்கையாளர்களின்" && !CustomerModal && (
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          புகைப்படம்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          பெயர்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          தொலைபேசி எண்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          ஆதார் எண்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          முகவரி
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          விருப்பங்கள்
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length > 0 ? (
                        customers.map((customer) => (
                          <tr
                            key={customer._id}
                            className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <img
                                src={`http://localhost:5000/uploads/${customer.recentimage}`}
                                width="50"
                              />
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-800">
                              {customer.name}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-800">
                              {customer.phone}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-800">
                              {customer.aadhar}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-800">
                              {customer.address}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-800">
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setLoanModal(true);
                                  fetchProducts();
                                }}
                                className="bg-green-500 cursor-pointer text-white px-3 py-1 rounded-md font-semibold hover:bg-green-700 transition">
                                கடன் வாங்கு
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="py-4 text-center text-gray-500">
                            No customers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "வாடிக்கையாளர்களின்" && role === "worker" && (
                <>
                  <button
                    onClick={() => setCustomerModal(true)}
                    className="mt-4 cursor-pointer bg-green-100 text-green-700 px-4 py-2 rounded-md font-semibold hover:bg-green-200 transition">
                    + புதிய வாடிக்கையாளர்கள்
                  </button>
                </>
              )}

              {activeTab === "கடன்களின்" && (
                <div className="p-6 overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-blue-600 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          தேதி
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          வாடிக்கையாளர்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          அடகு பொருள்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          தங்கம் விலை
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          அடகு%
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          கடன் தொகை
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          நடவடிக்கை எடு
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          பெட்டக நிலை
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          வட்டி (Interest)
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          மொத்தம் (Total)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.length > 0 ? (
                        loans.map((loan) => (
                          <tr
                            key={loan._id}
                            className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-800">
                              {new Date(loan.createdAt).toLocaleDateString()}
                            </td>

                            <td className="py-3 px-4 text-sm font-bold text-gray-800">
                              {loan.customer?.name || "Unknown"}
                            </td>

                            <td className="py-3 px-4 text-sm text-gray-800">
                              <span className="text-blue-600 font-semibold">
                                {loan.product.name}
                              </span>{" "}
                              /{" "}
                              <span className="text-blue-600 font-semibold">
                                {loan.weight}g
                              </span>{" "}
                              /{" "}
                              <span className="text-red-500">
                                {loan.stoneweight}g
                              </span>
                            </td>

                            <td className="py-3 px-4 text-sm text-gray-800">
                              ₹{loan.goldrate}
                            </td>

                            <td className="py-3 px-4 text-sm text-gray-800">
                              {loan.pawnpercentage}%
                            </td>

                            <td className="py-3 px-4 text-sm font-bold text-green-600">
                              ₹{loan.loanamount?.toFixed(2)}
                            </td>
                            <td className="p-3 px-4 text-sm">
                              {loan.isClosed ? (
                                <div className="flex justify-center items-center">
                                  <span className="inline-block border-4 border-green-500 text-green-600 font-black text-lg uppercase tracking-widest py-1 px-0 rounded-md transform -rotate-10 opacity-80 shadow-sm pointer-events-none">
                                    கடன் செலுத்தப்பட்டது (PAID)
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedLoan(loan);
                                    setPayLoanModal(true);
                                  }}
                                  className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded">
                                  கடனை செலுத்துங்கள்
                                </button>
                              )}
                              <div className="flex">
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedLoan(loan);
                                      setReceiptModal(true);
                                    }}
                                    className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded">
                                    ரசீதை பெறவும்
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td>
                              {!loan.isBanked ? (
                                <div
                                  onClick={() => {
                                    setSelectedLoanForBank(loan);
                                    setIsBankModalOpen(true);
                                  }}
                                  className="content-center mx-10 cursor-pointer bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full w-6 h-6 flex justify-center items-center text-lg pb-1 transition-colors shadow-sm"
                                  title="Add to Owner's Bank">
                                  <img
                                    src={upi}
                                    className="w-10 hover:scale-110 transition duration-150"
                                  />
                                </div>
                              ) : (
                                <div className="content-center mx-10 cursor-pointer">
                                  <img className="w-10" src={ver} />{" "}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-red-600">
                              ₹
                              {calculateDynamicInterest(
                                loan.loanamount,
                                loan.createdAt,
                              )}
                            </td>

                            <td className="py-3 px-4 text-sm font-bold text-green-700 bg-green-50">
                              ₹
                              {loan.loanamount +
                                calculateDynamicInterest(
                                  loan.loanamount,
                                  loan.createdAt,
                                )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-4 text-center text-gray-500">
                            No loans found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "சுய" && role === "worker" && (
                <div className="p-6 overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-blue-600  border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          தேதி
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          பணம் செலுத்திய தேதி
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          பெயர்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          வாடிக்கையாளர் படம்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          அடகு பொருள்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          கடன் தொகை
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          செலுத்தப்பட்ட கடன் தொகைகள்
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidLoan.length > 0 ? (
                        paidLoan.map((pl) => (
                          <tr
                            key={pl._id}
                            className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-800">
                              {pl.loan?.createdAt
                                ? new Date(
                                    pl.loan.createdAt,
                                  ).toLocaleDateString()
                                : "-"}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-800">
                              {new Date(pl.paymentDate).toLocaleDateString()}
                            </td>

                            <td className="py-3 px-4 text-sm font-bold text-gray-800">
                              {pl.customer?.name || "Unknown"}
                            </td>

                            <td className="py-3 px-4 text-sm text-gray-800">
                              {pl.customer?.recentimage && (
                                <img
                                  src={`http://localhost:5000/uploads/${pl.customer.recentimage}`}
                                  alt="Customer"
                                  className="w-10 h-10 rounded-full object-cover border border-gray-300"
                                />
                              )}
                            </td>
                            <td className="p-3 px-4 text-sm">
                              {pl.loan?.product.name}
                            </td>
                            <td className="px-4 text-sm p-3">
                              ₹{pl.loan?.loanamount?.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm font-bold text-green-600">
                              ₹{pl.amountPaid?.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-4 text-center text-gray-500">
                            No paid loans found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "லாக்கர்" && role === "worker" && (
                <div className="p-6 overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-blue-600 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          பெயர்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          புகைப்படம்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          அடகு பொருள்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          வங்கி பெயர்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          கிளை பெயர்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          பெட்டக எண்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          கடன் தொகை
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lockerItems.length > 0 ? (
                        lockerItems.map((items) => (
                          <tr
                            key={items._id}
                            className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-800">
                              {items.customer?.name || "Unknown Customer"}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-800">
                              <div className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                                {items.customer?.recentimage ? (
                                  <img
                                    src={`http://localhost:5000/uploads/${items.customer.recentimage}`}
                                    alt={items.customer?.name}
                                    className="w-full h-full object-cover justify-center"
                                  />
                                ) : (
                                  <span className="text-xl">👤</span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-sm font-bold text-gray-800">
                              {items.loan?.product?.name ||
                                items.loan?.product ||
                                "N/A"}
                            </td>
                            <td className="p-3 px-4 text-sm">
                              {items.bank?.name || "N/A"}
                            </td>
                            <td className="px-4 text-sm p-3">
                              {items.branchname}
                            </td>
                            <td className="px-4 text-sm p-3">
                              {items.lockerno}
                            </td>
                            <td className="px-4 text-sm p-3">
                              ₹{items.loan?.loanamount || 0}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-4 text-center text-gray-500">
                            தற்போது வங்கியில் எந்த பொருட்களும் இல்லை. (No items
                            currently in the bank locker.)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "விகித" && role === "worker" && (
                <div className="p-6 overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-blue-600 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          தேதி
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          பெயர்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          புகைப்படம்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          அடகு பொருள்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          முதல் 3 மாதங்கள்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          4 முதல் 6 மாதங்கள்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          7 முதல் 9 மாதங்கள்
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          தற்போதைய மாத நிலை
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.length > 0 ? (
                        loans.map((items) => (
                          <tr
                            key={items._id}
                            className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-800">
                              {new Date(items.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-800">
                              {items.customer?.name || "Unknown Customer"}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-800">
                              <div className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                                {items.customer?.recentimage ? (
                                  <img
                                    src={`http://localhost:5000/uploads/${items.customer.recentimage}`}
                                    alt={items.customer?.name}
                                    className="w-full h-full object-cover justify-center"
                                  />
                                ) : (
                                  <span className="text-xl">👤</span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-sm font-bold text-gray-800">
                              {items.product?.name ||
                                items.loan?.product ||
                                "N/A"}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-orange-600">
                              <div>₹{items.interestBreakdown?.tier1 || 0}</div>
                              <div className="text-xs text-gray-500 font-normal mt-1 whitespace-nowrap">
                                {items.dateRanges?.tier1}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-sm font-medium text-red-700">
                              <div>₹{items.interestBreakdown?.tier2 || 0}</div>
                              <div className="text-xs text-gray-500 font-normal mt-1 whitespace-nowrap">
                                {items.dateRanges?.tier2}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-sm font-medium text-red-700">
                              <div>₹{items.interestBreakdown?.tier3 || 0}</div>
                              <div className="text-xs text-gray-500 font-normal mt-1 whitespace-nowrap">
                                {items.dateRanges?.tier3}
                              </div>
                            </td>

                            <td className="px-4 text-sm p-3">
                              ₹{items.interestBreakdown?.total || 0}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-4 text-center text-gray-500">
                            தற்போது வங்கியில் எந்த பொருட்களும் இல்லை. (No items
                            currently in the bank locker.)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {CustomerModal &&
                activeTab === "வாடிக்கையாளர்களின்" &&
                role === "worker" && (
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Loan Application</h3>

                <p className="mb-3 text-gray-700">
                  Customer: <b>{selectedCustomer?.name}</b>
                </p>

                <form onSubmit={handleLoanSubmit}>
                  <select
                    name="productId"
                    className="border border-gray-300 p-2 rounded w-full mb-3"
                    required>
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      name="weight"
                      type="number"
                      step="0.01"
                      placeholder="Gross Wt (g)"
                      onChange={handleLoanCalcChange}
                      className="border border-gray-300 p-2 rounded w-full"
                      required
                    />
                    <input
                      name="stoneweight"
                      type="number"
                      step="0.01"
                      placeholder="Stone Wt (g)"
                      onChange={handleLoanCalcChange}
                      className="border border-gray-300 p-2 rounded w-full"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      name="goldrate"
                      type="number"
                      placeholder="Gold Rate/g"
                      onChange={handleLoanCalcChange}
                      className="border border-gray-300 p-2 rounded w-full"
                      required
                    />
                    <input
                      name="pawnpercentage"
                      type="number"
                      placeholder="Pawn %"
                      onChange={handleLoanCalcChange}
                      className="border border-gray-300 p-2 rounded w-full"
                      required
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 text-center">
                    <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
                      Estimated Loan Amount
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      ₹
                      {estimatedAmount > 0
                        ? estimatedAmount.toFixed(2)
                        : "0.00"}
                    </p>
                  </div>

                  <div className="flex gap-3 mt-2">
                    <button
                      type="submit"
                      className="bg-green-600 cursor-pointer text-white px-6 py-2 rounded flex-1 font-semibold hover:bg-green-700 transition">
                      Submit Loan
                    </button>
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
                      className="bg-gray-400 cursor-pointer text-white px-6 py-2 rounded flex-1 font-semibold hover:bg-gray-500 transition">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
      {ReceiptModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 print:bg-white print:fixed print:inset-0">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg print:shadow-none print:w-full print:max-w-none print:p-0">
            <div
              id="printable-receipt"
              className="border-2 border-gray-800 p-6 rounded-xl print:border-none print:p-0">
              <div className="text-center mb-6 border-b-2 border-gray-300 pb-4 print:border-black">
                <h2 className="text-xl font-extrabold text-gray-900 uppercase tracking-wider">
                  இன்ஃபோசென்x ஐடி அடகுக் கடை பில் ரசீது
                </h2>
                <p className="text-gray-600 mt-1">
                  Nagercoil, Kanyakumari (District)
                </p>
                <p className="text-gray-600">Phone: +91 98765 43210</p>
              </div>

              <div className="flex justify-between mb-6 text-sm">
                <div>
                  <p className="text-gray-500">ரசீது எண்:</p>
                  <p className="font-bold text-gray-800">
                    #{selectedLoan._id.slice(-6).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">தேதி:</p>
                  <p className="font-bold text-gray-800">
                    {new Date(selectedLoan.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 print:bg-transparent print:border-black">
                  <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:border-black">
                    வாடிக்கையாளர் விவரங்கள்
                  </h4>
                  <p>
                    <span className="font-semibold w-20 inline-block">
                      பெயர்:
                    </span>{" "}
                    {selectedLoan.customer?.name}
                  </p>
                  <p>
                    <span className="font-semibold w-30 inline-block">
                      தொலைபேசி:
                    </span>{" "}
                    {selectedLoan.customer?.phone}
                  </p>
                  <p>
                    <span className="font-semibold w-24 inline-block">
                      முகவரி:
                    </span>{" "}
                    {selectedLoan.customer?.address}
                  </p>
                </div>
                <div className="align-self-start ml-6">
                  <img
                    src={`http://localhost:5000/uploads/${selectedLoan.customer?.recentimage}`}
                    alt="Customer"
                    className="w-30 h-30 rounded-full object-cover"
                  />
                </div>
              </div>

              <table className="w-full mb-6 text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="py-2 text-left">பொருள் விளக்கம்</th>
                    <th className="py-2 text-right">மொத்த Wt</th>
                    <th className="py-2 text-right">கல் எடை</th>
                    <th className="py-2 text-right">நிகர எடை</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 print:border-black">
                    <td className="py-3 font-semibold">
                      {selectedLoan.product?.name || "Gold Item"}
                    </td>
                    <td className="py-3 text-right">{selectedLoan.weight}g</td>
                    <td className="py-3 text-right">
                      {selectedLoan.stoneweight}g
                    </td>
                    <td className="py-3 text-right">
                      {(selectedLoan.weight - selectedLoan.stoneweight).toFixed(
                        2,
                      )}
                      g
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-between mt-8">
                <div className="text-sm text-gray-600">
                  <p>தங்கம் விலை: ₹{selectedLoan.goldrate}/g</p>
                  <p>அடகு சதவீதம்: {selectedLoan.pawnpercentage}%</p>
                </div>
                <div className="flex-row">
                  <div className="text-right">
                    <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-1">
                      மொத்த கடன் தொகை
                    </p>
                    <p className="text-3xl font-black text-gray-900 border-b-4 border-double border-gray-900 inline-block px-4">
                      ₹{selectedLoan.loanamount?.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-1">
                      செலுத்தப்பட்ட மொத்த கடன் தொகை
                    </p>
                    {(() => {
                      const relatedPayments = paidLoan.filter(
                        (pl) => pl.loan?._id === selectedLoan._id,
                      );

                      if (relatedPayments.length === 0) {
                        return (
                          <p className="text-xl font-black text-gray-900 border-b-4 border-double border-gray-900 inline-block px-4">
                            ₹0.00
                          </p>
                        );
                      }

                      const totalPaid = relatedPayments.reduce(
                        (sum, pl) => sum + (pl.amountPaid || 0),
                        0,
                      );

                      return (
                        <p className="text-xl font-black text-gray-900 border-b-4 border-double border-gray-900 inline-block px-4">
                          ₹{totalPaid.toFixed(2)}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-between text-center text-sm font-semibold text-gray-500">
                <div className="border-t border-gray-400 w-32 pt-2 print:border-black">
                  வாடிக்கையாளர் கையொப்பம்
                </div>
                <div className="border-t border-gray-400 w-32 pt-2 print:border-black">
                  உரிமையாளரின் கையொப்பம்
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 cursor-pointer flex-1 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2">
                🖨️ ரசீதை அச்சிடுங்கள்
              </button>
              <button
                onClick={() => {
                  setReceiptModal(false);
                  setSelectedLoan(null);
                }}
                className="bg-gray-200 cursor-pointer flex-1 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition">
                மூடு
              </button>
            </div>
          </div>
        </div>
      )}

      {PayLoanModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 print:bg-white print:fixed print:inset-0">
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg print:shadow-none print:w-full print:max-w-none print:p-0">
            {/* Customer Info & Receipt Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-200 rounded-xl bg-gray-50 p-5 mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={`http://localhost:5000/uploads/${selectedLoan.customer?.recentimage}`}
                  alt="Customer"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Customer Name
                  </p>
                  <p className="font-bold text-gray-900 text-lg">
                    {selectedLoan.customer?.name}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-gray-200 pt-3 sm:pt-0">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Receipt No
                </p>
                <p className="font-bold text-gray-800 text-lg">
                  #{selectedLoan._id?.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Total Loan Amount */}
            <div className="flex flex-col items-end mb-8">
              <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-1">
                Total Loan Amount
              </p>
              <p className="text-4xl font-black text-gray-900 border-b-4 border-double border-gray-300 pb-1">
                ₹{selectedLoan.loanamount?.toFixed(2)}
              </p>
            </div>

            {/* Payment Form */}
            <form onSubmit={handlePayLoanSubmit} className="mt-2">
              <div className="space-y-4">
                <select
                  name="payType"
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer bg-white"
                  value={payType}
                  onChange={(e) => setPayType(e.target.value)}
                  required>
                  <option value="" disabled>
                    Select Pay Type
                  </option>
                  <option value="Full Pay">Full Pay (Auto-Calculate)</option>
                  <option value="Initial Pay">Initial Pay (Partial)</option>
                </select>

                {payType && (
                  <div className="space-y-4 transition-all duration-300">
                    <input
                      name="payAmount"
                      type="number"
                      step="0.01"
                      placeholder="Enter Pay Amount ₹"
                      value={payAmount}
                      onChange={(e) =>
                        setPayAmount(parseFloat(e.target.value) || 0)
                      }
                      readOnly={payType === "Full Pay"}
                      className={`border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none transition ${
                        payType === "Full Pay"
                          ? "bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500 font-bold"
                          : "bg-white border-gray-300"
                      }`}
                      required
                    />

                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                      <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-1">
                        {payType === "Full Pay"
                          ? "Total Remaining Balance"
                          : "Estimated Loan Pay Amount"}
                      </p>
                      <p className="text-3xl font-bold text-green-900">
                        ₹{payAmount > 0 ? Number(payAmount).toFixed(2) : "0.00"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setPayLoanModal(false)}
                  className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg flex-1 font-semibold hover:bg-gray-200 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!payType || payAmount <= 0}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg flex-1 font-semibold hover:bg-green-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
                  Pay Amount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isBankModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
              வங்கி விவரங்களைச் சேர்க்கவும் (Add Bank Details)
            </h2>

            <form onSubmit={handleBankSubmit} className="space-y-4">
              {/* Dropdown for Bank Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  வங்கி (Bank)
                </label>
                <select
                  name="bankId"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white">
                  <option value="">வங்கியைக் தேர்ந்தெடுக்கவும்...</option>
                  {bankList.map((bank) => (
                    <option key={bank._id} value={bank._id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  கிளை (Branch Name)
                </label>
                <input
                  required
                  name="branchname"
                  type="text"
                  placeholder="எ.கா: Main Branch"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  கணக்கு எண் (Account No)
                </label>
                <input
                  required
                  name="accountno"
                  type="text"
                  placeholder="எ.கா: 1234567890"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  லாக்கர் எண் (Locker number)
                </label>
                <input
                  required
                  name="lockerno"
                  type="text"
                  placeholder="எ.கா: 1"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 font-semibold">
                  ரத்து (Cancel)
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold">
                  சேமி (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
