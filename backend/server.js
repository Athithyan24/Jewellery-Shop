import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5000;

const uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');

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

const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

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

  shoptype: {type: String, required: true},

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
});
const User = mongoose.model("User", userSchema);

const createSuperAdmin = async () => {
  const adminExists = await User.findOne(
    { username: "admin" },
    { username: "worker" },
  );
  if (!adminExists) {
    await User.create({
      username: "admin",
      password: "adminpassword",
      role: "superadmin",
      shoptype: "Headquarters",
    });
    
    console.log(
      "Super Admin account created! Username: admin | Password: adminpassword",
    );
  }
};

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dob: { type: Date, required: true },
  address: { type: String, required: true },
  aadhar: { type: String, required: true, unique: true },
  aadharimage: { type: String, required: true },
  recentimage: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
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

const Bank = mongoose.model("Bank", bankSchema)

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
  if (!principal || !createdAt) return { tier1: 0, tier2: 0, tier3: 0, total: 0 };

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
    total: Math.round(tier1Interest + tier2Interest + tier3Interest)
  };
};

const loanSchema = new mongoose.Schema({
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

  firstinterest:Number,
  secondinterest:Number,
  thirdinterest:Number,

  firstinterestAmount:Number,
  secondinterestAmount:Number,
  thirdinterestAmount:Number,

  firstInterestFrom: { type: Number, default: 1 },
  firstInterestTo: { type: Number, default: 90 },
  
  secondInterestFrom: { type: Number, default: 91 },
  secondInterestTo: { type: Number, default: 180 },
  
  thirdInterestFrom: { type: Number, default: 181 },
  thirdInterestTo: { type: Number, default: 270},  

  loanamount: Number,

  principalPaid: { type: Number, default: 0 },
  interestPaid: { type: Number, default: 0 },
  isClosed: { type: Boolean, default: false },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  isBanked: { type: Boolean, default: false },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
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
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
  branchname: {type: String, required: true},
  accountno: {type: String, required: true},
  lockerno: {type: String, required: true},
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const BankDetails = mongoose.model ("BankDetails",  bankDetailsSchema)

const addMonths = (dateString, months) => {
  const d = new Date(dateString);
  d.setMonth(d.getMonth() + months);
  return d;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const calculateBackendInterest = (principal, createdAt, r1, r2, r3, 
  t1From = 1, t1To = 90, 
  t2From = 91, t2To = 180, 
  t3From = 181, t3To = 270) => {
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
  
    const tier1Interest = (principal * tier1Rate * m1) / (100);
    const tier2Interest = (principal * tier2Rate * m2) / (100);
    const tire3Interest = (principal * tier3Rate * m3) / (100);
    interestAmount = tier1Interest + tier2Interest + tire3Interest;
  return {
    total: Math.round(totalInterestAccrued),
    tier1Gross: Math.round(tier1Gross), 
    tier2Gross: Math.round(tier2Gross),
    tier3Gross: Math.round(tier3Gross)
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
    const matchCondition = req.user.role === "superadmin" ? {} : { createdBy: new mongoose.Types.ObjectId(req.user.id) };
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

    const statsMap = {};
    
    dailyLoans.forEach((item) => {
      statsMap[item._id] = { date: item._id, loanGiven: item.totalLoanGiven, income: 0 };
    });

    dailyIncome.forEach((item) => {
      if (statsMap[item._id]) {
        statsMap[item._id].income = item.totalIncome;
      } else {
        statsMap[item._id] = { date: item._id, loanGiven: 0, income: item.totalIncome };
      }
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
    

    const myWorkers = await User.find({ createdBy: req.user.id })
                                .select("-password"); 

    res.status(200).json(myWorkers);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ message: "Failed to fetch workers" });
  }
});

app.get("/api/loguser", verifyToken, async (req, res) => {
  try{
   const user = await User.findById(req.user.id || req.userId);

   if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
   res.status(200).json(user);
  }
  catch (error){
    res.status(500).json({ message: "Failed to fetch user", error });
  }
})

app.get("/api/loans", verifyToken, async (req, res) => {
  try {
    const query = req.user.role === "superadmin" ? {} : { createdBy: req.user.id };
    const loans = await Loan.find(query)
      .populate("customer")
      .populate("product")
      .lean(); 

    // நாட்களை கூட்ட உதவும் Function
    const addDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + (days || 0));
      return result;
    };

    const loansWithCalculations = loans.map((loan) => {
      const principalPaid = loan.principalPaid || 0;
      const remainingPrincipal = loan.loanamount - principalPaid;
      const principalToCalculate = remainingPrincipal > 0 ? remainingPrincipal : 0;

      // 🟢 மீதமுள்ள அசலை வைத்து Dynamic நாட்களின்படி வட்டி கணக்கிடுதல்
      const interestData = calculateBackendInterest(
        principalToCalculate, 
        loan.createdAt,
        loan.firstinterest, 
        loan.secondinterest, 
        loan.thirdinterest,
        loan.firstInterestFrom,
        loan.firstInterestTo,
        loan.secondInterestFrom,
        loan.secondInterestTo,
        loan.thirdInterestFrom,
        loan.thirdInterestTo
      );

      const totalInterest = interestData.total;

      const interestPaid = loan.interestPaid || 0;
      const pendingInterest = totalInterest - interestPaid;
      const activePendingInterest = pendingInterest > 0 ? pendingInterest : 0;
      
      const currentBalance = principalToCalculate + activePendingInterest;

      const startDate = loan.createdAt;
      
      const endTier1Date = addDays(startDate, loan.firstInterestTo || 90);
      const endTier2Date = addDays(startDate, loan.secondInterestTo || 180);

      const dateRanges = {
        tier1: `${formatDate(startDate)} - ${formatDate(endTier1Date)}`,
        tier2: `${formatDate(endTier1Date)} - ${formatDate(endTier2Date)}`,
        tier3: `From ${formatDate(endTier2Date)}`
      };

      return {
        ...loan,
        interestBreakdown: interestData, 
        dateRanges,
        currentBalance,
        pendingInterest: activePendingInterest,
        formattedDate: loan.createdAt ? formatDate(loan.createdAt) : "No Date"
      };
    });

    res.status(200).json(loansWithCalculations);
  } catch (error) {
    console.error("Error fetching loans:", error);
    res.status(500).json({ message: "Failed to fetch loans" });
  }
});

