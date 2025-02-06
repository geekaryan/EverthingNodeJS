const multer = require('multer');
const sharp = require('sharp'); //easy to use image processing library for node js
const User = require('./../models/userModal');
const Factory = require('./factoryController');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
//to use multer we are goin to use multer storage and multer filter

//this multerstorage is used to tell us the destination and file name
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-userid-currenttimestamp.jpeg
//     const ext = file.mimetype.split('/')[1]; // so this is doing we are going to mimetype then split on '/' and take the second part which is going to be the file extension.
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage(); //the reason to store it in memory so it is going to act as buffer and the instead storing images in memory we can store it in here and then do the processing and all

//this multerfilter check whether we have added the correct image file or not
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    //in javascript startsWith method is used to check whether i have added image or not.
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');
//here we are resizing the image
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    //if in the req there is no file property then move forward
    return next();
  }
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`); //[resize take height and width as input] //reading file from the buffer as it is stored in memory
  //toFormat is used to specify the format of our images

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    statu: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//updating the data of use
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');
  //we only want to save the file name not the actual file so if in req there is a file we are storing it's file name only
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };

exports.getUser = Factory.getOne(User);
// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };

exports.updateUser = Factory.updateOne(User);

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };

exports.deleteUser = Factory.deleteOne(User);

//sharp package in used to resize the images
//multer package is used to add files to the backend
//in frontend when we are goin to upload file in the backend then we are looking for .files[0] not .value because type files contains the array of files
