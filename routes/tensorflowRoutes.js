const express = require("express");
const router = express.Router();

const tensorflowController = require("../controllers/tensorflowController");

router.get('/get/evaluate', tensorflowController.evaluate);

module.exports = router;