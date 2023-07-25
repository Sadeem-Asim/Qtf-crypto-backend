/*****  Packages  *****/
import Joi from "joi";
import mongoose from "mongoose";
import JoiObjectId from "joi-objectid";


const mongoonse_id = JoiObjectId(Joi)

const subAdminUsersSchema = new mongoose.Schema({
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    sub_admin: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
}, {timestamps: true});

const subAdminUsers = mongoose.model('sub_admins', subAdminUsersSchema);

const subAdminUsersValidation = (data) => {
    const schema = Joi.object({
        user_id: Joi.array().items(mongoonse_id()),
        sub_admin: mongoonse_id().required(),
    });
    return schema.validate(data);
}
export {subAdminUsers, subAdminUsersValidation as validate}
