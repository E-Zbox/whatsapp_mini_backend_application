const {
    model,
    Schema,
    SchemaTypes: { Date, ObjectId },
} = require("mongoose");
const { deletedSchema } = require("./index.js");

const deliveredToSchema = new Schema(
    {
        date: {
            type: Number,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const seenBySchema = new Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        user_id: {
            type: ObjectId,
            required: true,
        },
    },
    { _id: false }
);

const groupMessageSchema = new Schema({
    body: {
        type: String,
        required: true,
    },
    date_created: {
        type: Date,
        required: true,
    },
    deleted: {
        type: deletedSchema,
        required: true,
    },
    delivered_to: {
        type: [deliveredToSchema],
        required: true,
    },
    group_room_id: {
        type: ObjectId,
        required: true,
    },
    seen_by: {
        type: [seenBySchema],
        required: true,
    },
    sender: {
        type: ObjectId,
        required: true,
    },
});

module.exports = model("GroupMessage", groupMessageSchema);
