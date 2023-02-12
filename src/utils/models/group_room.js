// error
const { handleRoomNotFound, throwError } = require("../../config/error");
// model
const { GroupRoom } = require("../../models");

exports.createGroupRoom = async (payload) => {
    /**
     * @payload : {
     *      admins, edit_group_info, group_info, locked, members,
     *      messages => []
     * }
     */
    let response = {
        data: null,
        error: "",
        success: false,
    };
    try {
        let data = await GroupRoom.create({
            ...payload,
            date_created: Date.now(),
        });
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

exports.findOneGroupRoom = async (_id) => {
    let response = { data: null, error: "", success: false };
    try {
        let data = await GroupRoom.find({ _id });

        if (!data) throwError(handleRoomNotFound({ _id }));

        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

exports.updateGroupRoom = async (_id, payload) => {
    /**
     * @payload : {
     *      name, description, profile
     * }
     */
    let response = { data: null, error: "", success: false };
    try {
        let data = await GroupRoom.findOneAndUpdate(
            { _id },
            { ...payload },
            { new: true }
        );
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};
