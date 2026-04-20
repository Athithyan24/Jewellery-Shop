import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Counter from "./models/Counter.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = fs.existsSync(path.join(__dirname, ".env")) 
  ? path.join(__dirname, ".env") 
  : path.join(__dirname, "..", ".env");
dotenv.config({ path: envPath });
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || "jwellery@123";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jwelleryshop";
const uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

app.use("/uploads", express.static(uploadPath));



mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Successfully");
    createSuperAdmin();
    Products();
    Banks();
  })
  .catch((err) => {
    console.error("MongoDB Connection Error: ", err);
  });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["superadmin", "worker"], default: "worker" },

  shoptype: { type: String, required: true },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
});
const User = mongoose.model("User", userSchema);

const createSuperAdmin = async () => {
  const adminExists = await User.findOne(
    { username: "InfoZenX_It" },
    { username: "worker" },
  );
  if (!adminExists) {
    await User.create({
      username: "InfoZenX_It",
      password: "Info@ZenXItadmin",
      role: "superadmin",
      shoptype: "Headquarters",
    });

    console.log(
      "Super Admin account created! Username: InfoZenX_It | Password: Info@ZenXItadmin",
    );
  }
};

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  customerIdy: { type: String, unique: true },
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  aadhar: { type: String, required: true, unique: true },
  aadharimage: { type: String, required: true },
  recentimage: { type: String, required: true },
 
  phone: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});
const Customer = mongoose.model("Customer", customerSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const Product = mongoose.model("Product", productSchema);

const Products = async () => {
  try {
    const products = [
      "நெக்லஸ்",
      "காதணி",
      "மோதிரம்",
      "தூக்கு",
      "கொலுசு",
      "சங்கிலி",
      "வீதிச் சங்கிலி",
      "மாட்டி",
      "வளையல்கள்",
      "மூக்குத்தி",
      "தாயாட்டு",
      "முத்து மாலை",
      "அறைங்யான்",
      "காதணி ஆணி",
      "நெத்தி சுட்டி",
      "இரண்டாவது காதணி",
    ];

    for (const p of products) {
      const exists = await Product.findOne({ name: p });

      if (!exists) {
        await Product.create({ name: p });
      }
    }

    console.log("Products inserted successfully");
  } catch (error) {
    console.error("Error inserting products:", error);
  }
};

const bankSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const Bank = mongoose.model("Bank", bankSchema);

const Banks = async () => {
  try {
    const banks = [
      "IOB இந்தியன் ஓவர்சீஸ் வங்கி",
      "IB இந்திய வங்கி",
      "SBI பாரத ஸ்டேட் வங்கி",
      "CB கனரா வங்கி",
      "BOB பாங்க் ஆப் பரோடா",
      "NBP பஞ்சாப் நேஷனல் வங்கி",
      "UBO யூனியன் பாங்க் ஆஃப் இந்தியா",
      "CBI சென்ட்ரல் பேங்க் ஆஃப் இந்தியா",
      "BOI பாங்க் ஆப் இந்தியா",
      "BOM பாங்க் ஆப் மஹாராஷ்டிரா",
      "UCO யூகோ வங்கி",
      "எச்டிஎப்சி வங்கி (HDFC Bank)",
      "ஐசிஐசிஐ வங்கி (ICICI Bank)",
      "ஆக்சிஸ் வங்கி (Axis Bank)",
      "கோடக் மஹிந்திரா வங்கி (Kotak Mahindra Bank)",
      "ஐடிபிஐ வங்கி (IDBI Bank)",
      "இந்திய ரிசர்வ் வங்கி (RBI) ",
    ];

    for (const b of banks) {
      const exists = await Bank.findOne({ name: b });

      if (!exists) {
        await Bank.create({ name: b });
      }
    }

    console.log("Bank inserted successfully");
  } catch (error) {
    console.error("Error inserting banks:", error);
  }
};

const calculateInterestBreakdown = (principal, createdAt, r1, r2, r3) => {
  if (!principal || !createdAt)
    return { tier1: 0, tier2: 0, tier3: 0, total: 0 };

  const startDate = new Date(createdAt);
  const currentDate = new Date();

  const diffInTime = currentDate.getTime() - startDate.getTime();
  const diffInDays = diffInTime / (1000 * 3600 * 24);
  const months = Math.max(diffInDays / 30, 1);

  const tier1Months = Math.min(months, 3);
  const tier2Months = Math.max(0, Math.min(months - 3, 3));
  const tier3Months = Math.max(0, months - 6);

  const tier1Interest = (principal * (parseFloat(r1) || 0) * tier1Months) / 100;
  const tier2Interest = (principal * (parseFloat(r2) || 0) * tier2Months) / 100;
  const tier3Interest = (principal * (parseFloat(r3) || 0) * tier3Months) / 100;

  return {
    tier1: Math.round(tier1Interest),
    tier2: Math.round(tier2Interest),
    tier3: Math.round(tier3Interest),
    total: Math.round(tier1Interest + tier2Interest + tier3Interest),
  };
};

const loanSchema = new mongoose.Schema({
  loanId: { type: String, unique: true },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  weight: Number,
  stoneweight: Number,
  goldrate: Number,
  pawnpercentage: Number,

  firstinterest: Number,
  secondinterest: Number,
  thirdinterest: Number,

  firstinterestAmount: Number,
  secondinterestAmount: Number,
  thirdinterestAmount: Number,

  firstInterestFrom: { type: Number, default: 1 },
  firstInterestTo: { type: Number, default: 90 },

  secondInterestFrom: { type: Number, default: 91 },
  secondInterestTo: { type: Number, default: 180 },

  thirdInterestFrom: { type: Number, default: 181 },
  thirdInterestTo: { type: Number, default: 270 },

  loanamount: Number,

  principalPaid: { type: Number, default: 0 },
  interestPaid: { type: Number, default: 0 },
  isClosed: { type: Boolean, default: false },

  isDeleted: { type: Boolean, default: false },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  isBanked: { type: Boolean, default: false },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Loan = mongoose.model("Loan", loanSchema);

const payLoanSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan",
    required: true,
  },
  amountPaid: Number,
  payType: { type: String, enum: ["Initial Pay", "Full Pay"] },

  interestCalculated: { type: Number },
  remainingBalance: { type: Number },

  paymentDate: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const PayLoan = mongoose.model("PayLoan", payLoanSchema);

const bankDetailsSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan",
    required: true,
  },
  bank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bank",
    required: true,
  },
  ledgercreationdate: { type: String, required: true },
  branchname: { type: String, required: true },
  obstaffname: { type: String },
  obaccountno: { type: String },
  accountno: { type: String, required: true },
  lockerno: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const BankDetails = mongoose.model("BankDetails", bankDetailsSchema);

const expenseSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});
const Expense = mongoose.model("Expense", expenseSchema);

const shopProfileSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  shopimage: { type: String }, 
  deletePassword: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }
});
const ShopProfile = mongoose.model("ShopProfile", shopProfileSchema);

const dailyCashSchema = new mongoose.Schema({
  date: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});
dailyCashSchema.index({ date: 1, userId: 1 }, { unique: true });
const DailyCash = mongoose.model("DailyCash", dailyCashSchema);

const addMonths = (dateString, months) => {
  const d = new Date(dateString);
  d.setMonth(d.getMonth() + months);
  return d;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const calculateBackendInterest = (
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
  const startDate = new Date(createdAt);
  const currentDate = new Date();

  const diffInTime = currentDate.getTime() - startDate.getTime();
  const exactDiffInDays = diffInTime / (1000 * 3600 * 24);
  const diffInDays = Math.max(exactDiffInDays, 30);

  const tier1Rate = parseFloat(r1) || 1;
  const tier2Rate = parseFloat(r2) || 1;
  const tier3Rate = parseFloat(r3) || 1;

  const daysInTier1 = Math.max(0, Math.min(diffInDays, t1To) - (t1From - 1));
  const daysInTier2 = Math.max(0, Math.min(diffInDays, t2To) - (t2From - 1));
  const daysInTier3 = Math.max(0, Math.min(diffInDays, t3To) - (t3From - 1));

  const m1 = daysInTier1 / 30;
  const m2 = daysInTier2 / 30;
  const m3 = daysInTier3 / 30;

  const tier1Gross = (principal * tier1Rate * m1) / 100;
  const tier2Gross = (principal * tier2Rate * m2) / 100;
  const tier3Gross = (principal * tier3Rate * m3) / 100;

  let totalInterestAccrued = tier1Gross + tier2Gross + tier3Gross;

  let interestAmount = 0;

  const tier1Interest = (principal * tier1Rate * m1) / 100;
  const tier2Interest = (principal * tier2Rate * m2) / 100;
  const tire3Interest = (principal * tier3Rate * m3) / 100;
  interestAmount = tier1Interest + tier2Interest + tire3Interest;
  return {
    total: Math.round(totalInterestAccrued),
    tier1Gross: Math.round(tier1Gross),
    tier2Gross: Math.round(tier2Gross),
    tier3Gross: Math.round(tier3Gross),
  };
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ message: "Token required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

app.get("/api/daily-stats", verifyToken, async (req, res) => {
  try {
    const matchCondition =
      req.user.role === "superadmin"
        ? {}
        : { createdBy: new mongoose.Types.ObjectId(req.user.id) };

    const dailyLoans = await Loan.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalLoanGiven: { $sum: "$loanamount" },
        },
      },
    ]);

    const dailyIncome = await PayLoan.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
          totalIncome: { $sum: "$amountPaid" },
        },
      },
    ]);

    const dailyExpenses = await Expense.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, 
          totalExpenses: { $sum: "$amount" },
          expenseDetails: { $push: { name: "$name", amount: "$amount" } },
        },
      },
    ]);

    const cashMatchCondition = 
      req.user.role === "superadmin"
        ? {}
        : { userId: req.user.id };

    const dailyCash = await DailyCash.find(cashMatchCondition);

    const statsMap = {};

    const initMapEntry = (date) => {
      if (!statsMap[date]) {
        statsMap[date] = {
          date: date,
          loanGiven: 0,
          income: 0,
          expenses: 0,
          expenseDetails: [],
          startingCash: 0,
        };
      }
    };

    dailyLoans.forEach((item) => {
      initMapEntry(item._id);
      statsMap[item._id].loanGiven = item.totalLoanGiven;
    });

    dailyIncome.forEach((item) => {
      initMapEntry(item._id);
      statsMap[item._id].income = item.totalIncome;
    });

    dailyExpenses.forEach((item) => {
      initMapEntry(item._id);
      statsMap[item._id].expenses = item.totalExpenses;
      statsMap[item._id].expenseDetails = item.expenseDetails;
    });

    dailyCash.forEach((item) => {
      initMapEntry(item.date);
      statsMap[item.date].startingCash = item.amount;
    });

    const statsArray = Object.values(statsMap).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.status(200).json(statsArray);
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    res.status(500).json({ message: "Failed to fetch daily stats" });
  }
});

