import {HashRouter, Routes, Route} from "react-router-dom";
import Login from "./Login";
import AdminPage from "./AdminPage";
import './App.css'

function App() {
 

  return (
    <>
      
        <HashRouter>
        
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </HashRouter>
      
    </>
  )
}

export default App
