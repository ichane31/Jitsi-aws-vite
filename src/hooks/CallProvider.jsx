import React, { useState } from "react";
import { CallContext } from "./CallContext";

export const CallProvider = ({ children }) => {
  const [jitsiApi, setJitsiApi] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [userType, setUserType] = useState("patient");
  const [activeCall, setActiveCall] = useState(false);

  return (
    <CallContext.Provider
      value={{
        jitsiApi,
        setJitsiApi,
        roomId,
        setRoomId,
        userType,
        setUserType,
        activeCall,
        setActiveCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
