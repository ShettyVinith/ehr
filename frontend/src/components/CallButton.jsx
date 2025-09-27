function CallButton({ handleVideoCall }) {
  return (
    <div className="p-3 border-b flex items-center justify-end max-w-7xl mx-auto w-full absolute top-0">
      <button onClick={handleVideoCall} className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded">
        Video Call
      </button>
    </div>
  );
}

export default CallButton;