app.get("/api/users", verifyToken, async (req, res) => {
  try {
    const myWorkers = await User.find({ createdBy: req.user.id }).select(
      "-password",
    );

    res.status(200).json(myWorkers);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ message: "Failed to fetch workers" });
  }
});

app.get("/api/loguser", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user", error });
  }
});

const calculateAccruedInterest = (loan, targetDate = new Date()) => {
  if (!loan || !loan.createdAt) return { total: 0, pending: 0, months: 0, effectivePrincipal: 0, tier1: 0, tier2: 0, tier3: 0 };

  const startDate = new Date(loan.createdAt);
  const endDate = new Date(targetDate);

  let months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
  let days = endDate.getDate() - startDate.getDate();
  if (days < 0) months -= 1;
  const chargeableMonths = Math.max(months, 1);

  let runningPrincipal = (loan.loanamount || 0);
  let totalInterestAccrued = 0;
  let remainingPaidInterest = loan.interestPaid || 0;

  // 🟢 Initialize Tier Accumulators
  let tier1Accrued = 0;
  let tier2Accrued = 0;
  let tier3Accrued = 0;

  for (let m = 1; m <= chargeableMonths; m++) {
    const daysElapsedAtThisMonth = m * 30;
    let rate = loan.firstinterest || 1;
    
    // Determine rate and accumulate by tier
    if (daysElapsedAtThisMonth > 180) {
        rate = loan.thirdinterest || 2;
    } else if (daysElapsedAtThisMonth > 90) {
        rate = loan.secondinterest || 1.5;
    }

    const interestForThisMonth = (runningPrincipal * rate) / 100;
    totalInterestAccrued += interestForThisMonth;

    // 🟢 Assign interest to the correct tier breakdown
    if (m <= 3) tier1Accrued += interestForThisMonth;
    else if (m <= 6) tier2Accrued += interestForThisMonth;
    else tier3Accrued += interestForThisMonth;

    // Compounding logic: If interest wasn't paid, add to principal for next month
    if (remainingPaidInterest >= interestForThisMonth) {
      remainingPaidInterest -= interestForThisMonth;
    } else {
      const unpaidPortion = interestForThisMonth - remainingPaidInterest;
      remainingPaidInterest = 0;
      runningPrincipal += unpaidPortion; 
    }
  }

  const finalTotal = Math.round(totalInterestAccrued);
  const pending = Math.max(finalTotal - (loan.interestPaid || 0), 0);

  return {
    total: finalTotal,
    pending: pending,
    months: chargeableMonths,
    effectivePrincipal: runningPrincipal,
    // 🟢 Return the breakdown fields the API expects
    tier1: Math.round(tier1Accrued),
    tier2: Math.round(tier2Accrued),
    tier3: Math.round(tier3Accrued),
    tier1Gross: Math.round(tier1Accrued), // Added for frontend compatibility
    tier2Gross: Math.round(tier2Accrued),
    tier3Gross: Math.round(tier3Accrued)
  };
};

