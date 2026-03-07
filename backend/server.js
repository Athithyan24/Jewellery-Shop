import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5000;

const SECRET_KEY = process.env.SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB Successfully"))
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

const Products = async () => {
  const Workerusers = await User.findOne({ username: "worker" });
  const products = [
    "நெக்லஸ்", "காதணி", "மோதிரம்", "தூக்கு", "கொலுசு",
"சங்கிலி", "வீதிச் சங்கிலி", "மாட்டி", "வளையல்கள்", "மூக்குத்தி",
"தாயாட்டு", "முத்து மாலை", "அறைங்யான்", "காதணி ஆணி",
"நெத்தி சுட்டி", "இரண்டாவது காதணி"
  ];

  for (const p of products) {
    await Item.create({
      product: p,
      weight: 0,
      stoneweight: 0,
      goldrate: 0,
      amount: 0,
      pawnpercentage: 0,
      owner: Workerusers._id
    });
  }
};

const itemSchema = new mongoose.Schema({
  product: { type: String, required: true },
  weight: { type: Number},
  stoneweight: { type: Number},
  goldrate: { type: Number},
  amount: { type: Number},
  pawnpercentage: { type: Number},
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } 
});

const Item = mongoose.model("Item", itemSchema);

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

app.post("/api/customers", verifyToken, async (req, res) => {
   const{name, dob, address, aadhar, aadharimage, recentimage, email, phone} = req.body;
   if (req.user.role == "worker") 
    {
      try {
        const newCustomer = new Customer({ 
          name, 
          dob, 
          address, 
          aadhar, 
          aadharimage, 
          recentimage, 
          email, 
          phone });
        await newCustomer.save();

        res.status(201).json({ 
          message: "Customer created successfully", 
          customer: newCustomer });

    } catch (error) {
        res.status(500).json({ 
          message: "Failed to create customer", 
          error });
    }
  }
   else {
      res.status(403).json({ 
        message: "Access denied: Insufficient permissions" });
   }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
