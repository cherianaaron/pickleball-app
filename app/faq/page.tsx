"use client";

import Link from "next/link";
import { useState } from "react";

interface FAQSection {
  id: string;
  icon: string;
  title: string;
  content: React.ReactNode;
}

function AccordionItem({ section, isOpen, onToggle }: { section: FAQSection; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl">{section.icon}</span>
          <h3 className="text-lg font-semibold text-white">{section.title}</h3>
        </div>
        <span className={`text-white/50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-white/10">
          <div className="text-white/70 space-y-4 leading-relaxed">
            {section.content}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["getting-started"]));

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setOpenSections(new Set(faqSections.map(s => s.id)));
  };

  const collapseAll = () => {
    setOpenSections(new Set());
  };

  const faqSections: FAQSection[] = [
    {
      id: "getting-started",
      icon: "🚀",
      title: "Getting Started",
      content: (
        <>
          <p>
            <strong className="text-white">Welcome to PickleBracket!</strong> This app helps you organize and manage pickleball tournaments with ease. You can create two types of tournaments:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong className="text-orange-400">Round Robin</strong> - Every team plays every other team in their pool. Great for ensuring everyone gets multiple games.</li>
            <li><strong className="text-lime-400">Bracket (Single Elimination)</strong> - Traditional tournament style where losing a match eliminates you. Winner takes all!</li>
          </ul>
          <p className="mt-4">
            <strong className="text-white">Quick Start:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>From the home page, choose either <strong className="text-orange-400">Round Robin</strong> or <strong className="text-lime-400">Bracket</strong></li>
            <li>Configure your settings (optional but recommended)</li>
            <li>Add your teams/players</li>
            <li>Generate the tournament and start playing!</li>
          </ol>
        </>
      ),
    },
    {
      id: "settings",
      icon: "⚙️",
      title: "Settings",
      content: (
        <>
          <p>
            Access settings from the home page by clicking the <strong className="text-white">⚙️ Settings</strong> button. Settings should be configured <em>before</em> starting a tournament.
          </p>
          
          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">🎯 Score Limit</h4>
            <p>Choose how many points are needed to win a game. Standard pickleball is 11 points, but you can select from 5, 7, 9, 11, 15, or 21 points depending on your preference or time constraints.</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">✌️ Win by Two</h4>
            <p>When enabled, players must win by a 2-point margin. For example, if the score limit is 11 and both players reach 10-10, play continues until someone leads by 2 (e.g., 12-10). Toggle this off if you want games to end exactly at the score limit.</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">⏱️ Game Timer</h4>
            <p>Set an optional time limit per game. Options include: No Timer, 5, 10, 15, 20, or 30 minutes. When the timer expires, whoever has the higher score wins. This is great for keeping tournaments moving on schedule.</p>
          </div>

          <p className="mt-4 text-yellow-400/80 text-sm">
            ⚠️ Note: Settings are saved and will apply to new tournaments you create. For bracket tournaments, some settings cannot be changed once the tournament has started.
          </p>
        </>
      ),
    },
    {
      id: "round-robin",
      icon: "🔄",
      title: "Round Robin Tournaments",
      content: (
        <>
          <p>
            Round Robin tournaments ensure every team plays every other team in their pool. This format is perfect when you want to maximize playing time for all participants.
          </p>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Step 1: Tournament Setup</h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Tournament Name:</strong> Give your tournament a memorable name</li>
              <li><strong>Points to Win:</strong> Select from 7, 11, 15, or 21 points</li>
              <li><strong>Number of Courts:</strong> How many courts are available (1-6). More courts = more simultaneous games</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Step 2: Add Teams</h4>
            <p>Enter team names one by one. You need at least 4 teams to start. Teams will be automatically divided into pools based on the number of teams and courts available.</p>
            <p className="mt-2 text-lime-400/80 text-sm">💡 Tip: Use descriptive names like "Court 1 - Team A" or player names like "John & Sarah"</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Step 3: Pool Play</h4>
            <p>Once you start pool play:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Teams are divided into pools (usually 2 pools)</li>
              <li>Matches are organized by <strong>rounds</strong> - in each round, multiple games can happen simultaneously</li>
              <li>Court assignments show where each match should be played</li>
              <li>Teams with a <strong className="text-yellow-400">BYE</strong> sit out that round</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Step 4: Enter Scores</h4>
            <p>Click on any match to enter scores. Enter the final score for each team - the winner is determined automatically. You can edit scores even after entering them by clicking on completed matches.</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Step 5: Rankings & Playoffs</h4>
            <p>After all pool play matches are complete:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Teams are ranked by: <strong>Wins</strong> → <strong>Point Differential</strong> → <strong>Head-to-Head</strong></li>
              <li>Top teams from each pool advance to playoffs (single elimination bracket)</li>
              <li>Continue entering scores until a champion is crowned!</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-orange-400/10 to-lime-400/10 rounded-xl p-4 mt-4 border border-orange-400/20">
            <h4 className="text-white font-semibold mb-2">💡 Pro Tip: Round Robin → Bracket</h4>
            <p>Want to use Round Robin results to seed a Bracket tournament? Here&apos;s how:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
              <li>Complete your Round Robin tournament and view the final standings</li>
              <li>Go to <strong className="text-lime-400">🏆 Bracket</strong> from the navigation</li>
              <li>Create a new bracket tournament</li>
              <li>Add players <strong className="text-white">in seed order</strong> (1st place first, then 2nd, etc.)</li>
              <li>Generate the bracket - top seeds will automatically face lower seeds!</li>
            </ol>
            <p className="mt-2 text-white/60 text-sm">Note: Round Robin and Bracket are separate tournament types. You&apos;ll need to manually add players to the bracket based on your Round Robin rankings.</p>
          </div>

          <p className="mt-4 text-lime-400/80 text-sm">
            ✨ Your round robin progress is automatically saved. You can leave the page and come back - just navigate back to Round Robin to continue where you left off.
          </p>
        </>
      ),
    },
    {
      id: "bracket",
      icon: "🏆",
      title: "Bracket Tournaments (Single Elimination)",
      content: (
        <>
          <p>
            Bracket tournaments follow a single-elimination format - lose once and you&apos;re out! This format creates exciting high-stakes matches and crowns a clear champion.
          </p>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Step 1: Add Players</h4>
            <p>From the home page, click <strong className="text-lime-400">🏆 Bracket</strong> to go to the players page. Add at least 2 players/teams. You can name your tournament at the top of the page.</p>
            <p className="mt-2 text-white/60 text-sm">The bracket size will automatically adjust (4, 8, 16, 32 slots) based on player count. If you have an uneven number, some players get a first-round BYE.</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Step 2: Generate Bracket</h4>
            <p>Click <strong className="text-lime-400">🏆 Generate Bracket & Start</strong> to create the tournament bracket. Players are randomly seeded and matched up. This action starts the tournament - player list is locked after this point.</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Step 3: View & Navigate the Bracket</h4>
            <p>The bracket view shows all matches organized by round:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Round 1:</strong> First round matches (Quarterfinals for 8 players)</li>
              <li><strong>Semifinals:</strong> Winners from Round 1 face off</li>
              <li><strong>Finals:</strong> The championship match</li>
            </ul>
            <p className="mt-2">Bracket connectors show how winners advance to the next round.</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Step 4: Enter Match Scores</h4>
            <p>Click on any match with both players assigned to enter scores. A modal will appear where you can:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Enter the final score for each player</li>
              <li>Start/pause/reset the game timer (if enabled in settings)</li>
              <li>Submit the score - winner automatically advances!</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Step 5: Crown the Champion</h4>
            <p>When the Finals match is complete, a celebration screen appears announcing the tournament champion! 🎉</p>
          </div>
        </>
      ),
    },
    {
      id: "byes",
      icon: "⏭️",
      title: "Understanding BYEs",
      content: (
        <>
          <p>
            A <strong className="text-yellow-400">BYE</strong> is when a player or team automatically advances to the next round <em>without playing a match</em>. This happens when the number of participants doesn&apos;t perfectly fill the bracket.
          </p>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">When Do BYEs Happen?</h4>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong>Bracket Tournaments:</strong> When you have an odd number of players (like 6 players), one player will get a BYE because 3 winners from Round 1 can&apos;t be evenly paired in Round 2.</li>
              <li><strong>Round Robin:</strong> When you have an odd number of teams in a pool, one team sits out each round (marked as &quot;BYE&quot;).</li>
              <li><strong>Non-Power-of-2 Brackets:</strong> With 6 players, 3 matches happen in Round 1, producing 3 winners. Only 2 can play in Round 2, so the 3rd gets a BYE to the Finals.</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">How to Identify BYE Players</h4>
            <p>In the bracket view, players who received a BYE are marked with a <span className="px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 text-xs font-medium">BYE</span> badge next to their name. This indicates they advanced without playing in the previous round.</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Example: 6 Players</h4>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Round 1:</strong> 3 matches (6 players → 3 winners)</li>
              <li><strong>Round 2:</strong> 1 match (2 of the 3 winners play; 1 winner gets a BYE)</li>
              <li><strong>Finals:</strong> Round 2 winner vs BYE player</li>
            </ul>
          </div>

          <p className="mt-4 text-lime-400/80 text-sm">
            💡 Tip: BYEs are assigned automatically based on tournament size. In seeded brackets, typically the top seeds receive BYEs as an advantage.
          </p>
        </>
      ),
    },
    {
      id: "timers",
      icon: "⏱️",
      title: "Using Game Timers",
      content: (
        <>
          <p>
            Game timers help keep your tournament on schedule by setting a time limit for each match. When time expires, whoever has the higher score wins.
          </p>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Setting Up Timers</h4>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Go to <strong className="text-white">⚙️ Settings</strong> from the home page</li>
              <li>In the <strong>Game Timer</strong> section, select your preferred duration (5, 10, 15, 20, or 30 minutes)</li>
              <li>Click <strong className="text-lime-400">Save Settings</strong></li>
              <li>Timers will now appear in your bracket tournament matches</li>
            </ol>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Timer Controls (in Score Entry Modal)</h4>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-lime-400">▶ Start</strong> - Begin the countdown timer</li>
              <li><strong className="text-yellow-400">⏸ Pause</strong> - Temporarily stop the timer (for timeouts, disputes, etc.)</li>
              <li><strong className="text-white">↻ Reset</strong> - Reset timer back to full duration</li>
              <li><strong className="text-lime-400">▶ Resume</strong> - Continue a paused timer</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Timer Indicators</h4>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><span className="text-lime-400">Green timer</span> - Game in progress with plenty of time</li>
              <li><span className="text-yellow-400">Yellow timer</span> - Less than 1 minute remaining or paused</li>
              <li><span className="text-red-400">Red "TIME!"</span> - Timer has expired, enter final scores</li>
            </ul>
          </div>

          <p className="mt-4 text-lime-400/80 text-sm">
            💡 Tip: The timer continues running even if you close the score entry modal. The timer state is saved to the database.
          </p>
        </>
      ),
    },
    {
      id: "editing-scores",
      icon: "✏️",
      title: "Editing Scores",
      content: (
        <>
          <p>
            Made a mistake entering a score? No problem! PickleBracket allows you to edit scores even after they&apos;ve been submitted.
          </p>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Editing Bracket Scores</h4>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Find the completed match in the bracket view</li>
              <li>Completed matches show <strong className="text-lime-400">✓ Complete (click to edit)</strong></li>
              <li>Click on the match to open the score entry modal</li>
              <li>The previous scores will be pre-filled - update them as needed</li>
              <li>Click <strong className="text-lime-400">Update Score</strong> to save changes</li>
            </ol>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Editing Round Robin Scores</h4>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>In the pool play view, find the completed match</li>
              <li>Completed matches show a <strong className="text-lime-400">green checkmark ✓</strong></li>
              <li>Click on the match to reopen the score entry</li>
              <li>Update the scores and submit again</li>
            </ol>
          </div>

          <p className="mt-4 text-yellow-400/80 text-sm">
            ⚠️ Warning: In bracket tournaments, editing a score may affect subsequent matches. If the winner changes, players who advanced based on the original result may need to be manually reassigned.
          </p>
        </>
      ),
    },
    {
      id: "history",
      icon: "📜",
      title: "Tournament History",
      content: (
        <>
          <p>
            All your bracket tournaments are automatically saved. Access your tournament history to view past results, load previous tournaments, or delete old ones.
          </p>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Accessing History</h4>
            <p>From any page, you can access tournament history. The history page shows all bracket tournaments with:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Tournament name and creation date</li>
              <li>Number of players and matches</li>
              <li>Status: 📝 Not Started, ⚡ In Progress, or 🏆 Complete</li>
              <li>Champion name (if completed)</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Loading a Tournament</h4>
            <p>Click on any tournament to view its details. You can then click <strong className="text-lime-400">Load This Tournament</strong> to make it your active tournament and continue where you left off.</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4 mt-4">
            <h4 className="text-white font-semibold mb-2">Deleting a Tournament</h4>
            <p>Hover over a tournament and click the 🗑️ delete button, or select a tournament and click <strong className="text-red-400">Delete Tournament</strong>. This action is permanent and cannot be undone.</p>
          </div>

          <div className="bg-gradient-to-r from-orange-400/10 to-lime-400/10 rounded-xl p-4 mt-4 border border-orange-400/20">
            <h4 className="text-white font-semibold mb-2">🔄 Using Round Robin Results for Brackets</h4>
            <p>Completed a Round Robin tournament and want to create a seeded Bracket? You&apos;ll need to <strong className="text-white">manually create a new bracket</strong> using your Round Robin standings:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2 mt-2 text-sm">
              <li>View the final rankings in your completed Round Robin tournament</li>
              <li>Navigate to <strong className="text-lime-400">🏆 Bracket</strong> and create a new tournament</li>
              <li>Manually add players in order of their Round Robin ranking (1st place first, then 2nd, etc.)</li>
              <li>Generate the bracket - the seeding will ensure top performers face lower seeds!</li>
            </ol>
            <p className="mt-2 text-white/50 text-sm">⚠️ Round Robin and Bracket tournaments are separate - there is no automatic import feature. You must manually re-enter player names.</p>
          </div>

          <p className="mt-4 text-white/60 text-sm">
            Note: This History page shows <strong>Bracket tournaments only</strong>. Round Robin tournaments are saved separately - return to the Round Robin page to view past results.
          </p>
        </>
      ),
    },
    {
      id: "tips",
      icon: "💡",
      title: "Tips & Best Practices",
      content: (
        <>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lime-400 font-semibold mb-2">🎯 Choosing Tournament Type</h4>
              <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                <li><strong>Round Robin:</strong> Best for 6-12 teams, when you want everyone to play multiple games</li>
                <li><strong>Bracket:</strong> Best for larger groups, creates exciting elimination drama</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lime-400 font-semibold mb-2">⏰ Time Management</h4>
              <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                <li>Use game timers to keep matches moving (10-15 min recommended)</li>
                <li>For Round Robin, choose court count wisely - more courts = faster tournament</li>
                <li>Consider shorter games (7 or 9 points) for large tournaments</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lime-400 font-semibold mb-2">📱 On Mobile</h4>
              <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                <li>The app works great on phones and tablets</li>
                <li>Bracket view scrolls horizontally - swipe left/right to see all rounds</li>
                <li>Tap on matches to enter scores</li>
              </ul>
            </div>

            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-lime-400 font-semibold mb-2">🐛 Found a Bug?</h4>
              <p className="text-sm">Go to <strong className="text-white">Settings</strong> and scroll down to find the <strong className="text-red-400">Report a Bug</strong> section. We appreciate your feedback!</p>
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
          <div className="text-center">
            <div className="inline-block mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400/20 to-yellow-300/20 flex items-center justify-center border-2 border-lime-400/30">
                <span className="text-3xl">❓</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">How It Works</h1>
            <p className="text-white/50">Everything you need to know about PickleBracket</p>
          </div>
        </div>

        {/* Expand/Collapse All */}
        <div className="flex justify-end gap-3 mb-6">
          <button
            onClick={expandAll}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {faqSections.map((section) => (
            <AccordionItem
              key={section.id}
              section={section}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </div>

        {/* Still Need Help */}
        <div className="mt-12 glass rounded-3xl p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Still Need Help?</h3>
          <p className="text-white/60 mb-6">
            Found a bug or have a feature request? Let us know!
          </p>
          <Link
            href="/settings#bug-report"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-lime-400 to-yellow-300 text-emerald-900 shadow-lg shadow-lime-400/30 hover:shadow-lime-400/50 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            🐛 Report a Bug
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/30 text-sm">
          <p>PickleBracket v1.0</p>
        </div>
      </div>
    </div>
  );
}

