const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
//Route
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const app = express();

//Global Middleware
//set security HTTP request
app.use(helmet());

//development Logging URL
if(process.env.NODE_ENV == 'development') {
    app.use(morgan('dev'));
}

//Rate limiting
//max adalah maximum hit url
//windowMs waktu maksimum hit api  
const limiter = rateLimit({
    max: 100,
    windowMS: 60*60*1000,
    message: 'Too many request from this IP, please try again in an hour!'
});
//limit semua api
app.use('/api', limiter);

//middleware untuk mendapatkan request body
app.use(express.json());

//data sanitization untuk melawan NoSQL query injection
app.use(mongoSanitize());

//data sanitization untuk melawan XSS
app.use(xss());

//mencegah parameter pollution
app.use(hpp({
    whitelist: [
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

//middleware router
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//Error handling apabila link tidak ditemukan
app.all('*', (req, res, next) => {
    next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

//err.statusCode , err.status dan err,message di dapat dari utils appError.js
//jadi setiap ada error middleware ini akan menampilkan pesan error tersebut
app.use(globalErrorHandler);

module.exports = app;