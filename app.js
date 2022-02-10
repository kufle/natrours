const express = require('express');
const morgan = require('morgan');

const app = express();

//Middleware
if(process.env.NODE_ENV == 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());

//Route
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;