const express = require("express");
const router = express.Router();
const { syncData } = require("../controllers/syncController");

// POST /sync
router.post("/", syncData);

module.exports = router;
