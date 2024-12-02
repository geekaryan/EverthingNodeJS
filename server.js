const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (error) => {
  console.log('Unhandled exception: ');
  console.log(error.name, error.message);

  process.exit(1);
});

const app = require('./app');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose

  // .connect(process.env.DATABASE_LOCAL, {  ======>> FOR LOCAL DATABASE CONNECTION
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connnection successfully');
  });

// const testTour = new Tour({
//   name: 'The Camper of India',
//   price: 500,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('Error..', err);
//   });

// console.log(process.env);
const port = 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

//unhanled rejections..

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled rejection');
  server.close(() => {
    process.exit(1);
  });
});

//uncaught expections..
