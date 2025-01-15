const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

//now this review route can have access to the noraml routes and also routes from the tour section
// POST: /review
// POST: /tour/234dfc/reviews

//both of them are handled here due to the mergeParams route

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getOneReview)
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  );

module.exports = router;
