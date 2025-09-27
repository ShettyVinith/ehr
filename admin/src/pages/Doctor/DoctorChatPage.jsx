import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Channel, ChannelHeader, Chat, MessageInput, MessageList, Thread, Window } from "stream-chat-react";
import { StreamChat } from "stream-chat";
import { toast } from "react-toastify";
import "stream-chat-react/dist/css/v2/index.css";
import { DoctorContext } from "../../context/DoctorContext";
import axios from "axios";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const isValidHttpUrl = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const DoctorChatPage = () => {
  const { id: targetUserId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, dToken, profileData, getProfileData } = useContext(DoctorContext);

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initChat = async () => {
      if (!dToken) return;

      if (!STREAM_API_KEY) {
        toast.error("Missing VITE_STREAM_API_KEY in admin .env");
        setLoading(false);
        return;
      }

      // Ensure we have doctor profile
      if (!profileData) {
        try {
          await getProfileData();
        } catch (_) {}
        return; // wait for profileData update
      }

      // Ensure both users exist on Stream (doctor + patient)
      try {
        await axios.post(`${backendUrl}/api/chat/doctor-upsert-users`, { targetUserId }, { headers: { dtoken: dToken } });
      } catch (e) {
        // non-fatal; proceed to try connecting
      }

      const tokenResp = await axios.get(`${backendUrl}/api/chat/doctor-token`, { headers: { dtoken: dToken } }).then(r => r.data).catch(() => null);
      if (!tokenResp?.token) {
        setLoading(false);
        return;
      }

      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);

        const streamUser = {
          id: profileData._id,
          name: profileData.name,
        };
        if (profileData.image && isValidHttpUrl(profileData.image)) {
          streamUser.image = profileData.image;
        }

        await client.connectUser(streamUser, tokenResp.token);

        const channelId = [profileData._id, targetUserId].sort().join("-");
        const currChannel = client.channel("messaging", channelId, {
          members: [profileData._id, targetUserId],
        });

        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [dToken, profileData, targetUserId, backendUrl, getProfileData]);

  const handleVideoCall = () => {
    if (!channel) return;
    const doctorUrl = `${window.location.origin}/call/${channel.id}`;
    const patientUrl = `http://localhost:5173/call/${channel.id}`;
    channel.sendMessage({ text: `I've started a video call. Doctor join: ${doctorUrl} | Patient join: ${patientUrl}` });
    toast.success("Video call link sent to chat.");
  };

  if (loading || !chatClient || !channel) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center p-4 w-full">
        <div className="animate-spin w-10 h-10 rounded-full border-4 border-gray-300 border-t-blue-600" />
        <p className="mt-4 text-center text-lg">Connecting to chat...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="px-4 py-3 border-b bg-white sticky top-0 z-10 flex items-center justify-between w-full">
        <button 
          onClick={() => navigate(-1)} 
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Back to Appointments
        </button>
        <button
          onClick={handleVideoCall}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
        >
          Video Call
        </button>
      </div>
      <div className="max-w-4xl mx-auto p-4 w-full">
        <div className="h-[72vh] bg-white border rounded-md overflow-hidden">
          <Chat client={chatClient}>
            <Channel channel={channel} className="h-full">
              <div className="w-full h-full relative">
                <Window>
                  <ChannelHeader className="shadow-sm" />
                  <MessageList />
                  <MessageInput focus />
                </Window>
              </div>
              <Thread />
            </Channel>
          </Chat>
        </div>
      </div>
    </div>
  );
};

export default DoctorChatPage;
