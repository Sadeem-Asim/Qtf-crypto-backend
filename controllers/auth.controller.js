/*****  Packages  *****/
import Joi from "joi";
import bcrypt from "bcrypt";

/*****  Modules  *****/
import {UserModel} from "#models/user.model";
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import _ from "lodash";

const validate = (req) => {
    const schema = Joi.object({
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(5).max(255).required()
    });

    return schema.validate(req)
}

/**
 @desc     Authenticate UserModel
 @route    POST /api/auth
 @access   Public
 */
const loginUser = (asyncHandlerMiddleware(async (req, res) => {
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let user = await UserModel.findOne({email: req.body.email}).select('+role');
    if (!user) return res.status(400).send('Invalid email or password.');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password.');

    const token = user.generateAuthToken();
    res
        .cookie('x-auth-token', token, {
            httpOnly: true,
            maxAge: 365 * 24 * 60 * 60 * 1000
        }) // maxAge expire after 1 hour
        .header("x-auth-token", token)
        .header("access-control-expose-headers", "x-auth-token")
        .send(_.pick(user, ['name', 'email', 'role', '_id', 'api']));
}));

/**
 @desc     Clear Cookies
 @route    GET /api/auth/logout
 @access   Public
 */

const logout = asyncHandlerMiddleware(async (req, res) => {
    res
        .cookie("x-auth-token", null)
        .send('Successfully logout')

});

export {loginUser, logout};
