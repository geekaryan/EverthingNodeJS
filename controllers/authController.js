//promisify
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModal');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure: true,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  //cookie sending
  res.cookie('jwt', token, cookieOptions);

  //remove the password from the output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// exports.singUp = catchAsync(async (req, res, next) => {
//   const newUser = await User.create({
//     name: req.body.name,
//     email: req.body.email,
//     password: req.body.password,
//     passwordConfirm: req.body.passwordConfirm,
//   });

//   const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN,
//   });
//   res.status(201).json({
//     status: 'success',
//     token,
//     data: {
//       user: newUser,
//     },
//   });
// });

exports.singUp = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordResetToken: req.body.passwordResetToken,
      passwordResetExpires: req.body.passwordResetExpires,
      passwordConfirm: req.body.passwordConfirm,
      role: req.body.role,
      passwordChangedAt: req.body.passwordChangedAt,
    });
    //this req.protocol and req.get('host') all this thing is being done to do just extraction protocol and host dynamicallly
    //example http://127.0.0.0::3000/me
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);

    // const newUser = await User.create(req.body);

    //so we make a token field add jwt.sign which contain id of newUser, we pass our secret,
    //and expires and then add token in our json request..

    // const token = signToken(newUser._id);
    // res.status(200).json({
    //   status: 'success',
    //   token,
    //   data: {
    //     user: newUser,
    //   },
    // });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

exports.login = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    //1) Check if email and password exist..
    if (!email || !password) {
      // next(new AppError('Please provide email and password', 400));
      res.status(401).json({
        status: 'fail',
        message: 'Please provide email and password',
      });
    }

    //2) Check if user exists and passowrd is correct..

    //we are finding user using find one and then we are just doing the .select('+password') to check whether the user
    //is present in the database or not..
    //await it because it's send a promise..
    const user = await User.findOne({ email }).select('+password');
    // console.log(user);

    //we are calling our function of if user doesnot exist or the password is incorrect,
    //we are going to send fail request..

    if (!user || !(await user.correcPassword(password, user.password))) {
      res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password',
      });
    }

    //3) If everthing ok, send token to client.
    createSendToken(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //   status: 'success',
    //   token,
    // });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
};

// exports.login = (req, res, next) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     // return next(new AppError('Please provide email and password', 400));
//     res.status(401).json({
//       status: 'fail',
//       message: 'Please provide email and password',
//     });
//   }

//   const token = '';
//   res.status(200).json({
//     status: 'success',
//     token,
//   });
// };

//middleware for protection ...
exports.protect = catchAsync(async (req, res, next) => {
  //1) Getting token and check if it's there..
  let token;
  if (
    //we are checking the req.headers.authorization and if if start with bearer or nto
    //then we are assinging the token value by split of space to token and then
    //we are checking if the token is available for not if it is available then we
    //are saying okkie good otherwise we are sending an error..
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // console.log(token);

  // if (!token) {
  //   res.status(401).json({
  //     status: 'fail',
  //     message: 'You are not logged in! Please log in to get the access ',
  //   });
  // }

  if (!token) {
    return next(
      new AppError('Your not logged in! Please log in to get access', 401)
    );
  }

  //2) Verification token..

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)Check if user still exists..
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(new AppError("The user belonging to token doesn't exist", 401));
  }

  //4)Check if user changed password after the token was issued...
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again', 401)
    );
  }

  //Grant access to protected route
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform is action.', 403) //403 means forbidden
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user based on posted email..

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  //2) generate the random token
  const resetToken = user.createPasswordResetToken();
  console.log(resetToken);

  //validatebefore save is needed because it helps us to avoid error..
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // return next(
    //   new AppError('There was an error sending the email. Try again later!'),
    //   500
    // );

    res.status(404).json({
      status: 'fail',
      message: err.message,
    });
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //steps
  //1) Get user based on the token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2) set the new password if token has not expired and there is a new user, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  //3)Update changedPasswordAt property for the user..

  //4) log the user in , send JWT
  createSendToken(newUser, 201, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');

  //2) Check if the POSTED current password is correct
  if (!(await user.correcPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  //3)If so, update password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4)If so, update password,Log user in, send JWT
  createSendToken(user, 201, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});
//npm i jsonwebtoken
