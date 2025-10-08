import { JitsiMeeting } from "@jitsi/react-sdk";
import React, { useState, useRef } from "react";
import patientImage from "./assets/images/patient.png";
import doctorImage from "./assets/images/doctor.png";
import "./App.css";

const Test = ({
  patient,
  doctor,
  roomId = "test123",
  userType = "patient",
}) => {
  const apiRef = useRef(null);
  const jitsiContainerRef = useRef(null);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isConferenceJoined, setIsConferenceJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(userType === "patient");
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const patientInfo = {
    name: patient?.nom || "Patient",
    avatar: patientImage,
  };

  const doctorInfo = {
    name: doctor?.nom || "Dr Mohamed Bouy",
    avatar: doctorImage,
    speciality: doctor?.specialite || "Médecin Généraliste",
  };

  // Vérifier si PiP est supporté
  const isPipSupported = () => {
    return 'pictureInPictureEnabled' in document;
  };

  // Créer le PiP
  const createPip = async () => {
    if (!isPipSupported()) {
      alert("Picture-in-Picture n'est pas supporté sur ce navigateur");
      return;
    }

    if (!jitsiContainerRef.current) {
      alert("La conférence n'est pas chargée");
      return;
    }

    try {
      // Créer un élément vidéo
      const video = document.createElement('video');
      video.width = 640;
      video.height = 360;
      video.muted = true;
      video.playsInline = true;
      video.style.backgroundColor = '#000';

      // Capturer le contenu de l'iframe Jitsi
      const jitsiIframe = jitsiContainerRef.current.querySelector('iframe');
      if (!jitsiIframe) {
        throw new Error("Iframe Jitsi non trouvée");
      }

      // Utiliser getDisplayMedia pour capturer l'onglet
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          cursor: 'never'
        },
        audio: false
      });

      video.srcObject = stream;

      video.onloadedmetadata = async () => {
        try {
          await video.play();
          await video.requestPictureInPicture();
          setIsPipActive(true);

          // Gérer la fermeture du PiP
          video.addEventListener('leavepictureinpicture', () => {
            cleanupPip(stream, video);
          });

          // Gérer la fin du stream
          stream.getVideoTracks()[0].addEventListener('ended', () => {
            cleanupPip(stream, video);
          });

        } catch (error) {
          console.error("Erreur activation PiP:", error);
          cleanupPip(stream, video);
        }
      };

    } catch (error) {
      console.error("Erreur création PiP:", error);
      if (error.name === 'NotAllowedError') {
        alert("Vous devez autoriser la capture d'écran pour utiliser le PiP");
      } else {
        alert("Erreur: " + error.message);
      }
    }
  };

  // Nettoyer le PiP
  const cleanupPip = (stream, video) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (video) {
      video.remove();
    }
    setIsPipActive(false);
  };

  // Toggle PiP
  const togglePip = async () => {
    if (isPipActive) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      }
      setIsPipActive(false);
    } else {
      await createPip();
    }
  };

  // Fonctions de contrôle
  const toggleMicrophone = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleAudio');
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleVideo');
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const hangupCall = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup');
    }
    setIsPipActive(false);
  };

  // Gérer l'API Jitsi
  const handleApiReady = (api) => {
    apiRef.current = api;
    console.log("API Jitsi prête");

    api.addEventListener('videoConferenceJoined', () => {
      console.log('Conférence rejointe');
      setIsConferenceJoined(true);
    });

    api.addEventListener('videoConferenceLeft', () => {
      console.log('Conférence quittée');
      setIsConferenceJoined(false);
      setIsPipActive(false);
    });

    api.addEventListener('audioMuteStatusChanged', (event) => {
      setIsMuted(event.muted);
    });

    api.addEventListener('videoMuteStatusChanged', (event) => {
      setIsVideoMuted(event.muted);
    });
  };

  const handleJitsiIFrameRef = (iframeRef) => {
    if (iframeRef) {
      iframeRef.style.border = "none";
      iframeRef.style.borderRadius = "12px";
      iframeRef.style.height = "100%";
      iframeRef.style.width = "100%";
    }
  };

  const handleReadyToClose = () => {
    console.log("Consultation terminée");
    setIsPipActive(false);
  };

  const jitsiConfig = {
    prejoinPageEnabled: false,
    startWithAudioMuted: userType === "patient",
    startWithVideoMuted: false,
    enableWelcomePage: false,
    disableModeratorIndicator: true,
  };

  const jitsiInterfaceConfig = {
    TOOLBAR_BUTTONS: ["microphone", "camera", "hangup"],
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    SHOW_BRAND_WATERMARK: false,
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Contrôles flottants */}
      {isConferenceJoined && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10000,
          display: 'flex',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '10px 20px',
          borderRadius: '25px',
          backdropFilter: 'blur(10px)'
        }}>
          <button
            onClick={toggleMicrophone}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isMuted ? '#ea4335' : '#3c4043',
              color: 'white',
              fontSize: '20px',
              transition: 'all 0.2s',
            }}
            title={isMuted ? "Activer le micro" : "Désactiver le micro"}
          >
            {isMuted ? '🎤❌' : '🎤'}
          </button>

          <button
            onClick={toggleCamera}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isVideoMuted ? '#ea4335' : '#3c4043',
              color: 'white',
              fontSize: '20px',
              transition: 'all 0.2s',
            }}
            title={isVideoMuted ? "Activer la caméra" : "Désactiver la caméra"}
          >
            {isVideoMuted ? '📹❌' : '📹'}
          </button>

          <button
            onClick={togglePip}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isPipActive ? '#fbbc04' : '#3c4043',
              color: 'white',
              fontSize: '20px',
              transition: 'all 0.2s',
            }}
            title={isPipActive ? "Fermer le PiP" : "Ouvrir en PiP"}
          >
            {isPipActive ? '📺' : '⬜'}
          </button>

          <button
            onClick={hangupCall}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ea4335',
              color: 'white',
              fontSize: '20px',
              transition: 'all 0.2s',
            }}
            title="Raccrocher"
          >
            📞
          </button>
        </div>
      )}

      {/* Indicateur PiP */}
      {isPipActive && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '10px 16px',
          borderRadius: '20px',
          backgroundColor: '#1a73e8',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#34a853',
          }} />
          PiP Actif
        </div>
      )}

      <div 
        ref={jitsiContainerRef}
        style={{
          width: '100%',
          height: '100%',
          background: '#f0f0f0'
        }}
      >
        <JitsiMeeting
          domain="jitsi-meet-clinital.duckdns.org"
          roomName={roomId}
          onApiReady={handleApiReady}
          onReadyToClose={handleReadyToClose}
          configOverwrite={jitsiConfig}
          interfaceConfigOverwrite={jitsiInterfaceConfig}
          userInfo={{
            displayName: userType === "patient" ? patientInfo.name : doctorInfo.name,
          }}
          getIFrameRef={handleJitsiIFrameRef}
        />
      </div>
    </div>
  );
};

export default Test;