const Discord = require("discord.js");
const ytdl = require('ytdl-core');
const request = require('request');

let singletons = require('../singletons');
let bot = singletons.bot;

const YOUTUBE_API_KEY = process.env.DJCOOKIEYT;

let song_queue = [];
let now_playing = null;
let stopped = false;
let voice_connection = null;
let voice_dispatcher = null;

singletons.concatCommands([
    {
        name: 'q',
        info: 'Queue a song.',
        exec: (arg, message) => {
            insert_song_into_queue(arg, message);
        }
    },
    {
        name: 'here',
        info: 'Move the bot to your voice channel.',
        exec: (arg, message) => {
            let user = message.author;
            let server = message.guild;
            if (server.available) {
                server.fetchMember(user).then(member => {
                    let voice_channel = member.voiceChannel;
                    voice_channel.join().then(connection => {
                        voice_connection = connection;
                        message.channel.send(':fire: **Time to get lit.**')
                    }).catch((reason) => {
                        console.log(reason);
                        message.channel.send(':x: **Unable to join voice channel.**');
                    });
                });

            }
        }
    },
    {
        name: 'queue',
        info: 'Lists the current queue.',
        exec: (arg, message) => {
            if (song_queue.length === 0) {
                message.channel.send('<:thonking:387657047577198592> **The queue is empty.**');
            } else {
                let response = '\n';
                let i = 1;
                song_queue.forEach(song => {
                    response += `${i}. **${song.title}**\n`;
                    i += 1;
                });
                const embed = new Discord.RichEmbed()
                    .setAuthor(bot.user.username, bot.user.displayAvatarURL)
                    .setDescription(response);
                message.channel.send(embed);
            }
        }
    },
    {
        name: 'skip',
        info: 'Skips the current song.',
        exec: (arg, message) => {
            if (now_playing != null && voice_dispatcher != null) {
                voice_dispatcher.end();
                message.channel.send(':fast_forward: **Skipping the current song!**');
            } else {
                message.channel.send('<:thonking:387657047577198592> **There is no song playing currently.**');
            }
        }
    },
    {
        name: 'pause',
        info: 'Pauses current song.',
        exec: (arg, message) => {
            if (voice_dispatcher != null) {
                voice_dispatcher.pause();
                message.channel.send(':pause_button: **Paused the current song.**')
            } else {
                message.channel.send('<:thonking:387657047577198592> **There is no song playing currently!**');
            }
        }
    },
    {
        name: 'resume',
        info: 'Resume a paused song.',
        exec: (arg, message) => {
            if (voice_dispatcher != null) {
                voice_dispatcher.resume();
                message.channel.send(':play_pause: **Resumed the current song.**')
            } else {
                message.channel.send('<:thonking:387657047577198592> **There is no song playing currently!**');
            }
        }
    },
    {
        name: 'skipto',
        info: 'Skips to a certain position of the queue.',
        exec: (arg, message) => {
            let position = arg.split(' ')[0];
            if(!is_number(position)) {
                message.channel.send('**wat**');
                return;
            }

            if(song_queue.length === 0) {
                message.channel.send('What is there to remove? <:thonking:387657047577198592>');
                return;
            }

            if (now_playing != null) {
                let position = position.split(' ')[0];
                if (position + 1 > song_queue.length) {
                    //TODO splice and then play head of queue

                    voice_connection.end();
                    message.channel.send('Skipping the current song!');
                } else {
                    message.channel.send('**Your index is out of bounds**');
                }
            } else {
                message.channel.send('**There is no song playing currently.**');
            }
        }
    },
    {
        name: 'clear',
        info: 'Clears the queue',
        exec: (arg, message) => {
            if (song_queue.length === 0) {
                message.channel.send('**Already clear m8**');
            } else {
                song_queue = [];
                message.channel.send('**The queue is now empty.**');
            }
        }
    },
    {
        name: 'shuffle',
        info: 'Shuffles the queue',
        exec: (arg, message) => {
            if(song_queue.length === 0) {
                message.channel.send('**How can I shuffle something that\'s empty**');
                return;
            }

            for (let i = song_queue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [song_queue[i], song_queue[j]] = [song_queue[j], song_queue[i]];
            }
            message.channel.send('**Queue shuffled.**');
        }
    },
    {
        name: 'remove',
        info: 'Removes a certain item from the queue',
        exec: (arg, message) => {
            let position = arg.split(' ')[0];
            if(!is_number(position)) {
                message.channel.send('**wat**');
                return;
            }

            if(song_queue.length === 0) {
                message.channel.send('What is there to remove? <:thonking:387657047577198592>');
                return;
            }

            if(position >= 1 && position <= song_queue.length) {
                let song_removed = song_queue[position - 1];
                song_queue.splice(position - 1, 1);
                message.channel.send(`Removed ${song_removed.title} from the queue.`)
            }
        }
    },
    {
        name: 's',
        info: 'Search for a video on youtube, add the first result to the queue.',
        exec: (arg, message) => {
            message.channel.send(`**searching** :mag_right: \`\`${arg}\`\``);
            let url = "https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(arg) + "&key=" + YOUTUBE_API_KEY;
            request(url, (error, response, body) => {
                let json = JSON.parse(body);
                if ('error' in json) {
                    message.channel.send(':x: An error has occurred.');
                } else if (json.items.length === 0) {
                    message.channel.send('<:thonking:387657047577198592> No videos found!');
                } else {
                    add_song_to_queue([], json.items[0].id.videoId, message);
                }
            });
        }
    },
    {
        name: 'np',
        info: 'What is currently playing.',
        exec: (arg, message) => {
            if (now_playing == null) {
                message.channel.send('There is no song currently playing.');
            } else {
                message.channel.send(now_playing.title);
            }
        }
    }
]);

