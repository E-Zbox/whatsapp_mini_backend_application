const {
    model,
    Schema,
    SchemaTypes: { ObjectId, Date },
} = require("mongoose");

const roomSchema = new Schema({
    date_created: {
        type: Date,
        required: true,
    },
    members: {
        type: [ObjectId],
        required: true,
        validate: [
            (val) => {
                console.log(`${val.length} => ${val}`);
                return val.length <= 10;
            },
            "{PATH} exceeds the limit of 10",
        ],
    },
    messages: {
        type: [ObjectId],
        required: true,
    },
    name: {
        type: String,
        required: true,
        /**
         * creator_id:recepient_id
         * where creator_id is the id of the user that started chat in this room
         */
    },
    type: {
        type: String,
        enum: ["SINGLE", "DUAL"],
        required: true,
    },
});

module.exports = model("Room", roomSchema);
