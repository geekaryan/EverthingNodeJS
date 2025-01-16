const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// reviewSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'tour',
//     select: 'name',
//   }).populate({
//     path: 'user',
//     select: 'name photo',
//   });
//   next();
// });

// reviewSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'tour',
//     select: 'name',
//   }).populate({
//     path: 'user',
//     select: 'name photo',
//   });
//   next();
// });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

//basically in this we are performing to calculate average rating using group by just like mysql
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, // so the aggreate function  match is used to match particular things so it act as a .find() method in hashmap
    },
    {
      $group: {
        //so this group by is used to group by just same like we use in our sql
        _id: '$tour',
        nRating: { $sum: 1 }, //here it is going to add 1
        avgRating: { $avg: '$rating' }, // here we are calculating the average rating thing so here we are getting rating from our schema we defined above
      },
    },
  ]);

  // console.log(stats);

  //here we are updating the new rating into our Tour itself
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });
};

//so to add something before being saved to the document we are going to use pre and mention ('save')
//moreover this is the middleware which we are writing by our own
// Middleware to trigger after a review is saved
reviewSchema.post('save', function () {
  //'this' points to the current review document
  this.constructor.calcAverageRatings(this.tour); // Calculate average ratings for the associated tour
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