app.get("/api/loans", verifyToken, async (req, res) => {
  try {
    const query = req.user.role === "superadmin" ? {} : { createdBy: req.user.id };
    const finalQuery = { ...query, isDeleted: { $ne: true } };

    const loans = await Loan.find(finalQuery).populate("customer").populate("product").sort({ createdAt: -1 });

    const loansWithCalculations = loans.map((loan) => {
      const loanObj = loan.toObject();
      const interestData = calculateAccruedInterest(loanObj);
      
      const interestPaid = loanObj.interestPaid || 0;
      const pendingInterest = Math.max(interestData.total - interestPaid, 0);
      const remainingPrincipal = Math.max(loanObj.loanamount - (loanObj.principalPaid || 0), 0);
      
      return {
        ...loanObj,
        interestBreakdown: interestData, // Now contains tier1, tier2, tier3
        pendingInterest: pendingInterest,
        currentBalance: remainingPrincipal + pendingInterest,
        dateRanges: {
           // 🟢 These will now work because interestData.tier1 is defined
           tier1: `Month 1-3 (₹${interestData.tier1})`,
           tier2: interestData.tier2 > 0 ? `Month 4-6 (₹${interestData.tier2})` : "-",
           tier3: interestData.tier3 > 0 ? `Month 7+ (₹${interestData.tier3})` : "-",
        }
      };
    });

    return res.status(200).json(loansWithCalculations);
  } catch (error) {
    return res.status(500).json({ message: "Error", error: error.message });
  }
});

app.get("/api/customers", verifyToken, async (req, res) => {
  try {
    const query =
      req.user.role === "superadmin" ? {} : { createdBy: req.user.id };
    const customers = await Customer.find(query);
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customers", error });
  }
});

app.get("/api/products", verifyToken, async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error });
  }
});

app.get("/api/payLoan", verifyToken, async (req, res) => {
  try {
    const query =
      req.user.role === "superadmin" ? {} : { createdBy: req.user.id };
    const payLoans = await PayLoan.find(query)
      .populate("customer")
      .populate({
        path: "loan",
        populate: {
          path: "product",
        },
      });
    res.status(200).json(payLoans);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch loans", error });
  }
});

app.get("/api/banks", verifyToken, async (req, res) => {
  try {
    const banks = await Bank.find().sort({ name: 1 });
    res.status(200).json(banks);
  } catch (error) {
    console.error("Error fetching banks:", error);
    res.status(500).json({ message: "Failed to fetch banks" });
  }
});

