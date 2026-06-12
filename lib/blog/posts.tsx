import type { ReactNode } from "react";
import { HabitGridHero, TrackerCardHero, StreakHero, DiamondHero, WorldHero } from "@/components/blog/heroes";

// Lightweight prose elements so each article stays readable without a markdown
// dependency or global CSS.
function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold text-white mt-10 mb-3 tracking-tight">{children}</h2>;
}
function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] text-muted leading-relaxed mb-4">{children}</p>;
}
function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1.5 text-[15px] text-muted leading-relaxed mb-4">{children}</ul>;
}
function Strong({ children }: { children: ReactNode }) {
  return <strong className="text-white font-semibold">{children}</strong>;
}

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  readingMins: number;
  keywords: string[];
  hero: ReactNode;
  content: ReactNode;
};

export const POSTS: Post[] = [
  {
    slug: "your-living-world",
    title: "Your Living World: How to Grow the Ultimate Planet",
    description:
      "Every Phantom Tracker account has a unique living world that grows with your habits. Here's how it works, and how to grow it into the ultimate planet.",
    date: "2026-06-12",
    readingMins: 5,
    keywords: ["habit tracker gamification", "living world", "phantom tracker planet", "habit streaks rewards"],
    hero: <WorldHero />,
    content: (
      <>
        <P>
          Every Phantom Tracker account is born with its own <Strong>living world</Strong>: a small
          planet, unique to you, that grows and changes as you build habits. It is not just a badge.
          It is a living reflection of your consistency, and it can become genuinely beautiful.
          Here is exactly how it works, and how to grow the best possible version.
        </P>

        <H2>It starts as a tiny ocean world</H2>
        <P>
          When you sign up, you get a one-of-a-kind seed that shapes your planet forever: a small
          blue world with a single speck of land and a lot of open ocean. Every account&apos;s world
          looks different from day one, and yours will always be yours.
        </P>

        <H2>The process: show up, earn XP, level up</H2>
        <P>
          Your world grows through the same thing that builds real habits: <Strong>consistency</Strong>.
          Every check-in earns XP, and XP raises your <Strong>profile level</Strong>. As you level up,
          your world visibly evolves:
        </P>
        <UL>
          <li><Strong>More land.</Strong> New continents rise in random places as you climb the levels (there is always ocean, never a fully covered globe).</li>
          <li><Strong>The planet grows.</Strong> It gets larger and more detailed, and the surface rotates so you can watch your lands and oceans drift by.</li>
          <li><Strong>Rings and moons.</Strong> A moon appears early on, and a glowing ring forms once you reach the higher levels.</li>
          <li><Strong>More trees.</Strong> Greenery fills your continents as your total XP grows.</li>
        </UL>

        <H2>Health: keep it thriving</H2>
        <P>
          Beyond size, your world has a <Strong>living health</Strong> that follows your{" "}
          <em>recent</em> consistency: stack good days and it climbs through ten states, from
          <Strong> Dormant</Strong> all the way up to <Strong>Radiant</Strong>. Drift away and it
          fades and gets overgrown, but it can never die: get consistent again and everything
          regrows. Tap the status badge on your world to see all ten states and where you stand.
        </P>

        <H2>How to grow the best version</H2>
        <P>A few simple habits make a beautiful planet:</P>
        <UL>
          <li><Strong>Be consistent.</Strong> Recent streaks and perfect days are what push your world toward Radiant.</li>
          <li><Strong>Diversify.</Strong> Spread habits across different categories: each unique category adds bonus XP, so variety both levels you up faster and earns more.</li>
          <li><Strong>Protect your streaks.</Strong> Use a rest day when you need it instead of breaking the chain.</li>
          <li><Strong>Aim for the summit.</Strong> The very top levels unlock the most dramatic worlds.</li>
        </UL>

        <H2>The ultimate: the Diamond world</H2>
        <P>
          The most spectacular world belongs to <Strong>Diamond</Strong> members who reach the top.
          At the summit, your rings cross at different angles so the world reads like an{" "}
          <Strong>atom</Strong> while still looking like a planet, and a green{" "}
          <Strong>aurora</Strong> sweeps over the pole. It is the rarest, most beautiful version of
          your world, and you earn it by leveling all the way up.
        </P>

        <H2>Go see yours</H2>
        <P>
          Your world is waiting on your Stats page. Open it, watch it spin, and check its health,
          then go build a habit to make it grow.
        </P>
        <P>
          <a href="/stats" className="text-primary hover:underline font-medium">Visit your world &rarr;</a>
        </P>
      </>
    ),
  },
  {
    slug: "diamond-is-coming",
    title: "Diamond Is Coming: Lifetime Pro, for a Limited Time",
    description:
      "Phantom Tracker's Diamond plan launches soon: pay once, keep Pro forever, plus exclusive perks. A limited launch price of €29 (regular €39). Subscribe to the newsletter to hear the moment it opens.",
    date: "2026-06-12",
    readingMins: 3,
    keywords: ["diamond plan", "lifetime habit tracker", "phantom tracker diamond", "lifetime deal"],
    hero: <DiamondHero />,
    content: (
      <>
        <P>
          We&apos;ve been quietly building something special: <Strong>Diamond</Strong>, a one-time
          purchase that gives you Pro <Strong>forever</Strong>. No subscription, no renewals: pay
          once and you&apos;re set for life.
        </P>

        <H2>What Diamond includes</H2>
        <UL>
          <li><Strong>Everything in Pro, permanently</Strong>: unlimited habits, reminders, advanced stats.</li>
          <li><Strong>A 2&times; XP boost</Strong>: the biggest in the app (Pro gets 1.5&times;).</li>
          <li><Strong>The Diamond theme</Strong>: switch the whole app to an exclusive icy-cyan look.</li>
          <li><Strong>An aurora over your world</Strong>: shimmering light bands only Diamond planets get.</li>
          <li><Strong>A secret summit level</Strong>: one level above Eternal that only Diamond members can reach.</li>
          <li><Strong>The Diamond badge</Strong>: shown across the app, so your world knows you were here early.</li>
        </UL>

        <H2>The catch: it&apos;s limited</H2>
        <P>
          Diamond won&apos;t be on sale year-round. It opens for a <Strong>limited launch window</Strong>
          at a special early price of <Strong>&euro;29</Strong>, instead of the regular <Strong>&euro;39</Strong>.
          When the window closes, the launch price is gone for good. Early supporters get the best deal
          we&apos;ll ever offer.
        </P>

        <H2>How to not miss it</H2>
        <P>
          Subscribe to the newsletter and you&apos;ll get one email the moment Diamond opens, with the
          price and the deadline. That&apos;s it: no spam, just the launch.
        </P>
        <UL>
          <li>
            Already have an account? Turn on the newsletter in{" "}
            <a href="/settings#newsletter" className="text-primary hover:underline font-medium">Settings → Newsletter</a>.
          </li>
          <li>
            New here?{" "}
            <a href="/signup" className="text-primary hover:underline font-medium">Create a free account</a>{" "}
            and tick the newsletter box: you&apos;ll be tracking habits today and first in line for Diamond.
          </li>
        </UL>

        <P>
          Until then, keep your streaks alive: your world keeps growing either way.
        </P>
      </>
    ),
  },
  {
    slug: "how-to-build-a-habit-that-sticks",
    title: "How to Build a Habit That Actually Sticks",
    description:
      "A practical, science-backed guide to building habits that last: start tiny, anchor to a cue, track your streak, and recover fast when you slip.",
    date: "2026-06-10",
    readingMins: 6,
    keywords: ["how to build a habit", "build habits", "habit formation", "habit tracker"],
    hero: <HabitGridHero />,
    content: (
      <>
        <P>
          Most habits fail for the same reasons: we start too big, rely on motivation, and quit the
          first time we miss a day. Building a habit that actually sticks is less about willpower and
          more about <Strong>design</Strong>. Here&apos;s a simple system that works.
        </P>

        <H2>1. Start absurdly small</H2>
        <P>
          The biggest mistake is going all-in on day one. Instead, shrink the habit until it feels
          almost too easy: one push-up, one page, two minutes of meditation. A tiny habit you do
          every day beats a big one you abandon in a week. You can always do more: the goal first is
          to make showing up automatic.
        </P>

        <H2>2. Anchor it to an existing cue</H2>
        <P>
          New habits stick when they&apos;re attached to something you already do. Use the format
          <Strong> &ldquo;After I [current habit], I will [new habit].&rdquo;</Strong> For example:
        </P>
        <UL>
          <li>After I pour my morning coffee, I will write down one priority.</li>
          <li>After I brush my teeth, I will do two minutes of stretching.</li>
          <li>After I sit down at my desk, I will drink a glass of water.</li>
        </UL>

        <H2>3. Make it visible: track the streak</H2>
        <P>
          What gets measured gets done. Seeing an unbroken chain of completed days creates real
          momentum: you don&apos;t want to break it. This is exactly why a habit tracker with streaks
          and a visual calendar works so well: each check-in is a small win you can literally see
          building up. In <Strong>Phantom Tracker</Strong>, every day you show up fills a square and
          grows your streak, level, and XP.
        </P>

        <H2>4. Plan for the missed day</H2>
        <P>
          You <em>will</em> miss a day: that&apos;s normal, and it&apos;s not failure. The rule that
          matters: <Strong>never miss twice.</Strong> One missed day is a slip; two becomes the new
          pattern. Decide in advance how you&apos;ll bounce back, and treat getting back on track as
          part of the habit itself.
        </P>

        <H2>5. Reward progress, not perfection</H2>
        <P>
          Celebrate consistency over intensity. A 70% completion rate sustained for months beats a
          perfect week followed by burnout. Watch your weekly completion and longest streak trend up
          over time: that slow, compounding progress is the whole game.
        </P>

        <H2>Put it together</H2>
        <P>
          Pick one habit. Shrink it until it&apos;s easy. Anchor it to a cue. Track it daily so you
          can see the streak grow, and never miss twice. Do that, and the habit stops being something
          you force and becomes something you simply are.
        </P>
      </>
    ),
  },
  {
    slug: "best-free-habit-tracker",
    title: "The Best Free Habit Tracker in 2026 (and What to Look For)",
    description:
      "What actually makes a great free habit tracker (streaks, reminders, stats, privacy) and why Phantom Tracker is a strong free pick.",
    date: "2026-06-10",
    readingMins: 5,
    keywords: ["best free habit tracker", "free habit tracker", "habit tracker app", "habit app"],
    hero: <TrackerCardHero />,
    content: (
      <>
        <P>
          There are dozens of habit trackers, and most of the &ldquo;free&rdquo; ones either bury the
          good parts behind a paywall or drown you in ads. Here&apos;s what genuinely matters in a
          free habit tracker: and how to choose one you&apos;ll actually keep using.
        </P>

        <H2>What to look for</H2>
        <UL>
          <li><Strong>A real free tier.</Strong> You should be able to track meaningful habits without paying: not a 7-day trial in disguise.</li>
          <li><Strong>Streaks &amp; a visual calendar.</Strong> Seeing your consistency build is the single biggest motivator.</li>
          <li><Strong>Reminders.</Strong> A nudge at the right time is the difference between doing it and forgetting.</li>
          <li><Strong>Stats that mean something.</Strong> Completion rate, best streak, and trends: not just vanity numbers.</li>
          <li><Strong>Privacy.</Strong> Your habits are personal. Avoid apps that sell data or demand pointless permissions.</li>
          <li><Strong>Works everywhere.</Strong> Phone, tablet, desktop: ideally installable as an app without an app store.</li>
        </UL>

        <H2>Why Phantom Tracker is a strong free choice</H2>
        <P>
          <Strong>Phantom Tracker</Strong> was built around a genuinely usable free plan: track up to
          four habits, build streaks, earn XP and levels, and watch a living world grow with your
          consistency: all free, on every device, with no ads and no selling your data.
        </P>
        <P>
          When you want more, Pro unlocks unlimited habits, timed push reminders, advanced stats, and
          exclusive tiers: but the free plan is fully functional on its own. It installs straight to
          your home screen (no app store needed), and it&apos;s available in English, Magyar and
          Română.
        </P>

        <H2>The bottom line</H2>
        <P>
          The best free habit tracker is the one you&apos;ll open every day. Look for real streaks,
          helpful reminders, honest privacy, and a free tier that isn&apos;t crippled. If that sounds
          like what you want, <Strong>give Phantom Tracker a try</Strong>: it&apos;s free to start
          and takes about a minute to set up.
        </P>
      </>
    ),
  },
  {
    slug: "why-streaks-work",
    title: "Why Streaks Work: The Psychology of Habit Streaks",
    description:
      "Streaks are one of the most powerful tools for consistency. Here's the psychology behind why they work: and how to use them without burning out.",
    date: "2026-06-10",
    readingMins: 5,
    keywords: ["habit streaks", "why streaks work", "streak motivation", "habit tracker streaks"],
    hero: <StreakHero />,
    content: (
      <>
        <P>
          A &ldquo;streak&rdquo;: the number of days in a row you&apos;ve done something: is one of
          the most effective motivators in any habit tracker. It seems almost too simple to work, yet
          people will go to surprising lengths to protect one. Here&apos;s why.
        </P>

        <H2>1. Loss aversion</H2>
        <P>
          We feel the pain of losing something about twice as strongly as the pleasure of gaining it.
          Once you&apos;ve built a 20-day streak, breaking it <em>feels</em> like a loss: so you show
          up to protect what you&apos;ve built. The streak turns an abstract goal into something
          concrete you don&apos;t want to give up.
        </P>

        <H2>2. The progress principle</H2>
        <P>
          Visible progress is intrinsically motivating. A growing chain of completed days gives your
          brain a small hit of accomplishment every time you check in: momentum you can actually see.
          That&apos;s why a streak counter paired with a contribution calendar is so sticky.
        </P>

        <H2>3. Identity reinforcement</H2>
        <P>
          Every day you keep a streak alive, you cast a vote for the kind of person you&apos;re
          becoming. A 60-day meditation streak isn&apos;t just data: it&apos;s evidence that
          &ldquo;I&apos;m someone who meditates.&rdquo; Habits stick when they become part of your
          identity.
        </P>

        <H2>The dark side: don&apos;t let the streak own you</H2>
        <P>
          Streaks have a failure mode. If one missed day wipes a 100-day streak to zero, the loss can
          feel so demoralizing that people quit entirely. The fix:
        </P>
        <UL>
          <li><Strong>Focus on the trend, not perfection.</Strong> A 90% month is excellent.</li>
          <li><Strong>Never miss twice.</Strong> A single gap is nothing; two in a row is a pattern.</li>
          <li><Strong>Use rest days</Strong> for habits that aren&apos;t meant to be daily, so a planned day off doesn&apos;t feel like a break.</li>
        </UL>

        <H2>Make streaks work for you</H2>
        <P>
          Used well, streaks turn consistency into a game you want to win. <Strong>Phantom Tracker</Strong>
          builds the whole experience around them: streak counters, bonus XP at 7, 14 and 30 days,
          milestone celebrations, and gentle nudges so you don&apos;t break a streak worth keeping.
        </P>
      </>
    ),
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}
