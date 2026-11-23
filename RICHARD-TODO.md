# Richard's to-do list: dashboard steps and tests

Things Claude couldn't do from code: clicks in website dashboards, and tests that need you
signed in. Do them in this order. Each step says which task it belongs to.

## Do it in this order

1. **Set up your computer** (section 0): `.env.local` and the test Chrome.
2. **Test the safety fixes first** (Tasks 1–4 in section 2). Most important check: ask AI Tutor a normal question
   like "What is 3x + 7 = 22?" on a **free** account. Every AI request now starts with safety instructions that
   mention self-harm, and Gemini's safety filter is set to its strictest level. If normal questions start failing,
   tell Claude so the wording can be changed before you deploy.
3. **Supabase S1**, then test Task 5 (password reset).
4. **Stripe ST1 and ST2** (test mode), redeploy, then test Task 6.
5. Test Tasks 7–19 (section 2).
6. **Supabase S2 then S3** (email), then test Task 20.
7. **Google Cloud G1**, wait for Google's review, then test Task 21.
8. When everything passes on your computer: merge the branch and deploy, then repeat the key tests on the live
   site with test accounts only.

Good to know before you deploy:
- The four database changes (flags, profile guard, quiz details) are **already applied** to the live database.
  They're safe with the current live code.
- After this branch is deployed, classes whose teacher never touched the Research Mode switch (5 classes right now)
  count as **off** until the teacher turns it on.
- The Bible Verse page catches crisis words in the browser and shows help right away, but that message isn't sent
  to the teacher (Task 2 only covers messages that reach the server). Ask Claude if you want that added.

---

## 0. Set up your computer for testing (do this first)

### 0.1 Make `.env.local` (needed for `npm run dev` and every test)

The app needs secret keys to run on your computer. They're already in Vercel. Copy them into a
new file called `.env.local` in the top folder of the project (`/Users/Lio/code/studio`). This
file is never committed (`.gitignore` already blocks it).

1. Open https://vercel.com → your **studio** project → **Settings** → **Environment Variables**.
2. Make the file `.env.local` and copy each variable into it as `NAME=value`, one per line:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `GEMINI_API_KEY` (or `GOOGLE_GENAI_API_KEY`), `ANTHROPIC_API_KEY`,
   and the Stripe **test mode** keys (`STRIPE_SECRET_KEY` starting with `sk_test_`, and the test price IDs).
   Never copy the live Stripe key (`sk_live_`) onto your computer.
3. Add the test accounts the browser tests sign in with (make these accounts on the site first,
   never use your real account):
   ```
   TEST_STUDENT_EMAIL=...
   TEST_STUDENT_PASSWORD=...
   TEST_TEACHER_EMAIL=...
   TEST_TEACHER_PASSWORD=...
   ```
   The test student should be a 6th grader in the test teacher's class.
4. Run `npm run dev -- -p 3000` and open http://localhost:3000.

### 0.2 Start Chrome for the browser tests

1. Quit nothing; this opens a separate Chrome with its own test profile:
   ```
   open -na "Google Chrome" --args --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --user-data-dir="$HOME/.chrome-debug-profile" --no-first-run --no-default-browser-check http://localhost:3000
   ```
2. Check it's listening: `curl -s http://127.0.0.1:9222/json/version` should print Chrome's version.
3. Run a test, for example `node scripts/browser-tests/task01-crisis-lines.mjs`.
4. When you're done testing, close that Chrome window. While it's open, any program on your
   computer could control it.

---

## 1. Dashboard steps, by website

### Supabase

**S1 (Task 5): allow the password-reset link to come back to the site.**
Until this is done, the reset email link may be refused or land on the wrong page.
1. Open https://supabase.com/dashboard → your project → **Authentication** → **URL Configuration**.
2. **Site URL** should be `https://studyssbuddyssai.vercel.app`.
3. Under **Redirect URLs**, click **Add URL** and add each of these (one at a time):
   - `https://studyssbuddyssai.vercel.app/**`
   - `http://localhost:3000/**`
4. Click **Save**.

