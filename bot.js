const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(async (ctx, next) => {
  return next();
});

bot.command('game', (ctx) => {
  if (ctx.chat.type === 'private') {
    return ctx.reply('❌ Perintah ini hanya bisa digunakan di grup.');
  }

  ctx.reply('🎮 Pilih game yang ingin dimainkan:',
    Markup.inlineKeyboard([
      [Markup.button.callback('✊ Suit (RPS)', 'select_game_rps')],
      [Markup.button.callback('⚫⚪ Hitam Putih', 'select_game_hp')]
    ])
  );
});

bot.action('select_game_rps', async (ctx) => {
  const chatId = ctx.callbackQuery.message.chat.id;

  return ctx.editMessageText('🧩 Suit dipilih! Klik tombol di bawah untuk mulai.',
    Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Mulai Suit', `join_game_${chatId}`)],
      [Markup.button.callback('📊 Leaderboard Suit', `show_leaderboard_${chatId}`)],
      [Markup.button.callback('⬅️ Kembali', 'back_to_menu')]
    ])
  );
});

bot.action('select_game_hp', async (ctx) => {
  const chatId = ctx.callbackQuery.message.chat.id;

  return ctx.editMessageText('🧩 Hitam Putih dipilih! Klik tombol di bawah untuk mulai.',
    Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Mulai Hitam Putih', `hp_join_${chatId}`)],
      [Markup.button.callback('📊 Leaderboard Hitam Putih', `hp_leaderboard_${chatId}`)],
      [Markup.button.callback('⬅️ Kembali', 'back_to_menu')]
    ])
  );
});

bot.action('back_to_menu', async (ctx) => {
  return ctx.editMessageText('🎮 Pilih game yang ingin dimainkan:',
    Markup.inlineKeyboard([
      [Markup.button.callback('✊ Suit (RPS)', 'select_game_rps')],
      [Markup.button.callback('⚫⚪ Hitam Putih', 'select_game_hp')]
    ])
  );
});

const gamesPath = path.join(__dirname, 'games');
fs.readdirSync(gamesPath).forEach(file => {
  if (file.endsWith('.js')) {
    require(path.join(gamesPath, file))(bot);
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.launch();