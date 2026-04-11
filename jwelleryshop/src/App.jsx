import { HashRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import AdminPages from "./AdminPages";

function App() {
  return (
    <div className="relative min-h-screen w-full ">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
        style={{ filter: "brightness(0.9) contrast(1.1)" }}
      >
        <source src="/bg1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="relative z-10 w-full min-h-screen">
        <HashRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/admin" element={<AdminPages />} />
          </Routes>
        </HashRouter>
      </div>
    </div>
  );
}

export default App;