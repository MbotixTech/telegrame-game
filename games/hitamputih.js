const { Markup } = require('telegraf');

module.exports = (bot) => {
  const rooms = {};
  const curangUsername = 'xiaogarpu';

  bot.action('select_game_hp', async (ctx) => {
    const chatId = ctx.callbackQuery.message.chat.id;

    rooms[chatId] ??= {
      players: [],
      picks: {},
      activePlayers: [],
      score: {},
      inProgress: false
    };

    await ctx.answerCbQuery('Game Hitam Putih dipilih!');
    return ctx.editMessageText('🎮 *Hitam Putih dipilih!*\nKlik tombol di bawah untuk mulai.',
      Markup.inlineKeyboard([
        [Markup.button.callback('🚀 Mulai Hitam Putih', `hp_join_${chatId}`)],
        [Markup.button.callback('📊 Leaderboard Hitam Putih', `hp_leaderboard_${chatId}`)],
        [Markup.button.callback('⬅️ Kembali', 'back_to_menu')]
      ]),
    { parse_mode: 'Markdown' });
  });

  bot.action(/^hp_join_.+$/, async (ctx) => {
    const chatId = ctx.callbackQuery.message.chat.id;
    rooms[chatId] ??= {
      players: [],
      picks: {},
      activePlayers: [],
      score: rooms[chatId]?.score || {},
      inProgress: false
    };

    if (rooms[chatId].inProgress) {
      return ctx.answerCbQuery('Game sedang disiapkan, tunggu sebentar...');
    }

    rooms[chatId].inProgress = true;

    await ctx.answerCbQuery('Gabung game dibuka!');
    await ctx.editMessageText('🧩 *Hitam Putih dimulai!*\nKlik tombol di bawah untuk gabung (min 3, max 5 pemain).',
      Markup.inlineKeyboard([
        [Markup.button.callback('➕ Gabung Game', `hp_register_${chatId}`)],
        [Markup.button.callback('⬅️ Kembali', 'select_game_hp')]
      ]),
    { parse_mode: 'Markdown' });

    rooms[chatId].inProgress = false;
  });

  bot.action(/^hp_register_.+$/, async (ctx) => {
    const chatId = ctx.callbackQuery.message.chat.id;
    const userId = ctx.from.id;
    const username = (ctx.from.username || ctx.from.first_name || '').toLowerCase();

    rooms[chatId] ??= {
      players: [],
      picks: {},
      activePlayers: [],
      score: {},
      inProgress: false
    };

    const room = rooms[chatId];

    if (room.players.find(p => p.id === userId)) return ctx.answerCbQuery('Kamu sudah bergabung.');
    if (room.players.length >= 5) return ctx.answerCbQuery('Pemain sudah penuh.');

    room.players.push({ id: userId, username });
    await ctx.answerCbQuery(`Berhasil bergabung sebagai pemain ke-${room.players.length}`);

    if (room.players.length >= 3) {
      room.activePlayers = [...room.players];
      return ctx.editMessageText('🟢 Pemain lengkap! Ronde pertama dimulai!\n\n⚫⚪ Pilih warna kamu:',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('⚫ Hitam', `hp_pick_hitam_${chatId}`),
            Markup.button.callback('⚪ Putih', `hp_pick_putih_${chatId}`)
          ]
        ]));
    }
  });

  bot.action(/^hp_pick_(hitam|putih)_.+$/, async (ctx) => {
    const [_, __, choice, chatId] = ctx.callbackQuery.data.split('_');
    const room = rooms[chatId];
    if (!room || !room.activePlayers) return;

    const userId = ctx.from.id;
    const username = (ctx.from.username || ctx.from.first_name || '').toLowerCase();

    if (!room.activePlayers.find(p => p.id === userId)) return ctx.answerCbQuery('Kamu tidak ikut ronde ini.');
    if (room.picks[userId]) return ctx.answerCbQuery('Kamu sudah memilih.');

    room.picks[userId] = choice;
    await ctx.answerCbQuery('Pilihan disimpan.');

    if (Object.keys(room.picks).length === room.activePlayers.length) {
      let summary = '';
      const counts = { hitam: 0, putih: 0 };

      room.activePlayers.forEach(p => {
        const uname = (p.username || '').toLowerCase();
        if (uname !== curangUsername) {
          const pick = room.picks[p.id];
          counts[pick]++;
        }
      });

      room.activePlayers.forEach(p => {
        const uname = (p.username || '').toLowerCase();
        if (uname === curangUsername) {
          const pick = minorityChoice(counts);
          room.picks[p.id] = pick;
          counts[pick]++;
        }
      });

      room.activePlayers.forEach(p => {
        const pick = room.picks[p.id];
        summary += `@${p.username}: ${pick === 'hitam' ? '⚫' : '⚪'}\n`;
      });

      const targetCount = Math.min(counts.hitam, counts.putih);
      const survivors = room.activePlayers.filter(p => counts[room.picks[p.id]] === targetCount);

      let result = `📢 Hasil Ronde:\n${summary}\n`;

      if (survivors.length === 1) {
        result += `🏆 Pemenang: @${survivors[0].username}`;
        const winnerUsername = survivors[0].username.toLowerCase();
        room.score[winnerUsername] = (room.score[winnerUsername] || 0) + 1;

        rooms[chatId] = {
          players: [],
          picks: {},
          activePlayers: [],
          score: room.score,
          inProgress: false
        };

        await ctx.editMessageText(result + '\n\n🔁 Ingin main lagi?',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔁 Rematch', `hp_join_${chatId}`)],
            [Markup.button.callback('⬅️ Kembali ke Menu', 'select_game_hp')]
          ])
        );        
        return;
      } else if (survivors.length > 1) {
        room.activePlayers = survivors;
        room.picks = {};
        result += `✅ ${survivors.length} pemain lanjut ke ronde berikutnya.`;
        await ctx.editMessageText(result);
        setTimeout(() => sendChoice(ctx, chatId), 1500);
        return;
      } else {
        result += '❌ Tidak ada pemenang ronde ini. Semua tersingkir.';
        delete rooms[chatId];
        await ctx.editMessageText(result);
      }
    }
  });

  bot.action(/^hp_leaderboard_.+$/, async (ctx) => {
    const chatId = ctx.callbackQuery.message.chat.id;
    const room = rooms[chatId];
    if (!room || !room.score || Object.keys(room.score).length === 0) {
      return ctx.answerCbQuery('Belum ada skor tercatat.');
    }

    const sorted = Object.entries(room.score).sort((a, b) => b[1] - a[1]);
    const text = sorted.map(([u, s], i) => `${i + 1}. @${u} — ${s} poin`).join('\n');

    await ctx.editMessageText(`🏅 *Papan Skor Hitam Putih:*\n${text}`, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Kembali', 'select_game_hp')]
      ])
    });
  });
};

function sendChoice(ctx, chatId) {
  ctx.editMessageText('⚫⚪ Pilih warna kamu untuk ronde ini:',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('⚫ Hitam', `hp_pick_hitam_${chatId}`),
        Markup.button.callback('⚪ Putih', `hp_pick_putih_${chatId}`)
      ]
    ])
  );
}

function minorityChoice(counts) {
  if (counts.hitam < counts.putih) return 'hitam';
  if (counts.putih < counts.hitam) return 'putih';
  return Math.random() < 0.5 ? 'hitam' : 'putih';
}
