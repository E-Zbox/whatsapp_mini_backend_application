// model
const { Message } = require("../../models");

exports.createMessage = async (payload) => {
    /**
     * @payload : {
     *      body, room_type, room_id, sender,
     * }
     */
    let response = { data: null, error: "", success: false };
    try {
        let data = await Message.create({
            ...payload,
            date_created: Date.now(),
            date_delivered: null,
            deleted: false,
        });
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

exports.deleteMessage = async (_id) => {
    let response = { data: null, error: "", success: false };
    try {
        let data = await Message.findOneAndUpdate(
            { _id },
            { deleted: true },
            { new: true }
        );
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

exports.getRoomMessages = async (room_id) => {
    let response = { data: null, error: "", success: false };
    try {
        let data = await Message.find({ room_id });
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

/**
 *
 * @param {ObjectId} _id
 * @param {object} payload { date_delivered: Number}
 * @returns {}
 */
exports.updateMessage = async (_id, payload) => {
    let response = { data: null, error: "", success: false };
    try {
        let data = await Message.findOneAndUpdate({ _id }, payload);
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};
