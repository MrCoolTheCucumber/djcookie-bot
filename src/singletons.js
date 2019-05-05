const Discord = require("discord.js");
const redis = require('redis');
let redisClient;

if (process.env.NODE_ENV !== 'production') {
    redisClient = redis.createClient();
} else {
    redisClient = redis.createClient({host: 'redis'});
}

redisClient.on("error", function (err) {
    console.log("[Redis] Error: " + err);
});

module.exports = {
    commands: [],
    concatCommands: function(commands) {
        this.commands = this.commands.concat(commands);
    },
    bot: new Discord.Client({disabledEvents: [Discord.TYPING_START, Discord.TYPING_STOP]}),
    redisClient: redisClient,
    commandChar:'!'
};
