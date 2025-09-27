import express from "express";
import authUser from "../middleware/authUser.js";
import authDoctor from "../middleware/authDoctor.js";
import { getStreamToken, upsertChatMembers } from "../controllers/chatController.js";

const router = express.Router();

router.get("/token", authUser, getStreamToken);
router.post("/upsert-users", authUser, upsertChatMembers);

// Doctor chat routes
router.get("/doctor-token", authDoctor, getStreamToken);
router.post("/doctor-upsert-users", authDoctor, upsertChatMembers);

export default router;


