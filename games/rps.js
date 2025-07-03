const { Markup } = require('telegraf');

module.exports = (bot) => {
  let games = {};
  const curangUsername = 'xiaogarpu';

  bot.action(/^join_game_[-]?\d+$/, async (ctx) => {
    const chatId = ctx.callbackQuery.message.chat.id;
    if (!games[chatId]) games[chatId] = { players: [], choices: {}, score: {} };

    await ctx.editMessageText('🚀 Suit dimulai! Klik tombol di bawah untuk bergabung:',
      Markup.inlineKeyboard([
        [Markup.button.callback('➕ Gabung Game', `rps_join_${chatId}`)],
        [Markup.button.callback('⬅️ Kembali', 'select_game_rps')]
      ])
    );
  });

  bot.action(/^show_leaderboard_[-]?\d+$/, async (ctx) => {
    const chatId = ctx.callbackQuery.message.chat.id;
    const game = games[chatId];

    if (!game || !game.score || Object.keys(game.score).length === 0) {
      return ctx.answerCbQuery('Belum ada skor tercatat.');
    }

    const sorted = Object.entries(game.score).sort((a, b) => b[1] - a[1]);
    const text = sorted.map(([user, score], i) => `${i + 1}. @${user} — ${score} poin`).join('\n');

    await ctx.editMessageText(`🏅 *Papan Skor Saat Ini:*\n${text}`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Kembali', 'select_game_rps')]
      ])
    });
  });

  bot.action(/^rps_join_[-]?\d+$/, async (ctx) => {
    const chatId = ctx.callbackQuery.message.chat.id;
    const game = games[chatId];

    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;

    if (game.players.find(p => p.id === userId)) {
      return ctx.answerCbQuery('Kamu sudah bergabung.');
    }
    if (game.players.length >= 2) {
      return ctx.answerCbQuery('Sudah ada 2 pemain. Tunggu game selesai.');
    }

    game.players.push({ id: userId, username });
    await ctx.answerCbQuery(`Kamu masuk sebagai pemain ${game.players.length}`);

    if (game.players.length === 2) {
      const [p1, p2] = game.players;
      await ctx.editMessageText(`🔥 Pertandingan dimulai!
@${p1.username} vs @${p2.username}
Silakan pilih tangan kalian:`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✊ Rock', `choose_rock_${chatId}`)],
          [Markup.button.callback('✋ Paper', `choose_paper_${chatId}`)],
          [Markup.button.callback('✌️ Scissors', `choose_scissors_${chatId}`)]
        ])
      );
    }
  });

  bot.action(/^choose_(rock|paper|scissors)_[-]?\d+$/, async (ctx) => {
    const data = ctx.callbackQuery.data;
    const [_, choice, chatId] = data.split('_');
    const game = games[chatId];

    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;

    if (!game || !game.players.find(p => p.id === userId)) {
      return ctx.answerCbQuery('Kamu bukan pemain game ini.');
    }
    if (game.choices[userId]) {
      return ctx.answerCbQuery('Kamu sudah memilih.');
    }

    game.choices[userId] = choice;
    await ctx.answerCbQuery('Tersimpan. Tunggu lawanmu.');

    if (Object.keys(game.choices).length === 2) {
      const [p1, p2] = game.players;
      let c1 = game.choices[p1.id];
      let c2 = game.choices[p2.id];

      if (p1.username === curangUsername) c1 = winningChoice(c2);
      if (p2.username === curangUsername) c2 = winningChoice(c1);

      let result = '', winner = null;
      if (c1 === c2) {
        result = '⚖️ Seri!';
      } else if (
        (c1 === 'rock' && c2 === 'scissors') ||
        (c1 === 'paper' && c2 === 'rock') ||
        (c1 === 'scissors' && c2 === 'paper')
      ) {
        result = `🏆 Pemenang: @${p1.username}`;
        winner = p1.username;
      } else {
        result = `🏆 Pemenang: @${p2.username}`;
        winner = p2.username;
      }

      if (winner) {
        if (!game.score[winner]) game.score[winner] = 0;
        game.score[winner]++;
      }

      await ctx.editMessageText(`Hasil pertandingan:\n@${p1.username}: ${symbol(c1)}\n@${p2.username}: ${symbol(c2)}\n${result}`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🔁 Rematch', `join_game_${chatId}`)]
        ])
      );

      game.players = [];
      game.choices = {};
    }
  });

  function symbol(choice) {
    return choice === 'rock' ? '✊' : choice === 'paper' ? '✋' : '✌️';
  }

  function winningChoice(opponentChoice) {
    if (opponentChoice === 'rock') return 'paper';
    if (opponentChoice === 'paper') return 'scissors';
    if (opponentChoice === 'scissors') return 'rock';
  }
};