app.get("/api/customers", verifyToken, async (req, res) => {
  try {
    const query = req.user.role === "superadmin" ? {} : { createdBy: req.user.id };
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

app.get("/api/payLoan", verifyToken, async(req, res)=>{
  try{
    const query = req.user.role === "superadmin" ? {} : { createdBy: req.user.id };
    const payLoans = await PayLoan.find(query).populate("customer").populate(({
        path: "loan",       
        populate: {
          path: "product"   
        }
      }));
    res.status(200).json(payLoans);
  }
  catch (error){
    res.status(500).json({message: "Failed to fetch loans", error})
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
  try{
    const query = req.user.role === "superadmin" ? {} : { createdBy: req.user.id };
    const locker = await BankDetails.find(query)
    .populate("customer", "name recentimage")
    .populate("bank", "name")
    .populate({
        path: "loan",
        select: "product loanamount",
        populate: { path: "product", select: "name" } 
      })
    res.status(200).json(locker);
  }
  catch(error){
    console.error("Error fetching Customers Locker: ", error);
    res.status(500).json({message: "Failed to fetch Customer's Assigned Locker"})
  }
} );

app.post("/api/users", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied: Only superadmins can create workers." });
    }

    const { username, password, shopname } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists. Choose another." });
    }

    const newUser = new User({
      username,
      password, 
      role: "worker",
      shoptype: shopname,
      createdBy: req.user.id 
    });

    await newUser.save();

    res.status(201).json({ 
      message: `Worker created successfully for shop: ${shopname}`, 
      user: { username: newUser.username, role: newUser.role, shoptype : newUser.shoptype } 
    });

  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: "Failed to create worker" });
  }
});

app.post("/api/bankDetails", verifyToken, async (req, res) =>  {
  try{
    const {loanId, bankId, branchname, accountno, lockerno} = req.body;
    const loan = await Loan.findById(loanId);
    if (!loan || !bankId || !branchname || !accountno || !lockerno){
      return res.status(400).json({message: "All fields are required"});
    }

    const newBankDetails = new BankDetails({
      customer: loan.customer,
      loan: loanId,
      bank: bankId, 
      branchname,
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
  }catch (error) {
    console.error("Error saving bank details:", error);
    res.status(500).json({
      message: "Failed to save bank details",
      error: error.message || error,
    });
  }
})


app.post("/api/payLoan", verifyToken, async (req, res) => {
  try {
    const { loanId, amountPaid, payType } = req.body;
    const payment = Number(amountPaid);

    const loan = await Loan.findById(loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    if (loan.isClosed) return res.status(400).json({ message: "Loan is already closed." });

    const previouslyPaidPrincipal = loan.principalPaid || 0;
    const remainingPrincipal = loan.loanamount - previouslyPaidPrincipal;
    const principalToCalculate = remainingPrincipal > 0 ? remainingPrincipal : 0;

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

    if (payment > (currentTotalDue + 1)) { 
      return res.status(400).json({ 
        message: `Amount ₹${payment} exceeds the current due of ₹${currentTotalDue.toFixed(2)}` 
      });
    }

    let remainingPayment = payment;

    if (payType === "Full Pay" || payment >= (currentTotalDue - 1)) {
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
      isClosed: loan.isClosed
    });

  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: "Internal Server Error processing payment." });
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
      { expiresIn: "1d" }
    );

    res.status(200).json({ 
      token, 
      role: user.role, 
      username: user.username, 
      shoptype: user.shoptype 
    });
  } catch (error) {
    console.error("Login Error:", error); 
    res.status(500).json({ message: "Server error during login" });
  }
});

app.post(
  "/api/customers",
  verifyToken,
  upload.fields([
    { name: "aadharimage", maxCount: 1 },
    { name: "recentimage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.body) {
        return res.status(400).json({ message: "Form data missing" });
      }

      const { name, dob, address, aadhar, email, phone } = req.body;

      if (
        !req.files ||
        !req.files["aadharimage"] ||
        !req.files["recentimage"]
      ) {
        return res.status(400).json({ message: "Images not uploaded" });
      }

      const newCustomer = new Customer({
        name,
        dob,
        address,
        aadhar,
        aadharimage: req.files["aadharimage"][0].filename,
        recentimage: req.files["recentimage"][0].filename,
        email,
        phone,
        createdBy: req.user.id
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
      firstInterestFrom, firstInterestTo,
      secondInterestFrom, secondInterestTo,
      thirdInterestFrom, thirdInterestTo,
    } = req.body;

    const netWeight = weight - stoneweight;

    const goldValue = netWeight * goldrate;

    const loanamount = (goldValue * pawnpercentage) / 100;

    const loan = new Loan({
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Images are being stored in: ${uploadPath}`);
});
