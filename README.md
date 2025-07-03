# Telegram Game Bot

A Telegram bot that hosts interactive games for group chats, featuring Rock Paper Scissors and Black & White (Hitam Putih) games with leaderboard tracking.

## Features

- **Rock Paper Scissors (RPS)**: Classic 1v1 game with automated scoring
- **Black & White (Hitam Putih)**: Multiplayer elimination game (3-5 players)
- **Leaderboard System**: Track wins and scores for each game
- **Group Chat Only**: Designed specifically for group interactions
- **Interactive UI**: Telegram inline keyboard for smooth gameplay

## Games

### 🎯 Rock Paper Scissors

- 2-player competitive game
- Choose between Rock (✊), Paper (✋), or Scissors (✌️)
- Winner tracking with persistent scores
- Rematch functionality

### 🎯 Black & White (Hitam Putih)

- 3-5 player elimination game
- Players choose between Black (⚫) or White (⚪)
- Minority group survives each round
- Last player standing wins

## Installation

1. Clone the repository:

```bash
git clone https://github.com/MbotixTech/telegrame-game.git
cd telegrame-game
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Edit `.env` file and add your bot token:

```env
BOT_TOKEN=your_bot_token_here
```

## Getting Bot Token

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token and paste it in your `.env` file

## Usage

1. Start the bot:

```bash
npm start
```

2. Add your bot to a Telegram group
3. In the group, send the command:

```text
/game
```

4. Use the interactive buttons to select and play games

## Project Structure

```ini
├── bot.js              # Main bot file and command handlers
├── games/              # Game modules directory
│   ├── rps.js         # Rock Paper Scissors game logic
│   └── hitamputih.js  # Black & White game logic
├── data/              # Data storage directory
│   └── rps_scores.json # Score persistence (auto-generated)
├── package.json       # Project dependencies
├── .env.example       # Environment variables template
└── .env              # Environment variables (create this)
```

## Commands

- `/game` - Start game menu (group chats only)

## Game Rules

### Rock Paper Scissors

- Rock beats Scissors
- Scissors beats Paper
- Paper beats Rock
- Same choice = Draw

### Black & White (Hitam Putih)

- All players choose a color simultaneously
- Players in the minority group survive
- Elimination continues until one player remains
- Winner gets 1 point added to leaderboard

## Dependencies

- [telegraf](https://github.com/telegraf/telegraf) - Telegram Bot API framework
- [dotenv](https://github.com/motdotla/dotenv) - Environment variable loader

## Development

To add new games:

1. Create a new file in the `games/` directory
2. Export a function that takes the bot instance as parameter
3. The game will be automatically loaded on bot startup

Example game structure:

```javascript
module.exports = (bot) => {
  // Your game logic here
  bot.action('your_game_action', async (ctx) => {
    // Handle game interactions
  });
};
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.