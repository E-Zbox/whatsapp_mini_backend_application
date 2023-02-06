const {Schema} = require("mongoose")

exports.deletedSchema = new Schema({
    bool: {
        type: Boolean,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
});

exports.GroupMessage = require("./GroupMessage");
exports.GroupRoom = require("./GroupRoom");
exports.Message = require("./Message");
exports.Room = require("./Room");
exports.User = require("./User");
