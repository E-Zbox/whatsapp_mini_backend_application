const {
    model,
    Schema,
    SchemaTypes: { Date, ObjectId },
} = require("mongoose");

const groupInfoSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: false,
        },
        profile: {
            type: String,
            required: false,
        },
    },
    { _id: false }
);

const lockedSchema = new Schema(
    {
        bool: {
            type: Boolean,
            required: true,
        },
        by: {
            type: ObjectId, // `admin` user_id that locked group
            required: true,
        },
        timestamp: {
            type: Date,
            required: true,
        },
    },
    { _id: false }
);

const groupRoomSchema = new Schema({
    admins: {
        type: [ObjectId],
        required: true,
    },
    date_created: {
        type: Date,
        required: true,
    },
    edit_group_info: {
        type: Boolean,
        required: true,
        description:
            "When false, only members with admin priveleges can edit group description, name and profile, ",
    },
    group_info: {
        type: groupInfoSchema,
        required: true,
    },
    locked: {
        type: lockedSchema,
        required: true,
    },
    members: {
        type: [ObjectId],
        required: true,
    },
    messages: {
        type: [ObjectId],
        required: true,
    },
});

module.exports = model("GroupRoom", groupRoomSchema);
