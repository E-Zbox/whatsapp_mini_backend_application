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

exports.updateGroupInfo = async (_id, payload) => {
    /**
     * @payload : {
     *      name, description, profile
     * }
     */
    let response = { data: null, error: "", success: false };
    try {
        let data = await GroupRoom.findOneAndUpdate(
            { _id },
            { group_info: payload },
            { new: true }
        );
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};
