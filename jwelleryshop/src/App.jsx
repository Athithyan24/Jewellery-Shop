import {BrowserRouter, Routes, Route} from "react-router-dom";
import Login from "./Login";
import AdminPage from "./AdminPage";
import './App.css'

function App() {
 

  return (
    <>
      
        <BrowserRouter>
        
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </BrowserRouter>
      
    </>
  )
}

export default App
