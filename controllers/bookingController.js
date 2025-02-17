require('dotenv').config();

const stripe = require('stripe')(
  'sk_test_51QtV2EKtrWLocb3Y8OuQqv5WaXH1BbZhJuoOqsXSHonprmFn57EJjeIcFA9VydOEisKbJ88BUA15K2XMzTITxZWb00ooiytmRZ'
);

const catchAsync = require('./../utils/catchAsync');
const Tour = require('./../models/tourModel');
const AppError = require('./../utils/appError');
const factory = require('./factoryController');

exports.getCheckOutSession = catchAsync(async (req, res, next) => {
  //1) get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  //2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    //as soon as payment is success go to page
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    //this is protected route and user is alqays there in req
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    //below is the information about the product that the user is about to purchase
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100, // Convert price to cents
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  //3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});
