const express = require('express');

const router = express.Router();

//import controller
const { 
    getAllTour, 
    createTour, 
    getTour, 
    checkID, 
    checkBody, 
    updateTour, 
    deleteTour, 
    aliasTopTours,
    getTourStats,
    getMonthlyPlan
} = require('../controller/tourController');

const authController = require('../controller/authController');

//jika url nya mengandung id , maka di cek dulu id tersebut apakah ada
//router.param('id', checkID);
router.get('/top-5-cheap', aliasTopTours, getAllTour);
router.get('/tour-stats', getTourStats);
router.get('/monthly-plan/:year', getMonthlyPlan);
//define a router
router.get('/', authController.protect, getAllTour);
router.post('/',checkBody, createTour);
router.get('/:id', getTour);
router.patch('/:id', updateTour);
router.delete('/:id',authController.protect, authController.restricTo('admin', 'lead-guide'), deleteTour);

module.exports = router;