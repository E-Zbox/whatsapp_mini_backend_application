const mongoose = require("mongoose");

exports.connectToDb = (dbURI) => {
    mongoose.set("strictQuery", true);

    mongoose
        .connect(dbURI, {
            dbName: "whatsapp_mini_application",
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then((response) => console.log("Connected to database"))
        .catch((err) => {
            console.log(err);
            process.exit(1);
        });
};
