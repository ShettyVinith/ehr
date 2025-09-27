function ChatLoader() {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <div className="animate-spin w-10 h-10 rounded-full border-4 border-gray-300 border-t-blue-600" />
      <p className="mt-4 text-center text-lg">Connecting to chat...</p>
    </div>
  );
}

export default ChatLoader;


