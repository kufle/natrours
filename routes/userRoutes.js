const express = require('express');

const router = express.Router();

//import from controller
const { getAllUser, createUser, getUser, updateUser, deleteUser, updateMe, deleteMe } = require('../controller/userController');
const { signup, login, forgotPassword, resetPassword, protect, updatePassword } = require('../controller/authController');

//define a router
//Auth
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.patch('/update-password', protect, updatePassword);
router.patch('/update-me', protect, updateMe);
router.delete('/delete-me', protect, deleteMe);
//User
router.get('/', getAllUser);
router.post('/', createUser);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.patch('/:id', deleteUser);

module.exports = router;