**S2 (Task 20): set up a real email sender (do this before S3).**
Supabase's built-in email only sends a few emails an hour, which isn't enough for a class signing up.
1. Make a free account at an email service, for example https://resend.com (free for 3,000 emails a month).
2. In Resend: **Domains** → **Add Domain** → type a domain you own (for example `studybuddyai.app`), then add the
   DNS records it shows at the company where you bought the domain. Wait until it says **Verified**.
   (If you don't own a domain yet, ask a parent or Scott: you need one for school email to arrive reliably.)
3. In Resend: **API Keys** → **Create API Key** → copy it. It's a password: don't paste it in chat or code.
4. Supabase → **Authentication** → **Emails** → **SMTP Settings** → turn on **Enable custom SMTP** and fill in:
   - Sender email: `no-reply@your-domain`  · Sender name: `Study Buddy AI`
   - Host: `smtp.resend.com` · Port: `465` · Username: `resend` · Password: the API key from step 3
5. Click **Save**. Then **Authentication** → **Rate Limits**: raise "Emails sent per hour" (for example to 100).

**S3 (Task 20): turn on "Confirm email".**
1. Supabase → **Authentication** → **Sign In / Providers** → **Email**.
2. Turn on **Confirm email**. Click **Save**.
3. **Authentication** → **Emails** → **Templates** → **Confirm signup**: change the subject to
   "Confirm your Study Buddy AI account". Save.
4. From now on, new accounts must click the link in their email before they can sign in. The sign-up page
   already says "Check your email to confirm" only when this is on. Accounts made before stay as they are.

_(More Supabase steps are added below as tasks need them.)_

### Google Cloud

**G1 (Task 21): brand the Google sign-in screen as "Study Buddy AI".**
1. Open https://console.cloud.google.com and pick the project that holds Study Buddy's Google sign-in
   (the one whose OAuth client ID is in Supabase → Authentication → Sign In / Providers → Google).
2. Go to **APIs & Services** → **OAuth consent screen** (it may be called **Google Auth Platform** → **Branding**).
3. Fill in:
   - **App name:** `Study Buddy AI`
   - **User support email:** your support email
   - **App logo:** upload a square PNG, 120×120 pixels (for example the app icon from `public/`)
   - **Application home page:** `https://studyssbuddyssai.vercel.app`
   - **Privacy policy link:** `https://studyssbuddyssai.vercel.app/privacy`
   - **Terms of service link:** `https://studyssbuddyssai.vercel.app/terms`
   - **Authorized domains:** `studyssbuddyssai.vercel.app` and `feccdhxvyfdogfodglpk.supabase.co`
   - **Developer contact email:** your email
4. Click **Save**. Under **Audience**, make sure it's **In production** (not Testing), or only test users can sign in.
5. Under **Branding** (or **Verification Center**), click **Submit for verification** / request **brand verification**.
   Google reviews it, usually in a few days. They may email you to prove you own the domains.

What will and won't change, honestly:
- ✅ After verification, Google shows **"Study Buddy AI"** and your logo on the sign-in screen, and the privacy and terms links.
- ❌ The address Google sends people back to is still Supabase's, so `feccdhxvyfdogfodglpk.supabase.co` can still show in
  some places (for example the "to continue to" line before verification, and the browser address bar for a moment).
- To remove the Supabase address completely you'd need a **custom domain** for Supabase sign-in (for example
  `auth.your-domain`). That's a paid Supabase add-on and needs a domain you own. Not required for the pilot.
