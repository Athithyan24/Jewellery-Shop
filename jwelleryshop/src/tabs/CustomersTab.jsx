import { useState, useEffect } from "react";
import axios from "axios";
import { Search, Handshake, Users } from "lucide-react";
import { getDatabase } from "../db";
export default function CustomersTab() {
  const [offlineCustomers, setOfflineCustomers] = useState([]);
  const [CustomerModal, setCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [LoanModal, setLoanModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loans, setLoans] = useState([]);
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

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

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
      name: formValues.get("name") || "பெயர் இல்லை",
      customerIdy: "PENDING",
      dob: formValues.get("dob") || "",
      address: formValues.get("address") || "",
      aadhar: formValues.get("aadhar") || "",
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

  const filteredCustomers = customers.filter((customer) => {
    if (!customerSearchQuery) return true;

    const searchLower = customerSearchQuery.toLowerCase();

    return (
      (customer.customerIdy &&
        customer.customerIdy.toLowerCase().includes(searchLower)) ||
      (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchLower))
    );
  });

  const netWeight =
    (parseFloat(loanCalc.weight) || 0) -
    (parseFloat(loanCalc.stoneweight) || 0);
  const estimatedAmount =
    (netWeight *
      (parseFloat(loanCalc.goldrate) || 0) *
      (parseFloat(loanCalc.pawnpercentage) || 0)) /
    100;

  const interest1Month =
    (estimatedAmount * (parseFloat(loanCalc.firstinterest) || 0)) / 100;
  const interest2Months =
    (estimatedAmount * (parseFloat(loanCalc.secondinterest) || 0)) / 100;
  const interest3Months =
    (estimatedAmount * (parseFloat(loanCalc.thirdinterest) || 0)) / 100;

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

  const handleLoanCalcChange = (e) => {
    const { name, value } = e.target;
    const updatedCalc = { ...loanCalc, [name]: value };

    // 1. Calculate the actual Loan Principal (The 40,000 in your example)
    const netWt =
      (parseFloat(updatedCalc.weight) || 0) -
      (parseFloat(updatedCalc.stoneweight) || 0);
    const goldRt = parseFloat(updatedCalc.goldrate) || 0;
    const pawnPct = parseFloat(updatedCalc.pawnpercentage) || 0;
    const principal = (netWt * goldRt * pawnPct) / 100;

    // 2. Helper to calculate "Monthly Slab" Interest
    const calculateTierTotal = (ratePercent, fromDay, toDay) => {
      const rate = parseFloat(ratePercent) || 0;
      const days = (parseInt(toDay) || 0) - (parseInt(fromDay) || 0) + 1;

      if (principal <= 0 || days <= 0) return 0;

      // Convert days to months (rounding up: e.g., 1-30 days = 1 month, 31-60 = 2 months)
      const months = Math.ceil(days / 30);

      // Formula: Principal * (Rate/100) * Number of Months
      return principal * (rate / 100) * months;
    };

    // 3. Update the state with new totals
    updatedCalc.firstTierTotal = calculateTierTotal(
      updatedCalc.firstinterest,
      updatedCalc.firstInterestFrom,
      updatedCalc.firstInterestTo,
    );
    updatedCalc.secondTierTotal = calculateTierTotal(
      updatedCalc.secondinterest,
      updatedCalc.secondInterestFrom,
      updatedCalc.secondInterestTo,
    );
    updatedCalc.thirdTierTotal = calculateTierTotal(
      updatedCalc.thirdinterest,
      updatedCalc.thirdInterestFrom,
      updatedCalc.thirdInterestTo,
    );

    setLoanCalc(updatedCalc);
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

        const response = await axios.post(
          "http://localhost:5000/api/customers",
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );

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

  useEffect(() => {
    fetchOfflineCustomers();
    fetchCustomers();
    fetchProducts();
    fetchLoans();
  }, []);
  return (
    <>
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
              தரவை ஒத்திசை ({offlineCustomers.filter((c) => !c.isSynced).length}{" "}
              Unsynced)
            </button>
          </div>
        )}

        <div className="p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden">
            <div className="px-6 py-6 bg-white flex flex-col xl:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <div className="flex">
                  <Users className="mr-2 text-red-500" />
                  <h2 className="lg:text-lg md:text-sm font-bold text-blue-800 tracking-wide">
                    வாடிக்கையாளர்கள் (Customers)
                  </h2>
                </div>
                <button
                  onClick={() => setCustomerModal(true)}
                  className="bg-indigo-600 hover:scale-105 cursor-pointer transition-all duration-200 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-95 shrink-0">
                  + புதிய வாடிக்கையாளர்
                </button>
              </div>

              <div className="relative w-full xl:w-96 group">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-300"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by ID, Name, or Phone..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all shadow-inner"
                />
              </div>

              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                Total:{" "}
                {(customers?.length || 0) +
                  offlineCustomers.filter((c) => !c.isSynced).length}
              </span>
            </div>

            <div className="overflow-x-auto h-150 custom-scrollbar">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-800 sticky top-0 z-10 shadow-md">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">
                      புகைப்படம்
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">
                      அடையாள எண்
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">
                      ஆதார் புகைப்படம்
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">
                      பெயர் (Name)
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">
                      மொபைல் (Phone)
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">
                      ஆதார் எண்
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">
                      முகவரி (Address)
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">
                      செயல்
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {offlineCustomers &&
                    offlineCustomers
                      .filter((c) => !c.isSynced)
                      .map((customer) => (
                        <tr
                          key={customer.id}
                          className="bg-rose-50/40 hover:bg-rose-50 transition-colors border-l-4 border-l-rose-400 group">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <img
                              src={
                                customer.recentimage ||
                                `https://ui-avatars.com/api/?name=${customer.name}&background=F1F5F9&color=64748B`
                              }
                              alt={customer.name}
                              className="w-25 h-30 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-white text-blue-600 border border-blue-200 shadow-sm">
                              {customer.customerIdy}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <img
                              src={
                                customer.aadharimage ||
                                `https://ui-avatars.com/api/?name=${customer.name}&background=F1F5F9&color=64748B`
                              }
                              alt="Aadhaar"
                              className="h-25 w-50 rounded-lg object-cover border-2 border-rose-200 shadow-sm opacity-80"
                            />
                          </td>
                          <td className="px-4 py-3 font-black text-slate-800 uppercase">
                            {customer.name}
                            <span className="ml-2 block mt-1 w-max text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold tracking-widest uppercase shadow-sm border border-rose-200">
                              Not Synced
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-600">
                            {customer.phone}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-500">
                            {customer.aadhar}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-sm font-medium min-w-[150px]">
                            {customer.address}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-[10px] font-bold text-rose-500 bg-white px-3 py-1.5 rounded-lg border border-rose-100 shadow-sm">
                              Sync to enable Loan
                            </span>
                          </td>
                        </tr>
                      ))}

                  {filteredCustomers.length > 0
                    ? filteredCustomers.map((customer) => (
                        <tr
                          key={customer._id}
                          className="hover:bg-indigo-50/30 transition-colors duration-200 group">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <img
                              src={`http://localhost:5000/uploads/${customer.recentimage}`}
                              alt={customer.name}
                              className="w-25 h-30 rounded-xl object-cover border-2 border-slate-200 shadow-sm"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${customer.name}&background=F1F5F9&color=64748B`;
                              }}
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-700 group-hover:bg-white transition-all">
                              {customer.customerIdy}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <img
                              src={`http://localhost:5000/uploads/${customer.aadharimage}`}
                              alt="Aadhaar"
                              className="h-25 w-50 rounded-lg object-cover border-2 border-slate-200 shadow-sm opacity-90 group-hover:border-indigo-300 transition-all"
                            />
                          </td>
                          <td className="px-4 py-3 font-black text-slate-800 uppercase tracking-wide">
                            {customer.name}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-600">
                            {customer.phone}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-500">
                            {customer.aadhar}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-sm font-medium min-w-[150px]">
                            {customer.address}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setLoanModal(true);
                                fetchProducts();
                              }}
                              className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border border-emerald-200 hover:border-emerald-600 shadow-sm hover:shadow-emerald-600/30 hover:-translate-y-0.5 active:scale-95 cursor-pointer">
                              <Handshake size={16} className="mr-1 " />
                            </button>
                          </td>
                        </tr>
                      ))
                    : offlineCustomers.filter((c) => !c.isSynced).length ===
                        0 && (
                        <tr>
                          <td colSpan="8" className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <Search size={56} className="mb-4 opacity-20" />
                              <p className="text-xl font-black text-slate-500 tracking-tight">
                                எந்த வாடிக்கையாளரும் இல்லை!
                              </p>
                              <p className="text-sm font-semibold mt-2 opacity-70">
                                (No customers found matching your search)
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

      {CustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-2xl">👤</span> புதிய வாடிக்கையாளர் (Add
                Customer)
              </h2>
              <button
                onClick={() => setCustomerModal(false)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
              <form onSubmit={saveCustomerOffline} className="space-y-5">
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
                    இணையம் இல்லாவிட்டாலும் (Offline) வாடிக்கையாளரை சேமிக்கலாம்.
                    இணையம் வந்ததும் Sync செய்துகொள்ளவும்.
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
      {LoanModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[95vh]">
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

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">
              <form
                id="loan-form"
                onSubmit={handleLoanSubmit}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-5">
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

                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
                      வட்டி அமைப்புகள் (Interest Settings)
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">
                        Est. Loan: ₹
                        {estimatedAmount > 0
                          ? estimatedAmount.toFixed(2)
                          : "0.00"}
                      </span>
                    </h4>

                    <div className="space-y-4">
                      {/* TIER 1 */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-xs font-black text-indigo-700 uppercase tracking-wider">
                            முதல் வட்டி (Tier 1)
                          </h5>

                          <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-3 py-1 rounded-lg border border-indigo-200 shadow-sm font-mono flex flex-col items-end">
                            <span className="text-[12px] opacity-70">
                              ₹
                              {(
                                (((parseFloat(loanCalc.weight) -
                                  parseFloat(loanCalc.stoneweight)) *
                                  loanCalc.goldrate *
                                  loanCalc.pawnpercentage) /
                                  100) *
                                (loanCalc.firstinterest / 100)
                              ).toFixed(2)}{" "}
                              /mo
                            </span>

                            <span className="text-sm">
                              Total: ₹
                              {loanCalc.firstTierTotal
                                ? loanCalc.firstTierTotal.toFixed(2)
                                : "0.00"}
                            </span>

                            <span className="text-[12px] opacity-50 italic">
                              (
                              {Math.ceil(
                                (parseInt(loanCalc.firstInterestTo) -
                                  parseInt(loanCalc.firstInterestFrom) +
                                  1) /
                                  30,
                              )}{" "}
                              Months)
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                              வட்டி வீதம் (%)
                            </label>
                            <div className="relative">
                              <input
                                name="firstinterest"
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={loanCalc.firstinterest || ""}
                                onChange={handleLoanCalcChange}
                                className="block w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition-all"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                              முதல் (From Day)
                            </label>
                            <input
                              name="firstInterestFrom"
                              type="number"
                              placeholder="1"
                              value={loanCalc.firstInterestFrom || ""}
                              onChange={handleLoanCalcChange}
                              className="block w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                              வரை (To Day)
                            </label>
                            <input
                              name="firstInterestTo"
                              type="number"
                              placeholder="90"
                              value={loanCalc.firstInterestTo || ""}
                              onChange={handleLoanCalcChange}
                              className="block w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition-all"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* TIER 2 */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 hover:border-amber-200 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-xs font-black text-amber-700 uppercase tracking-wider">
                            2வது வட்டி (Tier 2)
                          </h5>
                          <span className="bg-amber-100 text-amber-700 text-xs font-black px-3 py-1 rounded-lg border border-orange-200 shadow-sm font-mono flex flex-col items-end">
                            <span className="text-[12px] opacity-70">
                              ₹
                              {(
                                (((parseFloat(loanCalc.weight) -
                                  parseFloat(loanCalc.stoneweight)) *
                                  loanCalc.goldrate *
                                  loanCalc.pawnpercentage) /
                                  100) *
                                (loanCalc.secondinterest / 100)
                              ).toFixed(2)}{" "}
                              /mo
                            </span>

                            <span className="text-sm">
                              Total: ₹
                              {loanCalc.secondTierTotal
                                ? loanCalc.secondTierTotal.toFixed(2)
                                : "0.00"}
                            </span>

                            <span className="text-[12px] opacity-50 italic">
                              (
                              {Math.ceil(
                                (parseInt(loanCalc.secondInterestTo) -
                                  parseInt(loanCalc.secondInterestFrom) +
                                  1) /
                                  30,
                              )}{" "}
                              Months)
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                              வட்டி வீதம் (%)
                            </label>
                            <div className="relative">
                              <input
                                name="secondinterest"
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={loanCalc.secondinterest || ""}
                                onChange={handleLoanCalcChange}
                                className="block w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-inner transition-all"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                              முதல் (From Day)
                            </label>
                            <input
                              name="secondInterestFrom"
                              type="number"
                              placeholder="91"
                              value={loanCalc.secondInterestFrom || ""}
                              onChange={handleLoanCalcChange}
                              className="block w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-inner transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                              வரை (To Day)
                            </label>
                            <input
                              name="secondInterestTo"
                              type="number"
                              placeholder="180"
                              value={loanCalc.secondInterestTo || ""}
                              onChange={handleLoanCalcChange}
                              className="block w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-inner transition-all"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* TIER 3 */}
                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 hover:border-rose-200 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="text-xs font-black text-rose-700 uppercase tracking-wider">
                            3வது வட்டி (Tier 3)
                          </h5>
                          <span className="bg-rose-100 text-rose-700 text-xs font-black px-3 py-1 rounded-lg border border-rose-200 shadow-sm font-mono flex flex-col items-end">
                            <span className="text-[12px] opacity-70">
                              ₹
                              {(
                                (((parseFloat(loanCalc.weight) -
                                  parseFloat(loanCalc.stoneweight)) *
                                  loanCalc.goldrate *
                                  loanCalc.pawnpercentage) /
                                  100) *
                                (loanCalc.thirdinterest / 100)
                              ).toFixed(2)}{" "}
                              /mo
                            </span>

                            <span className="text-sm">
                              Total: ₹
                              {loanCalc.thirdTierTotal
                                ? loanCalc.thirdTierTotal.toFixed(2)
                                : "0.00"}
                            </span>

                            <span className="text-[12px] opacity-50 italic font-bold">
                              (
                              {Math.ceil(
                                (parseInt(loanCalc.thirdInterestTo) -
                                  parseInt(loanCalc.thirdInterestFrom) +
                                  1) /
                                  30,
                              )}{" "}
                              Months)
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                              வட்டி வீதம் (%)
                            </label>
                            <div className="relative">
                              <input
                                name="thirdinterest"
                                type="number"
                                step="0.01"
                                placeholder="0"
                                value={loanCalc.thirdinterest || ""}
                                onChange={handleLoanCalcChange}
                                className="block w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-inner transition-all"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                              முதல் (From Day)
                            </label>
                            <input
                              name="thirdInterestFrom"
                              type="number"
                              placeholder="181"
                              value={loanCalc.thirdInterestFrom || ""}
                              onChange={handleLoanCalcChange}
                              className="block w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-inner transition-all"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                              வரை (To Day)
                            </label>
                            <input
                              name="thirdInterestTo"
                              type="number"
                              placeholder="270"
                              value={loanCalc.thirdInterestTo || ""}
                              onChange={handleLoanCalcChange}
                              className="block w-full rounded-lg border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-inner transition-all"
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
                form="loan-form"
                className="px-8 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm transition-all active:scale-95 w-48">
                உறுதி செய் (Submit)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
