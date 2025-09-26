import { JitsiMeeting } from "@jitsi/react-sdk";
import React from "react";
import ConsultationApp from "./ConsultationApp";
import Navbar from "./components/Navbar";
import "./App.css";

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <ConsultationApp />
    </div>
  );
};

export default App;