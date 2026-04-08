import {HashRouter, Routes, Route} from "react-router-dom";
import Login from "./Login";
import AdminPages from "./AdminPages";
import './App.css'

function App() {
 

  return (
    <>
      
        <HashRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/admin" element={<AdminPages />} />
          </Routes>
        </HashRouter>
      
    </>
  )
}

export default App
