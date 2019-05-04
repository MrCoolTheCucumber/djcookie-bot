/**
 * TODO Async wait for inactivity?
 * TODO when to join user channel?
 *
 */

const Discord = require("discord.js");
const request = require('request');
const fs = require('fs');

let singletons = require('./singletons');
const COMMAND_CHAR = singletons.commandChar;
const bot = singletons.bot;

require('./command_libs/yt');
require('./command_libs/gambling');
require('./command_libs/memes');

RegExp.escape= function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

singletons.concatCommands([
    {
        name: 'ping',
        info: 'Average ping of connection heartbeat.',
        exec: (arg, message) => {
            message.channel.send(bot.ping);
        }
    },
    {
        name: 'purge',
        info: 'Deletes the number of most recent messages specified.',
        exec: (arg, message) => {
            let channel = message.channel;

            if(!is_number(arg)) {
                channel.send('**wut**');
            }

            channel.fetchMessages({limit: arg}).then(messages => {
                channel.bulkDelete(messages, true);
            });
        }
    },
    {
        name: 'commands',
        info: 'Displays all commands',
        exec: (arg, message) => {
            let response = '';
            singletons.commands.forEach((command) => {
                response += '**' + command.name + '**: ';
                response += command.info + '\n';
            });

            message.channel.send(response);
        }
    }
]);

bot.on('ready', () => {
    console.log('Connected.');
    console.log(singletons.commands.length + ' commands loaded.');
});

bot.on('message', message => {
    if (message.channel.type === 'text') {
        singletons.commands.forEach(command => {
            let regex = new RegExp('^\\' + COMMAND_CHAR + '(' + RegExp.escape(command.name) + ')' + '($| (.+)?)');
            let match = message.content.match(regex);
            if ((match !== null) && (match[1] === command.name)) {
                console.log('Exec command: ' + command.name);
                command.exec(match[3], message);
            }
        });
    }
});

bot.on('disconnect', event => {
    console.log('Disconnected! ' + event.reason + '(' + event.code + ')');
});

bot.on('error', event => {
   console.log('[ERROR] An error has occurred:\n' + event);
});

bot.login(process.env.DJCOOKIETOKEN);
