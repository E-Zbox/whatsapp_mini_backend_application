const {
    Types: { ObjectId },
} = require("mongoose");
// error
const { constructSocketResponse, throwError } = require("../../config/error");
// event emitters
const {
    displayError,
    messageCreated,
    messageSent,
    messagesNotFound,
    messagesResult,
    roomCreated,
    roomNotFound,
    roomResult,
    roomsNotFound,
    roomsResult,
} = require("./emitters");
// utils
const { createAdminPayload } = require("../../utils/controllers/payload");
const { createMessage } = require("../../utils/models/message");
const {
    createRoom,
    findOneRoom,
    getRoomMessages,
    updateRoomMessages,
} = require("../../utils/models/room");
const { findOneUser, updateOneUser } = require("../../utils/models/user");

exports.events = {
    CONNECTION: "connection",
    CREATE_MESSAGE: "create_message",
    CREATE_ROOM: "create_room",
    GET_ROOM: "get_room",
    GET_ROOMS: "get_rooms",
    GET_MESSAGE: "get_message",
    GET_MESSAGES: "get_messages",
    MESSAGE_DELIVERED: "message_delivered",
};

exports.functions = {
    /**
     *
     * @param {Object} payload an object containing
     * {
     *      `body`: message body
     *      `room_id`: room id
     * }
     * @param {*} socket
     */
    createMessage: async (payload, socket, io) => {
        const { body, room_id: _room_id } = payload;

        const sender = ObjectId(socket.user._id);
        const room_id = ObjectId(_room_id);
        console.log("got here [56]");
        const roomResult = await findOneRoom({ _id: room_id });
        console.log("got here [58]");

        if (!roomResult.success) {
            return socket.emit(
                roomNotFound,
                constructSocketResponse(roomResult.error, roomResult.success)
            );
        }
        console.log("got here [66]");

        const { type: room_type, name: room_name } = roomResult.data;

        const newMessage = await createMessage({
            body,
            room_type,
            room_id,
            sender,
        });
        console.log("got here [76]");

        if (!newMessage.success) {
            return socket.emit(
                displayError,
                constructSocketResponse(newMessage.error, newMessage.success)
            );
        }
        console.log("got here [84]");

        // perform update operations on the following Room: messages
        const updatedRoom = await updateRoomMessages(
            room_id,
            newMessage.data._id
        );
        console.log("got here [91]");

        if (!updatedRoom.success) {
            return socket.emit(
                displayError,
                constructSocketResponse(updatedRoom.error, updatedRoom.success)
            );
        }
        console.log("got here [99]");

        // add user to room if not already added
        console.log(socket.rooms);
        socket.join(room_name);

        socket.broadcast.emit(
            messageCreated,
            constructSocketResponse(newMessage.data, newMessage.success)
        );
        console.log("got here [105]");
        // send message to room using Room: name
        console.log(room_name);
        console.log(socket.rooms);
        return io
            .to(room_name)
            .emit(
                messageSent,
                constructSocketResponse(newMessage.data, newMessage.success)
            );
    },
    /**
     *
     * @param {object} payload {
     *      phone,
     * }
     * @param {socketObject} socket
     */
    createRoom: async (payload, socket) => {
        const { phone: _phone } = payload;

        if (!_phone) {
            return socket.emit(
                displayError,
                constructSocketResponse(
                    "No phone was provided. Confirm payload object and try again!"
                )
            );
        }

        const phone = Number(_phone);

        const { user } = socket;

        const { data: creator } = await findOneUser(user.phone);

        const { data: recipient, error, success } = await findOneUser(phone);

        if (!success) {
            return socket.emit(displayError, constructSocketResponse(error));
        }

        const name = `${creator._id}:${recipient._id}`;
        const reverse_name = `${recipient._id}:${creator._id}`;

        const roomWithNameExists = await findOneRoom({ name });
        const roomWithReverseNameExists = await findOneRoom({
            name: reverse_name,
        });

        // check if room exist
        if (roomWithNameExists.success || roomWithReverseNameExists.success) {
            return socket.emit(
                displayError,
                constructSocketResponse({ room_exists: true }, false)
            );
        }

        const type = name === reverse_name ? "SINGLE" : "DUAL";
        const members =
            type == "DUAL"
                ? [ObjectId(creator._id), recipient._id]
                : [ObjectId(creator._id)];

        const _payload = {
            members,
            messages: [],
            name,
            type,
        };

        const newRoom = await createRoom(_payload);

        if (!newRoom.success) {
            return socket.emit(
                displayError,
                constructSocketResponse(newRoom.error)
            );
        }

        // update user(s) room array
        await updateOneUser(creator.phone, {
            rooms: [...creator.rooms, newRoom.data._id],
        });

        if (type === "DUAL") {
            await updateOneUser(recipient.phone, {
                rooms: [...recipient.rooms, newRoom.data._id],
            });
        }

        // add user to this room using the Room: name
        socket.join(newRoom.data.name);

        console.log(socket.rooms);

        return socket
            .to(newRoom.data.name)
            .emit(
                roomCreated,
                constructSocketResponse(newRoom.data, newRoom.success)
            );
    },
    getRoom: async (payload, socket) => {
        const { _id: id } = payload;
        const _id = ObjectId(id);

        console.log(payload);

        const { data, error, success } = await findOneRoom({ _id });

        return socket.emit(
            roomResult,
            constructSocketResponse(success ? data : error, success)
        );
    },
    getRooms: async (payload, socket, io) => {
        const { phone } = socket.user;

        // search for user rooms
        const { data, error, success } = await findOneUser(phone);

        // if userExists.success == false; an error occurred
        if (!success) {
            return socket.emit(displayError, constructSocketResponse(error));
        }

        if (data.rooms.length == 0) {
            return socket.emit(
                roomsNotFound,
                constructSocketResponse(
                    "No rooms where found. Emit `create_room` event to start chat!"
                )
            );
        }

        // add users to rooms returned
        data.rooms.forEach(async (_id) => {
            let { data, error, success } = await findOneRoom({ _id });

            if (!success) {
                return socket.emit(
                    displayError,
                    constructSocketResponse(error)
                );
            }
            console.log(data.name);
            socket.join(data.name);
        });

        console.log(`${socket.user.name} => ${socket.id}`);
        console.log(io.of(socket.nsp.name).sockets);
        return socket.emit(
            roomsResult,
            constructSocketResponse(data.rooms, success)
        );
    },
};
