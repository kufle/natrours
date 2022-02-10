const fs = require('fs');
const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');

const app = express();

const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env'});
const DB = process.env.DATABASE_LOCAL;

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => console.log('DB connection successfull'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));

//IMPORT DATA TO DB
const importData = async() => {
    try {
        await Tour.create(tours);
        console.log('Data Successfully imported');
        process.exit();
    } catch (err) {
        console.log(err);
        process.exit();
    }
}

//DELETE ALL DATA FROM DATABASE
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log('Data Successfully deleted');
        process.exit();
    } catch (err) {
        console.log('Data failed delted');
        process.exit();
    }
}

if(process.argv[2] === '--import') {
    importData();
}else if(process.argv[2] === '--delete') {
    deleteData();
}

console.log(process.argv);