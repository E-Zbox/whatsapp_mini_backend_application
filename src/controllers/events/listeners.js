const {
    Types: { ObjectId },
} = require("mongoose");
// error
const { throwError } = require("../../config/error");
// event emitters
const {
    displayError,
    groupMessageSent,
    groupMessagesNotFound,
    groupRoomCreated,
    groupRoomNewMemberJoined,
    groupRoomNotFound,
    groupRoomResult,
    groupRoomsNotFound,
    groupRoomsResult,
    messageSent,
    messagesNotFound,
    messagesResult,
    roomCreated,
    roomNotFound,
    roomResult,
    roomsNotFound,
    roomsResult,
    userIsOnline,
} = require("./emitters");
// response
const { constructSocketResponse } = require("../../utils/controllers/payload");
// utils
const { createAdminPayload } = require("../../utils/controllers/payload");
const { createGroupRoom } = require("../../utils/models/group_room");
const {
    createMessage,
    getRoomMessages,
    updateMessage,
} = require("../../utils/models/message");
const {
    createRoom,
    findOneRoom,
    updateRoomMessages,
} = require("../../utils/models/room");
const {
    findOneUser,
    findOneUserWithPayload,
    updateOneUser,
} = require("../../utils/models/user");

exports.events = {
    CONNECTION: "connection",
    // messages & rooms
    CREATE_MESSAGE: "create_message",
    GET_MESSAGE: "get_message",
    GET_MESSAGES: "get_messages",
    CREATE_ROOM: "create_room",
    GET_ROOM: "get_room",
    GET_ROOMS: "get_rooms",
    MESSAGE_DELIVERED: "message_delivered",
    // group messages & rooms
    CREATE_GROUP_MESSAGE: "create_group_message",
    GET_GROUP_MESSAGES: "get_group_messages",
    CREATE_GROUP_ROOM: "create_group_room",
    GET_GROUP_ROOM: "get_group_room",
    GET_GROUP_ROOMS: "get_group_rooms",
    GROUP_MESSAGE_DELIVERED: "group_message_delivered",
};

