// event emitters and listeners
const { welcomeBackUser } = require("./events/emitters");
const {
    events: { CREATE_ROOM, GET_ROOM, GET_ROOMS },
    functions: { createRoom, getRoom, getRooms },
} = require("./events/listeners");

exports.roomIOController = (io, socket) => {
    console.log("io.sockets.sockets", io.sockets.sockets);
    // welcome back user
    socket.emit(
        welcomeBackUser,
        "Welcome to WhatsApp Chat Community 🎉🎉. It's great to have you back here😊"
    );

    console.log(io.sockets.sockets);

    socket.on(CREATE_ROOM, (payload) => createRoom(payload, socket, io));

    socket.on(GET_ROOM, (payload) => getRoom(payload, socket, io));

    socket.on(GET_ROOMS, (payload) => getRooms(payload, socket, io));
};
