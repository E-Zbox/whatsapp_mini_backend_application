// error
const { handleRoomNotFound, throwError } = require("../../config/error");
// models
const { Room } = require("../../models");

exports.createRoom = async (payload) => {
    /**
     * @payload : {
     *      members, messages, name, type
     * }
     */
    let response = { data: null, error: "", success: false };
    try {
        let data = await Room.create({ date_created: Date.now(), ...payload });
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

/**
 *
 * @param {Object} payload
 * finds room with the given payload
 */
exports.findOneRoom = async (payload) => {
    let response = { data: null, error: "", success: false };
    try {
        let data = await Room.findOne({ ...payload });

        if (!data) throwError(handleRoomNotFound({ ...payload }));

        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

// this function is redundant
exports.getRoomMessages = async (_id) => {
    let response = { data: null, error: "", success: false };
    try {
        let data = await Room.findOne({ _id });

        if (!data) throwError(handleRoomNotFound({ _id }));

        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

exports.updateRoomMessages = async (_id, message_id) => {
    /**
     * add message to a room by `_id`
     */
    let response = { data: null, error: "", success: false };
    try {
        let data = await Room.findOneAndUpdate(
            { _id },
            { $push: { messages: message_id } }
        );
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

exports.deleteRoomMessage = async (_id, message_id) => {
    /**
     * pop a message_id from rooms
     */
    let response = { data: null, error: "", success: false };
    try {
        let data = await Room.findOneAndUpdate(
            { _id },
            { $pull: { messages: message_id } },
            { new: true }
        );
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};
