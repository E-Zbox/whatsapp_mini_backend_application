const {
    Types: { ObjectId },
} = require("mongoose");
// event emitters
const { displayError } = require("../controllers/events/emitters");
// response
const { constructSocketResponse } = require("../utils/controllers/payload");
// utils
const { findOneRoom } = require("../utils/models/room");

exports.addSocketToRoom = async (packet, next, socket) => {
    const randomData = [
        "create_message",
        {
            body: "Apparently Kendrick has cried for a woman (woman matter not because of heartbreak)",
            room_id: "63df8e7afb238be50d8b4853",
        },
    ];
    const socketRooms = Array.from(socket.rooms);
    const [_, { room_id: _room_id }] = packet;
    const room_id = ObjectId(_room_id);

    const { data, error, success } = await findOneRoom({ _id: room_id });

    if (!success) {
        return socket.emit(
            displayError,
            constructSocketResponse(error, success)
        );
    }

    if (!socketRooms.includes(data.name)) {
        socket.join(data.name);
    }

    next();
};
