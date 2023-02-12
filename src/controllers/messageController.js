// event emitters and listeners
const {
    events: {
        CREATE_MESSAGE,
        GET_MESSAGES,
        CREATE_GROUP_MESSAGE,
        GET_GROUP_MESSAGES,
    },
    functions: { createMessage, getMessages, createGroupMessage },
} = require("./events/listeners");
// socket middlewares
const { addSocketToRoom } = require("../middlewares/message");

exports.messageIOController = (io, socket) => {
    // socket middleware
    socket.use((packet, next) => addSocketToRoom(packet, next, socket));

    socket.emit("welcome_back_user", "It's great to have you here🤩");

    socket.on(CREATE_MESSAGE, (payload) => createMessage(payload, socket, io));
    socket.on(GET_MESSAGES, (payload) => getMessages(payload, socket));

    // groups
    socket.on(CREATE_GROUP_MESSAGE, (payload) =>
        createGroupMessage(payload, socket, io)
    );
    console.log(createGroupMessage);
};
