# 🏓 PickleBracket

A modern, feature-rich pickleball tournament management application built with Next.js and Supabase.

![PickleBracket](https://img.shields.io/badge/Pickleball-Tournament%20Manager-84cc16?style=for-the-badge)

## ✨ Features

### 🏆 Bracket Tournaments
- **Player Management**: Add and manage tournament participants
- **Auto-Generated Brackets**: Automatically creates single-elimination brackets for any number of players
- **Smart Seeding**: Top seeds receive byes in tournaments with non-power-of-2 players
- **Score Entry**: Enter scores with flexible validation - games can end early due to time constraints
- **Edit Scores**: Correct scores after they've been entered
- **Visual Bracket View**: Beautiful, interactive bracket visualization

### 🔄 Round Robin Tournaments
- **Pool Play**: Split teams into pools (e.g., Pool A and Pool B)
- **Match Scheduling**: Automatic round-robin match scheduling within pools
- **Live Standings**: Real-time rankings based on wins, point differential, and head-to-head
- **Playoff Generation**: Automatically advance top teams to a playoff bracket

### ⚙️ Customizable Settings
- **Score Limits**: Set game targets (7, 11, 15, or 21 points)
- **Win by Two**: Toggle the "win by two" rule
- **Game Timer**: Optional countdown timer for each game
- **Persistent Timers**: Timers continue even if you close the window

### 📜 Tournament History
- View all past and ongoing tournaments
- Load previous tournaments to continue play
- Delete old tournaments
- See detailed stats, players, and brackets for each tournament

### 🐛 Bug Reporting
- Built-in bug report submission
- Reports saved to database for review

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) account (free tier works great!)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pickleball-app.git
   cd pickleball-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   
   Create a new project at [supabase.com](https://supabase.com) and run the SQL scripts in this order:
   
   - `supabase-schema.sql` - Creates the main tables (tournaments, players, matches)
   - `supabase-round-robin.sql` - Creates round robin tables
   - `supabase-timer-migration.sql` - Adds timer support to matches

4. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   You can find these values in your Supabase project dashboard under **Settings > API**.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Use

### Creating a Bracket Tournament

1. Click **"Add Players"** on the home page or navigate to the Players page
2. Click **"Create New Tournament"** to start fresh
3. Enter player names one by one
4. Click **"Generate Bracket"** when all players are added
5. Go to the **Bracket** page to see your tournament bracket
6. Click on any match to enter scores
7. The winner automatically advances to the next round!

### Creating a Round Robin Tournament

1. Click **"Round Robin"** on the home page
2. Enter tournament details (name, score limit, number of courts)
3. Add all teams/players
4. Click **"Generate Pools"** to create pool assignments
5. Play through pool matches and enter scores
6. View standings and advance top teams to playoffs

### Entering Scores

- Click on any match card in the bracket
- Enter the final score for each player
- Games can end at any score - perfect for time-limited situations!
- Click **"✓ Complete Game"** to submit

### Using the Timer

1. Go to **Settings** and set a game timer (e.g., 10 minutes)
2. When entering scores, click **"▶ Start"** to begin the countdown
3. Use **"⏸ Pause"** and **"▶ Resume"** as needed
4. Timer persists even if you close the score entry window

## 🗂️ Project Structure

```
pickleball-app/
├── app/
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context for state management
│   ├── api/             # API routes
│   ├── bracket/         # Bracket tournament page
│   ├── players/         # Player management page
│   ├── round-robin/     # Round robin tournament page
│   ├── history/         # Tournament history page
│   ├── settings/        # App settings page
│   └── page.tsx         # Home page
├── public/              # Static assets
├── lib/                 # Utility functions (Supabase client)
└── supabase-*.sql       # Database schema files
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Language**: TypeScript
- **Analytics**: [Vercel Speed Insights](https://vercel.com/docs/speed-insights)

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs using the in-app bug reporter or GitHub Issues
- Suggest new features
- Submit pull requests

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments


- Happy birthday Mylynh! 🎂

---

**Ready to run your next pickleball tournament? Let's go!** 🏓
