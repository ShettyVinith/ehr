import { generateStreamToken, upsertStreamUser } from "../config/stream.js";

export const getStreamToken = async (req, res) => {
  try {
    // authUser middleware stores id on req.body.userId, authDoctor stores on req.body.docId
    const userId = req.body?.userId || req.body?.docId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = await generateStreamToken(userId);
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error generating stream token:", error.message);
    res.status(500).json({ error: "Failed to generate stream token" });
  }
};

export const upsertChatMembers = async (req, res) => {
  try {
    const requesterId = req.body?.userId || req.body?.docId;
    const { targetUserId } = req.body || {};
    if (!requesterId || !targetUserId) {
      return res.status(400).json({ error: "Missing requesterId or targetUserId" });
    }

    await upsertStreamUser({ id: requesterId.toString() });
    await upsertStreamUser({ id: targetUserId.toString() });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error upserting chat members:", error.message);
    res.status(500).json({ error: "Failed to upsert chat members" });
  }
};