app.get("/api/bankDetails", verifyToken, async (req, res) => {
  try {
    const query =
      req.user.role === "superadmin" ? {} : { createdBy: req.user.id };
    const locker = await BankDetails.find(query)
      .populate("customer", "name recentimage")
      .populate("bank", "name")
      .populate({
        path: "loan",
        select: "product loanamount loanId",
        populate: { path: "product", select: "name" },
      });
    res.status(200).json(locker);
  } catch (error) {
    console.error("Error fetching Customers Locker: ", error);
    res
      .status(500)
      .json({ message: "Failed to fetch Customer's Assigned Locker" });
  }
});


app.post("/api/backup/export", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).json({ message: "Access denied!" });
    }
    const { password } = req.body;
    const shopProfile = await ShopProfile.findOne({ userId: req.user.id });

    if (!shopProfile || shopProfile.deletePassword !== password) {
      return res.status(401).json({ message: "தவறான கடவுச்சொல்! (Incorrect password!)" });
    }

    const backupData = {
      users: await User.find({ role: "worker" }), 
      customers: await Customer.find(),
      loans: await Loan.find(),
      expenses: await Expense.find(),
      payLoans: await PayLoan.find(),         
      bankDetails: await BankDetails.find(),  
      dailyCash: await DailyCash.find(),      
    };

    res.status(200).json(backupData);
  } catch (error) {
    res.status(500).json({ message: "Export failed", error: error.message });
  }
});

app.post("/api/reports/excel-export", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const dailyCash = await DailyCash.find({ userId: userId }); // Fetch Initial Cash
    const customers = await Customer.find({ createdBy: userId });
    const loans = await Loan.find({ createdBy: userId }).populate("customer");
    const expenses = await Expense.find({ createdBy: userId });
    const payLoans = await PayLoan.find({ createdBy: userId })
      .populate("customer")
      .populate("loan");

    const reportData = [];

    dailyCash.forEach((c) => {
      reportData.push({
        type: "தொடக்க இருப்பு (Starting Cash)",
        description: "அன்றைய தின கல்லா இருப்பு",
        amount: c.amount || 0,
        createdAt: c.date || c.createdAt
      });
    });

    customers.forEach((c) => {
      reportData.push({
        type: "புதிய வாடிக்கையாளர் (New Customer)",
        description: c.name || "Customer",
        amount: 0,
        createdAt: c.createdAt || c._id.getTimestamp() 
      });
    });

    loans.forEach((l) => {
      reportData.push({
        type: "கடன் வழங்கப்பட்டது (Loan Given)",
        description: `Loan No: ${l.loanId} - ${l.customer?.name || "Unknown"}`,
        amount: l.loanamount || 0,
        createdAt: l.createdAt || l._id.getTimestamp()
      });
    });

    expenses.forEach((e) => {
      reportData.push({
        type: "செலவு (Expense)",
        description: e.expenseName || e.description || e.name || "Expense",
        amount: parseFloat(e.expenseAmount) || parseFloat(e.amount) || 0,
        createdAt: e.createdAt || (e._id ? e._id.getTimestamp() : new Date())
      });
    });

    payLoans.forEach((p) => {
      const actualLoanId = p.loan?.loanId || p.loanId || "N/A";
      const loanNo = actualLoanId !== "N/A" ? `Loan No: ${actualLoanId}` : "Loan N/A";
      
      const custName = p.customer?.name || "Unknown";
      const interestDetail = p.interestPaid ? `(Int: ₹${p.interestPaid})` : "";

      reportData.push({
        type: "வரவு (Loan Payment)",
        description: `${loanNo} - ${custName} ${interestDetail}`,
        amount: p.amountPaid || 0,
        createdAt: p.paymentDate || p.createdAt || p._id.getTimestamp()
      });
    });

    reportData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.status(200).json(reportData);
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ message: "Failed to generate Excel report", error: error.message });
  }
});

