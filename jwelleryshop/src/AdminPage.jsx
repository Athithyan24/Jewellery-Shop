import { useState, useEffect } from "react";
import axios from "axios";

const TABS = [
  {
    id: "transaction",
    label: "Transaction",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 text-black mr-1",
    endpoint: "/api/transactions",
  },
  {
    id: "customers",
    label: "Customers",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 mx-1 text-black",
    endpoint: "/api/customers",
  },
  {
    id: "loans",
    label: "Loans",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 mx-1 text-black",
    endpoint: "/api/loans",
  },
  {
    id: "settings",
    label: "Settings",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 mx-1 text-black",
    endpoint: "/api/settings",
  },
  {
    id: "profile",
    label: "Profile",
    colorClass: "bg-white cursor-pointer hover:bg-gray-100 mx-1 text-black",
    endpoint: "/api/profile",
  },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [tabData, setTabData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [CustomerModal, setCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    dob: "",
    address: "",
    aadhar: "",
    aadharimage: "",
    recentimage: "",
    email: "",
    phone: "",
  });

  const handleChange = (e) => {
    setForm({ 
      ...form, 
     [e.target.name]: e.target.value });
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/customers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCustomers(res.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/customers",
        form,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      alert(res.data.message);
      setCustomerModal(false);
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
        if (activeTab === "customers") {
          await fetchCustomers();
        }
        await new Promise((resolve) => setTimeout(resolve, 600));
        setTabData(
          `Data fetched securely for the ${currentTab.label} dashboard.`,
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
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
            {activeTab} Management
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="text-gray-600 text-lg">
              <p className="mb-4">{tabData}</p>

              {/* Only show the table if we are on the customers tab and the modal is CLOSED */}
              {activeTab === "customers" && !CustomerModal && (
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                          Name
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                          Phone
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                          Aadhar
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">
                          Address
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length > 0 ? (
                        customers.map((customer) => (
                          <tr
                            key={customer._id}
                            className="border-b border-gray-100 hover:bg-gray-50">
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

              {activeTab === "customers" && (
                <>
                  <button
                    onClick={() => setCustomerModal(true)}
                    className="mt-4 cursor-pointer bg-blue-100 text-blue-700 px-4 py-2 rounded-md font-semibold hover:bg-blue-200 transition">
                    + Add New Customer
                  </button>
                </>
              )}
              {CustomerModal && activeTab === "customers" && (
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
                      placeholder="Full Address"
                      onChange={handleChange}
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                    <input
                      name="aadhar"
                      placeholder="Aadhar Number"
                      onChange={handleChange}
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                    <input
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      onChange={handleChange}
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                    <input
                      name="phone"
                      placeholder="Phone Number"
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
      </div>
    </div>
  );
}
