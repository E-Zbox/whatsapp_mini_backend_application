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