app.post("/api/backup/import", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "superadmin" && req.user.role !== "worker") {
      return res.status(403).json({ message: "Access denied!" });
    }
    
    const { password, backupData } = req.body;
    
    if (req.user.role === "worker") {
      const shopProfile = await ShopProfile.findOne({ userId: req.user.id });
      if (!shopProfile || shopProfile.deletePassword !== password) {
        return res.status(401).json({ message: "தவறான கடவுச்சொல்! (Incorrect password!)" });
      }
    }

    if (backupData.users && backupData.users.length > 0) {
      await User.deleteMany({ role: "worker" }); 
      await User.insertMany(backupData.users);
    }

    if (backupData.customers && backupData.customers.length > 0) {
      await Customer.deleteMany({});
      await Customer.insertMany(backupData.customers);
    }
    if (backupData.loans && backupData.loans.length > 0) {
      await Loan.deleteMany({});
      await Loan.insertMany(backupData.loans);
    }
    if (backupData.expenses && backupData.expenses.length > 0) {
      await Expense.deleteMany({});
      await Expense.insertMany(backupData.expenses);
    }
    if (backupData.payLoans && backupData.payLoans.length > 0) {
      await PayLoan.deleteMany({});
      await PayLoan.insertMany(backupData.payLoans);
    }
    if (backupData.bankDetails && backupData.bankDetails.length > 0) {
      await BankDetails.deleteMany({});
      await BankDetails.insertMany(backupData.bankDetails);
    }
    if (backupData.dailyCash && backupData.dailyCash.length > 0) {
      await DailyCash.deleteMany({});
      await DailyCash.insertMany(backupData.dailyCash);
    }

    res.status(200).json({ message: "முழு தரவும் வெற்றிகரமாக மீட்டமைக்கப்பட்டது! (Full data imported successfully!)" });
  } catch (error) {
    res.status(500).json({ message: "Import failed", error: error.message });
  }
});

app.get("/api/shop-profile", verifyToken, async (req, res) => {
  try {
    const profile = await ShopProfile.findOne({ userId: req.user.id }); 
    res.status(200).json(profile || {});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch shop profile" });
  }
});

app.get("/api/daily-cash", verifyToken, async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA'); 
    const cash = await DailyCash.findOne({ date: today, userId: req.user.id });
    res.status(200).json({ amount: cash ? cash.amount : 0 });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cash", error: error.message });
  }
});

app.post("/api/users", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({
          message: "Access denied: Only superadmins can create workers.",
        });
    }

    const { username, password, shopname } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username already exists. Choose another." });
    }

    const newUser = new User({
      username,
      password,
      role: "worker",
      shoptype: shopname,
      createdBy: req.user.id,
    });

    await newUser.save();

    res.status(201).json({
      message: `Worker created successfully for shop: ${shopname}`,
      user: {
        username: newUser.username,
        role: newUser.role,
        shoptype: newUser.shoptype,
      },
    });
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: "Failed to create worker" });
  }
});

app.post("/api/expenses", verifyToken, async (req, res) => {
  try {
    const { name, amount } = req.body;
    const newExpense = new Expense({
      name,
      amount: Number(amount),
      createdBy: req.user.id,
    });
    await newExpense.save();
    res.status(201).json({ message: "Expense added", expense: newExpense });
  } catch (error) {
    res.status(500).json({ message: "Failed", error: error.message });
  }
});

app.post("/api/bankDetails", verifyToken, async (req, res) => {
  try {
    const { loanId, bankId, branchname, ledgercreationdate, obstaffname, obaccountno, accountno, lockerno } = req.body;
    const loan = await Loan.findById(loanId);
    if (!loan || !bankId || !branchname || !ledgercreationdate
      || !obstaffname || !obaccountno || !accountno || !lockerno) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newBankDetails = new BankDetails({
      customer: loan.customer,
      loan: loanId,
      bank: bankId,
      branchname,
      ledgercreationdate,
      obstaffname,
      obaccountno,
      accountno,
      lockerno,
      createdBy: req.user.id,
    });
    await newBankDetails.save();

    loan.isBanked = true;
    await loan.save();

    res.status(201).json({
      message: "Owner's bank details saved successfully",
      bankDetails: newBankDetails,
    });
  } catch (error) {
    console.error("Error saving bank details:", error);
    res.status(500).json({
      message: "Failed to save bank details",
      error: error.message || error,
    });
  }
});

