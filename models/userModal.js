const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const useSchema = new mongoose.Schema({
  passwordChangedAt: {
    type: Date,
  },
  name: {
    type: String,
    required: [true, 'User must have a username'],
  },
  email: {
    type: String,
    required: [true, 'User must have an email address'],
    unique: true,
    lowercase: true,
    //We are using validate then validator package with validator.isEmail..
    validate: [validator.isEmail, 'Please provide a valid email'], //validate email
  },
  photos: String,
  role: {
    type: String,
    //enum is used to se the roles specific to the application
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'User must have a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'User must have a password confirmation'],
    //validate if the password are equal..
    //only works when we create a new object and save not on update..
    //we are making a validate function calling the this.password and checking
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// //encrption...
// //between getting and setting before in database..
// useSchema.pre('save', async function (next) {
//   //Only run this function if password was actually modified..
//   //isModified is not equal to password then we can return to the next thing..
//   if (!this.isModified('password')) return next();

//   //using bcrypt it's a async and then using with a length or value of 12..
//   //bcrypt.hash (this.password, 12 //usually it's 10)
//   this.password = await bcrypt.hash(this.password, 12);

//   //here we are making our confirm password undefine..
//   this.passwordConfirm = undefined;
//   next();
// });

//pre middleware works between getting the data and saving the data in the database so we
//are using it here..

//->comment strt
useSchema.pre('save', async function (next) {
  //isModified tell us whether in the current the thing is modified or not..
  if (!this.isModified('password')) return next();

  //so here we are placing this.passowrd value equal to bcrypt.hash(passing the password, with how long it should be.. )
  this.password = await bcrypt.hash(this.password, 12);

  //delete a field..
  //we are not going to check the password confirm
  this.passwordConfirm = undefined;
  next();
});

useSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//query middleware

useSchema.pre(/^find'/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//Instance method..
useSchema.methods.correcPassword = async function (
  candidatePassword,
  userPassword
) {
  //we are comparing here the user password with our login entered password..
  return await bcrypt.compare(candidatePassword, userPassword);
};

useSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp; //100<200
  }

  // False means NOT changed
  return false;
};

useSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', useSchema);

module.exports = User;

//for bcrypt use npm i bcryptjs ==>important
