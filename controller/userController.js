const User = require('../models/userModel');

const filterObj = (bodyObj, ...allowedBody) => {
    const newObj = {};
    //Object.key fungsinya mengambil key nya saja, contoh name: "korong", yg di ambil name nya
    Object.keys(bodyObj).forEach(el => {
        if (allowedBody.includes(el)){
            newObj[el] = bodyObj[el]
        }
    });

    return newObj;
}

const getAllUser = async (req, res, next) => {
    try {
        const user = await User.find();
        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (err) {
        next(err);
    }   
}

const updateMe = async (req, res, next) => {
    try {
        //Filtered unwanted field
        const filteredBody = filterObj(req.body, 'name', 'email');
        
        const userUpdate = await User.findByIdAndUpdate(req.user.id, filteredBody, { new: true, runValidators: true });
        return res.status(200).json({
            status: 'success',
            data: {
                userUpdate
            }
        });
    } catch (err) {
        next(err);
    }
}

const deleteMe = async (req, res, next) => {
    try{
        await User.findByIdAndUpdate(req.user.id, {active: false});

        return res.status(204).json({
           status: 'success',
           message: 'account successfully deactivate' 
        });
    } catch (err) {
        next(err);
    }
}

const createUser = (req, res) => {
    res.status(500).json({
        'status': 'error',
        'message': 'THis route is not yet defined'
    });
}

const getUser = (req, res) => {
    res.status(500).json({
        'status': 'error',
        'message': 'THis route is not yet defined'
    });
}

const updateUser = (req, res) => {
    res.status(500).json({
        'status': 'error',
        'message': 'THis route is not yet defined'
    });
}


const deleteUser = (req, res) => {
    res.status(500).json({
        'status': 'error',
        'message': 'THis route is not yet defined'
    });
}

module.exports = {
    getAllUser,
    createUser,
    getUser,
    updateUser,
    deleteUser,
    updateMe,
    deleteMe
};