const fs = require('fs');
//const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));

const Tour = require('../models/tourModel');

const getAllTour = async (req, res) => {
    try {
        const queryObj = {...req.query};
        const excludeFields = ['page','sort','limit', 'fields'];
        excludeFields.forEach(el => delete queryObj[el] );
        
        //advanced filtering, 
        let queryStr = JSON.stringify(queryObj);
        //menambah tanda $ didepan kata gte, gt, lte, lt
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        let query = Tour.find(JSON.parse(queryStr));

        // 2 Sorting
        if(req.query.sort) {
            let sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        }else {
            query = query.sort('-createdAt');
        }

        // 3) Fields Limiting
        if (req.query.fields) {
            let fields = req.query.fields.split(',').join(' ');
            query = query.select(fields);
        }else {
            query = query.select('-__v');
        }

        //4) Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);

        // Execute Query
        const tours = await query;
        
        res.status(200).json({
            status: 'success',
            result: tours.length,
            data: {
                tours
            }
        });
    } catch (err) {
        return res.status(400).json({
            status: 'fail',
            message: err
        });
    }
}

const getTour = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);
    
        res.status(200).json({
            'status': 'success',
            'data': {
                tour
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        });
    }
}

const createTour = async (req, res) => {
    try {
        const payload = req.body;
        const newTour = new Tour(payload);
        await newTour.save();

        return res.status(200).json({
            status: 'success',
            data: {
                tour: newTour
            }
        });
    } catch (error) {
        return res.status(400).json({
            status: 'fail',
            message: error
        });
    }
}

const updateTour = async (req, res) => {
    try {
        const payload = req.body;
        //Object new true ini fungsinya untuk mengembalikan data terbaru yang sudah di update
        //jika object new false maka akan mengembalikan data yang sebelum di update
        const tour = await Tour.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }); 
        return res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });
    } catch (err) {
        return res.status(400).json({
            status: 'fail',
            message: err
        });
    }
};

const deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            status: 'success',
            message: 'Tour deleted'
        });
    } catch (err) {
        return res.status(400).json({
            status: 'fail',
            message: err
        });
    }
}

const getTourStats = async (req, res) => {
    try {
        const stats = await Tour.aggregate([
            {
                $match: {ratingsAverage: { $gte: 3.5 }}
            },
            {
                $group: {
                    _id: null,
                    numTours: { $sum: 1 },
                    numRatings: { $sum: '$ratingsQuantity' },
                    avgRating: { $avg: '$ratingsAverage'},
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }
        ]);

        return res.status(200).json({
            status: 'success',
            results: stats.length,
            data: {
                stats
            }
        });
    } catch (err) {
        return res.status(400).json({
            status: 'fail',
            message: err
        });
    }
}

const getMonthlyPlan = async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$startDates' },
                    numTourStart: { $sum: 1 },
                    tour: { $push: '$name' }
                }
            },
            {
                $addFields: { month: '$_id' }
            },
            {
                $project: {
                    _id: 0
                }
            },
            {
                $sort: {
                    numTourStart: 1
                }
            }
        ]);

        return res.status(200).json({
            status: 'success',
            results: plan.length,
            data: {
                plan
            }
        });
    } catch (err) {
        return res.status(400).json({
            status: 'fail',
            message: err
        });
    }
}
//Middleware
//untuk mengecek apakah ada id nya
const aliasTopTours = (req, res, next) => {
    req.query.sort = '-ratingsAverage,price';
    req.query.limit = '5';
    req.query.fields = 'name,price,ratingsAverage,difficulty,summary';
    next();
}

const checkID = (req, res, next, val) => {
    //id nya di kali satu biar nilai nya jadi integer
    if(req.params.id * 1 > tours.length) {
        return res.status(404).json({
            'status': 'fail',
            'message': 'Not Found'
        });
    }

    next();
};

//untuk mengcek price dan name
const checkBody = (req, res, next) => {
    if(!req.body.name || !req.body.price) {
        return res.status(400).json({
            'status': 'fail'
        });
    }
    
    next();
};

module.exports = {
    getAllTour,
    getTour,
    createTour,
    updateTour,
    deleteTour,
    checkID,
    checkBody,
    aliasTopTours,
    getTourStats,
    getMonthlyPlan
};