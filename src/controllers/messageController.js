// event emitters and listeners
const {
    events: { CREATE_MESSAGE, GET_MESSAGES },
    functions: { createMessage },
} = require("./events/listeners");

exports.messageIOController = (io, socket) => {
    socket.on(CREATE_MESSAGE, (payload) => createMessage(payload, socket, io));
};