app.post("/api/shop-profile", verifyToken, upload.single("shopimage"), async (req, res) => {
  try {
    const { shopName, ownerName, phone, address, deletePassword, currentPassword } = req.body;
    
    const existingProfile = await ShopProfile.findOne({ userId: req.user.id });

    if (existingProfile && existingProfile.deletePassword) {
      if (!currentPassword) {
        return res.status(401).json({ message: "மாற்றங்களைச் சேமிக்க தற்போதைய கடவுச்சொல்லை உள்ளிடவும்! (Current password required!)" });
      }
      if (currentPassword !== existingProfile.deletePassword) {
        return res.status(401).json({ message: "தவறான கடவுச்சொல்! (Incorrect current password!)" });
      }
    }

    let updateData = { 
      shopName, 
      ownerName, 
      phone, 
      address, 
      userId: req.user.id,    
      updatedBy: req.user.id 
    };
    
    if (deletePassword && deletePassword.trim() !== "") {
      updateData.deletePassword = deletePassword;
    }
    
    if (req.file) {
      updateData.shopimage = req.file.filename;
    }
    
    const profile = await ShopProfile.findOneAndUpdate(
      { userId: req.user.id }, 
      { $set: updateData }, 
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Shop Profile updated successfully", profile });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
});

app.post("/api/daily-cash", verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const today = new Date().toLocaleDateString('en-CA'); 
    
    const dailyCash = await DailyCash.findOneAndUpdate(
      { date: today, userId: req.user.id }, 
      { 
        $inc: { amount: Number(amount) },
        $setOnInsert: { userId: req.user.id } 
      }, 
      { new: true, upsert: true }
    );
    
    res.status(200).json({ message: "Cash added successfully", dailyCash });
  } catch (error) {
    res.status(500).json({ message: "Failed to add cash", error: error.message });
  }
});

