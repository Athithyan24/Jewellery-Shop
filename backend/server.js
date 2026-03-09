import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5000;

const storage = multer.diskStorage({destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now()+"-" + file.originalname);
  }
});
const upload = multer({ storage });

app.use("/uploads", express.static("uploads"));

const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB Successfully");
    await Products();
  })
  .catch((err) => console.log("Failed to connect to MongoDB", err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'worker'], default: 'worker' }
});
const User = mongoose.model("User", userSchema);

const createSuperAdmin = async () => {
  const adminExists = await User.findOne({ username: "admin" },{username: "worker"});
  if (!adminExists) {
    await User.create({ username: "admin", password: "adminpassword", role: "superadmin", shoptype: "Headquarters" });
    await User.create({ username: "worker", password: "workerpassword", role: "worker", shoptype: "Headquarters" });
    console.log("Super Admin account created! Username: admin | Password: adminpassword");
  }
};
createSuperAdmin();

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    address: { type: String, required: true },
    aadhar: { type: String, required: true, unique: true },
    aadharimage: { type: String, required: true },
    recentimage: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true }
});
const Customer = mongoose.model("Customer", customerSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

const Product = mongoose.model("Product", productSchema);

const Products = async () => {
  try {

    const products = [
      "நெக்லஸ்", "காதணி", "மோதிரம்", "தூக்கு", "கொலுசு",
      "சங்கிலி", "வீதிச் சங்கிலி", "மாட்டி", "வளையல்கள்", "மூக்குத்தி",
      "தாயாட்டு", "முத்து மாலை", "அறைங்யான்", "காதணி ஆணி",
      "நெத்தி சுட்டி", "இரண்டாவது காதணி"
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

const loanSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  weight: Number,
  stoneweight: Number,
  goldrate: Number,
  pawnpercentage: Number,

  loanamount: Number,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Loan = mongoose.model("Loan", loanSchema);



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

app.get("/api/customers", verifyToken, async (req, res) => {
  try{
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch customers", error });
  }
})

app.get("/api/products", verifyToken, async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products", error });
  }
});

app.get("/api/loans", verifyToken, async (req, res) => {
  try {
    const loans = await Loan.find().populate("customer").populate("product");
    res.status(200).json(loans);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch loans", error });
  }
});

app.post("/api/login", async(req, res)=>{
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username, password });
        if (existingUser) {
            const token = jwt.sign(
                { userId: existingUser._id, role: existingUser.role }, 
                SECRET_KEY, 
                { expiresIn: "9h" }
            );
            res.status(200).json({ 
                message: "Login successful", 
                token,
                role: existingUser.role,
                user: existingUser.username, 
               });
        } else {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        }
     catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

app.post(
  "/api/customers",
  verifyToken,
  upload.fields([
    { name: "aadharimage", maxCount: 1 },
    { name: "recentimage", maxCount: 1 }
  ]),
  async (req, res) => {
    try {

      if (!req.body) {
        return res.status(400).json({ message: "Form data missing" });
      }

      const { name, dob, address, aadhar, email, phone } = req.body;

      if (!req.files) {
        return res.status(400).json({ message: "Images not uploaded" });
      }

      const aadharimage = req.files["aadharimage"][0].filename;
      const recentimage = req.files["recentimage"][0].filename;

      const newCustomer = new Customer({
        name,
        dob,
        address,
        aadhar,
        aadharimage,
        recentimage,
        email,
        phone
      });

      await newCustomer.save();

      res.status(201).json({
        message: "Customer created successfully",
        customer: newCustomer
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Failed to create customer",
        error
      });
    }
  }
);

app.post("/api/loans", verifyToken, async (req, res) => {
  try {

    const {
      customerId,
      product,
      weight,
      stoneweight,
      goldrate,
      pawnpercentage
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
      loanamount
    });

    await loan.save();

    res.status(201).json({
      message: "Loan created successfully",
      loan
    });

  } catch (error) {

    res.status(500).json({
      message: "Failed to create loan",
      error
    });

  }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
