const {
    model,
    Schema,
    SchemaTypes: { ObjectId, Date },
} = require("mongoose");

const messageSchema = new Schema({
    body: {
        type: String,
        required: true,
    },
    date_created: {
        type: Date,
        required: true,
    },
    date_delivered: {
        type: Date,
        required: false,
    },
    deleted: {
        type: Boolean,
        required: true,
    },
    room_type: {
        type: "String",
        enum: ["SINGLE", "DUAL"],
    },
    room_id: {
        type: ObjectId,
        required: true,
    },
    sender: {
        type: ObjectId,
        required: true,
    },
});

module.exports = model("Message", messageSchema);
