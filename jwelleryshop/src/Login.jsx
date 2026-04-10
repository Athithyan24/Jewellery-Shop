import { useState} from "react";
import axios from "axios";
import AdminPage from "./AdminPages";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isloading, setisloading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setisloading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        username,
        password,
    });
      const data = response.data;
      
      
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.role);
          localStorage.setItem("username", data.username);
          localStorage.setItem("shoptype", data.shoptype); 
        }
        setIsLoggedIn(true);
        navigate("/admin");
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please check your server.");
      }
    } finally {
      setisloading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          {/* Header Section */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            Welcome Back
          </h2>

          {/* Error Message Display - Added this so users can see login failures */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center mb-4 border border-red-200">
              {error}
            </div>
          )}

          {/* Form Section */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Input Group */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your username"
                required
              />
            </div>

            {/* Password Input Group */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center items-center">
              <button
                className={`text-white font-bold px-8 py-2 rounded-3xl duration-200 shadow-md ${
                  isloading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 hover:scale-110 cursor-pointer"
                }`}
                type="submit"
                disabled={isloading}
              >
                {isloading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>

      
      {isLoggedIn && <AdminPage />}
    </>
  );
}
