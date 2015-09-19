var TelegramBot = require('node-telegram-bot-api');

var options = {
  polling: true
};

var token = process.env.TELEGRAM_BOT_TOKEN || 'TELEGRAM_BOT_TOKEN';

var bot = new TelegramBot(token, options);
var voiceMessages = [];

bot.getMe().then(function(me) {
  console.log('Hi my name is %s!', me.username);
});

bot.on('text', function(msg) {
  var chatId = msg.chat.id;
  if (msg.text === '/all') {
    // Forward all messages.
    for(var i = 0; i < voiceMessages.length; i++) {
      var voiceMessage = voiceMessages[i];
      var vmChatId = voiceMessage.chat.id;
      bot.forwardMessage(vmChatId, vmChatId, voiceMessage.message_id);
    }
  }
});

bot.on('message', function(msg) {
  console.log('received message');
  if (msg.voice) {
    // Store it in the messages array.
    voiceMessages.push(msg);
  }
});
