const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

//now this review route can have access to the noraml routes and also routes from the tour section
// POST: /review
// POST: /tour/234dfc/reviews

//both of them are handled here due to the mergeParams route

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

router.route('/:id').get(reviewController.getOneReview);

module.exports = router;
