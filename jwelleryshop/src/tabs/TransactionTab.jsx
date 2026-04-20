import { useState, useEffect } from "react";
import axios from "axios";
import {
  Store,
  Coffee,
  TrendingDown,
  HandCoins,
  Import,
  FileDown,
  Calendar,
  Plus,
} from "lucide-react";
import * as XLSX from "xlsx";


export default function TransactionTab() {
  const [isBackupMenuModalOpen, setIsBackupMenuModalOpen] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [dailyCashInput, setDailyCashInput] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [todayStartingCash, setTodayStartingCash] = useState(0);
  const [dailyStats, setDailyStats] = useState([]);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [shopProfile, setShopProfile] = useState({});
  const [selectedBackupFile, setSelectedBackupFile] = useState(null);
  const [importPassword, setImportPassword] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const filteredStats = dailyStats.filter((stat) => {
    if (!filterDate) return true;
    return stat.date === filterDate;
  });

  const todayStr = new Date().toLocaleDateString("en-CA");

  const todaysStat = dailyStats.find((stat) => stat.date === todayStr);

  const totalExpenses = todaysStat ? todaysStat.expenses : 0;

  const handleExportDailyExcel = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/reports/excel-export",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const backendData = res.data;
      if (!backendData || backendData.length === 0) {
        return alert("ஏற்றுமதி செய்ய எந்த தரவும் இல்லை! (No data to export!)");
      }

      const groupedData = backendData.reduce((acc, item) => {
        const dateKey = new Date(item.createdAt).toLocaleDateString("ta-IN");
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
      }, {});

      let finalExcelRows = [];

      Object.keys(groupedData).forEach((date) => {
        const dayTransactions = groupedData[date];

        finalExcelRows.push({
          "வ.எண் (S.No)": `📅 தேதி: ${date}`,
          "நேரம் (Time)": "=================",
          "பரிவர்த்தனை வகை (Type)": "===========================",
          "விவரம் (Description)":
            "===============================================",
          "தொகை (Amount)": "=======",
        });

        dayTransactions.forEach((item, index) => {
          const time = new Date(item.createdAt).toLocaleTimeString("ta-IN", {
            hour: "2-digit",
            minute: "2-digit",
          });

          finalExcelRows.push({
            "வ.எண் (S.No)": index + 1,
            "நேரம் (Time)": time,
            "பரிவர்த்தனை வகை (Type)": item.type,
            "விவரம் (Description)": item.description,
            "தொகை (Amount)": item.amount || 0,
          });
        });

        finalExcelRows.push({
          "வ.எண் (S.No)": "",
          "நேரம் (Time)": "",
          "பரிவர்த்தனை வகை (Type)": "",
          "விவரம் (Description)": "",
          "தொகை (Amount)": "",
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(finalExcelRows);

      const columnWidths = [
        { wch: 16 },
        { wch: 18 },
        { wch: 35 },
        { wch: 55 },
        { wch: 15 },
      ];
      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Ledger");

      const fileDate = new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");
      XLSX.writeFile(workbook, `PawnShop_Ledger_${fileDate}.xlsx`);
    } catch (error) {
      console.error("Excel generation failed:", error);
      alert("எக்செல் பதிவிறக்குவதில் பிழை! (Error downloading Excel)");
    }
  };

  const handleImportData = async () => {
    if (!importPassword)
      return alert("கடவுச்சொல்லை உள்ளிடவும்! (Enter password)");
    if (!selectedBackupFile)
      return alert("கோப்பை தேர்ந்தெடுக்கவும்! (Select a file)");

    try {
      const fileReader = new FileReader();
      fileReader.readAsText(selectedBackupFile, "UTF-8");

      fileReader.onload = async (e) => {
        const backupData = JSON.parse(e.target.result);

        const token = localStorage.getItem("token");
        await axios.post(
          "http://localhost:5000/api/backup/import",
          { password: importPassword, backupData: backupData },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        alert(
          "தரவு வெற்றிகரமாக மீட்டெடுக்கப்பட்டது! (Data Restored Successfully!)",
        );
        setImportModalOpen(false);
        setImportPassword("");
        setSelectedBackupFile(null);

        window.location.reload();
      };
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to restore data. Invalid file.",
      );
    }
  };

  const handleExportData = async () => {
    if (!exportPassword)
      return alert("கடவுச்சொல்லை உள்ளிடவும்! (Enter password)");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/backup/export",
        { password: exportPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(res.data));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute(
        "download",
        `PawnShop_Backup_${new Date().toISOString().split("T")[0]}.json`,
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      alert("காப்பு தரவு பதிவிறக்கம் செய்யப்பட்டது! (Backup Downloaded!)");
      setExportModalOpen(false);
      setExportPassword("");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to download backup");
    }
  };

  const handleAddDailyCash = async (e) => {
    e.preventDefault();
    if (!dailyCashInput) return alert("தொகையை உள்ளிடவும்! (Enter amount)");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/daily-cash",
        { amount: dailyCashInput },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setDailyCashInput("");
      fetchDailyCash();
      fetchDailyStats();
    } catch (error) {
      console.error("Failed to add cash:", error);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseName || !expenseAmount)
      return alert("Please fill both expense fields!");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/expenses",
        { name: expenseName, amount: expenseAmount },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setExpenseName("");
      setExpenseAmount("");
      fetchDailyStats();
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/shop-profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("கடை விவரங்கள் சேமிக்கப்பட்டன! (Shop Details Saved!)");
      setProfileModal(false);
      fetchShopProfile();
    } catch (error) {
      console.error("Failed to save:", error);
      alert(error.response?.data?.message || "Failed to update profile.");
    }
  };

  const fetchShopProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/shop-profile", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setShopProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDailyCash = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/daily-cash", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodayStartingCash(res.data.amount);
    } catch (error) {
      console.error("Failed to fetch daily cash:", error);
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

  useEffect(() => {
    fetchShopProfile();
    fetchDailyCash();
    fetchDailyStats();
  }, []);

  return (
    <>
      <>
        
        <div className="flex items-center gap-3 ml-auto">
          <button
  onClick={handleExportDailyExcel}
  className="group relative flex items-center justify-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-200 px-6 py-2.5 rounded-xl shadow-sm hover:bg-emerald-600 hover:text-white hover:border-emerald-600 font-bold transition-all duration-300 active:scale-95 overflow-hidden"
  title="Download Daily Report as Excel"
>
  {/* Icon Wrapper */}
  <div className="relative transition-all duration-500 group-hover:translate-x-11.25 group-hover:rotate-12 group-hover:scale-125">
    {/* Lucide FileDown Icon */}
    <div className="transform transition-transform duration-500 group-hover:animate-bounce hover:pl-5">
        <FileDown size={20} strokeWidth={2.5} />
    </div>
  </div>

  {/* Button Text */}
  <span className="transition-all duration-500 group-hover:opacity-0 group-hover:translate-x-10">
    Excel
  </span>

  {/* Hidden Text that appears on hover */}
  <span className="absolute -translate-x-full opacity-0 transition-all duration-500 group-hover:-translate-x-3.75 group-hover:opacity-100">
    Download
  </span>
</button>
          <button
  type="button"
  onClick={() => setIsBackupMenuModalOpen(true)}
  title="தரவு பாதுகாப்பு (Backup & Restore)"
  className="group relative inline-flex items-center justify-center w-[50px] h-[50px] bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full shadow-lg transform scale-100 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-orange-300 active:scale-95"
>
  <Import 
    size={26} 
    strokeWidth={2.5}
    className="transition-all duration-300 ease-out group-hover:-rotate-45 group-hover:scale-75" 
  />
</button>

          <button
  onClick={() => setProfileModal(true)}
  className="group relative flex items-center gap-3 px-6 py-2.5 bg-white text-green-500 border-none rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 ml-auto overflow-hidden"
>
  {/* Text Layer */}
  <span className="relative z-20 font-bold text-sm tracking-wide pointer-events-none">
    + Add Shop Profile
  </span>

  {/* Icon Container */}
  <div className="relative w-6 h-6 z-10">
    {/* 1. Card Icon */}
    <svg viewBox="0 0 24 24" className="absolute inset-0 w-6 h-6 text-green-500 opacity-0 transition-all group-hover:animate-[iconRotate_2.5s_infinite_0s]">
      <path d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18C2,19.11 2.89,20 4,20H20C21.11,20 22,19.11 22,18V6C22,4.89 21.11,4 20,4Z" fill="currentColor" />
    </svg>

    {/* 2. Payment Icon */}
    <svg viewBox="0 0 24 24" className="absolute inset-0 w-6 h-6 text-green-500 opacity-0 transition-all group-hover:animate-[iconRotate_2.5s_infinite_0.5s]">
      <path d="M2,17H22V21H2V17M6.25,7H9V6H6V3H18V6H15V7H17.75L19,17H5L6.25,7M9,10H15V8H9V10M9,13H15V11H9V13Z" fill="currentColor" />
    </svg>

    {/* 3. Dollar Icon */}
    <svg viewBox="0 0 24 24" className="absolute inset-0 w-6 h-6 text-green-500 opacity-0 transition-all group-hover:animate-[iconRotate_2.5s_infinite_1s]">
      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor" />
    </svg>

    {/* 4. Wallet Icon (Default) */}
    <svg viewBox="0 0 24 24" className="absolute inset-0 w-6 h-6 text-green-500 transition-all duration-300 group-hover:opacity-0">
      <path d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z" fill="currentColor" />
    </svg>

  </div>
</button>
        </div>
      </>

      <div className="p-6 overflow-x-auto animate-in fade-in duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-emerald-50/70 border border-emerald-100 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div className="mb-4">
              <h3 className="text-emerald-800 font-bold flex items-center gap-2 text-lg">
                <span className="bg-emerald-100 p-2 rounded-lg shadow-sm">
                  <HandCoins />
                </span>{" "}
                கல்லா இருப்பு (Daily Cash In)
              </h3>
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                காலையில் கடையில் வைத்த தொடக்க இருப்பு (Opening Balance)
              </p>
            </div>

            <form
              onSubmit={handleAddDailyCash}
              className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                value={dailyCashInput}
                onChange={(e) => setDailyCashInput(e.target.value)}
                placeholder="தொகை (e.g., 50000)"
                className="flex-1 rounded-xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white transition-colors font-bold text-emerald-900"
              />
              <button
  type="submit"
  className="group relative flex z-0 items-center w-[160px] h-[45px] bg-emerald-500 border border-emerald-600 rounded-xl overflow-hidden cursor-pointer transition-all active:scale-95 shadow-sm active:bg-emerald-800"
>
  {/* The Button Text */}
  <span className="ml-6 text-white font-bold text-sm transition-all duration-300 group-hover:opacity-0">
    சேர் (Add)
  </span>

  {/* The Animated Icon Container */}
  <span className="absolute right-0 flex items-center justify-center w-[45px] h-full bg-emerald-600 transition-all duration-300 group-hover:w-full group-hover:translate-x-0">
    <Plus className="text-white transition-all duration-300" size={24} strokeWidth={3} />
  </span>
</button>
            </form>

            <div className="mt-4 pt-3 border-t border-emerald-200/60 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                இன்றைய இருப்பு:
              </span>
              <span className="text-lg font-black text-emerald-700">
                ₹{todayStartingCash || 0}
              </span>
            </div>
          </div>

          <div className="bg-rose-50/70 border border-rose-100 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div className="mb-4">
              <h3 className="text-rose-800 font-bold flex items-center gap-2 text-lg">
                <span className="bg-rose-100 p-2 rounded-lg shadow-sm">
                  <TrendingDown />
                </span>{" "}
                கடை செலவு (Add Expense)
              </h3>
              <p className="text-xs text-rose-600 mt-1 font-medium">
                டீ, பேப்பர், மற்றும் இதர செலவுகள் (Shop Maintenance)
              </p>
            </div>

            <form
              onSubmit={handleAddExpense}
              className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="காரணம் (Reason)"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="flex-1 rounded-xl border border-rose-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-white transition-colors text-rose-900"
              />
              <input
                type="number"
                placeholder="தொகை (₹)"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full sm:w-32 rounded-xl border border-rose-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-white transition-colors font-bold text-rose-900"
              />
              <button
  type="submit"
  className="group relative flex items-center w-40 h-12 bg-rose-600 border border-rose-700 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 active:scale-95 shadow-md active:bg-rose-800"
>
  {/* The Button Text - Moves left slightly on hover */}
  <span className="ml-6 text-white font-bold text-sm transition-all duration-300 group-hover:opacity-0 group-hover:-translate-x-4">
    சேர் (Add)
  </span>

  {/* The Animated Icon Container - Slides to cover the button */}
  <span className="absolute right-0 flex items-center justify-center w-11.25 h-full bg-rose-700 transition-all duration-300 group-hover:w-full">
    <Plus 
      className="text-white transition-all duration-300 group-hover:scale-110" 
      size={22} 
      strokeWidth={3} 
    />
  </span>
</button>
            </form>

            <div className="mt-4 pt-3 border-t border-red-200/60 flex justify-between items-center">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                இன்றைய மொத்த செலவு:
              </span>
              <span className="text-lg font-black text-rose-700">
                ₹{totalExpenses || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/50 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-black-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
              <span className="text-yellow-500">
                <Coffee />
              </span>{" "}
              தினசரி பரிவர்த்தனைகள் (Daily Ledger)
            </h2>
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-white/50 p-4 rounded-2xl border border-slate-200 shadow-sm gap-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50/10 p-2.5 rounded-xl text-indigo-600 shadow-sm border border-indigo-100">
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 tracking-wide">
                    தேதி வாரியாக தேடு
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                    Search by Date
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full sm:w-auto border border-slate-200 rounded-xl pl-4 pr-4 py-2.5 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm cursor-pointer"
                  />
                </div>
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="text-sm font-bold text-rose-500 hover:text-white hover:bg-rose-500 px-4 py-2.5 rounded-xl transition-all shadow-sm border border-rose-100 hover:border-rose-500 active:scale-95">
                    Clear
                  </button>
                )}
              </div>
            </div>
            <span className="bg-white text-slate-600 text-xs font-bold px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
              Total Days: {dailyStats?.length || 0}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="py-4 px-6 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    தேதி (Date)
                  </th>
                  <th className="py-4 px-6 text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
                    தொடக்க இருப்பு
                    <br />
                    <span className="text-[10px] text-slate-400">
                      START CASH
                    </span>
                  </th>
                  <th className="py-4 px-6 text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
                    வரவு / வட்டி
                    <br />
                    <span className="text-[10px] text-slate-400">INCOME</span>
                  </th>
                  <th className="py-4 px-6 text-xs font-extrabold text-rose-600 uppercase tracking-wider">
                    வழங்கிய கடன்
                    <br />
                    <span className="text-[10px] text-slate-400">LOAN OUT</span>
                  </th>
                  <th className="py-4 px-6 text-xs font-extrabold text-orange-600 uppercase tracking-wider">
                    கடை செலவுகள்
                    <br />
                    <span className="text-[10px] text-slate-400">EXP. OUT</span>
                  </th>
                  <th className="py-4 px-6 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    செலவு விவரம்
                    <br />
                    <span className="text-[10px] text-slate-400">REASON</span>
                  </th>
                  <th className="py-4 px-6 text-xs font-extrabold text-slate-800 uppercase tracking-wider text-right">
                    நிகர இருப்பு
                    <br />
                    <span className="text-[10px] text-slate-400">
                      NET BALANCE
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-100">
                {filteredStats && filteredStats.length > 0 ? (
                  filteredStats.map((stat) => {
                    const expensesTotal = stat.expenses || 0;
                    const startingCash = stat.startingCash || 0; // Fetched from backend daily stats
                    const income = stat.income || 0;
                    const loanGiven = stat.loanGiven || 0;

                    const netBalance =
                      startingCash + income - (loanGiven + expensesTotal);

                    return (
                      <tr
                        key={stat.date}
                        className="hover:bg-slate-50/80 transition-colors group">
                        {/* Date */}
                        <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-slate-700">
                          {new Date(stat.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        {/* Start Cash */}
                        <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-emerald-600">
                          {startingCash > 0
                            ? `₹${startingCash.toFixed(2)}`
                            : "-"}
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-indigo-600">
                          {income > 0 ? `+ ₹${income.toFixed(2)}` : "-"}
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-rose-600">
                          {loanGiven > 0 ? `- ₹${loanGiven.toFixed(2)}` : "-"}
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-orange-500">
                          {expensesTotal > 0
                            ? `- ₹${expensesTotal.toFixed(2)}`
                            : "-"}
                        </td>

                        <td className="py-3 px-6 text-sm font-medium text-slate-600">
                          {stat.expenseDetails &&
                          stat.expenseDetails.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                              {stat.expenseDetails.map((exp, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm min-w-35 group-hover:border-orange-200 transition-colors">
                                  <span className="text-slate-600 text-xs font-bold">
                                    {exp.name}
                                  </span>
                                  <span className="font-bold text-orange-600 text-xs ml-3">
                                    ₹{exp.amount}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <span
                            className={`inline-block px-4 py-2 rounded-xl text-sm font-black tracking-wide border ${
                              netBalance > 0
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : netBalance < 0
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}>
                            {netBalance > 0 ? "+" : ""}₹{netBalance.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-16 px-6 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <svg
                          className="w-12 h-12 mb-3 text-slate-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span className="font-bold text-slate-500">
                          எந்த பரிவர்த்தனைகளும் இல்லை
                        </span>
                        <span className="text-xs mt-1">
                          No transactions found.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {profileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="text-indigo-600">
                  <Store />
                </span>{" "}
                கடை விவரங்கள் (Edit Shop Profile)
              </h3>
              <button
                onClick={() => setProfileModal(false)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors font-bold">
                ✕
              </button>
            </div>

            <form
              id="shop-profile-form"
              className="flex flex-col flex-1 overflow-hidden"
              onSubmit={handleProfileSubmit}>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                      கடையின் பெயர் (Shop Name)
                    </label>
                    <input
                      name="shopName"
                      defaultValue={shopProfile?.shopName}
                      placeholder="எ.கா: Sri Murugan Pawn Shop"
                      required
                      className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-bold focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                      உரிமையாளர் (Owner Name)
                    </label>
                    <input
                      name="ownerName"
                      defaultValue={shopProfile?.ownerName}
                      placeholder="எ.கா: K. Murugan"
                      required
                      className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-bold focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                      மொபைல் எண் (Phone)
                    </label>
                    <input
                      name="phone"
                      defaultValue={shopProfile?.phone}
                      placeholder="எ.கா: 9876543210"
                      required
                      className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-bold focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                      முகவரி (Address)
                    </label>
                    <textarea
                      name="address"
                      defaultValue={shopProfile?.address}
                      placeholder="முழு முகவரியை உள்ளிடவும்..."
                      required
                      rows="3"
                      className="block w-full rounded-lg border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 font-bold focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none"
                    />
                  </div>

                  {/* Shop Logo Upload */}
                  <div className="md:col-span-2 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5 text-center hover:bg-slate-100 transition-colors">
                    <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">
                      கடையின் லோகோ (Shop Logo)
                    </label>
                    <input
                      type="file"
                      name="shopimage"
                      accept="image/*"
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-all cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                      பரிந்துரைக்கப்படும் அளவு: 1:1 (Square), Max 2MB.
                    </p>
                  </div>
                  {shopProfile && shopProfile.deletePassword ? (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-rose-50 border border-rose-100 rounded-xl mt-2">
                      {/* Box 1: Mandatory Auth Check */}
                      <div>
                        <label className="block text-[11px] font-extrabold text-rose-600 mb-1 uppercase tracking-widest">
                          தற்போதைய கடவுச்சொல் (Current Password) *
                        </label>
                        <input
                          name="currentPassword"
                          type="password"
                          placeholder="உரிமையாளர் கடவுச்சொல்"
                          required
                          className="block w-full rounded-lg border-rose-300 bg-white px-4 py-2 text-sm text-slate-900 font-bold focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none"
                        />
                        <p className="text-[10px] text-rose-500 mt-1 font-semibold">
                          மாற்றங்களைச் சேமிக்க இது கட்டாயம் தேவை.
                        </p>
                      </div>

                      {/* Box 2: Optional Password Change */}
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 mb-1 uppercase tracking-widest">
                          புதிய கடவுச்சொல் (New Password)
                        </label>
                        <input
                          name="deletePassword"
                          type="password"
                          placeholder="மாற்ற விரும்பினால் மட்டும் உள்ளிடவும்..."
                          className="block w-full rounded-lg border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          பழைய கடவுச்சொல்லையே தொடர இதை காலியாக விடவும்.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* This shows ONLY on the very first time they setup the shop */
                    <div className="md:col-span-2 p-4 bg-indigo-50 border border-indigo-100 rounded-xl mt-2">
                      <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase tracking-wide">
                        பாதுகாப்பு கடவுச்சொல்லை உருவாக்கவும் (Create Secret
                        Password)
                      </label>
                      <input
                        name="deletePassword"
                        type="password"
                        placeholder="Set a secret password for deletions"
                        required
                        className="block w-full rounded-lg border-indigo-300 bg-white px-4 py-2 text-sm text-slate-900 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 🛑 Modal Footer (Fixed at bottom) */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setProfileModal(false)}
                  className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
                  ரத்து (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all active:scale-95">
                  சேமி (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBackupMenuModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Import className="text-orange-500" />
                  தரவு மேலாண்மை (Data Options)
                </h3>
                <button
                  onClick={() => setIsBackupMenuModalOpen(false)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 bg-slate-50 rounded-full hover:bg-rose-50">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Action List */}
              <div className="space-y-4">
                {/* Export Option */}
                <div
                  onClick={() => {
                    setIsBackupMenuModalOpen(false);
                    setExportModalOpen(true);
                  }}
                  className="p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-800">
                        தரவை காப்பு எடுக்க (Export)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        கணினியில் பாதுகாப்பாக பதிவிறக்கம் செய்யவும்.
                      </p>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded-lg group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-600 transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Import Option */}
                <div
                  onClick={() => {
                    setIsBackupMenuModalOpen(false); // Close menu
                    setImportModalOpen(true); // Open file upload modal
                  }}
                  className="p-4 border border-slate-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-rose-800">
                        தரவை மீட்டெடு (Import)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        பழைய காப்பு கோப்பை அமைப்பில் பதிவேற்றவும்.
                      </p>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded-lg group-hover:bg-rose-100 text-slate-500 group-hover:text-rose-600 transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm border-4 border-emerald-50">
                🛡️
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2">
                தரவு பதிவிறக்கம் (Export)
              </h3>
              <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                தரவை காப்பு எடுக்க உரிமையாளரின்{" "}
                <span className="font-bold text-emerald-600">
                  ரகசிய கடவுச்சொல்லை
                </span>{" "}
                உள்ளிடவும்.
              </p>

              {/* Password Input */}
              <input
                type="password"
                placeholder="உரிமையாளர் கடவுச்சொல்"
                value={exportPassword}
                onChange={(e) => setExportPassword(e.target.value)}
                className="w-full tracking-widest text-lg text-center rounded-xl border-slate-300 bg-slate-50 px-4 py-3 font-bold text-slate-800 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-inner mb-6"
              />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setExportModalOpen(false);
                    setExportPassword("");
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                  ரத்து (Cancel)
                </button>
                <button
                  onClick={handleExportData}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95">
                  பதிவிறக்கு (Download)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {importModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm border-4 border-rose-50">
                ⚠️
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2">
                தரவை மீட்டெடு (Restore Data)
              </h3>
              <p className="text-sm text-rose-600 mb-6 font-bold leading-relaxed bg-rose-50 p-3 rounded-lg border border-rose-100">
                எச்சரிக்கை: நீங்கள் புதிய கோப்பை பதிவேற்றினால், தற்போதைய தரவுகள்
                அனைத்தும் அழிக்கப்பட்டு பழைய தரவுகள் மீட்கப்படும்!
                <br />
                (Warning: Importing will overwrite all current data!)
              </p>

              <div className="text-left mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                  காப்பு கோப்பை தேர்வு செய்க (Select .json file)
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setSelectedBackupFile(e.target.files[0])}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200 cursor-pointer border border-slate-200 rounded-lg"
                />
              </div>

              <input
                type="password"
                placeholder="உரிமையாளர் கடவுச்சொல் (Owner Password)"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                className="w-full tracking-widest text-lg rounded-xl border-slate-300 bg-slate-50 px-4 py-3 font-bold text-slate-800 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition-all outline-none shadow-inner mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setImportModalOpen(false);
                    setImportPassword("");
                    setSelectedBackupFile(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                  ரத்து (Cancel)
                </button>
                <button
                  onClick={handleImportData}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-md active:scale-95">
                  மீட்டெடு (Restore)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
