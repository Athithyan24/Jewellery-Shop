import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import infozenxLogo from "./assets/infozenxit.jpg";
import {
  Users,
  ArrowRightLeft,
  UserCircle,
  Wallet,
  Lock,
  TrendingUp,
  LogOut,
  Landmark,
} from "lucide-react";

import WorkersTab from "./tabs/WorkersTab";
import TransactionTab from "./tabs/TransactionTab";
import CustomersTab from "./tabs/CustomersTab";
import LoansTab from "./tabs/LoansTab";
import LockerTab from "./tabs/LockerTab";
import RatesTab from "./tabs/RatesTab";
import ProfileTab from "./tabs/ProfileTab";

const TABS = [
  {
    id: "பணியாளர்கள்",
    label: "பணியாளர்கள் (Workers)",
    icon: <Users size={18} />,
    allowedRole: "superadmin",
  },
  {
    id: "பரிவர்த்தனைகளின்",
    label: "பரிவர்த்தனைகள்",
    icon: <ArrowRightLeft size={18} />,
    allowedRole: "worker",
  },
  {
    id: "வாடிக்கையாளர்களின்",
    label: "வாடிக்கையாளர்கள்",
    icon: <UserCircle size={18} />,
    allowedRole: "worker",
  },
  {
    id: "கடன்களின்",
    label: "கடன்கள்",
    icon: <Wallet size={18} />,
    allowedRole: "worker",
  },
  {
    id: "லாக்கர்",
    label: "பெட்டகங்கள்",
    icon: <Landmark size={18} />,
    allowedRole: "worker",
  },
  {
    id: "விகித",
    label: "விகிதங்கள்",
    icon: <TrendingUp size={18} />,
    allowedRole: "worker",
  },
  {
    id: "சுய",
    label: "சுயவிவரம்",
    icon: <Lock size={18} />,
    allowedRole: "worker",
  },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("role") || "worker";
  const [activeTab, setActiveTab] = useState(
    userRole === "superadmin" ? "பணியாளர்கள்" : "பரிவர்த்தனைகளின்",
  );
  const [shopProfile, setShopProfile] = useState({});

  useEffect(() => {
    const fetchShopProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/shop-profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setShopProfile(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchShopProfile();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "பணியாளர்கள்":
        return <WorkersTab />;
      case "பரிவர்த்தனைகளின்":
        return <TransactionTab />;
      case "வாடிக்கையாளர்களின்":
        return <CustomersTab />;
      case "கடன்களின்":
        return <LoansTab />;
      case "லாக்கர்":
        return <LockerTab />;
      case "விகித":
        return <RatesTab />;
      case "சுய":
        return <ProfileTab />;
      default:
        return userRole === "superadmin" ? <WorkersTab /> : <TransactionTab />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent font-inter pb-12">
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-400 mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-linear-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200 overflow-hidden shrink-0">
              {shopProfile?.shopimage ? (
                <img
                  src={`http://localhost:5000/uploads/${shopProfile.shopimage}`}
                  alt="Shop Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center text-white">
                  <img src={infozenxLogo} size={28} strokeWidth={2.5} />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-bold text-slate-900 leading-snug tracking-tight">
                {userRole === "superadmin"
                  ? "InfoZenX IT"
                  : shopProfile?.shopName || "Jewelry Shop"}
              </h1>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-widest mt-0.5">
                {userRole === "superadmin"
                  ? "Super Admin"
                  : "Management System"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
  <div className="hidden md:block text-right">
    <p className="text-xs font-bold text-slate-400 uppercase">
      Today's Date
    </p>
    <p className="text-sm font-bold text-slate-700">
      {new Date().toLocaleDateString("ta-IN")}
    </p>
  </div>

  <button
    onClick={() => {
      localStorage.clear();
      navigate("/");
    }}
    className="group relative flex items-center justify-start w-11 h-11 bg-rose-500 rounded-full cursor-pointer overflow-hidden transition-all duration-300 shadow-lg hover:w-32 hover:rounded-2xl active:translate-x-0.5 active:translate-y-0.5"
  >
    <div className="flex items-center justify-center w-full transition-all duration-300 group-hover:w-[30%] group-hover:pl-4">
      <LogOut size={18} className="text-white" strokeWidth={2.5} />
    </div>

    <div className="absolute right-0 opacity-0 text-white text-sm font-bold pr-4 transition-all duration-300 group-hover:opacity-100 group-hover:w-[70%] group-hover:static">
      Logout
    </div>
  </button>
</div>
        </div>
      </nav>

      <div className="max-w-full mx-auto px-4 mt-6">
  <div className="sticky z-50 top-16 backdrop-blur-sm py-4 mb-4 w-full px-2">
    
    <div className="flex justify-center gap-3 overflow-x-auto pb-4 pt-2 no-scrollbar w-full">
      {TABS.filter((t) => t.allowedRole === userRole).map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`group relative outline-none print:hidden transition-all duration-300 ${
              isActive ? "-translate-y-0.5" : "hover:-translate-y-0.5"
            }`}
          >
            <div
              className={`relative overflow-hidden rounded-2xl p-[1px] transition-all duration-300 ${
                isActive
                  ? "bg-linear-to-bl from-rose-400 via-rose-500 to-rose-600 shadow-lg shadow-rose-500/30"
                  : "bg-slate-200 shadow-sm group-hover:bg-rose-300"
              }`}
            >
              <div
                className={`relative flex items-center gap-3 rounded-2xl px-5 py-2.5 transition-all duration-300 ${
                  isActive ? "bg-white" : "bg-white group-hover:bg-rose-50/80"
                }`}
              >
                <div
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 ${
                    isActive
                      ? "bg-linear-to-br from-rose-400 to-rose-600 text-white"
                      : "bg-slate-100 text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600"
                  }`}
                >
                  <div className="relative z-10 flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
                    {tab.icon}
                  </div>

                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-rose-500/50 blur-sm transition-all duration-300 group-hover:blur-md"></div>
                  )}
                </div>

                <span
                  className={`font-bold text-sm whitespace-nowrap transition-colors duration-300 ${
                    isActive ? "text-slate-800" : "text-slate-500 group-hover:text-rose-700"
                  }`}
                >
                  {tab.label}
                </span>

                {isActive && (
                  <div className="ml-2 flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-600 transition-transform duration-300 group-hover:scale-150"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-400 transition-transform duration-300 group-hover:scale-150 group-hover:delay-75"></div>
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-300 transition-transform duration-300 group-hover:scale-150 group-hover:delay-150"></div>
                  </div>
                )}
              </div>

              {isActive && (
                <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-rose-400 via-rose-500 to-rose-600 opacity-0 transition-opacity duration-300 group-hover:opacity-10 pointer-events-none"></div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  </div>

  <div className="animate-in fade-in duration-500 min-w-0">
    {renderTabContent()}
  </div>
</div>
      {userRole === "worker" && (
        <div className="fixed bottom-4 right-6 pointer-events-none z-50 select-none opacity-40 text-right print:hidden">
          <div className="flex">
            <img
              src={infozenxLogo}
              alt="InfoZenX Logo"
              className="w-15 h-15 mr-2"
            />
            <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase drop-shadow-sm">
              InfoZenX IT
            </h1>
          </div>
          <p className="text-[12px] font-bold text-slate-600 mt-0.5 drop-shadow-sm">
            Upstair, Tower Jn, Sivaraj Building 2nd Floor,
          </p>
          <p className="text-[12px] font-bold text-slate-600 drop-shadow-sm">
            Rose Centre, Nagercoil, Tamil Nadu 629001
          </p>
          <p className="text-[12px] font-bold text-slate-600 drop-shadow-sm">
            +91 94861 88648
          </p>
          <p className="text-[12px] font-bold text-slate-600 drop-shadow-sm">
            +91 72002 86091
          </p>
        </div>
      )}
    </div>
  );
}
