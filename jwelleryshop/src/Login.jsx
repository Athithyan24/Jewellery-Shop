import { useState } from "react";
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

  // --- NEW LICENSE RENEWAL STATES ---
  const [isExpired, setIsExpired] = useState(false);
  const [showRenewInput, setShowRenewInput] = useState(false);
  const [renewalKey, setRenewalKey] = useState("");

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
      if (err.response && err.response.data) {
        // Check if the backend flagged this as an expired license
        if (err.response.data.isExpired) {
          setIsExpired(true);
        }
        setError(err.response.data.message || "Login failed");
      } else {
        setError("Something went wrong. Please check your server.");
      }
    } finally {
      setisloading(false);
    }
  };

  const handleRenewal = async () => {
    if (!renewalKey) return;
    
    try {
      const response = await axios.post("http://localhost:5000/api/renew-license", {
        secretKey: renewalKey
      });
      
      alert(response.data.message);
      setIsExpired(false); // Immediately unlock the screen
      setShowRenewInput(false);
      setRenewalKey("");
      setError(""); // Clear the expiration error
      
    } catch (err) {
      alert(err.response?.data?.message || "Invalid Key");
    }
  };

  return (
    <>
      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="login.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/40 z-0 backdrop-blur-[2px]"></div>

        <div className="relative z-10 max-w-md w-full bg-white/90 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8">

          {/* 🔒 IF EXPIRED: SHOW LOCK SCREEN */}
          {isExpired ? (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Access Locked</h2>
              <p className="text-red-600 font-bold mb-4">{error}</p>
              <p className="text-sm text-gray-600 mb-8 font-medium">
                Your software license has expired. Please contact InfoZenX IT to get your renewal key and regain access.
              </p>

              {/* RENEWAL INPUT SECTION */}
              {showRenewInput ? (
                <div className="w-full flex gap-2 mb-4 animate-in slide-in-from-bottom-2">
                  <input
                    type="password"
                    placeholder="Enter Renewal Key"
                    value={renewalKey}
                    onChange={(e) => setRenewalKey(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 outline-none text-center tracking-widest font-bold shadow-sm"
                  />
                  <button 
                    onClick={handleRenewal}
                    className="bg-green-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-green-700 transition-all shadow-md">
                    Unlock
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowRenewInput(true)}
                  className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all mb-3 shadow-md">
                  I have a Renewal Key
                </button>
              )}

              <button 
                onClick={() => window.close()} 
                className="w-full bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-300 transition-all">
                Close Application
              </button>
            </div>
          ) : (
            
          /* 🔓 IF NOT EXPIRED: SHOW NORMAL LOGIN FORM */
            <div className="animate-in fade-in duration-500">
              <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-8 tracking-tight">
                Welcome Back
              </h2>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold text-center mb-6 border border-red-200 shadow-sm animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-8">
                {/* Username Input Group */}
                <div className="relative flex w-full h-14">
                  <input
                    id="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder=" "
                    className="peer w-full bg-white/70 outline-none px-4 text-base rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:shadow-md transition-all font-medium"
                  />
                  <label
                    htmlFor="username"
                    className="absolute top-1/2 -translate-y-1/2 left-4 px-2 bg-transparent text-gray-500 pointer-events-none transition-all duration-200 
                    peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:bg-white
                    peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:text-blue-600 peer-[:not(:placeholder-shown)]:bg-white"
                  >
                    Username
                  </label>
                </div>

                {/* Password Input Group */}
                <div className="relative flex w-full h-14">
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=" " 
                    className="peer w-full bg-white/70 outline-none px-4 text-base rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:shadow-md transition-all font-medium"
                  />
                  <label
                    htmlFor="password"
                    className="absolute top-1/2 -translate-y-1/2 left-4 px-2 bg-transparent text-gray-500 pointer-events-none transition-all duration-200 
                    peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:bg-white
                    peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-sm peer-[:not(:placeholder-shown)]:text-blue-600 peer-[:not(:placeholder-shown)]:bg-white"
                  >
                    Password
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isloading}
                    className={`group relative flex items-center justify-start min-w-full h-[52px] rounded-xl overflow-hidden transition-all duration-[0.8s] ease-[cubic-bezier(0.51,0.026,0.368,1.016)] shadow-lg 
                      ${isloading 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-blue-500/30"
                      }`}
                  >
                    <div className="absolute inset-0 flex items-center px-1.5 py-1 justify-start">
                      <div className={`transition-all duration-[0.8s] ease-[cubic-bezier(0.51,0.026,0.368,1.016)] 
                        ${isloading ? "w-0" : "w-0 group-hover:w-[calc(100%-42px)]"}`} 
                      />
                      <div className={`shrink-0 flex justify-center items-center rounded-lg h-full aspect-square transition-all duration-[0.8s] ease-[cubic-bezier(0.51,0.026,0.368,1.016)] shadow-inner
                        ${isloading ? "bg-white/20" : "bg-white group-hover:bg-black"}`}
                      >
                        <div className={`w-5 h-5 transition-all duration-[0.8s] ease-[cubic-bezier(0.51,0.026,0.368,1.016)]
                          ${isloading ? "" : "text-blue-600 group-hover:text-white group-hover:-rotate-45"}`}
                        >
                          {isloading ? (
                            <svg className="animate-spin text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg fill="none" viewBox="0 0 16 16" height="100%" width="100%">
                              <path fill="currentColor" d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`w-full font-bold text-white transition-all duration-[0.8s] ease-[cubic-bezier(0.51,0.026,0.368,1.016)]
                      ${isloading 
                        ? "pl-14 text-left" 
                        : "pl-14 pr-4 group-hover:pl-4 group-hover:pr-14 group-hover:text-black text-center"
                      }`}
                    >
                      {isloading ? "Logging in..." : "Login Securely"}
                    </div>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {isLoggedIn && <AdminPage />}
    </>
  );
}