import { JitsiMeeting } from "@jitsi/react-sdk";
import React, { useState, useRef, useEffect } from "react";
import patientImage from "./assets/images/patient.png";
import doctorImage from "./assets/images/doctor.png";
// Lucide react icons
import {
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  SwitchCamera,
  User,
  Pin,
  PinOff,
} from "lucide-react";

import "./App.css";

const ConsultationApp = ({
  patient,
  doctor,
  roomId = "test123",
  userType = "patient",
}) => {
  const [participantCount, setParticipantCount] = useState(1); // on compte le self
  const [showWaitingRoom, setShowWaitingRoom] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(userType === "patient");
  const [swappedView, setSwappedView] = useState(false);
  const localVideoRef = useRef(null);
  const [iJoined, setIJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const jitsiRef = useRef(null);

  // Effet pour gérer l'affichage de la salle d'attente
  useEffect(() => {
    // Afficher la salle d'attente seulement si l'utilisateur a rejoint ET qu'il est seul
    setShowWaitingRoom(iJoined && participantCount < 2);
  }, [iJoined, participantCount]);

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
  };

  // const generateRoomName = () =>
  //   roomId || `ConsultationRoom-${Math.random().toString(36).substr(2, 9)}`;

  const jitsiConfig = {
    prejoinPageEnabled: false,
    startWithAudioMuted: userType === "patient",
    startWithVideoMuted: false,
    enableWelcomePage: false,
    disableModeratorIndicator: true,
    p2p: { enabled: false },
  };

  const jitsiInterfaceConfig = {
    // TOOLBAR_BUTTONS: ["microphone", "hangup", "camera", "chat", "tileview"],
    TOOLBAR_BUTTONS: ["microphone", "hangup", "camera", "chat", "tileview"],
    SHOW_JITSI_WATERMARK: false,
    TOOLBAR_ALWAYS_VISIBLE: true,
    DEFAULT_BACKGROUND: "#f8f9fa",
    CUSTOM_STYLE_URL: "/config/custom.css",
    SHOW_WATERMARK_FOR_GUESTS: false,
    SHOW_BRAND_WATERMARK: false,
    BRAND_WATERMARK_LINK: '',
    LANG_DETECTION: true,
    CONNECTION_INDICATOR_DISABLED: false,
  };

  const handleApiReady = (api) => {
    jitsiRef.current = api;

    const updateParticipants = () => {
      let count = 0;

      // Essayer différentes méthodes pour obtenir le nombre de participants
      if (typeof api.getNumberOfParticipants === "function") {
        count = api.getNumberOfParticipants();
      } else if (typeof api.getParticipantsInfo === "function") {
        const participants = api.getParticipantsInfo();
        count = Array.isArray(participants) ? participants.length : 0;
      } else {
        // Méthode alternative
        try {
          const participants = api._getParticipants();
          count = participants ? participants.length : 0;
        } catch (error) {
          console.warn(
            "Impossible de récupérer le nombre de participants:",
            error
          );
          // Par défaut, on considère qu'il y a au moins 1 participant (soi-même)
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
    });

    api.addEventListener("videoConferenceLeft", () => {
      console.log("Utilisateur a quitté la conférence");
      setIJoined(false);
      setParticipantCount(0);
    });

    api.addEventListener("participantJoined", () => {
      console.log("Un participant a rejoint");
      updateParticipants();
    });

    api.addEventListener("participantLeft", () => {
      console.log("Un participant a quitté");
      updateParticipants();
    });

    // Vérification initiale
    setTimeout(updateParticipants, 1000);
  };

  const handleLeaveWaitingRoom = () => {
    if (jitsiRef.current) {
      jitsiRef.current.executeCommand("hangup");
    }
    setIJoined(false);
    setShowWaitingRoom(false);
    console.log("Vous avez quitté la consultation.");
  };

  // Effet pour capturer le flux vidéo local
  useEffect(() => {
    if (iJoined && !isVideoMuted) {
      startLocalVideo();
    }
    if (isVideoMuted) {
      stopLocalVideo();
    }
  }, [iJoined, isVideoMuted, swappedView]);

  const startLocalVideo = async () => {
    try {
      if (!localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } else {
        if (localVideoRef.current)
          localVideoRef.current.srcObject = localStream;
      }
    } catch (error) {
      console.error("Erreur d'accès à la caméra:", error);
    }
  };

  const stopLocalVideo = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const toggleVideo = () => {
    if (jitsiRef.current) {
      jitsiRef.current.executeCommand("toggleVideo");
      setIsVideoMuted(!isVideoMuted);
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
      {/* Salle d'attente */}
      {iJoined && showWaitingRoom && (
        <div className="waiting-room-overlay">
          <div className={`waiting-content ${swappedView ? "swapped" : ""}`}>
            {swappedView ? (
              // Vue avec la vidéo en grand
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
              // Vue avec l'avatar en grand
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
                onClick={() => handleLeaveWaitingRoom()}
              >
                <PhoneOff size={20} />
              </button>
              <button className="video-button" onClick={toggleVideo}>
                {isVideoMuted ? (
                  <VideoOff size={20} onClick={toggleVideo} />
                ) : (
                  <Video size={20} onClick={toggleVideo} />
                )}
              </button>
              <button className="audio-button" onClick={toggleAudio}>
                {isAudioMuted ? (
                  <MicOff size={20} onClick={toggleAudio} />
                ) : (
                  <Mic size={20} onClick={toggleAudio} />
                )}
              </button>
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
          domain="be086463d405.ngrok-free.app"
          externalApiUrl="https://be086463d405.ngrok-free.app/external_api.js"
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

export default ConsultationApp;
