const { join } = require("path");
// .env
require("dotenv").config({
    path: join(__dirname, `.env.${process.env.NODE_ENV}`),
});
const {
    env: { MONGODB_URI, PORT },
} = process;
// imports
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
// config
const { connectToDb } = require("./config/database");
const { handleEndpointNotFound, SERVER_ERR } = require("./config/error");
// handle socket disconnect
const { handleDisconnect } = require("./middlewares/socket");
// routes
const {
    socketRoutes: { initializeMessageIO, initializeRoomIO },
    userRoutes,
} = require("./routes");

// app configuration
const app = express();
const server = createServer(app);
const io = new Server(server);

app.set("io", io);

const baseUrl = "/api/v1";
const baseSocketUrl = `${baseUrl}/socket`;

app.get("/", (req, res) => {
    return res.status(200).json({ message: "Server is ready" });
});

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(`${baseUrl}/auth/user`, userRoutes);

io.of(baseSocketUrl, (socket) => {
    console.log("Welcome to server");

    socket.on("disconnect", (payload) => handleDisconnect(payload, socket, io));
});

// initalize socket routes
initializeMessageIO(io, baseSocketUrl, handleDisconnect);
initializeRoomIO(io, baseSocketUrl, handleDisconnect);

// error handlers
app.use((err, req, res, next) => {
    console.log(err);
    const status = err.status || 500;
    const error = err.message || SERVER_ERR;
    const data = err.data || null;

    return res.status(status).json({ data, error });
});

app.all("*", (req, res) => {
    const { method, originalUrl } = req;
    return res.status(404).json({
        error: handleEndpointNotFound(method, originalUrl),
        data: null,
    });
});

// connect to database and spin-up server
connectToDb(MONGODB_URI);

server.listen(PORT, () => console.log(`Server is listening on PORT ${PORT}`));
