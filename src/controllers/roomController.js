// event emitters and listeners
const { welcomeBackUser } = require("./events/emitters");
const {
    events: { CREATE_ROOM, GET_ROOM, GET_ROOMS, GET_GROUP_ROOMS },
    functions: { createRoom, getRoom, getRooms, getGroupRoom, getGroupRooms },
} = require("./events/listeners");

exports.roomIOController = (io, socket) => {
    // welcome back user
    socket.emit(
        welcomeBackUser,
        "Welcome to WhatsApp Chat Community 🎉🎉. It's great to have you back here😊"
    );

    socket.on(CREATE_ROOM, (payload) => createRoom(payload, socket, io));

    socket.on(GET_ROOM, (payload) => getRoom(payload, socket, io));

    socket.on(GET_ROOMS, (payload) => getRooms(payload, socket, io));

    socket.on(GET_GROUP_ROOMS, (payload) => getGroupRooms(payload, socket, io));
};
