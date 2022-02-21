const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const res = require('express/lib/response');

const signToken = (id, res) => {
    //membuat token JWT
    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
    
    //daftarkan jwt ke cookie juga
    const cookieOption = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }

    //jika mode production maka perlu https untuk cookie nya
    if(process.env.NODE_ENV === 'production') cookieOption.secure = true;

    res.cookie('jwt', token, cookieOption);

    //return JWT
    return token;
}

exports.signup = async (req, res, next) => {
    try {
        const payload = req.body;

        if(payload.password !== payload.passwordConfirm) {
            return next(new AppError('Password Confirm must be same as password', 400));
        }

        const newUser = await User.create({
            name: payload.name,
            email: payload.email,
            password: payload.password,
            passwordConfirm: payload.passwordConfirm
        });

        //sembunyikan property password di tampilan
        newUser.password = undefined;

        //dapatkan token JWT
        const token = signToken(newUser.id, res);
        
        return res.status(201).json({
            status: 'success',
            token,
            data: {
                user: newUser
            }
        });
    } catch (err) {
        next(err);
    }
}

exports.login = async (req, res, next) => {
    try {
        const {email, password} = req.body;
        //1) check if email and password request exist
        if(!email || !password) {
            return next(new AppError('Please provide the email and password', 400));
        }
        //2) check if user exsist && password is correct
        const user = await User.findOne({ email }).select('+password');
        if(user) {
            const checkPassword = await user.correctPassword(password, user.password);
            if(!checkPassword) {
                return next(new AppError('Incorrect email or password', 401));
            }
        } else {
            return next(new AppError('Incorrect email or password', 401));
        }

        //3) if everything is ok, send the token to client
        const token = signToken(user.id, res);
        return res.status(200).json({
            status: 'success',
            token
        });
    } catch (err) {
        next(err);
    }
}

exports.protect = async (req, res, next) => {
    try {
        //1) getting token
        let token;
        
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if(!token) {
            return next(new AppError('You are not login, please login to get access', 401));
        }

        //2) Verification token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        //3)check if user still exist
        const currentUser = await User.findById(decoded.id);
        if(!currentUser) {
            return next(new AppError('The user belonging to this token does no longer exist', 401));
        }
        //4) check if user changed password after the token has issued
        //iat adalah issued at atau tanggal di dapatnya token dari JWT
        //cek apakah user pernah ganti password && apakah tanggal update password melebihi tanggal login JWT
        if(currentUser.passwordChangedAt && currentUser.isUserUpdatePassword(decoded.iat)) {
            return next(new AppError('User recently changed Password! please login again', 401));
        }

        //Grant access to protected route
        req.user = currentUser;
        next();
    } catch (err) {
        next(err);
    }
}

exports.restricTo = (...roles) => {
    return (req, res, next) => {
        //cek jika role apakah memiliki request role yang sama dengan roles
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You do not have to perform this action', 403));
        }

        next();
    }
}

exports.forgotPassword = async (req, res, next) => {
    try {
        //1) Get User base on Email
        const email = req.body.email
        if(!email) {
            return next(new AppError('Please provide the email', 400));
        }

        const user = await User.findOne({email});
        if(!user) {
            return next(new AppError('There is no user with email address', 404));
        }

        //2) Generate Random token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        //3) Send it to user
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;

        const message = `Forgot your password ? Submit a Patch request with your new request password and password confirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Your password reset token (valid for 10min)',
                message
            });
    
            return res.status(200).json({
                status: 'success',
                message: 'Token Sent to mail'
            });
        } catch (err) {
            user.passwordResetToken = undefined;
            user.passwordResetExpired = undefined;

            await user.save({ validateBeforeSave: false });

            return next(new AppError('There was an error sending the email. Try again later', 500));
        }
    } catch (err) {
        next(err);
    }
}

exports.resetPassword = async (req, res, next) => {
    try {
        const payload = req.body;
        console.log(payload);
        if(payload.password !== payload.passwordConfirm) {
            return next(new AppError('Password Confirm must be same as password', 400));
        }

        //1) Get User based on Token
        //encrypt ke sha256 agar bisa di bandingkan dengan yang didatabase
        const tokenParams = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({ passwordResetToken: tokenParams, passwordResetExpired: {$gte: Date.now()} });

        if(!user) {
            next(new AppError('Token Expired or Invalid Token', 400));
        }
        //3)update changePasswordat property for the user
        user.password = payload.password;
        user.passwordConfirm = payload.passwordConfirm;
        //di kurangi 2 detik karena bisa jadi lebih duluan JWT yg di proses
        //di pindah ke middleware model 
        //user.passwordChangedAt = Date.now() - 2000;
        user.passwordResetToken = undefined;
        user.passwordResetExpired = undefined;
        await user.save();
        
        const token = signToken(user.id, res);

        return res.status(200).json({
            status: 'success',
            token
        });
    } catch (err) {
        next(err);
    }
}

exports.updatePassword = async (req,res,next) => {
    try {
        const payload = req.body;
        if(!payload.passwordCurrent || !payload.password || !payload.passwordConfirm) {
            return next(new AppError('Please fill all field', 400));
        }

        //1. check if posted current password is correct
        const user = await User.findById(req.user.id).select('+password');
       
        if(user) {
            const checkPassword = await user.correctPassword(payload.passwordCurrent, user.password);
            if(!checkPassword) {
                return next(new AppError('Incorrect Current Password', 401));
            }
        } else {
            return next(new AppError('User not found please login', 404));
        }

        //cek apakah password konfirmasi nya sama dengan password
        if(payload.password !== payload.passwordConfirm) {
            return next(new AppError('Password Confirm must be same as password', 400));
        }

        //2. update password
        //password nya di hash di model
        user.password = payload.password;
        user.passwordConfirm = payload.passwordConfirm;
        await user.save();
        
        //4. login user, send jwt
        const token = signToken(user.id, res);

        return res.status(200).json({
            status: 'success',
            token
        });

    } catch (err) {
        next(err);
    }
}