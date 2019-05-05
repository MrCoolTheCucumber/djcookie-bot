let assert = require('chai').assert;
let singletons = require('../src/singletons');

require('../src/command_libs/yt');
require('../src/command_libs/gambling');
require('../src/command_libs/memes');

let message = { channel: {}, author: {}};
let messageResponses = [];
let messageIndex = -1;
let execCommand;
let commandDict = {};

const ID = '123456';

let sleep = (millis) => {
    return new Promise(resolve => setTimeout(resolve, millis));
};

before(function() {
    message.author.id = ID;

    message.channel.send = (resp) => {
        messageResponses[++messageIndex] = resp;
    };

    singletons.commands.forEach((c) => {
        commandDict[c.name] = c;
    });

    execCommand = (command, arg, message) => {
        return commandDict[command].exec(arg, message);
    };

    if (process.env.NODE_ENV !== 'production') {
        //flush redis db
        singletons.redisClient.flushall();
    }
});

after(function() {
    process.exit(0);
});

describe('=== COMMANDS  ===', function() {
    it('should not be of length 0', function () {
        assert.notStrictEqual(singletons.commands.length, 0)
    });

    describe('[Cagegory] Meme commands', function () {
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

        describe('[COMMAND] ?', function () {
            it('should not throw', function () {
                assert.doesNotThrow(() => {
                    execCommand('?', "10", message);
                });
            });

            it('should not return null on correct input', function () {
                execCommand('?', '10', message);
                assert.notStrictEqual(messageResponses[messageIndex], null);
            });

            it('should return on bad input', function () {
                execCommand('?', 'fsdklfhsdlf', message);
                assert.strictEqual(messageResponses[messageIndex], '');
            });

            it('should append the correct number of "?"', function () {
                execCommand('?', '100', message);
                assert.strictEqual(messageResponses[messageIndex].length, 100);
            });

            it('should return a message if over 2000 is entered', () => {
                execCommand('?', '10000', message);
                assert.strictEqual(messageResponses[messageIndex], "You are mega dumb dumb?");
            });
        });
    });

    describe('[CATEGORY] Gambling commands', function () {
        beforeEach(() => {
            singletons.redisClient.flushall();
        });

        describe('[COMMAND] bal', function () {
            it('should set balance to 0 if not initialized', async function () {
                execCommand('bal', "", message);
                await sleep(10);
                assert.isTrue(messageResponses[messageIndex].includes('0'));
            });

            it('should return the correct bal', async () => {
                execCommand('claim', "", message);
                await sleep(10);
                execCommand('bal', "", message);
                await sleep(10);

                assert.isTrue(messageResponses[messageIndex].includes("500"));
            });
        });


    });
});


