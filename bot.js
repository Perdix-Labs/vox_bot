var TelegramBot = require('node-telegram-bot-api');
var JsonDB = require('node-json-db');
var db = new JsonDB('messageDatabase', true, false);

var options = {
  polling: true
};

var token = process.env.TELEGRAM_BOT_TOKEN || 'TELEGRAM_BOT_TOKEN';

var bot = new TelegramBot(token, options);
var undubbedMessages = [];
var dubbedMessages = {};
var dubbedPath = '/dubbed';

try {
  // Load messages form database.
  dubbedMessages = db.getData(dubbedPath);
} catch(error) {
  // Create an empty object in database.
  db.push(dubbedPath, {});
}

bot.getMe().then(function(me) {
  console.log('Hi my name is %s!', me.username);
});

bot.on('text', function(msg) {
  var chatId = msg.chat.id;
  var msgWords = msg.text.split(' ');
  if (msgWords[0] === '/all') {
    sendListOfAllMessages(bot, chatId, dubbedMessages);
  } else if (msgWords[0] === '/dub') {
    // gives a name to last stored voice message
    var dub = msgWords[1];
    dubMessage(bot, chatId, dub, dubbedMessages, undubbedMessages);
    // save dubbed messages to database. Override the whole thing.
    db.push(dubbedPath, dubbedMessages);
  } else if (msgWords[0] === '/say') {
    var dub = msgWords[1];
    say(bot, chatId, dub, dubbedMessages);
  } else if (msgWords[0] === '/undubbed') {
    // Forward all undubbed messages.
    forwardAllUndubbedMessages(bot, chatId, undubbedMessages);
  } else if  (msgWords[0] === '/help') {
    bot.sendMessage(chatId,
        'Hello, I am Vox bot.\n' +
        'I can help you to store voice messages to forward later.\n' +
        'Command list:\n' +
        '/undubbed returns a list of all the undubbed voice messages.\n' +
        '/dub <name> dub the last undubbed message with a name.\n' +
        '/all returns a list of all dubbed messages.\n' +
        '/say <name> forwards a dubbed message with the provided name.\n' +
        '/help returns this help list.\n');
  }
});

bot.on('message', function(msg) {
  console.log('received message');
  if (msg.voice) {
    // Store it in the messages array.
    undubbedMessages.push(msg);
  }
});

function sendListOfAllMessages(bot, chatId, dubbedMessages) {
  // Send all the dub names for messages.
  if (Object.keys(dubbedMessages).length > 0) {
    message = 'All available voice messages:\n';
    var count = 1;
    for (var dub in dubbedMessages) {
      message += `${count}: ${dub}\n`;
      count++;
    }
  } else {
    message = 'There are not available voice messages. Have you dubbed them?';
  }
  bot.sendMessage(chatId, message);
}

function say(bot, chatId, dub, dubbedMessages) {
  var message = dubbedMessages[dub];
  if (message) {
    bot.forwardMessage(chatId, message.chat.id, message.message_id);
  } else {
    bot.sendMessage(chatId, 'Message not found');
  }
}

function forwardAllUndubbedMessages(bot, chatId, undubbedMessages) {
  if (undubbedMessages.length > 0) {
    bot.sendMessage(chatId, 'List of all undubbed messages:\n').then(
        function() {
      for(var i = 0; i < undubbedMessages.length; i++) {
        var voiceMessage = undubbedMessages[i];
        var vmChatId = voiceMessage.chat.id;
        bot.forwardMessage(chatId, vmChatId, voiceMessage.message_id);
      }
    });
  } else {
    bot.sendMessage(chatId, 'There are no undubbed messages');
  }
}

function dubMessage(bot, chatId, dub, dubbedMessages, undubbedMessages ) {
  if (dub) {
    if (undubbedMessages.length > 0) {
      dubbedMessages[dub] = undubbedMessages.pop();
      bot.sendMessage(chatId, 'Message got dubbed');
    } else {
      bot.sendMessage(chatId, 'There are no messages to dub.');
    }
  } else {
    bot.sendMessage(chatId, 'Need name to dub. /dub name');
  }
}
