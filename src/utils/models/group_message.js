// model
const { GroupMessage } = require("../../models");

exports.createGroupMessage = async (payload) => {
    /**
     * @payload : {
     *      body, delivered_to, group_room_id, seen_by, sender
     * }
     */
    let response = { data: null, error: "", success: false };
    try {
        let data = await GroupMessage.create({
            ...payload,
            date_created: Date,
        });
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};

exports.updateGroupMessage = async (_id, property_name, new_value) => {
    /**
     * push to either seen_by or delivered_to property
     * @property_name : can be 'seen_by' or 'delivered_to' so as to perform the below operation
     *      [property_name]: new_value
     * @new_value : {
     *      date: Date, user_id: ObjectId
     * }
     */
    let response = { data: null, error: "", success: false };
    try {
        let data = await GroupMessage.findOneAndUpdate(
            { _id },
            { $push: { [property_name]: new_value } }
        );
        response = { ...response, data, success: true };
    } catch (error) {
        response = { ...response, error: error.message };
    } finally {
        return response;
    }
};