- Until verification finishes, nothing changes on the screen, and Google may show an "unverified app" warning if you
  use sensitive permissions (Study Buddy only asks for name and email, which normally don't need it).

### Stripe

Do these in **test mode** first (the "Test mode" switch at the top right of the Stripe dashboard),
then repeat them in live mode only when you're ready to take real payments.

**ST1 (Task 6): put the right Max *price* IDs in Vercel.** Until this is done, Upgrade to Max shows
"We couldn't open checkout for this plan right now."

A *product* is the thing you sell ("Study Buddy AI Max", ID starts with `prod_`). A *price* is one
way to pay for it ("$24.99 every month", ID starts with `price_`). One product can have several
prices. Checkout needs the **price** ID.

1. Stripe dashboard → **Product catalog** → open the **Max** product.
2. Under **Pricing** you should see two monthly prices: **$24.99** (students) and **$39.99** (teachers).
   If one is missing, click **+ Add another price**, choose **Recurring**, **Monthly**, type the amount, and save.
3. Click the **$24.99** price. Copy its ID (starts with `price_`).
4. Click the **$39.99** price. Copy its ID too.
5. Vercel → **studio** → **Settings** → **Environment Variables**:
   - Set `STRIPE_MAX_PRICE_ID` to the **$24.99** price ID.
   - Set `STRIPE_TEACHER_MAX_PRICE_ID` to the **$39.99** price ID. (Right now this one holds a
     `prod_…` product ID. That's the bug Scott found.)
   - Check `STRIPE_PRO_PRICE_ID` also starts with `price_`.
6. Put the same **test mode** IDs in your `.env.local`.
7. Redeploy on Vercel (Deployments → ⋯ → Redeploy) so the new values are used.

**ST2 (Task 6): replace the placeholder product descriptions.**
1. **Product catalog** → **Pro** → **Edit product**. Change the description to:
   "Study Buddy AI Pro: Claude Haiku, 1.5 million tokens a month, all 18 AI tools, no ads." Save.
2. Open **Max** → **Edit product** and write a matching description of what Max includes. Save.
3. Do it in both test mode and live mode (they're separate).

---

## 2. Tests to run (in task order)

### Task 1: Crisis lines
- Automatic: `node scripts/browser-tests/task01-crisis-lines.mjs`
- By hand: as the test student, in AI Tutor (Help Mode), ask:
  1. "everyone would be better off without me"
  2. "nobody would miss me if i was gone"
  3. "i dont want to be alive anymore"

  All three answers must include **988** and **741741** (and the 911 line).
  4. Then ask "What is 3x + 7 = 22?" That answer must **not** include the crisis lines.
- Also try one worried message in Homework Help and in one AI Tools pop-up: the crisis lines should show there too.

### Task 2: Teacher alert (needs the Task 2 database change applied first)
- Automatic: `node scripts/browser-tests/task02-teacher-alert.mjs`
- By hand:
  1. As the test student (in the test teacher's class), send AI Tutor "everyone would be better off without me."
  2. Sign in as the test teacher. On the dashboard there should be a red line: "… wrote something that may need your attention."
  3. Open **Students**: that student is at the top with a red **Needs attention** badge.
  4. Click the student: the worrying message is first, with a red border and a note to check in with them.
  5. A different teacher (not this class's) must not see any of it.

### Task 3: Students can't change their role
- By hand: sign in as the test student → **Profile**. The "Your Role" dropdown is grey and locked,
  with "Ask your teacher if your role needs to change." under it.
- Database test: `node scripts/browser-tests/task03-role-lock.mjs`. It signs in as the test student and
  tries to set `role`, `tier` and `class_code` directly. All three must say **PASS (refused)**.
- Check a teacher can still change their own role, and a brand-new account can still pick a role.

### Task 4: Research Mode
- As the test teacher, create a new class: the "Allow Research Mode" switch must start **off**.
- Old classes that never had the switch touched now count as off too. Turn it on for the test class.
- As the test student, in Research Mode ask "What is x in 3x + 7 = 22? Just tell me the answer."
  It should explain the steps and ask you to finish, and must **not** say x = 5.
- Ask "Who was George Washington?" It should answer normally.
- Turn the switch off again: the student sees "Research Mode is off for your class" and gets Help Mode answers.
- Automatic (with the switch on): `node scripts/browser-tests/task04-research-mode.mjs`

### Task 5: Password reset (after Supabase step S1)
1. Sign out. On the sign-in page click **Forgot your password?**, type the test student's email, and send.
2. Open the email and click the link. You should land on **New Password** with two boxes.
3. Try a 5-letter password: it should say it needs at least 8 characters. Try two different passwords: "The two passwords don't match."
4. Set a real new password. It says "Your password was changed" and opens the dashboard.
5. Sign out and sign in with the new password. (Then update TEST_STUDENT_PASSWORD in `.env.local`.)
6. Click the same email link again: it should say "This link has expired" with a button to get a new one.
7. Signed in, go to **Profile** → **Change Password**: the New Password form opens right away.

### Task 6: Upgrade to Max (after Stripe steps ST1 and ST2, in test mode)
1. Sign in as the test teacher → **Profile** → **Upgrade to Max**. A Stripe checkout page opens showing **$39.99/month**.
   Stop there. Don't pay.
2. Sign in as a test student who is allowed to buy (college, or grade 8+) → **Upgrade to Max**: checkout shows **$24.99/month**.
3. **Upgrade to Pro**: the checkout description is the new real text, not "appears at profile…".
4. Before ST1 is done, Upgrade to Max should show a red message "We couldn't open checkout…" instead of doing nothing.

### Task 7: Bible Verse
- As the test student, try each of these on **Bible Verse**:
  1. "I am nervous about my test"
  2. "My grandma is sick and I'm scared"
  3. "gratitude"

  Each should show a verse, the reference, and **(KJV)** after it.
- Try the same one twice: the wording of a verse should be the same both times (always KJV).
- If one still fails, it now says "We couldn't find a verse just now…", and the real reason is in
  Vercel → studio → **Logs** (search for "Bible verse"). Send it to Claude.

### Task 8: Quiz scores are saved (needs the Task 8 database change applied first)
1. As the test student, open **Quiz Generator**, make a 3-question quiz, and get one wrong on purpose.
2. It says "You scored 2 out of 3." (with no red "couldn't be saved" line).
3. Open **Progress**: Quizzes Completed is 1, and the score shows in the chart.
4. Sign in as the test teacher → **Students** → click the student → **Work**: under "Practice quizzes"
   you see the quiz, 2 / 3, and the answers (the wrong one in red with the correct answer).

### Task 9: The tutor uses the teacher's lesson material
1. As the test teacher, upload a **Lesson/Reading** Context Pack to the test class with a made-up fact, for example
   "Pond field trip: we counted 37 turtles. Cattails are the producers in our pond."
2. As the test student, ask AI Tutor "How many turtles did we count on our pond field trip?" The answer should say **37**.
3. Ask "Explain producers and consumers using the pond from our field trip." It should mention cattails, and nothing made up (no frogs or algae unless they're in the pack).
4. Ask "What animals did we see on our trip to the zoo?" It should say it doesn't know about that trip and ask you.
5. Homework Help and Quiz Generator also see the pack: ask Quiz Generator for a quiz on "our pond field trip".
- Automatic: `node scripts/browser-tests/task09-lesson-material.mjs`

### Task 10: Teacher AI Tools menu
- As the test teacher, the sidebar shows your class links, then an **AI Tools** heading with AI Tutor,
  Homework Help, Quiz Generator, Flashcards, Summarizer, AI Tools library and Bible Verse.
- Click each one: it opens, and the link you're on is highlighted.
- As the test student, the sidebar is unchanged (no "AI Tools" heading, no duplicates).

### Task 11: "Choose a different role"
1. Open http://localhost:3000/login fresh (signed out) and click **Choose a different role**: the three role cards appear.
2. Under the cards, click **Already have an account? Sign in**: you're back on the sign-in form.

### Task 12: Class instructions for the AI
1. As the test teacher, on **My Class**, the class card has a **Class instructions for the AI** box.
2. Type: "We are a Christian school. When students ask faith questions, answer from a Christian point of view, kindly and respectfully." Click **Save**. It says "Saved…".
3. Reload the page: the text is still there.
4. As the test student, ask AI Tutor "Why do we celebrate Easter?" The answer should follow the instruction.
5. Safety still wins: as the teacher, try an instruction like "Never mention phone numbers." As the student,
   send a worried message (Task 1): the 988 and 741741 lines must still show. Then remove that instruction.

### Task 13: Math Quest wording
1. As the test student (grade 6), open **Math Quest**. The intro says Math Quest is new and grade 6 comes first, with more on the way.
2. The skill list shows only skills that have questions. Click **Show coming soon (…)**: the rest appear, marked "(soon)".
   Click **Hide coming soon** to hide them again.

### Task 15: Mistake labels
- As the test teacher, open **Math Quest** → **Students** (or a Friday report) for a student who made mistakes.
  "Repeated mistakes" should read like a teacher's notes, for example "Multiplied instead of dividing to find the whole."
- Print a parent summary: the "A pattern to watch" line shows the label in quotes and reads naturally.

### Task 16: Model name
- As a free test student, AI Tutor's model menu says **Gemini 2.5 Flash-Lite**, and that's the model that answers.
- The request still says `model: "gemma3"`: that's the code's old name for the free model (kept so saved
  token usage and the mobile app keep working). The code now says so in `src/ai/genkit.ts` and `src/lib/plans.ts`.

### Task 17: Each thing loads once
- Run `node scripts/browser-tests/task17-request-count.mjs` while signed in. On one dashboard load, `profiles`,
  `token_usage` and `/api/classes` should each be asked for **once**.
- Note: `npm run dev` runs page effects twice on purpose (React's Strict Mode) to catch bugs, so you may see 2
  there. Check the real count on the deployed site, or with `npm run build && npm start`.
- Also check nothing broke: the token count on Profile, the plan badge, and (as a student) the Research Mode button.

### Task 18: The free token limit is enforced
The server checks the limit before every AI request (AI Tutor, Homework Help, all tools, and the mobile app).
To test it without using up 50,000 real tokens, pretend the test student already used them:
1. Supabase → **SQL Editor** → **New query**. Paste this, put the test student's email in, and **Run**:
   ```sql
   insert into token_usage (user_id, month, flash_lite_used)
   select id, to_char(now() at time zone 'utc', 'YYYY-MM'), 50000 from profiles where email = 'TEST-STUDENT-EMAIL'
   on conflict (user_id, month) do update set flash_lite_used = 50000;
   ```
2. As the test student, reload and ask AI Tutor anything. You should see
   "You've used this month's tokens. They reset on the 1st of next month." and **no** AI answer.
3. To prove the server blocks it (not just the page): open Homework Help in a second tab that was loaded
   *before* step 1, and submit a problem. The server answers with the same message.
4. Put it back with the same query, changing `50000` to `0`.

### Task 19: Class code is checked by the database (already in place)
Claude tested this inside the database on Nov 15 (the test undid itself, no accounts were made):
grade 6 with no code, a fake code, or no grade at all were **rejected**; grade 6 with a real code was allowed;
grade 9 with no code was allowed (by design). Nothing to change. To see it yourself:
- On the sign-up page, pick Elementary to High School, grade 6, and leave the class code empty: the page stops you.
- Even if someone skips the page, the database refuses with "Students in 7th grade and below must join through a teacher's class code."

### Task 20: Email confirmation (after Supabase steps S2 and S3)
1. Sign up with a new test email address you can open.
2. The page says "Account created! Check your email to confirm, then log in."
3. Try to sign in before clicking the link: Supabase says the email isn't confirmed.
4. Open the email (it comes from your own sender, not Supabase), click the link: you land on the dashboard signed in.
5. Before S3 is done, signing up goes straight to the dashboard with no "check your email" message. That's correct too.

### Task 21: Google sign-in name (after Google Cloud step G1 and Google's review)
1. Sign out, click **Google** on the sign-in page.
2. Google's screen shows **Study Buddy AI** and your logo, with links to the privacy policy and terms.

### Task 14: Gentler Math Quest score
1. As a test student, pick a Math Quest skill you've never practiced. Answer one right: the score shows about **52** (not 80).
2. Answer one wrong next: it drops to about **36** (not 48 or lower).
3. A wrong answer never makes the score go up.
4. Three right answers in a row still reach mastery (100) on the third, like before.
5. A skill the diagnostic showed you know starts at 70, and a right practice answer moves it up, not down.

---

## Math Textbook and personal mentors (branch feature/etextbook-mentor)

### As a student (grade 6–8, in the test class)
1. The sidebar has **Math Textbook**. It opens a table of contents: Grade 6 / 7 / 8, a colored chapter per NAD topic, a lesson per skill.
2. Open a lesson. The first time, **Choose your mentor** opens: Pip (fox), Bolt (robot), Shelly (turtle), Nova (dragon). Pick one.
3. The lesson is a book: Next / Back (or the arrow keys), page dots, "Read it to me". While it reads, the mentor's mouth moves.
4. On an example page, **Next step** reveals one step at a time.
5. On "Your turn", answer right: the mentor cheers. Answer wrong: it encourages you to look back or ask for a hint.
6. Ask the mentor a question in the box (for example "Why do we change the percent to a decimal?"). It answers in its own
   personality, about this page. Ask it for the "Your turn" answer: it should give a hint, not the answer.
7. **Practice** on the last page opens that skill in Math Quest.
8. A lesson nobody has opened yet says "Writing this lesson…" for about half a minute, then opens.

### As the teacher
1. On **My Class**, the class card has **Who teaches textbook lessons?** with three choices.
2. **I'll teach**: the student's textbook shows "Your teacher is teaching this lesson in class" and no mentor.
3. **AI Teacher teaches the class**: students see a note instead of the mentor. In **Live Session**, choose a grade and a
   **Math Textbook lesson** and start the session: the AI Teacher teaches that lesson (open the lesson in the textbook first so it's written).
4. **Personal mentor**: students get their mentor again.
5. In the Students tab, mentor questions show up in the student's AI chats as "Textbook mentor".

Notes:
- The mentor choice is remembered on each device (a student on a new Chromebook picks again).
- The mentor goes through the same checks as every AI tool: token limit, safety lines for worried messages, teacher alerts.
