// event emitters and listeners
const { welcomeBackUser } = require("./events/emitters");
const {
    events: {
        CREATE_ROOM,
        GET_ROOM,
        GET_ROOMS,
        CREATE_GROUP_ROOM,
        GET_GROUP_ROOMS,
    },
    functions: {
        createRoom,
        getRoom,
        getRooms,
        createGroupRoom,
        getGroupRooms,
    },
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

    // groups
    socket.on(CREATE_GROUP_ROOM, (payload) =>
        createGroupRoom(payload, socket, io)
    );

    socket.on(GET_GROUP_ROOMS, (payload) => getGroupRooms(payload, socket, io));
};
