import './App.css';
import { Routes, Route} from "react-router-dom";

import Map from './components/Map';
import Home from './components/Home';

function App() {
  return (
    <>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/map" element={<Map />} />      
      </Routes>
    </>
  );
}

export default App;
