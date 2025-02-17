const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectID,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!'],
  },
  user: {
    type: mongoose.Schema.ObjectID,
    ref: 'User',
    required: [true, 'Booking must be done by a User!'],
  },
  price: {
    type: Number,
    require: [true, 'Booking must have price!'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

//this pre here is to populate and show the data about the user and tour
bookingSchema.pre(/^find/, function (next) {
  //if we want to populate just a single thing out of a populate we can use path and write select
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });
});

const Booking = mongoose.Model('Booking', bookingSchema);

module.exports = Booking;
