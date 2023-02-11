// errors
const { constructErrorMessage } = require("../config/error");
// event emitters
const { userIsOffline } = require("../controllers/events/emitters");
// response
const { constructSocketResponse } = require("../utils/controllers/payload");
// utils
const { findOneRoom } = require("../utils/models/room");
const { findOneUser, updateOneUser } = require("../utils/models/user");

exports.updateUserSocket = async (_socket, next) => {
    const socket = { id: _socket.id };

    // check if the User: socket.id property is in-sync with the id provide by socket.io
    const { data: userData } = await findOneUser(_socket.user.phone);

    if (userData.socket?.id !== socket.id) {
        // update socket value
        const { data, error, success } = await updateOneUser(
            _socket.user.phone,
            {
                online_status: true,
                socket,
            }
        );

        if (!success) {
            return next(constructErrorMessage(error, 404));
        }
    }

    console.log("------------------------------------");
    console.log(`NSP: ${_socket.nsp.name}`);
    console.log(`User: ${_socket.user.name} => SocketID [ ${_socket.id} ]`);
    console.log("======================================");
    next();
};

// READ THIS !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
/**
 * working on sockets disconnect function
 */
exports.handleDisconnect = async (payload, socket, io) => {
    const socketRooms = Array.from(socket.adapter.rooms);

    // update user's last_seen, online_status
    await updateOneUser(socket.user.phone, {
        last_seen_status: Date.now(),
        online_status: false,
    });

    socketRooms.forEach(async (_room) => {
        let [room] = _room;
        let roomExists = await findOneRoom({ name: room });

        if (!roomExists.data) {
            return;
        }
        let payload = {
            isOffline: true,
            user: {
                name: socket.user.name,
                _id: socket.user._id,
                phone: socket.phone,
            },
        };
        io.of(socket.nsp.name)
            .to(room)
            .emit(userIsOffline, constructSocketResponse(payload, true));
    });
};
