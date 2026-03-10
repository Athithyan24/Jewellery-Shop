import { useState, useEffect } from "react";
import axios from "axios";

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
    id: "அமைப்பு",
    label: "அமைப்புகள்",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 mx-1 text-black",
    endpoint: "/api/அமைப்பு",
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

  const role = localStorage.getItem("role");

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setForm({
      ...form,
      [name]: files ? files[0] : value,
    });
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

  useEffect(() => {
    const fetchTabData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const currentTab = TABS.find((t) => t.id === activeTab);
        if (activeTab === "வாடிக்கையாளர்களின்") {
          await fetchCustomers();
        } else if (activeTab === "கடன்களின்") {
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

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      <div
        className={`max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden ${ReceiptModal ? "print:hidden" : ""}`}>
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

              {/* Only show the table if we are on the customers tab and the modal is CLOSED */}
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
                    className="mt-4 cursor-pointer bg-blue-100 text-blue-700 px-4 py-2 rounded-md font-semibold hover:bg-blue-200 transition">
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
                          அடகு %
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          கடன் தொகை
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">
                          நடவடிக்கை எடு
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
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedLoan(loan);
                                    setReceiptModal(true);
                                  }}
                                  className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded">
                                  ரசீதை பெறவும்
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedLoan(loan);
                                    setPayLoanModal(true);
                                  }}
                                  className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded">
                                  கடனை செலுத்துங்கள்
                                </button>
                              </div>
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

              {CustomerModal &&
                activeTab === "வாடிக்கையாளர்களின்" &&
                role === "worker" && (
                  <form
                    onSubmit={handleSubmit}
                    className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      New Customer Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        name="name"
                        placeholder="Full Name"
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                      <input
                        name="dob"
                        type="date"
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                      <input
                        name="address"
                        placeholder="Enter Customer's Full Address"
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                      <input
                        name="aadhar"
                        placeholder="Enter Customer's Aadhar Number"
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
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
                      <input
                        name="email"
                        type="email"
                        placeholder="Enter Customer's Email Address"
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                      <input
                        name="phone"
                        placeholder="Enter Customer's Phone Number"
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />

                      {/* File Inputs */}
                      <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-600 mb-1">
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
                        <label className="text-sm font-semibold text-gray-600 mb-1">
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
                        className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition">
                        Save Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerModal(false)}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded font-semibold hover:bg-gray-400 transition">
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
                <h2 className="text-3xl font-extrabold text-gray-900 uppercase tracking-wider">
                  InfoZenx IT Pawn Bill
                </h2>
                <p className="text-gray-600 mt-1">
                  Nagercoil, Kanyakumari (District)
                </p>
                <p className="text-gray-600">Phone: +91 98765 43210</p>
              </div>

              <div className="flex justify-between mb-6 text-sm">
                <div>
                  <p className="text-gray-500">Receipt No:</p>
                  <p className="font-bold text-gray-800">
                    #{selectedLoan._id.slice(-6).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500">Date:</p>
                  <p className="font-bold text-gray-800">
                    {new Date(selectedLoan.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 print:bg-transparent print:border-black">
                  <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1 print:border-black">
                    Customer Details
                  </h4>
                  <p>
                    <span className="font-semibold w-24 inline-block">
                      Name:
                    </span>{" "}
                    {selectedLoan.customer?.name}
                  </p>
                  <p>
                    <span className="font-semibold w-24 inline-block">
                      Phone:
                    </span>{" "}
                    {selectedLoan.customer?.phone}
                  </p>
                  <p>
                    <span className="font-semibold w-24 inline-block">
                      Address:
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
                    <th className="py-2 text-left">Item Description</th>
                    <th className="py-2 text-right">Gross Wt</th>
                    <th className="py-2 text-right">Stone Wt</th>
                    <th className="py-2 text-right">Net Wt</th>
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

              <div className="flex justify-between items-end mt-8">
                <div className="text-sm text-gray-600">
                  <p>Gold Rate: ₹{selectedLoan.goldrate}/g</p>
                  <p>Pawn Margin: {selectedLoan.pawnpercentage}%</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-1">
                    Total Loan Amount
                  </p>
                  <p className="text-3xl font-black text-gray-900 border-b-4 border-double border-gray-900 inline-block px-4">
                    ₹{selectedLoan.loanamount?.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-12 flex justify-between text-center text-sm font-semibold text-gray-500">
                <div className="border-t border-gray-400 w-32 pt-2 print:border-black">
                  Customer Signature
                </div>
                <div className="border-t border-gray-400 w-32 pt-2 print:border-black">
                  Authorized Signatory
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 cursor-pointer flex-1 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2">
                🖨️ Print Receipt
              </button>
              <button
                onClick={() => {
                  setReceiptModal(false);
                  setSelectedLoan(null);
                }}
                className="bg-gray-200 cursor-pointer flex-1 text-gray-800 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition">
                Close
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
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer Name</p>
          <p className="font-bold text-gray-900 text-lg">
            {selectedLoan.customer?.name}
          </p>
        </div>
      </div>
      <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-gray-200 pt-3 sm:pt-0">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Receipt No</p>
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
    <form className="mt-2">
      <div className="space-y-4">
        <select
          name="payType"
          className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer"
          defaultValue=""
          onChange={(e) => setSelectedTypeModal(e.target.value === "Initial Pay")}
          required
        >
          <option value="" disabled>Select Pay Type</option>
          <option value="Full Pay" >Full Pay</option>
          <option value="Initial Pay">Initial Pay</option>
        </select>

        {SelectedTypeModal && (
          <div className="space-y-4">
            <input
              name="Estimated Amount"
              type="number"
              step="0.01"
              placeholder="Enter Pay Amount ₹"
              
              className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none transition"
              required
            />
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
              <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-1">
                Estimated Loan Pay Amount
              </p>
              <p className="text-3xl font-bold text-green-900">
                ₹{estimatedAmount > 0 ? estimatedAmount.toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          type="button"
          onClick={() => setPayLoanModal(false)}
          className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg flex-1 font-semibold hover:bg-gray-200 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-3 rounded-lg flex-1 font-semibold hover:bg-green-700 shadow-sm transition"
        >
          Pay Amount
        </button>
      </div>
    </form>

  </div>
</div>
      )}
    </div>
  );
}
