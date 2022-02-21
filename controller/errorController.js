const AppError = require("../utils/appError");

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrorProd = (err, res) => {
    //Operational, Trusted error: send message to client
    if(err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message ? err.message : err._message
        });
    } else {
        //programing or other unknown error: dont leak error details
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong'
        });
    }
    
}

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = err => {
    const message = `Duplicate field value: ${err.keyValue.name} .Please use another value`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = err => {
    //object.values fungsinya untuk mengambil isi dari object , dan mengembalikan nilai nya menjadi array
    //contoh const obj = { foo: 'bar', baz: 42 }; Object.values(obj) hasilnya ['bar', 42]
    let error = Object.values(err.errors).map(el => el.message);
    const message = `Ivalid Input data. ${error.join('. ')}`;
    return new AppError(message, 400);
}

const handleJsonWebTokenError = err => {
    const message = `Invalid token. please login again`;
    return new AppError(message, 401);
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development') {
        console.log(err);
        sendErrorDev(err, res);
    } else if(process.env.NODE_ENV === 'production') {
        //err di copy karena props itu sifatnya imutable(tidak bisa di ubah)
        let error = { ...err };
        //console.log(err);
        if(err.name === 'CastError') error = handleCastErrorDB(error);
        if(err.code === 11000) error = handleDuplicateFieldsDB(error);
        if(err.name === 'ValidationError') error = handleValidationErrorDB(error);
        if(err.name === 'JsonWebTokenError') error = handleJsonWebTokenError(error);

        sendErrorProd(error, res);
    }
}