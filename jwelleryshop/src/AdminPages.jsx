import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Users, ArrowRightLeft, UserCircle, Wallet, Lock, TrendingUp, LogOut, Landmark
} from "lucide-react";

import WorkersTab from "./tabs/WorkersTab";
import TransactionTab from "./tabs/TransactionTab";
import CustomersTab from "./tabs/CustomersTab";
import LoansTab from "./tabs/LoansTab";
import LockerTab from "./tabs/LockerTab";
import RatesTab from "./tabs/RatesTab";
import ProfileTab from "./tabs/ProfileTab";

const TABS = [
  { id: "பணியாளர்கள்", label: "பணியாளர்கள் (Workers)", icon: <Users size={18} />, allowedRole: "superadmin" },
  { id: "பரிவர்த்தனைகளின்", label: "பரிவர்த்தனைகள்", icon: <ArrowRightLeft size={18} />, allowedRole: "worker" },
  { id: "வாடிக்கையாளர்களின்", label: "வாடிக்கையாளர்கள்", icon: <UserCircle size={18} />, allowedRole: "worker" },
  { id: "கடன்களின்", label: "கடன்கள்", icon: <Wallet size={18} />, allowedRole: "worker" },
  { id: "லாக்கர்", label: "பெட்டகங்கள்", icon: <Lock size={18} />, allowedRole: "worker" },
  { id: "விகித", label: "விகிதங்கள்", icon: <TrendingUp size={18} />, allowedRole: "worker" },
  { id: "சுய", label: "சுயவிவரம்", icon: <Lock size={18} />, allowedRole: "worker" },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("role") || "worker";
  const [activeTab, setActiveTab] = useState(userRole === "superadmin" ? "பணியாளர்கள்" : "பரிவர்த்தனைகளின்");
  const [shopProfile, setShopProfile] = useState({});

  

  useEffect(() => {
    const fetchShopProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/shop-profile", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setShopProfile(res.data);
    } catch (err) { console.error(err); }
  };
    fetchShopProfile();
  }, []);

  

  const renderTabContent = () => {
    switch (activeTab) {
      case "பணியாளர்கள்": return <WorkersTab />;
      case "பரிவர்த்தனைகளின்": return <TransactionTab />;
      case "வாடிக்கையாளர்களின்": return <CustomersTab />;
      case "கடன்களின்": return <LoansTab />;
      case "லாக்கர்": return <LockerTab />;
      case "விகித": return <RatesTab />;
      case "சுய": return <ProfileTab />;
      default: return userRole === "superadmin" ? <WorkersTab /> : <TransactionTab />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-12">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 shadow-sm">
        <div className="max-w-400 mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-20 h-10 bg-linear-to-broom-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
              <span className="text-white font-bold text-xl">{shopProfile?.shopimage ? (
                    <img
                      src={`http://localhost:5000/uploads/${shopProfile.shopimage}`}
                      alt="Shop Logo"
                      className="w-20 h-20 object-contain mb-3 rounded-xl print:w-16 print:h-16"
                    />
                  ) : (
                    <div className="inline-flex items-center justify-center bg-amber-100 text-amber-600 w-12 h-12 rounded-full mb-3 print:hidden shadow-sm">
                      <span className="text-2xl">
                        <Landmark />
                      </span>
                    </div>
                  )}</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
                {userRole === "superadmin" ? "InfoZenX_It" : shopProfile.shopName || "Jewelry Shop"}
              </h1>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-400 uppercase">Today's Date</p>
              <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('ta-IN')}</p>
            </div>
            <button onClick={() => { localStorage.clear(); navigate("/"); }} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-400 mx-auto px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {TABS.filter(t => t.allowedRole === userRole).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 cursor-pointer px-6 py-3 rounded-2xl whitespace-nowrap transition-all border-2 ${
                activeTab === tab.id 
                ? "bg-white border-rose-500 text-rose-600 shadow-md -translate-y-0.5" 
                : "bg-white border-transparent text-slate-500 hover:border-slate-200 shadow-sm"
              }`}
            >
              {tab.icon}
              <span className="font-bold text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 animate-in fade-in duration-500">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}