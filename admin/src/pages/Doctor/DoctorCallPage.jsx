import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DoctorContext } from "../../context/DoctorContext";
import axios from "axios";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

// Custom styles for better dropdown readability
const customStyles = `
  .str-video__call-controls__button[aria-expanded="true"] + .str-video__call-controls__menu,
  .str-video__call-controls__menu {
    background-color: #ffffff !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  }
  
  .str-video__call-controls__menu-item {
    color: #374151 !important;
    background-color: #ffffff !important;
  }
  
  .str-video__call-controls__menu-item:hover {
    background-color: #f3f4f6 !important;
    color: #111827 !important;
  }
  
  .str-video__call-controls__menu-item:focus {
    background-color: #dbeafe !important;
    color: #1d4ed8 !important;
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const DoctorCallPage = () => {
  const { id: callId } = useParams();
  const { backendUrl, dToken, profileData, getProfileData } = useContext(DoctorContext);
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const initCall = async () => {
      if (!dToken || !callId) return;

      if (!profileData) {
        try { await getProfileData(); } catch(_) {}
        return;
      }

      try {
        const { data } = await axios.get(`${backendUrl}/api/chat/doctor-token`, { headers: { dtoken: dToken } });

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: {
            id: profileData._id,
            name: profileData.name,
          },
          token: data.token,
        });

        const callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });
        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
  }, [backendUrl, dToken, profileData, callId, getProfileData]);

  if (isConnecting) return <div className="h-screen flex items-center justify-center">Connecting to call...</div>;

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="px-4 py-3 border-b bg-white sticky top-0 z-10 flex items-center justify-start w-full">
        <button 
          onClick={() => navigate('/doctor-appointments')} 
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Back to Appointments
        </button>
      </div>
      <div className="relative w-full h-full flex-1">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) return navigate(-1);

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default DoctorCallPage;


