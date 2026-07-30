const express = require("express");
const router = express.Router();
const {
  createRequest,
  acceptRequest,
  markPicked,
  rejectRequest,
  completeRequest,
  cancelRequest,
  getMyRequests,
} = require("../controllers/requestController");
const { getMessages, sendMessage } = require("../controllers/messageController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", protect, getMyRequests);
router.post("/", protect, authorize("receiver"), createRequest);
router.put("/:id/accept", protect, authorize("donor"), acceptRequest);
router.put("/:id/picked", protect, authorize("donor"), markPicked);
router.put("/:id/reject", protect, authorize("donor"), rejectRequest);
router.put("/:id/complete", protect, authorize("receiver"), completeRequest);
router.put("/:id/cancel", protect, cancelRequest);

router.get("/:id/messages", protect, getMessages);
router.post("/:id/messages", protect, sendMessage);

module.exports = router;
