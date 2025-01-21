const express = require('express');
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTour,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
} = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRoutes = require('./../routes/reviewRoutes');

const router = express.Router();

//now we want to have reviews for the particular tours so what we are going to do
// POST: /tour/tourId/reviews --> going to work on making this route
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

//so what happening here is that we are goin to use the concept of merge Router in which
//what we are going to do is use the reviewRouter just by calling it

router.use('/:tourId/reviews', reviewRoutes);

//here we have to write 'use' because now the router is acting as a middleware here

//------------>

// router.param('id', checkID);

router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    getMonthlyPlan
  );

//these are the routes to get your tours within a certain distance
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(getDistances);

router.route('/top-5-cheap').get(aliasTopTour, getAllTours);

router
  .route('/')
  .get(getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    createTour
  );
router
  .route('/:id')
  .get(getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    deleteTour
  );

module.exports = router;
