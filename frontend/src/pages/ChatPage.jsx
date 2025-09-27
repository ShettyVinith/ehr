import { useEffect, useMemo, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { Channel, ChannelHeader, Chat, MessageInput, MessageList, Thread, Window } from "stream-chat-react";
import { StreamChat } from "stream-chat";
import { toast } from "react-toastify";
import "stream-chat-react/dist/css/v2/index.css";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const isValidHttpUrl = (value) => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const { backendUrl, token, userData } = useContext(AppContext);

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tokenData, setTokenData] = useState(null);

  useEffect(() => {
    const initChat = async () => {
      if (!token || !userData) return;

      // Ensure both users exist on Stream (me + target)
      try {
        await axios.post(`${backendUrl}/api/chat/upsert-users`, { targetUserId }, { headers: { token } });
      } catch (e) {
        // non-fatal; proceed to try connecting
      }

      const tokenResp = tokenData || (await axios.get(`${backendUrl}/api/chat/token`, { headers: { token } }).then(r => r.data).catch(() => null));
      if (!tokenResp?.token) {
        setLoading(false);
        return;
      }

      try {
        const client = StreamChat.getInstance(STREAM_API_KEY);

        const streamUser = {
          id: userData._id,
          name: userData.name,
        };
        if (userData.image && isValidHttpUrl(userData.image)) {
          streamUser.image = userData.image;
        }

        await client.connectUser(streamUser, tokenResp.token);

        const channelId = [userData._id, targetUserId].sort().join("-");
        const currChannel = client.channel("messaging", channelId, {
          members: [userData._id, targetUserId],
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
  }, [token, userData, targetUserId, backendUrl, tokenData]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;
      channel.sendMessage({ text: `I've started a video call. Join me here: ${callUrl}` });
      toast.success("Video call link sent successfully!");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="w-full">
      <div className="px-4 py-3 border-b bg-white sticky top-0 z-10 flex items-center justify-end w-full">
        <button
          onClick={() => {
            if (!channel) return;
            const patientUrl = `${window.location.origin}/call/${channel.id}`;
            const doctorUrl = `http://localhost:5174/call/${channel.id}`;
            channel.sendMessage({ text: `I've started a video call. Patient join: ${patientUrl} | Doctor join: ${doctorUrl}` });
            toast.success("Video call link sent to chat.");
          }}
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

export default ChatPage;


