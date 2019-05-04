const Discord = require("discord.js");

let singletons = require('../singletons');
const bot = singletons.bot;

singletons.concatCommands([
    {
        name: '?',
        info: 'When someone goes full retard, ' + singletons.commandChar + '? <num>',
        exec: (arg, message) => {
            let num = Number(message);
            if (isNaN(num || !isFinite(num))) {
                return;
            }

            if (num > 2000) {
                message.channel.send('You are mega dumb dumb?');
                return;
            }

            let response = "";
            for (let i = 0; i < num; ++i) {
                response += '?';
            }

            message.channel.send(response);
        }
    },
    {
        name: 'police',
        info: 'the classic',
        exec: (arg, message) => {
            let police = "<:pussaayyyypatroooollll:409553574021038081>";
            let police2 = "<:police:420364933629476873>";
            let allUnitsReport = ":rotating_light::rotating_light:ALL UNITS REPORT:rotating_light::rotating_light:\n" +
                "                    / :oncoming_police_car:   \\ \n" +
                "                  /       :oncoming_police_car: \\\n" +
                "                / :oncoming_police_car:    :oncoming_police_car:  \\ \n" +
                "               /          :oncoming_automobile:     \\\n" +
                ":no_entry_sign::no_entry_sign:THIS IS NOT A DRILL:no_entry_sign::no_entry_sign:\n";

            let response = allUnitsReport + police2 + police;
            response += " :police_car: **NEE NAW NEE NAW** :police_car: ";
            response += police + police2;

            message.channel.send(response);
        }
    },
    {
        name: 'sonic',
        info: 'gotta go fast',
        exec: (arg, message) => {
            let sonic = "<:sonicthehedgehog:409553057706147862>";
            let response = sonic + ' :dash: **GOTTA GO FAST** :dash: ';
            response += sonic;

            message.channel.send(response);
        }
    }
]);