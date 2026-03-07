import {BrowserRouter, Routes, Route} from "react-router-dom";
import Login from "./Login";
import AdminPage from "./AdminPage";
import './App.css'

function App() {
 

  return (
    <>
      <header className="App-header flex  items-center justify-center bg-amber-300">
        <h1 className=" 
      justify-center text-5xl h-15  uppercase font-bold
      font-serif text-red-500">Jewellery Shop</h1>
      </header>
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
