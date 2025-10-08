import { JitsiMeeting } from "@jitsi/react-sdk";
import React, { useState, useRef, useEffect , useCallback } from "react";
import patientImage from "./assets/images/patient.png";
import doctorImage from "./assets/images/doctor.png";
import "./App.css";

const OtherPage = ({
  patient,
  doctor,
  roomId = "test123",
  userType = "patient",
}) => {
  const pipVideoRef = useRef(null);
  const apiRef = useRef(null);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isPipReady, setIsPipReady] = useState(false);
  const [showPipButton, setShowPipButton] = useState(false);
  const [autoPipEnabled] = useState(true); // Option pour désactiver l'auto-PiP

  const patientInfo = {
    name: patient?.nom || "Patient",
    avatar: patientImage,
  };

  const doctorInfo = {
    name: doctor?.nom || "Dr Mohamed Bouy",
    avatar: doctorImage,
    speciality: doctor?.specialite || "Médecin Généraliste",
  };

  // Gérer l'API Jitsi
  const handleApiReady = (api) => {
    apiRef.current = api;
    console.log("API Jitsi prête");

    // Écouter quand la conférence est rejointe
    api.addEventListener('videoConferenceJoined', async () => {
      console.log('Conférence rejointe');
      setShowPipButton(true);
      
      // Capturer le flux vidéo après un court délai
      setTimeout(() => {
        captureJitsiVideo();
      }, 2000);
    });

    api.addEventListener('videoConferenceLeft', () => {
      console.log('Conférence quittée');
      setShowPipButton(false);
      exitPictureInPicture();
    });
  };

    // Créer une vidéo de secours si la capture échoue
  const createFallbackVideo = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    // Dessiner un fond avec du texte
    ctx.fillStyle = '#1a73e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Consultation en cours', canvas.width / 2, canvas.height / 2);
    
    const stream = canvas.captureStream(30);
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject = stream;
      pipVideoRef.current.play();
      setIsPipReady(true);
    }
  }, [pipVideoRef]);

  // Capturer le flux vidéo de Jitsi
  const captureJitsiVideo = useCallback(async () => {
    try {
      // Obtenir le flux vidéo de l'utilisateur local
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = stream;
        await pipVideoRef.current.play();
        setIsPipReady(true);
        console.log("Flux vidéo capturé pour PiP");
      }
    } catch (error) {
      console.error("Erreur lors de la capture vidéo:", error);
      // Fallback: créer un canvas avec un message
      createFallbackVideo();
    }
  }, [createFallbackVideo, pipVideoRef]);

  // Activer Picture-in-Picture
  const enterPictureInPicture = useCallback(async () => {
    if (!pipVideoRef.current || isPipActive) return;

    try {
      // S'assurer que la vidéo est prête
      if (!isPipReady) {
        await captureJitsiVideo();
        // Attendre que la vidéo soit chargée
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await pipVideoRef.current.requestPictureInPicture();
      console.log("Mode Picture-in-Picture activé automatiquement");
    } catch (error) {
      console.error("Erreur Picture-in-Picture:", error);
    }
  }, [isPipActive, isPipReady, captureJitsiVideo]);

  // Désactiver Picture-in-Picture
  const exitPictureInPicture = useCallback(async () => {
    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
        console.log("Mode Picture-in-Picture désactivé automatiquement");
      } catch (error) {
        console.error("Erreur lors de la sortie du PiP:", error);
      }
    }
  }, []);

  // Activer/désactiver Picture-in-Picture manuellement
  const togglePictureInPicture = async () => {
    if (!pipVideoRef.current) return;

    try {
      if (!document.pictureInPictureElement) {
        await enterPictureInPicture();
      } else {
        await exitPictureInPicture();
      }
    } catch (error) {
      console.error("Erreur Picture-in-Picture:", error);
      alert("Impossible d'activer le Picture-in-Picture. Assurez-vous d'avoir autorisé l'accès à la caméra.");
    }
  };

  // Gérer automatiquement le PiP selon la visibilité de l'onglet
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Si l'auto-PiP est désactivé, ne rien faire
      if (!autoPipEnabled) return;

      if (document.hidden) {
        // Onglet caché - activer PiP
        console.log("Onglet masqué - activation automatique du PiP");
        await enterPictureInPicture();
      } else {
        // Onglet visible - désactiver PiP
        console.log("Onglet visible - désactivation automatique du PiP");
        await exitPictureInPicture();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPipReady, autoPipEnabled, enterPictureInPicture, exitPictureInPicture]);

  // Gérer les événements PiP pour mettre à jour l'état
  useEffect(() => {
    const handleEnterPip = () => {
      setIsPipActive(true);
      console.log("Entré en mode PiP");
    };

    const handleLeavePip = () => {
      setIsPipActive(false);
      console.log("Sorti du mode PiP");
    };

    const videoElement = pipVideoRef.current;
    if (videoElement) {
      videoElement.addEventListener('enterpictureinpicture', handleEnterPip);
      videoElement.addEventListener('leavepictureinpicture', handleLeavePip);

      return () => {
        videoElement.removeEventListener('enterpictureinpicture', handleEnterPip);
        videoElement.removeEventListener('leavepictureinpicture', handleLeavePip);
      };
    }
  }, []);

  useEffect(() => {
  const videoElement = pipVideoRef.current;

  return () => {
    if (videoElement && videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    exitPictureInPicture();
  };
}, [exitPictureInPicture]);


  const handleJitsiIFrameRef = (iframeRef) => {
    if (iframeRef) {
      iframeRef.style.border = "none";
      iframeRef.style.borderRadius = "12px";
      iframeRef.style.height = "100%";
      iframeRef.style.width = "100%";
      iframeRef.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.1)";
      iframeRef.style.overflow = "hidden";
    }
  };

  const handleReadyToClose = () => {
    console.log("Consultation terminée");
    exitPictureInPicture();
  };

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
    SHOW_WATERMARK_FOR_GUESTS: false,
    SHOW_BRAND_WATERMARK: false,
    BRAND_WATERMARK_LINK: '',
    LANG_DETECTION: true,
    CONNECTION_INDICATOR_DISABLED: false,
  };

  return (
    <>
      {/* Vidéo pour Picture-in-Picture */}
      <video
        ref={pipVideoRef}
        autoPlay
        muted={userType === "patient"}
        playsInline
        style={{
          position: 'fixed',
          top: '-1000px',
          left: '-1000px',
          width: '320px',
          height: '240px',
          opacity: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Boutons de contrôle PiP */}
      {showPipButton && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'flex-end'
        }}>
          {/* Bouton activation manuelle */}
          <button
            title="Quitter l'onglet / Activer l'incrustation"
            onClick={togglePictureInPicture}
            style={{
              padding: '10px 16px',
              backgroundColor: isPipActive ? '#dc3545' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
              <rect x="13" y="8" width="8" height="6" rx="1" />
            </svg>
          </button>
        </div>
      )}

      {/* Jitsi iframe */}
      <div className="jitsi-container">
        <JitsiMeeting
          domain="jitsi-meet-clinital.duckdns.org"
          externalApiUrl="https://jitsi-meet-clinital.duckdns.org/external_api.js"
          roomName={roomId || `test123`}
          onApiReady={handleApiReady}
          onReadyToClose={handleReadyToClose}
          configOverwrite={jitsiConfig}
          interfaceConfigOverwrite={jitsiInterfaceConfig}
          userInfo={{
            displayName:
              userType === "patient" ? patientInfo.name : doctorInfo.name,
          }}
          getIFrameRef={handleJitsiIFrameRef}
        />
      </div>
    </>
  );
};

export default OtherPage;