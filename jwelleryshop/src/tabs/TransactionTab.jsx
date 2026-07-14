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
  Mail,
  Minus,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function TransactionTab() {
  
  // ✨ NEW: States for past date password verification
  const [isDatePasswordModalOpen, setIsDatePasswordModalOpen] = useState(false);
  const [datePassword, setDatePassword] = useState("");
  const [pendingTransactionDate, setPendingTransactionDate] = useState("");

  const [isBackupMenuModalOpen, setIsBackupMenuModalOpen] = useState(false);
  const [profileModal, setProfileModal] = useState(false);

  // 🟢 Unified single date state for the entire page
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [dailyCashInput, setDailyCashInput] = useState("");
  const [dailyCashReason, setDailyCashReason] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [todayStartingCash, setTodayStartingCash] = useState(0);

  // 🟢 Initialize as an Object so it doesn't crash your metrics cards
  const [dailyStats, setDailyStats] = useState({
    startingCash: 0,
    capitalAdded: 0,
    loanGiven: 0,
    income: 0,
    expenses: 0,
    expenseDetails: [],
    bankLoanReceived: 0, // ✨ Initialize missing field
    bankSettlementPaid: 0, // ✨ Initialize missing field
    bankLoanDetails: [],
    bankSettlementDetails: []
  });

  const [expenseAmount, setExpenseAmount] = useState("");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportPassword, setExportPassword] = useState("");
  const [shopProfile, setShopProfile] = useState({});
  const [selectedBackupFile, setSelectedBackupFile] = useState(null);
  const [importPassword, setImportPassword] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [allDailyStats, setAllDailyStats] = useState([]);

  // Calculate active date based on filter or default to today's date
  let activeDate = filterDate;
  if (!activeDate) {
    activeDate = new Date().toISOString().split('T')[0]; 
  }

  // 🟢 HELPER: Calculates chronological running balance for all days safely
  const calculateRunningBalances = (stats) => {
    const sortedStats = [...stats].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );

    let previousEndingBalance = 0;

    const processedStats = sortedStats.map((stat) => {
      // Force everything to be a Number to prevent accidental string concatenation
      const manuallyAddedCash =
        Number(stat.totalAmount) || Number(stat.startingCash) || 0;
      const income = Number(stat.income) || 0;
      const loanGiven = Number(stat.loanGiven) || 0;
      const expenses = Number(stat.expenses) || 0;

      // Starting cash for today = Yesterday's ending balance + whatever you manually added today
      const totalStartingForDay = previousEndingBalance + manuallyAddedCash;

      // End of day balance
      const endOfDayBalance =
        totalStartingForDay + income - loanGiven - expenses;

      const carriedOverFromYesterday = previousEndingBalance;
      previousEndingBalance = endOfDayBalance;

      return {
        ...stat,
        carriedOverBalance: carriedOverFromYesterday,
        manuallyAddedCash: manuallyAddedCash,
        calculatedStartingBalance: totalStartingForDay,
        endingBalance: endOfDayBalance,
      };
    });

    return processedStats.sort((a, b) => new Date(b.date) - new Date(a.date));
  };


  // 🟢 BULLETPROOF FETCH & CALCULATOR
  const fetchDailyLedgerStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/daily-stats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      if (res.data && Array.isArray(res.data)) {
        // 1. Sort OLDEST to NEWEST to build a continuous timeline forward
        const sortedByOldest = [...res.data].sort((a, b) => new Date(a.date) - new Date(b.date));

        let previousClosingBalance = 0;

        // 2. Calculate the exact math for every single day in history
        const calculatedStats = sortedByOldest.map(day => {
          // Force numbers to prevent errors
          const manualCash = Number(day.totalAmount) || Number(day.startingCash) || 0;
          const income = Number(day.income) || 0;
          const loans = Number(day.loanGiven) || 0;
          const expenses = Number(day.expenses) || 0;

          const bankCashIn = Number(day.bankLoanReceived) || 0;
          const bankCashOut = Number(day.bankSettlementPaid) || 0;

          // 🔥 Today's Opening Balance = Yesterday's Closing Balance + Any cash added today
          const startingPool = previousClosingBalance + manualCash;

          // 🔥 Today's Closing Balance
          const closingBalance = startingPool + income + bankCashIn - loans - expenses - bankCashOut;

          const processedDay = {
            ...day,
            startingCash: startingPool,       // OVERWRITES RAW DATA WITH CORRECT CARRY-OVER
            totalAmount: startingPool,        // OVERWRITES RAW DATA FOR UI CARDS
            calculatedStartingBalance: startingPool,        
            carriedOverBalance: previousClosingBalance,
            manuallyAddedCash: manualCash,
            endingBalance: closingBalance
          };

          previousClosingBalance = closingBalance; // Carry forward to tomorrow
          return processedDay;
        });

        // 3. Sort back to NEWEST to OLDEST for your bottom history table
        const sortedByNewest = [...calculatedStats].sort((a, b) => new Date(b.date) - new Date(a.date));
        setAllDailyStats(sortedByNewest);

        // 4. Safely update Today's UI Cards without any timing glitches
        const todayStats = calculatedStats.find(day => day.date === transactionDate);

        if (todayStats) {
          setDailyStats(todayStats);
          setTodayStartingCash(todayStats.startingCash);
        } else {
          // If the day is completely empty, grab the balance from the last active day
          const pastDays = calculatedStats.filter(day => new Date(day.date) < new Date(transactionDate));
          const carriedOver = pastDays.length > 0 ? pastDays[pastDays.length - 1].endingBalance : 0;

          setDailyStats({
            date: transactionDate,
            startingCash: carriedOver,
            totalAmount: carriedOver,
            capitalAdded: 0,
            loanGiven: 0,
            income: 0,
            expenses: 0,
            expenseDetails: [],
            carriedOverBalance: carriedOver,
            manuallyAddedCash: 0,
            endingBalance: carriedOver,
            cashDetails: [],
            bankLoanReceived: 0, // ✨ Prevent NaN math issues
            bankSettlementPaid: 0, // ✨ Prevent NaN math issues
            bankLoanDetails: [],
            bankSettlementDetails: []
          });
          setTodayStartingCash(carriedOver);
        }
      }
    } catch (err) {
      console.error("Error fetching ledger stats:", err);
    }
  };

  useEffect(() => {
    fetchDailyLedgerStats();
  }, [transactionDate]);

  const handleExportDailyExcel = async () => {
    try {
      // Use allDailyStats (or filteredStats if you want to export only the searched dates)
      const statsToExport = allDailyStats; 

      if (!statsToExport || statsToExport.length === 0) {
        return alert("No data to export!");
      }

      let finalExcelRows = [];

      // Sort stats oldest to newest so the ledger flows chronologically
      const sortedStats = [...statsToExport].sort((a, b) => new Date(a.date) - new Date(b.date));

      sortedStats.forEach((stat) => {
        let dayBookEntries = [];
        let totalDebit = 0;
        let totalCredit = 0;

        // Helper to format Date + Time for individual entries
        const formatDateTime = (isoDate) => {
          const d = new Date(isoDate);
          const datePart = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
          const timePart = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
          return `${datePart} - ${timePart}`;
        };

        const baseDateStr = new Date(stat.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const baseStartOfDay = new Date(stat.date).setHours(0, 0, 0, 0);

        // 1. CREDIT: Previous Day Carry Over
        if (stat.carriedOverBalance > 0) {
          dayBookEntries.push({
            date: baseDateStr,
            rawDate: baseStartOfDay - 2000,
            history: "Previous Day Carry Over Balance",
            debit: 0,
            credit: stat.carriedOverBalance,
          });
          totalCredit += stat.carriedOverBalance;
        }

        // 2. CREDIT: Daily Cash Added
        if (stat.cashDetails && stat.cashDetails.length > 0) {
          stat.cashDetails.forEach((cash) => {
            const amt = Number(cash.amount) || 0;
            dayBookEntries.push({
              date: baseDateStr, 
              rawDate: cash.date ? new Date(cash.date).getTime() : (baseStartOfDay - 1000),
              history: cash.name || "Manually Added Cash",
              debit: 0,
              credit: amt,
            });
            totalCredit += amt;
          });
        } else if (stat.manuallyAddedCash > 0) {
          dayBookEntries.push({
            date: baseDateStr,
            rawDate: baseStartOfDay - 1000,
            history: "Opening Balance / Cash In",
            debit: 0,
            credit: stat.manuallyAddedCash,
          });
          totalCredit += stat.manuallyAddedCash;
        }

        // 3. CREDIT: INDIVIDUAL Income / Interest Paid
        if (stat.incomeDetails && stat.incomeDetails.length > 0) {
          stat.incomeDetails.forEach((inc) => {
            const amt = Number(inc.amount) || 0;
            const incDate = inc.date || stat.date;
            dayBookEntries.push({
              date: formatDateTime(incDate),
              rawDate: new Date(incDate).getTime(),
              history: `LOAN/INTEREST PAID BY ${inc.customerName?.toUpperCase() || "CUSTOMER"} FOR ${inc.loanId || "N/A"}`,
              debit: 0,
              credit: amt,
            });
            totalCredit += amt;
          });
        } else if (stat.income > 0) {
          dayBookEntries.push({
            date: baseDateStr,
            rawDate: baseStartOfDay + 1000,
            history: "Income (Loan Received / Interest Paid)",
            debit: 0,
            credit: Number(stat.income),
          });
          totalCredit += Number(stat.income);
        }

        // 4. CREDIT: INDIVIDUAL Bank Loan Taken (Locker Storage)
        if (stat.bankLoanDetails && stat.bankLoanDetails.length > 0) {
          stat.bankLoanDetails.forEach((bl) => {
            const amt = Number(bl.amount) || 0;
            const blDate = bl.date || stat.date;
            dayBookEntries.push({
              date: formatDateTime(blDate),
              rawDate: new Date(blDate).getTime(),
              history: `${bl.loanId || "N/A"} ${bl.productName?.toUpperCase() || "ITEM"} KEPT IN ${bl.bankName?.toUpperCase() || "BANK"} BANK LOCKER ${bl.lockerNo || "N/A"}`,
              debit: 0,
              credit: amt,
            });
            totalCredit += amt;
          });
        }

        // 5. DEBIT: INDIVIDUAL Loan Given 
        if (stat.loanDetails && stat.loanDetails.length > 0) {
          stat.loanDetails.forEach((loan) => {
            const amt = Number(loan.amount) || 0;
            const loanDate = loan.date || stat.date;
            dayBookEntries.push({
              date: formatDateTime(loanDate),
              rawDate: new Date(loanDate).getTime(),
              history: `LOAN GIVEN TO ${loan.customerName?.toUpperCase() || "CUSTOMER"} FOR ${loan.loanId || "N/A"}`,
              debit: amt,
              credit: 0,
            });
            totalDebit += amt;
          });
        } else if (stat.loanGiven > 0) {
          dayBookEntries.push({
            date: baseDateStr,
            rawDate: baseStartOfDay + 2000,
            history: "Loan Given (Cash Out)",
            debit: Number(stat.loanGiven),
            credit: 0,
          });
          totalDebit += Number(stat.loanGiven);
        }

        // 6. DEBIT: INDIVIDUAL Bank Settlement Paid
        if (stat.bankSettlementDetails && stat.bankSettlementDetails.length > 0) {
          stat.bankSettlementDetails.forEach((bs) => {
            const amt = Number(bs.amount) || 0;
            const bsDate = bs.date || stat.date;
            dayBookEntries.push({
              date: formatDateTime(bsDate),
              rawDate: new Date(bsDate).getTime(),
              history: `LOAN/INTEREST PAID TO THE ${bs.bankName?.toUpperCase() || "BANK"}`,
              debit: amt,
              credit: 0,
            });
            totalDebit += amt;
          });
        }

        // 7. DEBIT: Expenses
        if (stat.expenseDetails && stat.expenseDetails.length > 0) {
          stat.expenseDetails.forEach((exp) => {
            const amt = Number(exp.amount) || 0;
            const expDate = exp.date || stat.date;
            dayBookEntries.push({
              date: formatDateTime(expDate),
              rawDate: new Date(expDate).getTime(),
              history: `Expense: ${exp.name}`,
              debit: amt,
              credit: 0,
            });
            totalDebit += amt;
          });
        } else if (stat.expenses > 0) {
          dayBookEntries.push({
            date: baseDateStr,
            rawDate: baseStartOfDay + 3000,
            history: "Shop Expenses",
            debit: Number(stat.expenses),
            credit: 0,
          });
          totalDebit += Number(stat.expenses);
        }

        // Sort chronologically using rawDate (Just like your UI)
        dayBookEntries.sort((a, b) => a.rawDate - b.rawDate);

        // --- EXCEL SHEET CONSTRUCTION FOR THIS DAY ---
        
        // Day Header
        finalExcelRows.push({
          "Date & Time": `📅 தேதி: ${baseDateStr}`,
          "Transaction History": "=========================================================",
          "Debit (CASH OUT)": "=======",
          "Credit (CASH IN)": "=======",
        });

        // Insert actual transactions
        dayBookEntries.forEach((entry) => {
          finalExcelRows.push({
            "Date & Time": entry.date,
            "Transaction History": entry.history,
            "Debit (CASH OUT)": entry.debit > 0 ? entry.debit : "",
            "Credit (CASH IN)": entry.credit > 0 ? entry.credit : "",
          });
        });

        // Daily Footer Totals
        const overallBalance = totalCredit - totalDebit;
        finalExcelRows.push({
          "Date & Time": "",
          "Transaction History": "TOTAL TALLY:",
          "Debit (CASH OUT)": totalDebit > 0 ? totalDebit : "",
          "Credit (CASH IN)": totalCredit > 0 ? totalCredit : "",
        });
        
        finalExcelRows.push({
          "Date & Time": "",
          "Transaction History": "CLOSING NET BALANCE:",
          "Debit (CASH OUT)": "",
          "Credit (CASH IN)": overallBalance,
        });

        // Blank space between days
        finalExcelRows.push({
          "Date & Time": "",
          "Transaction History": "",
          "Debit (CASH OUT)": "",
          "Credit (CASH IN)": "",
        });
      });

      // Generate the Excel Sheet
      const worksheet = XLSX.utils.json_to_sheet(finalExcelRows);
      
      // Set column widths for proper UI matching
      const columnWidths = [
        { wch: 25 }, // Date & Time
        { wch: 80 }, // Transaction History (Made wider for customer details)
        { wch: 18 }, // Debit
        { wch: 18 }, // Credit
      ];
      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Ledger");

      const fileDate = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
      XLSX.writeFile(workbook, `PawnShop_Ledger_${fileDate}.xlsx`);
      
    } catch (error) {
      console.error("Excel generation failed:", error);
      alert("Error downloading Excel");
    }
  };

  // ✨ NEW: EXPORTS ONLY THE TRANSACTIONS ASSOCIATED WITH THE SELECTED SEARCH FILTER DATE
  const handleExportSelectedDateExcel = async () => {
    try {
      if (!allDailyStats || allDailyStats.length === 0) {
        return alert("No data available!");
      }

      // Match selected search filter date, fallback to standard date format comparison
      const targetStats = allDailyStats.filter((stat) => stat.date === activeDate);

      if (!targetStats || targetStats.length === 0) {
        return alert(`No transactions recorded for ${activeDate} yet!`);
      }

      let finalExcelRows = [];

      targetStats.forEach((stat) => {
        let dayBookEntries = [];
        let totalDebit = 0;
        let totalCredit = 0;

        // Helper to format Date + Time for individual entries
        const formatDateTime = (isoDate) => {
          const d = new Date(isoDate);
          const datePart = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
          const timePart = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
          return `${datePart} - ${timePart}`;
        };

        const baseDateStr = new Date(stat.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const baseStartOfDay = new Date(stat.date).setHours(0, 0, 0, 0);

        // 1. CREDIT: Previous Day Carry Over
        if (stat.carriedOverBalance > 0) {
          dayBookEntries.push({
            date: baseDateStr,
            rawDate: baseStartOfDay - 2000,
            history: "Previous Day Carry Over Balance",
            debit: 0,
            credit: stat.carriedOverBalance,
          });
          totalCredit += stat.carriedOverBalance;
        }

        // 2. CREDIT: Daily Cash Added
        if (stat.cashDetails && stat.cashDetails.length > 0) {
          stat.cashDetails.forEach((cash) => {
            const amt = Number(cash.amount) || 0;
            dayBookEntries.push({
              date: baseDateStr, 
              rawDate: cash.date ? new Date(cash.date).getTime() : (baseStartOfDay - 1000),
              history: cash.name || "Manually Added Cash",
              debit: 0,
              credit: amt,
            });
            totalCredit += amt;
          });
        } else if (stat.manuallyAddedCash > 0) {
          dayBookEntries.push({
            date: baseDateStr,
            rawDate: baseStartOfDay - 1000,
            history: "Opening Balance / Cash In",
            debit: 0,
            credit: stat.manuallyAddedCash,
          });
          totalCredit += stat.manuallyAddedCash;
        }

        // 3. CREDIT: INDIVIDUAL Income / Interest Paid
        if (stat.incomeDetails && stat.incomeDetails.length > 0) {
          stat.incomeDetails.forEach((inc) => {
            const amt = Number(inc.amount) || 0;
            const incDate = inc.date || stat.date;
            dayBookEntries.push({
              date: formatDateTime(incDate),
              rawDate: new Date(incDate).getTime(),
              history: `LOAN/INTEREST PAID BY ${inc.customerName?.toUpperCase() || "CUSTOMER"} FOR ${inc.loanId || "N/A"}`,
              debit: 0,
              credit: amt,
            });
            totalCredit += amt;
          });
        } else if (stat.income > 0) {
          dayBookEntries.push({
            date: baseDateStr,
            rawDate: baseStartOfDay + 1000,
            history: "Income (Loan Received / Interest Paid)",
            debit: 0,
            credit: Number(stat.income),
          });
          totalCredit += Number(stat.income);
        }

        // 4. CREDIT: INDIVIDUAL Bank Loan Taken
        if (stat.bankLoanDetails && stat.bankLoanDetails.length > 0) {
          stat.bankLoanDetails.forEach((bl) => {
            const amt = Number(bl.amount) || 0;
            const blDate = bl.date || stat.date;
            dayBookEntries.push({
              date: formatDateTime(blDate),
              rawDate: new Date(blDate).getTime(),
              history: `${bl.loanId || "N/A"} ${bl.productName?.toUpperCase() || "ITEM"} KEPT IN ${bl.bankName?.toUpperCase() || "BANK"} BANK LOCKER ${bl.lockerNo || "N/A"}`,
              debit: 0,
              credit: amt,
            });
            totalCredit += amt;
          });
        }

        // 5. DEBIT: INDIVIDUAL Loan Given 
        if (stat.loanDetails && stat.loanDetails.length > 0) {
          stat.loanDetails.forEach((loan) => {
            const amt = Number(loan.amount) || 0;
            const loanDate = loan.date || stat.date;
            dayBookEntries.push({
              date: formatDateTime(loanDate),
              rawDate: new Date(loanDate).getTime(),
              history: `LOAN GIVEN TO ${loan.customerName?.toUpperCase() || "CUSTOMER"} FOR ${loan.loanId || "N/A"}`,
              debit: amt,
              credit: 0,
            });
            totalDebit += amt;
          });
        } else if (stat.loanGiven > 0) {
          dayBookEntries.push({
            date: baseDateStr,
            rawDate: baseStartOfDay + 2000,
            history: "Loan Given (Cash Out)",
            debit: Number(stat.loanGiven),
            credit: 0,
          });
          totalDebit += Number(stat.loanGiven);
        }

        // 6. DEBIT: INDIVIDUAL Bank Settlement Paid
        if (stat.bankSettlementDetails && stat.bankSettlementDetails.length > 0) {
          stat.bankSettlementDetails.forEach((bs) => {
            const amt = Number(bs.amount) || 0;
            const bsDate = bs.date || stat.date;
            dayBookEntries.push({
              date: formatDateTime(bsDate),
              rawDate: new Date(bsDate).getTime(),
              history: `LOAN/INTEREST PAID TO THE ${bs.bankName?.toUpperCase() || "BANK"}`,
              debit: amt,
              credit: 0,
            });
            totalDebit += amt;
          });
        }

        // 7. DEBIT: Expenses
        if (stat.expenseDetails && stat.expenseDetails.length > 0) {
          stat.expenseDetails.forEach((exp) => {
            const amt = Number(exp.amount) || 0;
            const expDate = exp.date || stat.date;
            dayBookEntries.push({
              date: formatDateTime(expDate),
              rawDate: new Date(expDate).getTime(),
              history: `Expense: ${exp.name}`,
              debit: amt,
              credit: 0,
            });
            totalDebit += amt;
          });
        } else if (stat.expenses > 0) {
          dayBookEntries.push({
            date: baseDateStr,
            rawDate: baseStartOfDay + 3000,
            history: "Shop Expenses",
            debit: Number(stat.expenses),
            credit: 0,
          });
          totalDebit += Number(stat.expenses);
        }

        // Sort chronologically using rawDate
        dayBookEntries.sort((a, b) => a.rawDate - b.rawDate);

        // --- EXCEL SHEET CONSTRUCTION ---
        finalExcelRows.push({
          "Date & Time": `📅 தேதி: ${baseDateStr}`,
          "Transaction History": "=========================================================",
          "Debit (CASH OUT)": "=======",
          "Credit (CASH IN)": "=======",
        });

        // Insert actual transactions
        dayBookEntries.forEach((entry) => {
          finalExcelRows.push({
            "Date & Time": entry.date,
            "Transaction History": entry.history,
            "Debit (CASH OUT)": entry.debit > 0 ? entry.debit : "",
            "Credit (CASH IN)": entry.credit > 0 ? entry.credit : "",
          });
        });

        // Daily Footer Totals
        const overallBalance = totalCredit - totalDebit;
        finalExcelRows.push({
          "Date & Time": "",
          "Transaction History": "TOTAL TALLY:",
          "Debit (CASH OUT)": totalDebit > 0 ? totalDebit : "",
          "Credit (CASH IN)": totalCredit > 0 ? totalCredit : "",
        });
        
        finalExcelRows.push({
          "Date & Time": "",
          "Transaction History": "CLOSING NET BALANCE:",
          "Debit (CASH OUT)": "",
          "Credit (CASH IN)": overallBalance,
        });
      });

      // Generate the Excel Sheet
      const worksheet = XLSX.utils.json_to_sheet(finalExcelRows);
      
      const columnWidths = [
        { wch: 25 }, // Date & Time
        { wch: 80 }, // Transaction History
        { wch: 18 }, // Debit
        { wch: 18 }, // Credit
      ];
      worksheet["!cols"] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Day Book");

      const fileDate = new Date(activeDate).toLocaleDateString("en-GB").replace(/\//g, "-");
      XLSX.writeFile(workbook, `PawnShop_DayBook_${fileDate}.xlsx`);
      
    } catch (error) {
      console.error("Selected Day Excel generation failed:", error);
      alert("Error downloading Selected Day Excel");
    }
  };

  const handleAutoEmailBackup = async () => {
    setIsSendingEmail(true);

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/reports/excel-export",
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const backendData = res.data;
      if (!backendData || backendData.length === 0) {
        setIsSendingEmail(false);
        return alert("No data to send!");
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
          "S.No": `📅 தேதி: ${date}`,
          Time: "=================",
          Type: "===========================",
          Description: "===============================================",
          Amount: "=======",
        });

        dayTransactions.forEach((item, index) => {
          const time = new Date(item.createdAt).toLocaleTimeString("ta-IN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          finalExcelRows.push({
            "S.No": index + 1,
            Time: time,
            Type: item.type,
            Description: item.description,
            Amount: item.amount || 0,
          });
        });
        finalExcelRows.push({
          "S.No": "",
          Time: "",
          Type: "",
          Description: "",
          Amount: "",
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

      const base64Excel = XLSX.write(workbook, {
        type: "base64",
        bookType: "xlsx",
      });

      await axios.post(
        "http://localhost:5000/api/reports/email-excel",
        { base64Data: base64Excel },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      alert("Backup Email Sent Successfully!");
    } catch (error) {
      console.error("Backup generation/sending failed:", error);
      alert("Error sending backup email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleImportData = async () => {
    if (!importPassword) return alert("Enter password");
    if (!selectedBackupFile) return alert("Select a file");

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

        alert("Data Restored Successfully!");
        setImportModalOpen(false);
        setImportPassword("");
        setSelectedBackupFile(null);

        window.location.reload();
      };
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to restore data. Invalid file."
      );
    }
  };

  const handleExportData = async () => {
    if (!exportPassword) return alert("Enter password");

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
        `PawnShop_Backup_${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      alert("Backup Downloaded!");
      setExportModalOpen(false);
      setExportPassword("");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to download backup");
    }
  };

  const handleAddDailyCash = async (e) => {
    e.preventDefault();
    if (!dailyCashInput) return alert("Enter amount");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/daily-cash",
        {
          amount: dailyCashInput,
          // 🟢 FIXED to 'source' so your server actually accepts the reason text!
          name: dailyCashReason || "Opening Cash",
          date: transactionDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDailyCashInput("");
      setDailyCashReason(""); // Added to clean up form
      fetchDailyLedgerStats(); // Refresh grid with new cash
    } catch (error) {
      console.error("Failed to add cash:", error);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault(); // Added to stop page reload!
    if (!expenseName || !expenseAmount)
      return alert("Please fill both expense fields!");
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/expenses",
        { name: expenseName, amount: expenseAmount, date: transactionDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExpenseName("");
      setExpenseAmount("");
      fetchDailyLedgerStats(); // Refresh grid with new expense
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
      alert("Shop Details Saved!");
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

  // 🟢 On initial Page Load, fetch shop profile and your target date stats
  useEffect(() => {
    fetchShopProfile();
    fetchDailyLedgerStats();
  }, []);

  const totalExpenses = dailyStats?.expenses || 0;
  const selectedDateStartingCash = dailyStats?.calculatedStartingBalance || 0;

  const filteredStats = allDailyStats.filter((stat) => stat.date === activeDate);

  const handleDateChangeRequest = (e) => {
    const newDate = e.target.value;
    const today = new Date().toISOString().split("T")[0];

    // If the selected date is earlier than today, require password
    if (newDate < today) {
      setPendingTransactionDate(newDate);
      setIsDatePasswordModalOpen(true);
    } else {
      // If it's today, allow it directly
      setTransactionDate(newDate);
    }
  };

  const handleVerifyDatePassword = () => {
    if (!datePassword) return alert("Enter password");
    
    // Check against the shop profile's secret password
    if (datePassword === shopProfile?.deletePassword) {
      setTransactionDate(pendingTransactionDate);
      setIsDatePasswordModalOpen(false);
      setDatePassword("");
      setPendingTransactionDate("");
    } else {
      alert("Incorrect Secret Password!");
    }
  };

  // 🟢 NEW DAY BOOK LOGIC: Flatten stats into Day Book entries for the table
  let dayBookEntries = [];
  let totalDebit = 0;
  let totalCredit = 0;

  filteredStats.forEach((stat) => {
    // Helper to format Date + Time for individual entries
    const formatDateTime = (isoDate) => {
      const d = new Date(isoDate);
      const datePart = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const timePart = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
      return `${datePart} - ${timePart}`;
    };

    // Base Date for Fallbacks (Carry Over, Total Summaries)
    const baseDateStr = new Date(stat.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    // We get the midnight timestamp of the day to pin opening balances to the very top
    const baseStartOfDay = new Date(stat.date).setHours(0, 0, 0, 0);

    // 1. CREDIT: Previous Day Carry Over
    if (stat.carriedOverBalance > 0) {
      dayBookEntries.push({
        id: `${stat.date}-carryover`,
        date: baseDateStr,
        rawDate: baseStartOfDay - 2000, // Force to the absolute top
        history: "Previous Day Carry Over Balance",
        debit: 0,
        credit: stat.carriedOverBalance,
      });
      totalCredit += stat.carriedOverBalance;
    }

    // 2. CREDIT: Daily Cash Added
    if (stat.cashDetails && stat.cashDetails.length > 0) {
      stat.cashDetails.forEach((cash, idx) => {
        const amt = Number(cash.amount) || 0;
        dayBookEntries.push({
          id: `${stat.date}-cash-${idx}`,
          date: baseDateStr, 
          rawDate: cash.date ? new Date(cash.date).getTime() : (baseStartOfDay - 1000), // Pin right after carryover
          history: cash.name || "Manually Added Cash",
          debit: 0,
          credit: amt,
        });
        totalCredit += amt;
      });
    } else if (stat.manuallyAddedCash > 0) {
      dayBookEntries.push({
        id: `${stat.date}-start`,
        date: baseDateStr,
        rawDate: baseStartOfDay - 1000, // Force right after carry over
        history: "Opening Balance / Cash In",
        debit: 0,
        credit: stat.manuallyAddedCash,
      });
      totalCredit += stat.manuallyAddedCash;
    }

    // 3. CREDIT: INDIVIDUAL Income / Interest Paid
    if (stat.incomeDetails && stat.incomeDetails.length > 0) {
      stat.incomeDetails.forEach((inc, idx) => {
        const amt = Number(inc.amount) || 0;
        const incDate = inc.date || stat.date;
        dayBookEntries.push({
          id: `${stat.date}-inc-${idx}`,
          date: formatDateTime(incDate),
          rawDate: new Date(incDate).getTime(), // Track exact time
          history: `LOAN/INTEREST PAID BY ${inc.customerName?.toUpperCase() || "CUSTOMER"} FOR ${inc.loanId || "N/A"}`,
          debit: 0,
          credit: amt,
        });
        totalCredit += amt;
      });
    } else if (stat.income > 0) {
      dayBookEntries.push({
        id: `${stat.date}-inc`,
        date: baseDateStr,
        rawDate: baseStartOfDay + 1000,
        history: "Income (Loan Received / Interest Paid)",
        debit: 0,
        credit: Number(stat.income),
      });
      totalCredit += Number(stat.income);
    }

    // 4. CREDIT: INDIVIDUAL Bank Loan Taken (Locker Storage)
    if (stat.bankLoanDetails && stat.bankLoanDetails.length > 0) {
      stat.bankLoanDetails.forEach((bl, idx) => {
        const amt = Number(bl.amount) || 0;
        const blDate = bl.date || stat.date;
        dayBookEntries.push({
          id: `${stat.date}-bankloan-${idx}`,
          date: formatDateTime(blDate),
          rawDate: new Date(blDate).getTime(), // Track exact time
          history: `${bl.loanId || "N/A"} ${bl.productName?.toUpperCase() || "ITEM"} KEPT IN ${bl.bankName?.toUpperCase() || "BANK"} BANK LOCKER ${bl.lockerNo || "N/A"}`,
          debit: 0,
          credit: amt,
        });
        totalCredit += amt;
      });
    }

    // 5. DEBIT: INDIVIDUAL Loan Given 
    if (stat.loanDetails && stat.loanDetails.length > 0) {
      stat.loanDetails.forEach((loan, idx) => {
        const amt = Number(loan.amount) || 0;
        const loanDate = loan.date || stat.date;
        dayBookEntries.push({
          id: `${stat.date}-loan-${idx}`,
          date: formatDateTime(loanDate),
          rawDate: new Date(loanDate).getTime(), // Track exact time
          history: `LOAN GIVEN TO ${loan.customerName?.toUpperCase() || "CUSTOMER"} FOR ${loan.loanId || "N/A"}`,
          debit: amt,
          credit: 0,
        });
        totalDebit += amt;
      });
    } else if (stat.loanGiven > 0) { // Fallback for old data
      dayBookEntries.push({
        id: `${stat.date}-loan`,
        date: baseDateStr,
        rawDate: baseStartOfDay + 2000,
        history: "Loan Given (Cash Out)",
        debit: Number(stat.loanGiven),
        credit: 0,
      });
      totalDebit += Number(stat.loanGiven);
    }

    // 6. DEBIT: INDIVIDUAL Bank Settlement Paid
    if (stat.bankSettlementDetails && stat.bankSettlementDetails.length > 0) {
      stat.bankSettlementDetails.forEach((bs, idx) => {
        const amt = Number(bs.amount) || 0;
        const bsDate = bs.date || stat.date;
        dayBookEntries.push({
          id: `${stat.date}-banksettlement-${idx}`,
          date: formatDateTime(bsDate),
          rawDate: new Date(bsDate).getTime(), // Track exact time
          history: `LOAN/INTEREST PAID TO THE ${bs.bankName?.toUpperCase() || "BANK"}`,
          debit: amt,
          credit: 0,
        });
        totalDebit += amt;
      });
    }

    // 7. DEBIT: Expenses
    if (stat.expenseDetails && stat.expenseDetails.length > 0) {
      stat.expenseDetails.forEach((exp, idx) => {
        const amt = Number(exp.amount) || 0;
        const expDate = exp.date || stat.date;
        dayBookEntries.push({
          id: `${stat.date}-exp-${idx}`,
          date: formatDateTime(expDate), // Upgraded to show time if available
          rawDate: new Date(expDate).getTime(), // Track exact time
          history: `Expense: ${exp.name}`,
          debit: amt,
          credit: 0,
        });
        totalDebit += amt;
      });
    } else if (stat.expenses > 0) {
      dayBookEntries.push({
        id: `${stat.date}-exp-total`,
        date: baseDateStr,
        rawDate: baseStartOfDay + 3000,
        history: "Shop Expenses",
        debit: Number(stat.expenses),
        credit: 0,
      });
      totalDebit += Number(stat.expenses);
    }
  });

  // 🟢 NEW: Sort the entire daybook chronologically by the exact time they occurred!
  dayBookEntries.sort((a, b) => a.rawDate - b.rawDate);

  const overallBalance = totalCredit - totalDebit;

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
            onClick={handleAutoEmailBackup}
            disabled={isSendingEmail}
            className="group relative flex items-center justify-center gap-3 bg-blue-50 text-blue-700 border border-blue-200 px-6 py-2.5 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 font-bold transition-all duration-300 active:scale-95 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            title="1-Click Auto Backup (Excel + JSON)"
          >
            <div className="relative transition-all duration-500 group-hover:translate-x-11.25 group-hover:-rotate-12 group-hover:scale-125">
              <div className="transform transition-transform duration-500 group-hover:animate-pulse hover:pl-5">
                {isSendingEmail ? (
                  <span className="animate-spin text-xl">⏳</span>
                ) : (
                  <Mail size={20} strokeWidth={2.5} />
                )}
              </div>
            </div>
            <span className="transition-all duration-500 group-hover:opacity-0 group-hover:translate-x-10">
              {isSendingEmail ? "Sending..." : "Backup Data"}
            </span>
            <span className="absolute -translate-x-full opacity-0 transition-all duration-500 group-hover:-translate-x-3.75 group-hover:opacity-100">
              Send
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
              <svg
                viewBox="0 0 24 24"
                className="absolute inset-0 w-6 h-6 text-green-500 opacity-0 transition-all group-hover:animate-[iconRotate_2.5s_infinite_0s]"
              >
                <path
                  d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18C2,19.11 2.89,20 4,20H20C21.11,20 22,19.11 22,18V6C22,4.89 21.11,4 20,4Z"
                  fill="currentColor"
                />
              </svg>

              {/* 2. Payment Icon */}
              <svg
                viewBox="0 0 24 24"
                className="absolute inset-0 w-6 h-6 text-green-500 opacity-0 transition-all group-hover:animate-[iconRotate_2.5s_infinite_0.5s]"
              >
                <path
                  d="M2,17H22V21H2V17M6.25,7H9V6H6V3H18V6H15V7H17.75L19,17H5L6.25,7M9,10H15V8H9V10M9,13H15V11H9V13Z"
                  fill="currentColor"
                />
              </svg>

              {/* 3. Dollar Icon */}
              <svg
                viewBox="0 0 24 24"
                className="absolute inset-0 w-6 h-6 text-green-500 opacity-0 transition-all group-hover:animate-[iconRotate_2.5s_infinite_1s]"
              >
                <path
                  d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"
                  fill="currentColor"
                />
              </svg>

              {/* 4. Wallet Icon (Default) */}
              <svg
                viewBox="0 0 24 24"
                className="absolute inset-0 w-6 h-6 text-green-500 transition-all duration-300 group-hover:opacity-0"
              >
                <path
                  d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </button>
        </div>
      </>

      <div className="p-6 overflow-x-auto animate-in fade-in duration-300">
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
              onChange={handleDateChangeRequest} // ✨ Updated to use the interceptor
              max={new Date().toISOString().split("T")[0]} 
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-emerald-50/70 border border-emerald-100 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div className="mb-4">
              <h3 className="text-emerald-800 font-bold flex items-center gap-2 text-lg">
                <span className="bg-emerald-100 p-2 rounded-lg shadow-sm">
                  <HandCoins />
                </span>{" "}
                Daily Cash In
              </h3>
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                Opening Balance Details
              </p>
            </div>

            <form
              onSubmit={handleAddDailyCash}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                placeholder="Reason (e.g., Opening Balance, Owner Cash)"
                value={dailyCashReason}
                onChange={(e) => setDailyCashReason(e.target.value)}
                className="flex-1 rounded-xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white transition-colors text-emerald-900"
              />
              <input
                type="number"
                value={dailyCashInput}
                onChange={(e) => setDailyCashInput(e.target.value)}
                placeholder="Amount (₹)"
                className="w-full sm:w-32 rounded-xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white transition-colors font-bold text-emerald-900"
              />
              <button
                type="submit"
                className="group relative flex z-0 items-center w-40 h-12 bg-emerald-500 border border-emerald-600 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 active:scale-95 shadow-md active:bg-emerald-800"
              >
                {/* The Button Text */}
                <span className="ml-6 text-white font-bold text-sm transition-all duration-300 group-hover:opacity-0 group-hover:-translate-x-4">
                  Cash In
                </span>

                {/* The Animated Icon Container */}
                <span className="absolute right-0 flex items-center justify-center w-11.25 h-full bg-emerald-600 transition-all duration-300 group-hover:w-full">
                  <Plus
                    className="text-white transition-all duration-300 group-hover:scale-110"
                    size={22}
                    strokeWidth={3}
                  />
                </span>
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-emerald-200/60 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                {transactionDate === new Date().toISOString().split("T")[0]
                  ? "Today's Balance:"
                  : "Selected Date Balance:"}
              </span>
              <span className="text-lg font-black text-emerald-700">
                ₹{selectedDateStartingCash || todayStartingCash || 0}
              </span>
            </div>
          </div>

          <div className="bg-rose-50/70 border border-rose-100 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div className="mb-4">
              <h3 className="text-rose-800 font-bold flex items-center gap-2 text-lg">
                <span className="bg-rose-100 p-2 rounded-lg shadow-sm">
                  <TrendingDown />
                </span>{" "}
                Add Expense
              </h3>
              <p className="text-xs text-rose-600 mt-1 font-medium">
                Tea, Paper, and other expenses (Shop Maintenance)
              </p>
            </div>

            <form
              onSubmit={handleAddExpense}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                placeholder="Reason"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="flex-1 rounded-xl border border-rose-200 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-white transition-colors text-rose-900"
              />
              <input
                type="number"
                placeholder="Amount (₹)"
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
                  Cash Out
                </span>

                {/* The Animated Icon Container - Slides to cover the button */}
                <span className="absolute right-0 flex items-center justify-center w-11.25 h-full bg-rose-700 transition-all duration-300 group-hover:w-full">
                  <Minus
                    className="text-white transition-all duration-300 group-hover:scale-110"
                    size={22}
                    strokeWidth={3}
                  />
                </span>
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-red-200/60 flex justify-between items-center">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                {transactionDate === new Date().toISOString().split("T")[0]
                  ? "Today's Total Expense:"
                  : "Selected Date Expense:"}
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
              Daily Ledger
            </h2>
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-white/50 p-4 rounded-2xl border border-slate-200 shadow-sm gap-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50/10 p-2.5 rounded-xl text-indigo-600 shadow-sm border border-indigo-100">
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 tracking-wide">
                    Search by Date
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
                    className="text-sm font-bold text-rose-500 hover:text-white hover:bg-rose-500 px-4 py-2.5 rounded-xl transition-all shadow-sm border border-rose-100 hover:border-rose-500 active:scale-95"
                  >
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
            <table className="min-w-full divide-y divide-slate-200 text-sm text-left border-b border-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="py-4 px-6 text-xs font-extrabold text-slate-500 uppercase tracking-wider w-1/6">
                    Date
                  </th>
                  <th className="py-4 px-6 text-xs font-extrabold text-indigo-600 uppercase tracking-wider w-3/6">
                    Transaction History
                  </th>
                  <th className="py-4 px-6 text-xs font-extrabold text-rose-600 uppercase tracking-wider text-right w-1/6">
                    Debit
                    <br />
                    <span className="text-[10px] text-slate-400">CASH OUT</span>
                  </th>
                  <th className="py-4 px-6 text-xs font-extrabold text-emerald-600 uppercase tracking-wider text-right w-1/6">
                    Credit
                    <br />
                    <span className="text-[10px] text-slate-400">CASH IN</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-100">
                {dayBookEntries.length > 0 ? (
                  dayBookEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-4 px-6 whitespace-nowrap text-sm font-bold text-slate-700">
                        {entry.date}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-slate-700 leading-relaxed">
                        {entry.history}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-bold text-rose-600">
                        {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "-"}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-bold text-emerald-600">
                        {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-16 px-6 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <svg
                          className="w-12 h-12 mb-3 text-slate-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          ></path>
                        </svg>
                        <span className="font-bold text-slate-500">
                          No transactions found.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              
              {/* Tally / Totals Footer */}
              <tfoot className="bg-slate-100/90 border-t-2 border-slate-300">
                <tr>
                  <td
                    colSpan="2"
                    className="py-4 px-6 text-right text-sm font-black text-slate-600 uppercase tracking-widest"
                  >
                    Total Tally:
                  </td>
                  <td className="py-4 px-6 text-right text-base font-black text-rose-700 bg-rose-50/50">
                    ₹{totalDebit.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right text-base font-black text-emerald-700 bg-emerald-50/50">
                    ₹{totalCredit.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan="2"
                    className="py-5 px-6 text-right text-sm font-black text-slate-800 uppercase tracking-widest border-t border-slate-200"
                  >
                    Closing Net Balance:
                  </td>
                  <td
                    colSpan="2"
                    className="py-5 px-6 text-right border-t border-slate-200"
                  >
                    <span
                      className={`inline-block px-8 py-3 rounded-xl text-lg font-black tracking-wide border shadow-sm ${
                        overallBalance >= 0
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-rose-50 text-rose-700 border-rose-300"
                      }`}
                    >
                      {overallBalance >= 0 ? "+" : ""}₹{overallBalance.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ✨ NEW: EXPORT DAY BOOK BUTTON AT THE TABLE'S CLOSING (FOOTER OF THE CARD) */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-slate-500">
              * This export applies strictly to the records matching the search date above.
            </p>
            <button
              onClick={handleExportSelectedDateExcel}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 w-full sm:w-auto"
            >
              <FileDown size={18} strokeWidth={2.5} className="animate-pulse" />
              <span>
                Export Day Book ({new Date(activeDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})
              </span>
            </button>
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
                Edit Shop Profile
              </h3>
              <button
                onClick={() => setProfileModal(false)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            <form
              id="shop-profile-form"
              className="flex flex-col flex-1 overflow-hidden"
              onSubmit={handleProfileSubmit}
            >
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">
                      Shop Name
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
                      Owner Name
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
                      Phone
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
                      Address
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
                      Shop Logo
                    </label>
                    <input
                      type="file"
                      name="shopimage"
                      accept="image/*"
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-all cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                      Square, Max 2MB.
                    </p>
                  </div>
                  {shopProfile && shopProfile.deletePassword ? (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-rose-50 border border-rose-100 rounded-xl mt-2">
                      {/* Box 1: Mandatory Auth Check */}
                      <div>
                        <label className="block text-[11px] font-extrabold text-rose-600 mb-1 uppercase tracking-widest">
                          Current Password *
                        </label>
                        <input
                          name="currentPassword"
                          type="password"
                          placeholder="உரிமையாளர் கடவுச்சொல்"
                          required
                          className="block w-full rounded-lg border-rose-300 bg-white px-4 py-2 text-sm text-slate-900 font-bold focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none"
                        />
                        <p className="text-[10px] text-rose-500 mt-1 font-semibold">
                          This is mandatory to save changes.
                        </p>
                      </div>

                      {/* Box 2: Optional Password Change */}
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-500 mb-1 uppercase tracking-widest">
                          New Password
                        </label>
                        <input
                          name="deletePassword"
                          type="password"
                          placeholder="மாற்ற விரும்பினால் மட்டும் உள்ளிடவும்..."
                          className="block w-full rounded-lg border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Leave blank to keep current password.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* This shows ONLY on the very first time they setup the shop */
                    <div className="md:col-span-2 p-4 bg-indigo-50 border border-indigo-100 rounded-xl mt-2">
                      <label className="block text-xs font-bold text-indigo-700 mb-1 uppercase tracking-wide">
                        Create Secret Password
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
                  className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
                >
                  Save
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
                  Data Options
                </h3>
                <button
                  onClick={() => setIsBackupMenuModalOpen(false)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 bg-slate-50 rounded-full hover:bg-rose-50"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
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
                  className="p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-800">
                        Export Data
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Download data securely to your device.
                      </p>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded-lg group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-600 transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        ></path>
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
                  className="p-4 border border-slate-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-rose-800">
                        Import Data
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Upload your backup file to restore data.
                      </p>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded-lg group-hover:bg-rose-100 text-slate-500 group-hover:text-rose-600 transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        ></path>
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

              <h3 className="text-xl font-black text-slate-800 mb-2">Export</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                Enter the owner's{" "}
                <span className="font-bold text-emerald-600">
                  secret password
                </span>{" "}
                to back up the data..
              </p>

              {/* Password Input */}
              <input
                type="password"
                placeholder="Owner's Secret Password"
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
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportData}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                >
                  Download
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
                Restore Data
              </h3>
              <p className="text-sm text-rose-600 mb-6 font-bold leading-relaxed bg-rose-50 p-3 rounded-lg border border-rose-100">
                Warning: Importing will overwrite all current data!
              </p>

              <div className="text-left mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                  Select Backup File (Select .json file)
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
                placeholder="Owner's Secret Password"
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
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportData}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-md active:scale-95"
                >
                  Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Email Modal */}
      {/* ✨ NEW: Past Date Password Verification Modal */}
      {isDatePasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-sm border-4 border-yellow-50">
                🔒
              </div>

              <h3 className="text-xl font-black text-slate-800 mb-2">Admin Access Required</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                Modifying transactions on past dates requires the owner's secret password.
              </p>

              {/* Password Input */}
              <input
                type="password"
                placeholder="Secret Password"
                value={datePassword}
                onChange={(e) => setDatePassword(e.target.value)}
                className="w-full tracking-widest text-lg text-center rounded-xl border-slate-300 bg-slate-50 px-4 py-3 font-bold text-slate-800 focus:border-yellow-500 focus:bg-white focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none shadow-inner mb-6"
              />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDatePasswordModalOpen(false);
                    setDatePassword("");
                    setPendingTransactionDate("");
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyDatePassword}
                  className="flex-1 px-4 py-2.5 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition-all shadow-md active:scale-95"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}