app.post("/api/payLoan", verifyToken, async (req, res) => {
  try {
    const { loanId, amountPaid, payType } = req.body;
    const payment = Number(amountPaid);

    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if (loan.isClosed)
      return res.status(400).json({ message: "Loan is already closed." });

    const previouslyPaidPrincipal = loan.principalPaid || 0;
    const remainingPrincipal = loan.loanamount - previouslyPaidPrincipal;
    const principalToCalculate =
      remainingPrincipal > 0 ? remainingPrincipal : 0;

    const interestData = calculateBackendInterest(
      loan.loanamount,
      loan.createdAt,
      loan.firstinterest,
      loan.secondinterest,
      loan.thirdinterest,
      loan.firstInterestFrom,
      loan.firstInterestTo,
      loan.secondInterestFrom,
      loan.secondInterestTo,
      loan.thirdInterestFrom,
      loan.thirdInterestTo,
    );

    const currentInterests = interestData.total;

    const previouslyPaidInterest = loan.interestPaid || 0;
    const pendingInterest = currentInterests - previouslyPaidInterest;
    const activePendingInterest = pendingInterest > 0 ? pendingInterest : 0;

    const currentTotalDue = remainingPrincipal + activePendingInterest;

    if (payment > currentTotalDue + 1) {
      return res.status(400).json({
        message: `Amount ₹${payment} exceeds the current due of ₹${currentTotalDue.toFixed(2)}`,
      });
    }

    let remainingPayment = payment;

    if (payType === "Full Pay" || payment >= currentTotalDue - 1) {
      loan.isClosed = true;
      loan.interestPaid = previouslyPaidInterest + activePendingInterest;
      loan.principalPaid = loan.loanamount;
    } else {
      if (remainingPayment >= activePendingInterest) {
        loan.interestPaid = previouslyPaidInterest + activePendingInterest;
        remainingPayment -= activePendingInterest;
      } else {
        loan.interestPaid = previouslyPaidInterest + remainingPayment;
        remainingPayment = 0;
      }

      if (remainingPayment > 0) {
        loan.principalPaid = previouslyPaidPrincipal + remainingPayment;
      }
    }

    loan.totalPaid = (loan.totalPaid || 0) + payment;

    const newTransaction = new PayLoan({
      customer: loan.customer,
      loan: loan._id,
      amountPaid: payment,
      payType: payType,
      interestCalculated: currentInterests,
      remainingBalance: currentTotalDue - payment,
      createdBy: req.user.id,
    });

    await newTransaction.save();
    await loan.save();

    res.status(201).json({
      message: "Payment securely processed and recorded.",
      transaction: newTransaction,
      isClosed: loan.isClosed,
    });
  } catch (error) {
    console.error("Payment Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error processing payment." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.SECRET_KEY,
      { expiresIn: "1d" },
    );

    res.status(200).json({
      token,
      role: user.role,
      username: user.username,
      shoptype: user.shoptype,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

app.post("/api/customers", verifyToken,upload.fields([
    { name: "aadharimage", maxCount: 1 },
    { name: "recentimage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.body) {
        return res.status(400).json({ message: "Form data missing" });
      }
      
      if (
        !req.files ||
        !req.files["aadharimage"] ||
        !req.files["recentimage"]
      ) {
        return res.status(400).json({ message: "Images not uploaded" });
      }

      const counter = await Counter.findOneAndUpdate(
      { name: "customerId" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

      const { name, dob, address, aadhar, phone } = req.body;
      const generatedCustomerId = "CUST" + String(counter.value).padStart(3, "0");

      const newCustomer = new Customer({
        name,
        customerIdy: generatedCustomerId,
        dob,
        address,
        aadhar,
        aadharimage: req.files["aadharimage"][0].filename,
        recentimage: req.files["recentimage"][0].filename,
        phone,
        createdBy: req.user.id,
      });

      await newCustomer.save();

      res.status(201).json({
        message: "Customer created successfully",
        customer: newCustomer,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to create customer",
        error: error.message || error,
      });
    }
  },
);

app.post("/api/loans", verifyToken, async (req, res) => {
  try {
    const {
      customerId,
      product,
      weight,
      stoneweight,
      goldrate,
      pawnpercentage,
      firstinterest,
      secondinterest,
      thirdinterest,
      firstinterestAmount,
      secondinterestAmount,
      thirdinterestAmount,
      firstInterestFrom,
      firstInterestTo,
      secondInterestFrom,
      secondInterestTo,
      thirdInterestFrom,
      thirdInterestTo,
    } = req.body;

    const counter = await Counter.findOneAndUpdate(
      { name: "loanId" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const generatedLoanId = "LN" + String(counter.value).padStart(3, "0");

    const netWeight = weight - stoneweight;

    const goldValue = netWeight * goldrate;

    const loanamount = (goldValue * pawnpercentage) / 100;

    const loan = new Loan({
      loanId: generatedLoanId,
      customer: customerId,
      product,
      weight,
      stoneweight,
      goldrate,
      pawnpercentage,
      firstinterest,
      secondinterest,
      thirdinterest,
      firstInterestFrom: firstInterestFrom || 1,
      firstInterestTo: firstInterestTo || 90,
      secondInterestFrom: secondInterestFrom || 91,
      secondInterestTo: secondInterestTo || 180,
      thirdInterestFrom: thirdInterestFrom || 181,
      thirdInterestTo: thirdInterestTo || 270,
      loanamount,
      firstinterestAmount,
      secondinterestAmount,
      thirdinterestAmount,
      createdBy: req.user.id,
    });

    await loan.save();

    res.status(201).json({
      message: "Loan created successfully",
      loan,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create loan",
      error,
    });
  }
});

app.delete("/api/loans/:id", verifyToken, async (req, res) => {
  try {
    const { password } = req.body; 

    const shopProfile = await ShopProfile.findOne();
    if (!shopProfile || !shopProfile.deletePassword) {
      return res.status(400).json({ message: "சுயவிவரத்தில் கடவுச்சொல் அமைக்கப்படவில்லை! (Delete password not set in Shop Profile)" });
    }

    if (password !== shopProfile.deletePassword) {
      return res.status(401).json({ message: "தவறான கடவுச்சொல்! (Incorrect password!)" });
    }

    const deletedLoan = await Loan.findByIdAndUpdate(
      req.params.id, 
      { isDeleted: true },
      { returnDocument: "after" }
    );

    if (!deletedLoan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    res.status(200).json({ message: "Loan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete loan", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Images are being stored in: ${uploadPath}`);
});
