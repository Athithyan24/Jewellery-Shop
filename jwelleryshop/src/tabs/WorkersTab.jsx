import { useState, useEffect } from "react";
import axios from "axios";

export default function WorkersTab() {
  const [workers, setWorkers] = useState([]);
  const [workerUsername, setWorkerUsername] = useState("");
  const [workerPassword, setWorkerPassword] = useState("");
  const [workerShopname, setWorkerShopname] = useState("");
  const [isBackupMenuModalOpen, setIsBackupMenuModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState(null);

  const handleImportData = async () => {
    if (!selectedBackupFile) {
      return alert("கோப்பை தேர்ந்தெடுக்கவும்! (Select a file)");
    }

    try {
      const fileReader = new FileReader();
      fileReader.readAsText(selectedBackupFile, "UTF-8");

      fileReader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          const token = localStorage.getItem("token");
          
          const response = await axios.post(
            "http://localhost:5000/api/backup/import",
            { backupData: backupData }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );

          alert(response.data.message || "தரவு வெற்றிகரமாக மீட்டமைக்கப்பட்டது!");
          setImportModalOpen(false);
          setSelectedBackupFile(null);
          
          // Refresh workers list after import
          fetchWorkers();
        } catch (parseError) {
          alert("தவறான கோப்பு வடிவம் (Invalid backup file format)");
        }
      };
    } catch (err) {
      alert(err.response?.data?.message || "Import Failed");
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/users",
        {
          username: workerUsername,
          password: workerPassword,
          shopname: workerShopname,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      alert(res.data.message);

      setWorkerUsername("");
      setWorkerPassword("");
      setWorkerShopname("");
      const updatedRes = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const workerList = updatedRes.data.filter((user) => user.role !== "superadmin");
      setWorkers(workerList);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create worker.");
    }
  };
  const fetchWorkers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const workerList = res.data.filter((user) => user.role !== "superadmin");
        setWorkers(workerList);
      } catch (error) {
        console.error("Failed to fetch workers:", error);
      }
    };

  useEffect(() => {
    
    fetchWorkers();
  }, []);
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setImportModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-indigo-700 font-bold transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          தரவை மீட்டெடு (Import Admin Data)
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden h-fit">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
              <span className="text-2xl">👨‍💼</span> புதிய பணியாளர்
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              கடைக்கான புதிய பணியாளரை உருவாக்கவும்
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleCreateWorker} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  கடை பெயர் (Shop Name)
                </label>
                <input
                  required
                  type="text"
                  value={workerShopname}
                  onChange={(e) => setWorkerShopname(e.target.value)}
                  placeholder="எ.கா: Kovai Branch"
                  className="block w-full rounded-xl border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 font-bold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  பயனர் பெயர் (Username)
                </label>
                <input
                  required
                  type="text"
                  value={workerUsername}
                  onChange={(e) => setWorkerUsername(e.target.value)}
                  placeholder="எ.கா: worker_01"
                  className="block w-full rounded-xl border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 font-bold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  கடவுச்சொல் (Password)
                </label>
                <input
                  required
                  type="password"
                  value={workerPassword}
                  onChange={(e) => setWorkerPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 font-bold focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex justify-center items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                உருவாக்கு (Create)
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden col-span-1 lg:col-span-2 flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                <span className="text-2xl">📋</span> பணியாளர்கள் பட்டியல்
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                கடையின் அனைத்து பணியாளர்கள்
              </p>
            </div>
            <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
              Total: {workers.length}
            </span>
          </div>

          <div className="overflow-x-auto p-6 flex-1">
            <table className="min-w-full divide-y divide-slate-200 text-sm border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left font-extrabold text-slate-600 uppercase tracking-wider text-xs">
                    வ.எண்
                  </th>
                  <th className="px-6 py-4 text-left font-extrabold text-slate-600 uppercase tracking-wider text-xs">
                    பயனர் பெயர்
                  </th>
                  <th className="px-6 py-4 text-left font-extrabold text-slate-600 uppercase tracking-wider text-xs">
                    கடை பெயர்
                  </th>
                  <th className="px-6 py-4 text-left font-extrabold text-slate-600 uppercase tracking-wider text-xs">
                    பங்கு
                  </th>
                  <th className="px-6 py-4 text-center font-extrabold text-slate-600 uppercase tracking-wider text-xs">
                    செயல்
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {workers.length > 0 ? (
                  workers.map((worker, index) => (
                    <tr
                      key={worker._id}
                      className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-bold">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-black text-base">
                        {worker.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-bold">
                        {worker.shoptype}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm">
                          {worker.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-all"
                          title="பணியாளரை நீக்கு">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className="text-5xl opacity-50">📭</span>
                        <p className="text-slate-500 font-bold text-lg">
                          பணியாளர்கள் யாரும் இல்லை
                        </p>
                        <p className="text-slate-400 text-sm">
                          இடதுபுறம் உள்ள படிவத்தை பயன்படுத்தி புதிய பணியாளரை
                          உருவாக்கவும்.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isBackupMenuModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                  </svg>
                  தரவு மேலாண்மை (Data Options)
                </h3>
                <button
                  onClick={() => setIsBackupMenuModalOpen(false)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 bg-slate-50 rounded-full hover:bg-rose-50">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {/* Action List */}
              <div className="space-y-4">
                {/* Export Option */}

                {/* Import Option */}
                <div
                  onClick={() => {
                    setIsBackupMenuModalOpen(false); // Close menu
                    setImportModalOpen(true); // Open file upload modal
                  }}
                  className="p-4 border border-slate-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-rose-800">
                        தரவை மீட்டெடு (Import)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        பழைய காப்பு கோப்பை அமைப்பில் பதிவேற்றவும்.
                      </p>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded-lg group-hover:bg-rose-100 text-slate-500 group-hover:text-rose-600 transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {importModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-slate-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>

              <h2 className="text-2xl font-black text-slate-800 mb-2">தரவை மீட்டெடு (Import)</h2>
              <p className="text-sm text-slate-500 font-medium mb-6">
                பழைய காப்பு கோப்பை (Backup File) பதிவேற்றவும்.
              </p>

              <div className="w-full mb-6">
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setSelectedBackupFile(e.target.files[0])}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 transition-all border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setImportModalOpen(false);
                    setSelectedBackupFile(null);
                  }}
                  className="flex-1 px-4 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  ரத்து (Cancel)
                </button>
                <button
                  onClick={handleImportData}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-md active:scale-95"
                >
                  மீட்டெடு (Restore)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
