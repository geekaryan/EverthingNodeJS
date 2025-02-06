const express = require('express');
const {
  getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('./../controllers/userController');
const authController = require('./../controllers/authController');
// const multer = require('multer');

//calling  multer Upload to use it
//const upload = multer({ dest: 'public/img/users' }); //dest -> destination is there which tell u where in the disk we want to upload our data

const router = express.Router();

router.post('/signup', authController.singUp);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//this middleware here is going to add a protection to all the routes below it
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe); //we are using upload.single because we have only one single file to upload
router.delete('/deleteMe', deleteMe);

router.use(authController.restrictTo('admin'));
router.route('/').get(getAllUsers);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;

//to use multer we are goin to use multer storage and multer filter
