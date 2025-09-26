import { JitsiMeeting } from "@jitsi/react-sdk";
import React, { useState, useEffect, useRef } from "react";
import "./consultationRoom.css";

const ConsultationRoom = ({ userType = "patient", doctorName, patientName, roomId }) => {
  const [isWaiting, setIsWaiting] = useState(true);
  const [participantCount, setParticipantCount] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const jitsiRef = useRef(null);

  const doctorInfo = {
    name: doctorName || "Dr Mohamed Bouy",
    avatar: "/api/placeholder/120/120",
    speciality: "Médecin Généraliste"
  };

  const patientInfo = {
    name: patientName || "Patient",
    avatar: "/api/placeholder/120/120"
  };

  // Configuration Jitsi personnalisée
  const jitsiConfig = {
    prejoinPageEnabled: false,
    subject: `Consultation avec ${doctorInfo.name}`,
    startWithAudioMuted: userType === "patient",
    startWithVideoMuted: false,
    enableWelcomePage: false,
    disableModeratorIndicator: false,
    startScreenSharing: false,
    enableEmailInStats: false,
    enableCalendarIntegration: false,
    analytics: {
      disabled: true
    },
    p2p: {
      enabled: true
    }
  };

  const jitsiInterfaceConfig = {
    TOOLBAR_BUTTONS: [
      "microphone",
      "camera", 
      "chat",
      "raisehand",
      "tileview",
      "settings",
      "hangup"
    ],
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    HIDE_INVITE_MORE_HEADER: true,
    MOBILE_APP_PROMO: false,
    SHOW_CHROME_EXTENSION_BANNER: false,
    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
    TOOLBAR_ALWAYS_VISIBLE: true,
    DEFAULT_BACKGROUND: "#f8f9fa",
    INITIAL_TOOLBAR_TIMEOUT: 20000,
    TOOLBAR_TIMEOUT: 4000
  };

  // Gestion des événements Jitsi
  const handleApiReady = (api) => {
    jitsiRef.current = api;
    
    // Événements de participation
    api.addEventListener('participantJoined', (participant) => {
      console.log('Participant a rejoint:', participant);
      setParticipantCount(prev => prev + 1);
      if (participantCount >= 1) {
        setIsWaiting(false);
        setConnectionStatus("connected");
      }
    });

    api.addEventListener('participantLeft', (participant) => {
      console.log('Participant a quitté:', participant);
      setParticipantCount(prev => Math.max(1, prev - 1));
      if (participantCount <= 1) {
        setIsWaiting(true);
        setConnectionStatus("waiting");
      }
    });

    // Événements de connexion
    api.addEventListener('videoConferenceJoined', () => {
      setConnectionStatus("connected");
    });

    api.addEventListener('readyToClose', () => {
      console.log('Consultation terminée');
    });

    setConnectionStatus("connected");
  };

  // Style du container Jitsi
  const handleJitsiIFrameRef = (iframeRef) => {
    if (iframeRef) {
      iframeRef.style.border = "none";
      iframeRef.style.borderRadius = "12px";
      iframeRef.style.height = "100vh";
      iframeRef.style.width = "100%";
      iframeRef.style.background = "#f8f9fa";
    }
  };

  // Simulation pour la démo (retirer en production)
  useEffect(() => {
    const timer = setTimeout(() => {
      setParticipantCount(2);
      setIsWaiting(false);
      setConnectionStatus("connected");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="consultation-wrapper">
      {/* Indicateur de statut */}
      <div className={`connection-indicator ${connectionStatus}`}>
        {connectionStatus === "connecting" && "Connexion..."}
        {connectionStatus === "waiting" && `En attente ${userType === "patient" ? "du médecin" : "du patient"}`}
        {connectionStatus === "connected" && "Consultation en cours"}
      </div>

      {/* Overlay de salle d'attente */}
      {isWaiting && (
        <div className="waiting-overlay">
          <div className="waiting-card">
            <div className="doctor-profile">
              <div className="doctor-avatar-container">
                <img 
                  src={doctorInfo.avatar} 
                  alt={doctorInfo.name}
                  className="doctor-avatar-img"
                />
                <div className="status-indicator"></div>
              </div>
              <h2 className="doctor-name">En attente de {doctorInfo.name}</h2>
              <p className="doctor-speciality">{doctorInfo.speciality}</p>
            </div>
            
            <div className="waiting-message">
              <p>
                Vous serez informé(e) lorsque le {doctorInfo.name} rejoindra la consultation vidéo.
                <br />
                Veuillez rester en ligne et garder cette fenêtre ouverte.
              </p>
            </div>

            <div className="loading-animation">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>

          {/* Prévisualisation vidéo du patient */}
          <div className="patient-video-preview">
              <img 
                src={patientInfo.avatar} 
                alt="Votre vidéo"
                className="patient-preview-img"
              />
              <div className="video-controls">
                <button className="control-btn mute-btn">
                  <span>🎤</span>
                </button>
                <button className="control-btn video-btn">
                  <span>📹</span>
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Interface Jitsi */}
      <div className={`jitsi-meeting-container ${isWaiting ? 'hidden' : 'visible'}`}>
        <JitsiMeeting
          domain="be086463d405.ngrok-free.app"
          roomName={roomId || `consultation-${Date.now()}`}
          configOverwrite={jitsiConfig}
          interfaceConfigOverwrite={jitsiInterfaceConfig}
          userInfo={{
            displayName: userType === "patient" ? patientInfo.name : doctorInfo.name,
          }}
          onApiReady={handleApiReady}
          getIFrameRef={handleJitsiIFrameRef}
        />
      </div>

      {/* Footer avec informations légales */}
      <div className="consultation-footer">
        <div className="footer-links">
          <span>Conditions Générales d'Utilisation</span>
          <span>•</span>
          <span>Mentions légales</span>
          <span>•</span>
          <span>Politique de Confidentialité</span>
          <span>•</span>
          <span>Politique en matière des Cookies</span>
        </div>
      </div>
    </div>
  );
};

export default ConsultationRoom;