exports.functions = {
    /**
     *
     * @param {Object} payload an object containing
     * {
     *      `body`: message body
     *      `room_id`: room id
     * }
     * @param {socketObject} socket
     */
    createMessage: async (payload, socket, io) => {
        /**
         * the `room_id` gotten from payload is used to find a room,
         * if the room does not exist,
         *      - an event is emitted (room_not_found) to the user
         * else, from the room id we check if the socket.user.id (sender) is a member of the room
         *      if not a member,
         *          - an event is emitted (display_error) to the user (only members can send message to this room)
         *      else,
         *          a new message is created, room with room_id is updated with the new messages
         *          if the type of the room is 'DUAL',
         *              we perform a check to see if the recipient is online:
         *                  if true, the recipient (user's socket) is added to room,
         *                      and we update the new message `date_delivered`  property
         *                  else: NOTHING
         *              we also, update the recipient (user's room property) with this room_id if this was the first chat
         *              (i.e no message exists in this room before now)
         *          - an event is emitted (message_sent) to the room
         */
        const _io = io.of(socket.nsp.name);
        const { body, room_id: _room_id } = payload;

        const sender = ObjectId(socket.user._id);
        const room_id = ObjectId(_room_id);
        const roomResult = await findOneRoom({ _id: room_id });

        if (!roomResult.success) {
            return socket.emit(
                roomNotFound,
                constructSocketResponse(roomResult.error, roomResult.success)
            );
        }

        const { type: room_type, name: room_name, members } = roomResult.data;

        // only room members get to send message to a room
        if (!members.includes(sender)) {
            return socket.emit(
                displayError,
                constructSocketResponse(
                    404,
                    "Only room members can send message."
                )
            );
        }

        const newMessage = await createMessage({
            body,
            room_type,
            room_id,
            sender,
        });

        if (!newMessage.success) {
            return socket.emit(
                displayError,
                constructSocketResponse(newMessage.error, newMessage.success)
            );
        }

        // perform update operations on the following Room: messages
        const updatedRoom = await updateRoomMessages(
            room_id,
            newMessage.data._id
        );

        if (!updatedRoom.success) {
            return socket.emit(
                displayError,
                constructSocketResponse(updatedRoom.error, updatedRoom.success)
            );
        }

        /**
         * the following tasks below are performed using recipient _id
         * i. if online, add recipient socket.id to room
         * ii if offline. do nothing
         * finally;
         * update recipient `User` rooms field
         */
        const recipient_id = members.find((member) => member !== sender);

        const recipientResult = await findOneUserWithPayload({
            _id: recipient_id,
        });

        if (!recipientResult.success) {
            return socket.emit(
                displayError,
                constructSocketResponse(
                    recipientResult.error,
                    recipientResult.success
                )
            );
        }

        const {
            socket: { id: socketId },
            phone: recipient_phone,
            rooms: recipient_rooms,
        } = recipientResult.data;

        if (room_type == "SINGLE") {
            await updateMessage(newMessage.data._id, {
                date_delivered: Date.now(),
            });
        }

        // if recipient is online
        if (recipientResult.data.online_status) {
            // add recipient socket.id to room (I)
            const sockets = Array.from(_io.sockets);
            sockets.forEach((_socketId, _socket) => {
                if (_socketId === socketId) {
                    socket.join(room_name);
                    return;
                }
            });
            if (room_type === "DUAL") {
                await updateMessage(newMessage.data._id, {
                    date_delivered: Date.now(),
                });
            }
        }

        // update recipient rooms field (finally)
        const updatedRecipientRooms = recipient_rooms.includes(room_id)
            ? recipient_rooms
            : [...recipient_rooms, room_id];
        await updateOneUser(recipient_phone, { rooms: updatedRecipientRooms });

        // add user to room if not already added
        const sockets = Array.from(_io.sockets);
        const socketRooms = Array.from(socket.rooms);
        // console.log(sockets);
        // console.log(socketRooms);
        // send message to room using Room: name
        return _io
            .to(room_name)
            .emit(
                messageSent,
                constructSocketResponse(newMessage.data, newMessage.success)
            );
    },
    /**
     *
     * @param {object} payload { room_id}
     * @param {socketObject} socket
     */
    getMessages: async (payload, socket) => {
        /**
         * - using the room_id gotten from payload,
         * - we query database for all messages that have `room_id` property ,
         * - we check if current user is recipient of message and update message `date_delivered` property
         *  the messages in that room get returned as
         *      - an event emitted (get_messages) to the user
         */
        let { room_id } = payload;

        try {
            let roomMessagesResult = await getRoomMessages(room_id);

            // if room does not exist
            if (!roomMessagesResult.success) {
                return socket.emit(
                    displayError,
                    constructSocketResponse(
                        roomMessagesResult.error,
                        roomMessagesResult.success
                    )
                );
            }

            // if there are no messages in a room
            if (roomMessagesResult.data.length == 0) {
                return socket.emit(
                    messagesNotFound,
                    constructSocketResponse(messagesResult.data, false)
                );
            }

            // update `date_delivered` property of message if current user is recipient
            // room messages is filtered by `date_delivered` == null and message.sender !== socket.user._id
            let unreadMessages = roomMessagesResult.data.filter(
                (message) =>
                    !message.date_delivered &&
                    String(message.sender) !== socket.user._id
            );

            if (unreadMessages.length > 0) {
                unreadMessages.forEach(async (message) => {
                    await updateMessage(message._id, {
                        date_delivered: Date.now(),
                    });
                });

                // get updated room messages
                roomMessagesResult = await getRoomMessages(room_id);
            }

            return socket.emit(
                messagesResult,
                constructSocketResponse(roomMessagesResult.data, true)
            );
        } catch (error) {
            return socket.emit(
                displayError,
                constructSocketResponse(error, false)
            );
        }
    },
    /**
     *
     * @param {object} payload {
     *      phone,
     * }
     * @param {socketObject} socket
     */
    createRoom: async (payload, socket, io) => {
        /**
         * - user socket is used to find connected user (creator) and the `phone` property gotten from payload is used to find another user (recipient)
         * - a room name is created using connected user's id and recipient's id and we search if a room exists with that name or its reverse(recipient's id comes first here)
         * - if room does exists, an error is returned;
         * - else,
         *      - new room is created
         *      - we perform on update on connected user's document and an update is performed on recipient's user document only if the room type is `DUAL`
         *      - connected user's socket is made to join the new room
         *      - if recipient is online, their user's socket joins the room as well
         *      - an event is emitted (room_created) to room containing the new room's data
         *      - an event is emitted (user_is_online) to room containing details about the user(s)
         */
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

        // get recipient user
        const { data: recipient, error, success } = await findOneUser(phone);

        if (!success) {
            return socket.emit(displayError, constructSocketResponse(error));
        }

        const name = `${creator._id}:${recipient._id}`;
        const reverse_name = `${recipient._id}:${creator._id}`;

        // create room name and reverse room name field
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

        //  if recipient is online, get socket and add to this room
        if (type === "DUAL" && recipient.online_status) {
            const sockets = Array.from(io.of(socket.nsp.name).sockets);

            sockets.forEach(([_socketId, _socket]) => {
                /**
                 * if socket.id in equals recipient socket.id, then user is connected to /rooms endpoint
                 * Hence, add recipient socket to room
                 */
                if (_socket.id === recipient.socket.id) {
                    _socket.join(newRoom.data.name);
                }
            });
        }

        return io
            .of(socket.nsp.name)
            .to(newRoom.data.name)
            .emit(
                roomCreated,
                constructSocketResponse(newRoom.data, newRoom.success)
            );
    },
    /**
     *
     * @param {object} payload { _id }
     * @param {socketObject} socket
     * @returns socket.emit(...)
     */
    getRoom: async (payload, socket, io) => {
        /**
         * the provided `_id` from payload, is used to find a room,
         * the user's socket is used to join the room
         *      - an event is emitted to room saying that the user just joined the room
         */
        const { _id: id } = payload;

        if (!id) {
            return socket.emit(
                displayError,
                constructSocketResponse(
                    "Payload must contain `_id` ObjectId string"
                )
            );
        }

        try {
            const _id = ObjectId(id);
            const { data, error, success } = await findOneRoom({ _id });

            if (!success) {
                return socket.emit(
                    roomNotFound,
                    constructSocketResponse(
                        "Room `id` provided does not exist",
                        success
                    )
                );
            }

            // add user socket to room
            socket.join(data);

            return io
                .of(socket.nsp.name)
                .emit(
                    roomResult,
                    constructSocketResponse(success ? data : error, success)
                );
        } catch (error) {
            return socket.emit(
                displayError,
                constructSocketResponse(error.message)
            );
        }
    },
    /**
     *
     * @param {any} payload {}
     * @param {socketObject} socket
     * @param {io Object} io
     * @returns socket.emit(...)
     */
    getRooms: async (payload, socket, io) => {
        /**
         * - the `phone` property gotten from `socket.user` is used to update user's `online_status`;
         * - the `rooms` property from `data` is looped through, and the user's socket joins all rooms
         *      - an event is emitted to the room saying that the user that joined is online
         *      - an event is emitted containing the `rooms` property to the user
         */
        const _io = io.of(socket.nsp.name);
        const { phone } = socket.user;

        // find and update user online profile
        const { data, error, success } = await updateOneUser(phone, {
            online_status: true,
        });

        // if success == false; an error occurred
        if (!success) {
            return socket.emit(displayError, constructSocketResponse(error));
        }

        // emit to user that no room has been created
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
            let { data: roomData, error, success } = await findOneRoom({ _id });

            if (!success) {
                return socket.emit(
                    displayError,
                    constructSocketResponse(error)
                );
            }
            socket.join(roomData.name);

            /* emit to room that user is online (user's data)
                : some user data will be hidden.
                Incase frontend application get's compromised
            */
            let {
                name,
                about,
                profile,
                online_status,
                show_online_status,
                last_seen_status,
                show_last_seen_status,
                group_rooms,
                rooms,
            } = data;

            let payload = {
                name,
                about,
                profile,
                online_status,
                show_online_status,
                last_seen_status,
                show_last_seen_status,
                group_rooms,
                rooms,
            };

            _io.to(roomData.name).emit(
                userIsOnline,
                constructSocketResponse(payload, true)
            );
        });

        return socket.emit(
            roomsResult,
            constructSocketResponse(data.rooms, success)
        );
    },
    /**
     *
     * @param {object} payload {
     *      name, members: at least an array of one element
     * }
     * @param {socketObject} socket
     * @param {io Object} io
     */
    createGroupRoom: async (payload, socket, io) => {
        /**
         * we perform validations on the `name` and `members` property gotten from payload
         * such as checking if payload contains `name` and `members`, the members array provided contains other ObjectIds apart from connected user _id
         * a new group room gets created,
         * if on failure, an error occurs
         *      - an event is emitted (display_error) to the user
         * on success,
         *      we update all members (user) group rooms with newGroupRoom `_id`
         *      members (asides connected user' socket) if online, are added to group room
         *      - an event is emitted (group_room_created) to user that created room
         *      - an event is emitted (group_room_new_member_joined) to room
         */
        let { name, members } = payload;

        if (!name || !members) {
            return socket.emit(
                displayError,
                constructSocketResponse(
                    "Payload must contain `name` and `members`",
                    false
                )
            );
        }

        if (
            members.length == 0 ||
            (members.length == 1 && members.includes(socket.user._id))
        ) {
            return socket.emit(
                displayError,
                constructSocketResponse(
                    "Provide at least one other member in the `members` array"
                )
            );
        }

        let userId = ObjectId(socket.user._id);

        members = [userId, ...members.map((member_id) => ObjectId(member_id))];

        // we check if the members exist
        members.forEach(async (member_id) => {
            if (member_id !== userId) {
                let userExist = await findOneUserWithPayload({
                    _id: member_id,
                });

                if (!userExist.success) {
                    return socket.emit(
                        displayError,
                        constructSocketResponse(userExist.error)
                    );
                }
            }
        });

        let newGroupRoom = await createGroupRoom({
            admins: [userId],
            edit_group_info: false,
            group_info: { name, description: "", profile: "" },
            locked: { bool: false, by: userId, timestamp: Date.now() },
            members,
            messages: [],
        });

        if (!newGroupRoom.success) {
            return socket.emit(
                displayError,
                constructSocketResponse(newGroupRoom.error)
            );
        }

        // update all members (user) `group_rooms` property
        // i think this operation is expensive (computationally)
        const _io = io.of(socket.nsp.name);
        const sockets = Array.from(_io.sockets);
        const group_room_name = newGroupRoom.data._id;

        members.forEach(async (_id) => {
            let {
                data: {
                    name,
                    about,
                    phone,
                    profile,
                    group_rooms,
                    online_status,
                    show_online_status,
                    last_seen_status,
                    show_last_seen_status,
                    socket: { id: memberSocketId },
                },
            } = await findOneUserWithPayload({ _id });

            group_rooms.push(group_room_name);
            await updateOneUser(phone, { group_rooms });

            if (_id == userId) {
                // we use new group room _id as room name
                socket.join(group_room_name);
            } else {
                // check if member is online
                if (online_status) {
                    sockets.forEach(([_socketId, _socket]) => {
                        if (_socket.id == memberSocketId) {
                            _socket.join(group_room_name);

                            let _payload = {
                                name,
                                about,
                                profile,
                                online_status,
                                show_online_status,
                                last_seen_status,
                                show_last_seen_status,
                            };

                            _io.to(group_room_name).emit(
                                groupRoomNewMemberJoined,
                                constructSocketResponse(_payload, true)
                            );
                        }
                    });
                }
            }

            return socket.emit(
                groupRoomCreated,
                constructSocketResponse(newGroupRoom.data, true)
            );
        });
    },
    /**
     *
     * @param {object} payload
     * @param {socketObject} socket
     * @param {io Object} io
     */
    getGroupRooms: async (payload, socket, io) => {
        /**
         * we first of all get the groups for the connected user socket,
         * if there are no groups,
         *      - an event is emitted (group_rooms_not_found) to the user
         * else, connected socket joins the group room
         *      - an event is emitted (group_rooms_result) containing group rooms to the user
         *      - an event is emitted (user_is_online) to the group rooms
         */
        let { user } = socket;

        let { data, error, success } = await findOneUser(user.phone);

        if (!success) {
            return socket.emit(
                displayError,
                constructSocketResponse(error, success)
            );
        }

        if (data.group_rooms.length == 0) {
            return socket.emit(
                groupRoomsNotFound,
                constructSocketResponse(
                    "There are no rooms. Head over to /rooms (you current path) and emit `create_group_room` event"
                )
            );
        }

        data.group_rooms.forEach((group_room) => {
            socket.join(group_room);

            let {
                name,
                about,
                profile,
                online_status,
                show_online_status,
                last_seen_status,
                show_last_seen_status,
            } = data;

            let _payload = {
                name,
                about,
                profile,
                online_status,
                show_online_status,
                last_seen_status,
                show_last_seen_status,
            };

            io.of(socket.nsp.name)
                .to(group_room)
                .emit(userIsOnline, constructSocketResponse(_payload, true));
        });

        return socket.emit(
            groupRoomsResult,
            constructSocketResponse(data.group_rooms, true)
        );
    },
};
