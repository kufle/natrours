const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
//Route
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const app = express();

//Middleware
if(process.env.NODE_ENV == 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());

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