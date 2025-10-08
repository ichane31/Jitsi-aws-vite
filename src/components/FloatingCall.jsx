import React, { useRef } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useCall } from "../hooks/useCall.js";

export const FloatingCall = () => {
  const { roomId, userType, setJitsiApi } = useCall();
  const iframeRef = useRef(null);

  const jitsiConfig = {
    prejoinPageEnabled: false,
    startWithAudioMuted: userType === "patient",
    startWithVideoMuted: false,
    enableWelcomePage: false,
    disableModeratorIndicator: true,
    p2p: { enabled: false },
  };

  const jitsiInterfaceConfig = {
    TOOLBAR_BUTTONS: ["microphone", "hangup", "camera"],
    SHOW_JITSI_WATERMARK: false,
    TOOLBAR_ALWAYS_VISIBLE: false,
  };

  const handleApiReady = (api) => {
    setJitsiApi(api);
  };

  const handleIframeRef = (ref) => {
    if (ref) {
      iframeRef.current = ref;
      ref.style.border = "none";
      ref.style.borderRadius = "12px";
      ref.style.height = "100%";
      ref.style.width = "100%";
    }
  };

  if (!roomId) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        width: "320px",
        height: "180px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        zIndex: 9999,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <JitsiMeeting
        domain="jitsi-meet-clinital.duckdns.org"
        roomName={roomId}
        configOverwrite={jitsiConfig}
        interfaceConfigOverwrite={jitsiInterfaceConfig}
        userInfo={{ displayName: userType }}
        getIFrameRef={handleIframeRef}
        onApiReady={handleApiReady}
      />
    </div>
  );
};
export default FloatingCall;