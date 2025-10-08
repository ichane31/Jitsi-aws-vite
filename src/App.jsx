import { JitsiMeeting } from "@jitsi/react-sdk";
import React from "react";
import ConsultationApp from "./ConsultationApp";
import ConsultationRoom from "./ConsultationRoom";
import OtherPage from "./OtherPage";
import Test from "./test";
import Navbar from "./components/Navbar";
import { CallProvider } from "./hooks/CallProvider";
import { FloatingCall } from "./components/FloatingCall";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

const App = () => {
  return (
    <div className="app">
      {/* <Navbar /> */}
      {/* <ConsultationApp /> */}
      <CallProvider>
      <Router>
        <FloatingCall />
        <Routes>
          <Route path="/" element={<ConsultationRoom roomId="test123" />} />
          <Route path="/other" element={<OtherPage />} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </Router>
    </CallProvider>
    </div>
  );
};


export default App;
