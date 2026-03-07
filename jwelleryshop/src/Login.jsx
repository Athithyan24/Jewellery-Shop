import {useState, useEffect} from 'react';
import axios from 'axios';
import AdminPage from './AdminPage';
import { useNavigate } from 'react-router-dom';

export default function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/api/login", { username, password });
            const { token, role } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("role", role);
            navigate("/admin");
            setIsLoggedIn(true);
        } catch (error) {

            alert(error.response?.data?.message || "Login failed");
        }
    }


    
    return(
        <>
        
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        
        {/* Header Section */}
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Welcome Back
        </h2>

        {/* Form Section */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Username Input Group */}
          <div>
            <label 
              htmlFor="username" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Login
          </button>
          
        </form>
      </div>
    </div>

    {isLoggedIn && <AdminPage />}
        </>
    )
}
