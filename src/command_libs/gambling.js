const Discord = require("discord.js");

let singletons = require('../singletons');
const bot = singletons.bot;
const redisClient = singletons.redisClient;

const CURRENCY_NAME = 'yee haws';
const CLAIM_AMOUNT = 500;
const CLAIM_TIMEOUT = 86400; //Seconds in a day.

const BIG_DUMB = 'Ruben big dumb dumb pls tell him';

singletons.concatCommands([
    {
      name: 'bal',
      info: 'What your current balance of ' + CURRENCY_NAME + ' is.',
      exec: (arg, message) => {
          getCurrencyOfAuthor(message.author, (err, balance) => {
              if (err) {
                  message.channel.send(BIG_DUMB);
                  return;
              }

              message.channel.send('You have ' + balance + ' ' + CURRENCY_NAME + '.');
          })
      }
    },
    {
        name: 'flip',
        info: 'Gamble your ' + CURRENCY_NAME + ' by flipping a coin.',
        exec: (arg, message) => {
            let args = arg.split(' ');
            let stake = args[0];
            let choice = args[1];

            // If not a number, or if not h, t, heads or tails
            if (isNaN(stake) || (choice !== 'h' && choice !== 't'
                && choice !== 'heads' && choice !== 'tails')) {
                    message.channel.send('Invalid command arguments');
                    return;
            }

            stake = parseInt(stake);

            if (stake === 0) {
                message.channel.send('Your retarded.');
                return;
            }

            getCurrencyOfAuthor(message.author, (err, balance) => {
                balance = parseInt(balance);
                if (balance < stake) {
                    message.channel.send('You don\'t have enough money to do that!');
                    return;
                }

                let currencyKey = getCurrencyKey(message.author);
                let toss = Math.random();
                let won = (toss > 0.5 && (choice === 'h' || choice === 'heads')) ||
                    (toss <= 0.5 && (choice === 't' || choice === 'tails'));
                let coinResult = toss > 0.5 ? 'heads' : 'tails';

                if (won) {
                    let newBalance = balance + stake;
                    redisClient.set(currencyKey, newBalance);

                    message.channel.send('The coin landed on ' + coinResult + ', you won! New balance: ' + newBalance + '.');
                } else {
                    let newBalance = balance - stake;
                    redisClient.set(currencyKey, newBalance);

                    message.channel.send('The coin landed on ' + coinResult + ', you lost. New balance: ' + newBalance + '.');
                }
            });
        }
    },
    {
        name: 'claim',
        info: 'Claim your ' + CLAIM_AMOUNT + ' ' + CURRENCY_NAME + ' every 24hrs.',
        exec: (arg, message) => {
            let claimKey = getClaimKey(message.author);
            let currencyKey = getCurrencyKey(message.author);

            redisClient.ttl(claimKey, (err, reply) => {
                if (reply !== -2) {
                    let date = new Date(null);
                    date.setSeconds(reply);
                    let time = date.toISOString().substr(11, 8);
                    let response = 'You have already claimed your daily allowance. Time remaining: ' + time + '.';

                    message.channel.send(response);
                } else {
                    redisClient.incrby(currencyKey, CLAIM_AMOUNT, (err, reply) => {
                        if (err) {
                            message.channel.send(BIG_DUMB);
                            return;
                        }

                        redisClient.set(claimKey, 1, 'EX', CLAIM_TIMEOUT);

                        let balance = reply;
                        let response = 'You have just claimed ' + CLAIM_AMOUNT + ' ' + CURRENCY_NAME + '. ';
                        response += 'New balance: ' + balance + '.';
                        message.channel.send(response);
                    });
                }
            });
        }
    }
]);

let getCurrencyKey = (author) => {
    return 'user:' + author.id + ':currency';
};

let getClaimKey = (author) => {
    return 'user:' + author.id + ':claim';
};

let getCurrencyOfAuthor = (author, cb) => {
    let key = getCurrencyKey(author);

    redisClient.get(key, (err, reply) => {
        if (err) {
            console.log('An error occurred when getting author currency');
            cb(true, null);
            return;
        }

        if (reply === null) {
            // key not init
            redisClient.set(key, 0);
            cb(false, 0);
            return;
        }

        cb(false, parseInt(reply));
    });
};
