const catchAsync = require('./../utils/catchAsync');
const Review = require('./../models/reviewModel');
const Factory = require('./factoryController');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.getOneReview = catchAsync(async (req, res, next) => {
  const reviews = await Review.findById(req.params.id)
    .populate('tour')
    .populate('user');
  //so to populate mulitple this we have to call populate multiple times
  res.status(200).json({
    status: 'success',
    data: {
      reviews,
    },
  });
});

exports.setTourIds = (req, res, next) => {
  //this is used here to allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  nex();
};

// exports.createReview = catchAsync(async (req, res, next) => {
//   const newReview = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview,
//     },
//   });
// });

exports.createReview = Factory.createOne(Review);
exports.updateReview = Factory.updateOne(Review);
exports.deleteReview = Factory.deleteOne(Review);
