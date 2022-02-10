const express = require('express');

const router = express.Router();

//import from controller
const { getAllUser, createUser, getUser, updateUser, deleteUser } = require('../controller/userController');

//define a router
router.get('/', getAllUser);
router.post('/', createUser);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.patch('/:id', deleteUser);

module.exports = router;