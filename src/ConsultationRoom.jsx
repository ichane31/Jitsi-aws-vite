import { JitsiMeeting } from "@jitsi/react-sdk";
import React, { useState, useRef, useEffect, useCallback } from "react";
import patientImage from "./assets/images/patient.png";
import doctorImage from "./assets/images/doctor.png";
import {
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Pin,
  PinOff,
  PictureInPicture,
} from "lucide-react";

import "./App.css";

const ConsultationRoom = ({
  patient,
  doctor,
  roomId = "test123",
  userType = "patient",
}) => {
  const [participantCount, setParticipantCount] = useState(1);
  const [showWaitingRoom, setShowWaitingRoom] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(userType === "patient");
  const [swappedView, setSwappedView] = useState(false);
  const localVideoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const [iJoined, setIJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const jitsiRef = useRef(null);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isPipReady, setIsPipReady] = useState(false);
  const [autoPipEnabled] = useState(true);
  const streamRef = useRef(null); // Nouvelle référence pour le stream

  // Effet pour gérer l'affichage de la salle d'attente
  useEffect(() => {
    setShowWaitingRoom(iJoined && participantCount < 2);
  }, [iJoined, participantCount]);

  // Créer une vidéo de secours si la capture échoue
  const createFallbackVideo = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");

    // Dessiner un fond avec du texte
    ctx.fillStyle = "#1a73e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Consultation en cours", canvas.width / 2, canvas.height / 2);
    ctx.font = "16px Arial";
    ctx.fillText("Mode PiP activé", canvas.width / 2, canvas.height / 2 + 30);

    const stream = canvas.captureStream(15);
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject = stream;
      pipVideoRef.current.play().catch(console.error);
      setIsPipReady(true);
    }
    return stream;
  }, []);

  // Capturer le flux vidéo local pour PiP
  const captureLocalVideoForPip = useCallback(async () => {
    try {
      console.log("Tentative de capture vidéo pour PiP...");
      
      // Arrêter le stream existant s'il y en a un
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Obtenir le flux vidéo de l'utilisateur local
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        },
        audio: userType === "patient" ? false : true, // Les patients sont muets par défaut
      });

      streamRef.current = stream;

      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = stream;
        pipVideoRef.current.muted = userType === "patient"; // Mute pour patient
        await pipVideoRef.current.play();
        setIsPipReady(true);
        console.log("Flux vidéo capturé avec succès pour PiP");
        return stream;
      }
    } catch (error) {
      console.error("Erreur lors de la capture vidéo pour PiP:", error);
      console.log("Création d'une vidéo de secours...");
      return createFallbackVideo();
    }
  }, [userType, createFallbackVideo]);

  // Activer Picture-in-Picture
  const enterPictureInPicture = useCallback(async () => {
    if (!pipVideoRef.current || isPipActive) return;

    try {
      console.log("Tentative d'activation du PiP...");
      
      // S'assurer que la vidéo est prête
      if (!isPipReady || !pipVideoRef.current.srcObject) {
        console.log("Préparation du flux vidéo pour PiP...");
        await captureLocalVideoForPip();
        // Attendre que la vidéo soit chargée
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Vérifier que la vidéo a des données
      if (pipVideoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA ou plus
        await pipVideoRef.current.requestPictureInPicture();
        console.log("Mode Picture-in-Picture activé avec succès");
      } else {
        console.warn("La vidéo n'est pas prête pour PiP");
      }
    } catch (error) {
      console.error("Erreur lors de l'activation du Picture-in-Picture:", error);
      // Tentative avec la vidéo de secours
      try {
        const fallbackStream = createFallbackVideo();
        if (fallbackStream) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await pipVideoRef.current.requestPictureInPicture();
        }
      } catch (fallbackError) {
        console.error("Échec de la solution de secours:", fallbackError);
      }
    }
  }, [isPipActive, isPipReady, captureLocalVideoForPip, createFallbackVideo]);

  // Désactiver Picture-in-Picture
  const exitPictureInPicture = async () => {
    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
        console.log("Mode Picture-in-Picture désactivé");
      } catch (error) {
        console.error("Erreur lors de la sortie du PiP:", error);
      }
    }
  };

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
      alert(
        "Impossible d'activer le Picture-in-Picture. Assurez-vous d'avoir autorisé l'accès à la caméra."
      );
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

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoPipEnabled, enterPictureInPicture]);

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
      videoElement.addEventListener("enterpictureinpicture", handleEnterPip);
      videoElement.addEventListener("leavepictureinpicture", handleLeavePip);

      return () => {
        videoElement.removeEventListener(
          "enterpictureinpicture",
          handleEnterPip
        );
        videoElement.removeEventListener(
          "leavepictureinpicture",
          handleLeavePip
        );
      };
    }
  }, []);

  // Nettoyer le flux vidéo à la sortie
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (pipVideoRef.current && pipVideoRef.current.srcObject) {
        const tracks = pipVideoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
      exitPictureInPicture();
    };
  }, []);

  const startLocalVideo = useCallback(async () => {
    try {
      if (!localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true; // Toujours muet pour l'aperçu local
        }
        
        // Préparer aussi pour PiP si nécessaire
        if (!pipVideoRef.current.srcObject) {
          pipVideoRef.current.srcObject = stream;
          pipVideoRef.current.muted = userType === "patient";
        }
      } else {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.muted = true;
        }
      }
    } catch (error) {
      console.error("Erreur d'accès à la caméra:", error);
    }
  }, [localStream, userType]);

  const stopLocalVideo = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  // Effet pour capturer le flux vidéo local
  useEffect(() => {
    if (iJoined && !isVideoMuted) {
      startLocalVideo();
    } else if (isVideoMuted) {
      stopLocalVideo();
    }
  }, [iJoined, isVideoMuted, startLocalVideo]);

  // Vérifier si l'API Picture-in-Picture est supportée
  const isPipSupported = () => {
    return document.pictureInPictureEnabled;
  };

  const patientInfo = {
    name: patient?.nom || "Patient",
    avatar: patientImage,
  };

  const doctorInfo = {
    name: doctor?.nom || "Dr Mohamed Bouy",
    avatar: doctorImage,
    speciality: doctor?.specialite || "Médecin Généraliste",
  };

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
    // Quitter PiP si actif
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }
    // Nettoyer les streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
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
    BRAND_WATERMARK_LINK: "",
    LANG_DETECTION: true,
    CONNECTION_INDICATOR_DISABLED: false,
  };

  const handleApiReady = (api) => {
    jitsiRef.current = api;

    const updateParticipants = () => {
      let count = 0;

      if (typeof api.getNumberOfParticipants === "function") {
        count = api.getNumberOfParticipants();
      } else if (typeof api.getParticipantsInfo === "function") {
        const participants = api.getParticipantsInfo();
        count = Array.isArray(participants) ? participants.length : 0;
      } else {
        try {
          const participants = api._getParticipants();
          count = participants ? participants.length : 0;
        } catch (error) {
          console.warn(
            "Impossible de récupérer le nombre de participants:",
            error
          );
          count = iJoined ? 1 : 0;
        }
      }

      console.log("Nombre de participants:", count);
      setParticipantCount(count);
    };

    // Événements Jitsi
    api.addEventListener("videoConferenceJoined", () => {
      console.log("Utilisateur a rejoint la conférence");
      setIJoined(true);
      updateParticipants();
      
      // Préparer le PiP après avoir rejoint
      setTimeout(() => {
        captureLocalVideoForPip();
      }, 2000);
    });

    api.addEventListener("videoConferenceLeft", () => {
      console.log("Utilisateur a quitté la conférence");
      setIJoined(false);
      setParticipantCount(0);

      // Quitter PiP si actif et nettoyer
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    });

    api.addEventListener("participantJoined", () => {
      console.log("Un participant a rejoint");
      updateParticipants();
    });

    api.addEventListener("participantLeft", () => {
      console.log("Un participant a quitté");
      updateParticipants();
    });

    setTimeout(updateParticipants, 1000);
  };

  const handleLeaveWaitingRoom = () => {
    if (jitsiRef.current) {
      jitsiRef.current.executeCommand("hangup");
    }
    setIJoined(false);
    setShowWaitingRoom(false);

    // Quitter PiP si actif et nettoyer
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    console.log("Vous avez quitté la consultation.");
  };

  const toggleVideo = () => {
    if (jitsiRef.current) {
      jitsiRef.current.executeCommand("toggleVideo");
      setIsVideoMuted(!isVideoMuted);
      
      // Mettre à jour le stream PiP si la vidéo est activée/désactivée
      if (!isVideoMuted) {
        // Vidéo désactivée - arrêter le stream PiP
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      } else {
        // Vidéo activée - redémarrer le stream PiP
        setTimeout(() => {
          captureLocalVideoForPip();
        }, 500);
      }
    }
  };

  const toggleAudio = () => {
    if (jitsiRef.current) {
      jitsiRef.current.executeCommand("toggleAudio");
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const handleSwapView = () => {
    setSwappedView(!swappedView);
  };

  const handleVideoClick = () => {
    handleSwapView();
  };

  return (
    <>
      {/* Vidéo cachée pour Picture-in-Picture */}
      <video
        ref={pipVideoRef}
        autoPlay
        muted={userType === "patient"}
        playsInline
        style={{
          position: "fixed",
          top: "-1000px",
          left: "-1000px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* Salle d'attente */}
      {iJoined && showWaitingRoom && (
        <div className="waiting-room-overlay">
          <div className={`waiting-content ${swappedView ? "swapped" : ""}`}>
            {swappedView ? (
              <>
                <div className="patient-video-preview-large">
                  {isVideoMuted ? (
                    <img
                      className="avatar-image"
                      src={
                        userType === "patient"
                          ? doctorInfo.avatar
                          : patientInfo.avatar
                      }
                      alt="Avatar"
                    />
                  ) : (
                    <>
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="live-video-large"
                      />
                    </>
                  )}
                  <button
                    className={`epingler-button ${
                      swappedView ? "epingle" : ""
                    }`}
                    onClick={handleVideoClick}
                  >
                    {swappedView ? <PinOff size={18} /> : <Pin size={18} />}
                  </button>
                </div>
                <div>
                  <div className="patient-video-preview">
                    <img
                      src={
                        userType === "patient"
                          ? doctorInfo.avatar
                          : patientInfo.avatar
                      }
                      alt="preview avatar"
                      className="patient-preview-img"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="avatar-container">
                  <div className="avatar-border">
                    <img
                      src={
                        userType === "patient"
                          ? doctorInfo.avatar
                          : patientInfo.avatar
                      }
                      alt={
                        userType === "patient"
                          ? doctorInfo.name
                          : patientInfo.name
                      }
                      className="avatar-image"
                    />
                  </div>
                </div>
                <div className="waiting-text">
                  <h2 className="waiting-title">
                    En attente de{" "}
                    {userType === "patient"
                      ? doctorInfo.name
                      : patientInfo.name}
                  </h2>
                  <p className="waiting-message">
                    {userType === "patient" ? (
                      <>
                        Vous serez informé(e) lorsque le{" "}
                        <span>Dr. Mohamed Bouy</span> rejoindra la consultation
                        vidéo.
                      </>
                    ) : (
                      <>
                        Vous serez informé(e) lorsque le <span>patient</span>{" "}
                        rejoindra la consultation vidéo.
                      </>
                    )}
                    <br />
                    Veuillez rester en ligne et garder cette fenêtre ouverte.
                  </p>
                </div>
                <div className="patient-video-preview">
                  {isVideoMuted ? (
                    <img
                      src={patientInfo.avatar}
                      alt="Votre vidéo"
                      className="patient-preview-img"
                    />
                  ) : (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="live-video small"
                    />
                  )}

                  <button
                    className={`epingler-button ${
                      swappedView ? "epingle" : ""
                    }`}
                    onClick={handleSwapView}
                    data-tooltip={swappedView ? "Désépingler" : "Épingler"}
                  >
                    {swappedView ? <PinOff size={18} /> : <Pin size={18} />}
                  </button>
                </div>
              </>
            )}
            <div className="waiting-actions">
              <button
                className="leave-button"
                onClick={handleLeaveWaitingRoom}
              >
                <PhoneOff size={20} />
              </button>
              <button className="video-button" onClick={toggleVideo}>
                {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
              <button className="audio-button" onClick={toggleAudio}>
                {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Bouton Picture-in-Picture */}
              {iJoined && isPipSupported() && (
                <button
                  className={`pip-button ${isPipActive ? "active" : ""}`}
                  onClick={togglePictureInPicture}
                  title={
                    isPipActive
                      ? "Quitter le mode incrustation"
                      : "Activer le mode incrustation"
                  }
                >
                  <PictureInPicture size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Jitsi iframe */}
      <div
        className={`jitsi-container ${
          showWaitingRoom && iJoined ? "blurred" : ""
        }`}
      >
        <JitsiMeeting
          onApiReady={handleApiReady}
          domain="jitsi-meet-clinital.duckdns.org/"
          externalApiUrl="https://jitsi-meet-clinital.duckdns.org/external_api.js"
          roomName={roomId || `test123`}
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

export default ConsultationRoom;