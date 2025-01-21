const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModal');
// const User = require('./userModal');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour must name must have less or equal than 40 characters..',
      ],
      minlength: [10, ' A tour must have at least 10 characters'],
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must only contain characters.. ',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must havee group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A rating must be above 1.0'],
      max: [5, 'A rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, //this setter function run everytime this giving us round off values
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          //this only points to the current doc on New Document creation...
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below to regulat price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    //imgaes are saved as the array of the type string..
    images: [String],
    //type: Date specifying the current date of creating..
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //used to hide fields from the backend to vaou
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'], //enumeration property..
      },
      coordinates: [Number], //latitute first then longitude
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    // reviewList: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Review',
    //   },
    // ],
  },
  {
    toJSON: { virtuals: true }, //to JSON virtuals true..
    toObject: { virtuals: true }, //to object virtuals are ture..
  }
);

//here i am going to implement indexes in mongodb on prices
//in mongoDB if we set something to unique then also it is goin to create indexes for that
//tourSchema.index({ price: 1 }); //so here 1 represent to sort thing in ascending order but to sort things in descending order we are goin to use -1
//making compound indexes
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); // for geospatial data we need 2d index

//virtual Properties..
// tourSchema.virtual('durationWeeks').get(function () {
//   return this.duration / 7;
// });

//schemaName then .vritual("virtualPropertyname").get() //=> .get is used here
//because we are getting something to perform in our virtual property..

//we are gonna use normal regular function because we have to access this keyword..
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//this is Virtual Populate
// tourSchema.virtual('reviews', {
//   ref: 'Review',
//   foreignField: 'tour',
//   localField: '_id',
// });

tourSchema.virtual('review', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'tour',
});

//Document middlewaere: runs before the .save() command and .create()..
//goona install slugify use to create string
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//embedding...

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// tourSchema.pre('save', function (next) {
//   console.log('will save document');
//   next();
// });

// //post middlerware of document middleware..
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE..
//populate query middleware}
// tourSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'guides',
//     select: '-__v -passwordChangedAt',
//   });
// });

//===> secret tour..
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.prependOnceListener(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds.`);

  console.log(docs);
  next();
});

//AGGREGATION MIDDLEWARE...
//removing which have secret tour equal to truee..
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

//Middleware in mongoose contain pre and post methods..
// 4 types of middleware in mongoose..
//Document middleware..

//==> validate is a custom way to validate things..
