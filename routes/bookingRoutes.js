const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

//this route is for creating a check out session
router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckOutSession
);

module.exports = router;
