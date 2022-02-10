const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'a tour must have a name'],
        unique: true,
        trim: true
    },
    duration: {
        type: Number,
        required: [true, 'a tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'a tour must have a duration']
    },
    difficulty: {
        type: String,
        required: [true, 'a tour must have a duration']
    },
    ratingsAverage: {
        type: Number,
        default: 1.0
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'a tour must have a price']
    },
    priceDiscount: Number,
    summary: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: [String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date]
},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

//durationweek adalah nama object yang nanti akan ditampilkan
//.get() berarti ini akan muncul saat nge get data , mirip accesor di laravel
//disini kita menggunakan function regular / bukan arrow function karena arrow function tidak support keyword this
tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;