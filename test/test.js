let assert = require('chai').assert;
let singletons = require('../src/singletons');

require('../src/command_libs/yt');
require('../src/command_libs/gambling');
require('../src/command_libs/memes');

let message = { channel: {} };
let messageResponses = [];
let messageIndex = -1;
let execCommand;
let commandDict = {};

message.channel.send = (resp) => {
    messageResponses[++messageIndex] = resp;
};

before(function() {
    message.channel.send = (resp) => {
        messageResponses[++messageIndex] = resp;
    };

    singletons.commands.forEach((c) => {
        commandDict[c.name] = c;
    });

    execCommand = (command, arg, message) => {
        return commandDict[command].exec(arg, message);
    };
});

after(function() {
    process.exit(0);
});

describe('commands', function() {
    it('should not be of length 0', function () {
        assert.notStrictEqual(singletons.commands.length, 0)
    });

    describe('Meme commands', function () {
        describe('[COMMAND] police', function () {
            it('should not throw', function () {
                assert.doesNotThrow(() => {
                    execCommand('police', "", message);
                });
            });

            it('should respond with a string', function () {
                assert.strictEqual(typeof(messageResponses[messageIndex]), 'string')
            });
        });

        describe('[COMMAND] sonic', function () {
            it('should not throw', function () {
                assert.doesNotThrow(() => {
                    execCommand('sonic', "", message);
                });
            });

            it('should respond with a string', function () {
                assert.strictEqual(typeof(messageResponses[messageIndex]), "string")
            });
        });
    });
});


