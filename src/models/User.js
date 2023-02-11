const {
    model,
    Schema,
    SchemaTypes: { ObjectId },
} = require("mongoose");

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    about: {
        type: String,
        default: "",
    },
    phone: {
        type: Number,
        required: true,
        unique: true,
        validate: {
            validator: (v) => {
                // 234-xxx-6072-xxx
                let vString = String(v);
                return vString.length == 13 && vString.substring(0) !== "0";
            },
            message: "Invalid number was passed",
        },
    },
    profile: {
        type: String,
        default: "",
    },
    online_status: {
        type: Boolean,
        required: true,
        default: true,
    },
    show_online_status: {
        type: Boolean,
        required: true,
        default: true,
    },
    last_seen_status: {
        type: Number,
        required: true,
    },
    show_last_seen_status: {
        type: Boolean,
        required: true,
        default: true,
    },
    signed_token: {
        type: String,
        required: true,
        default: "",
    },
    group_rooms: {
        type: [ObjectId],
        required: true,
    },
    rooms: {
        type: [ObjectId],
        required: true,
    },
    socket: {
        type: { id: String },
        required: false,
    },
});

module.exports = model("User", userSchema);
