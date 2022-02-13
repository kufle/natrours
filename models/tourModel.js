const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'a tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal then 40 characters'],
        minlength: [5, 'A tour name must have more or equal then 5 characters']
    },
    slug: String,
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
        required: [true, 'a tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 1.0,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'a tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                //hanya berfungsi saat membuat dokumen baru
                return val < this.price
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
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
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    }
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

//Document Middleware
//membuat slug sebelum datanya disimpan ke database, mirip mutator di laravel
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

//Query Middleware
//menjalankan middleware saat find query
tourSchema.pre(/^find/, function(next) {
    this.find({secretTour: { $ne: true }});
    next();
});

//Aggregation Middleware
tourSchema.pre('aggregate', function(next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true }} });
    next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;