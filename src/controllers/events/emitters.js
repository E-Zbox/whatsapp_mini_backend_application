/**
 * contains event listeners and emitters helper variables
 * @eventEmitters : these are camel-cased variables that emit events to any io connection
 */
module.exports = {
    displayError: "display_error",
    messageCreated: "message_created",
    messageSent: "message_sent",
    messagesNotFound: "messages_not_found",
    messagesResult: "messages_result",
    roomCreated: "room_created",
    roomNotFound: "room_not_found",
    roomResult: "room_result",
    roomsNotFound: "rooms_not_found",
    roomsResult: "rooms_result",
    userIsOffline: "user_is_offline",
    userIsOnline: "user_is_online",
    welcomeBackUser: "welcome_back_user",
};
