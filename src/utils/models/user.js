const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// error
const { handleUserNotFound, throwError } = require("../../config/error");
// models
const { User } = require("../../models");

exports.createUser = async (payload) => {
    /**
     * payload: {
     *      name, about?, phone, online_status, show_online_status,
     *      last_seen_status, show_last_seen_status, signed_token
     * }
     */
    let response = { data: null, error: "", success: false };
    try {
        let data = await User.create({
            ...payload,
            group_rooms: [],
            rooms: [],
            socket: { id: "" },
        });
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

exports.findOneUser = async (phone) => {
    let response = { data: null, error: "", success: false };
    try {
        let data = await User.findOne({ phone });

        if (!data) throwError(handleUserNotFound(phone));

        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

exports.findOneUserWithPayload = async (payload) => {
    let response = { data: null, error: "", success: false };
    try {
        let data = await User.findOne(payload);

        if (!data) throwError(handleUserNotFound(phone));

        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

/**
 * @param {Number} phone 234-xxx-YYYY-xxx
 * @param {Object} payload {name, about, profile, show_online_status, ... except phone}
 * @returns { data: Object, error: String, success: Boolean}
 */
exports.updateOneUser = async (phone, payload) => {
    /**
     * updates any user property that gets passed in payload
     * i.e {name, about, profile, ...}
     *
     * Note that: phone cannot be updated
     */
    let response = { data: null, error: "", success: false };
    try {
        let data = await User.findOneAndUpdate(
            { phone },
            { ...payload, phone },
            { new: true }
        );

        if (!data) throwError(handleUserNotFound(phone));

        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

exports.signUserPayload = (payload, secretKey) => {
    return jwt.sign(payload, secretKey, { expiresIn: "2hr" });
};

exports.verifyUserToken = (token, secretKey) => {
    let response = { data: null, error: "", success: false };
    try {
        let data = jwt.verify(token, secretKey);
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: JSON.stringify(error) };
    } finally {
        return response;
    }
};
