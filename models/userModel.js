const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema({
    name : {
        type: String,
        required: [true, 'Please tell us your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide your email']
    },
    photo: String,
    role: {
        type: String,
        enum: ['user','guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Password must be filled'],
        minlength: true,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please Confirm your password'],
        validate: {
            //This only work on save and create
            validator: function(el) {
                return el === this.password;
            },
            message: 'Password are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpired: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

//Middleware untuk encrypt password
userSchema.pre('save', async function(next) {
    //jika password tidak ada perubahan/modified. maka exit
    if(!this.isModified('password')) return next();
    //10 adalah cost nya
    this.password = await bcrypt.hash(this.password, 10);

    this.passwordConfirm = undefined;
    next();
});

//Middleware untuk update property tanggal passwordChangedAt  
userSchema.pre('save', function(next){
    //cek apakah ada request ganti password kalo tidak ada, tidak di update atau data nya baru tidak di update juga 
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 2000;

    next();
});

//middleware untuk filter user active
userSchema.pre(/^find/, function(next) {
    this.find({active: {$ne: false}});
    next()
});

//middleware untuk cek password
userSchema.methods.correctPassword = async function(requestPassword, userPassword) {
    return await bcrypt.compare(requestPassword, userPassword);
}

//middleware untuk mengecek apakah user ada update password, dengan membandingkan waktu JWT dan waktu update passowrd
userSchema.methods.isUserUpdatePassword = function (JWTTimestamp) {
    const changeTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    
    //Jika tanggal JWT kurang dari tanggal update password maka lakukan login ulang
    return JWTTimestamp < changeTimestamp;
}

//Middleware untuk membuat Token reset password
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    //encrypt resetToken ke hash sha256 biar lebih secure daripada plaintext langsung resetToken
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log({ resetToken}, this.passwordResetToken);

    //set password expired selama 20 menit
    this.passwordResetExpired = Date.now() + 20 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;