let insert_song_into_queue = (arg, message) => {
    if (arg === undefined) {
        message.channel.send(':thumbsup: **Nice link.**');
        return false;
    }
    arg = arg.split(' ');
    const id = parse_yt_id(arg[0]);
    if (!id) {
        message.channel.send(':x: **I do not recognise this as a youtube link!**');
        return false;
    }

    add_song_to_queue(arg, id, message, true);
};

let add_song_to_queue = (arg, id, message, announce = false) => {

    if(announce) {
        message.channel.send(`**searching** :mag_right: \`\`https://www.youtube.com/watch?v=${id}\`\``);
    }

    ytdl.getInfo("https://www.youtube.com/watch?v=" + id, (error, info) => {
        if (error) {
            message.channel.send('**There was an error fetching this video.** \n **It does not exist or can not be played.**');
            return false;
        } else {
            //check if queue contains this song already.
            let found = false;
            for(let song of song_queue) {
                if(song.id === id) {
                    found = true;
                    break;
                }
            }

            if(found) {
                message.channel.send(':x: **This song is already in the queue**');
                return false;
            }

            let song_data = {title: info.title, id: id, user: message.author.username};
            let play_next_song = (!stopped && song_queue.length === 0 && (now_playing == null));
            let position;

            if (arg.length > 1) {
                position = arg[1] - 1;
                if (is_number(position)) {
                    song_queue.splice(position, 0, song_data)
                }
            } else {
                song_queue.push(song_data);
                position = song_queue.length;
            }

            const response = new Discord.RichEmbed()
                .setAuthor('Added to queue', message.author.displayAvatarURL)
                .setTitle(`**${song_data.title}**`)
                .setURL(`https://www.youtube.com/watch?v=${id}`)
                .setThumbnail(`https://img.youtube.com/vi/${id}/0.jpg`)
                .addField('Position in queue', `${position}`)
                .addField('Length', convert_seconds_to_mins(parseInt(info.length_seconds)));
            message.channel.send(response);

            if (play_next_song) {
                play_next_song_in_queue();
            }
        }
    });
};

let play_next_song_in_queue = () => {
    let next_song = song_queue.shift();
    now_playing = next_song;

    let data_stream = ytdl("https://www.youtube.com/watch?v=" + next_song.id, { filter: 'audioonly'});
    if(voice_connection == null) {
        console.log('[Music] Tried to play song but not in a channel.');
        return;
    }
    voice_dispatcher = voice_connection.playStream(data_stream);
    console.log('[Music] playing song');

    voice_dispatcher.once('end', () => {
        if (!stopped && song_queue.length !== 0 && (voice_connection != null)) {
            play_next_song_in_queue();
            console.log('[Music] Playing next song.')
        } else {
            console.log('[Music] Stopped playing.');
            now_playing = null;
            voice_dispatcher = null;
        }
    })
};

let parse_yt_id = (url) => {
    const r = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(r);
    return (match && match[2].length === 11) ? match[2] : false;
};

let convert_seconds_to_mins = (seconds) => {
    return seconds < 60 ? `0:${seconds}` : `${Math.floor(seconds / 60)}:${seconds % 60}`;
};

let is_number = (num) => {
    return !isNaN(parseFloat(num)) && isFinite(num) ;
};
