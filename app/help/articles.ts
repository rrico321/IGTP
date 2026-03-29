export interface HelpArticle {
  id: string
  category: string
  title: string
  content: string
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'what-is-igtp',
    category: 'Getting Started',
    title: 'What is IGTP?',
    content: `# What is IGTP?

**IGTP** stands for **"I Got The Power"** — and that's exactly what it's about. It's a platform that lets friends share their computers' AI power with each other.

## The Simple Version

You know how some people have powerful computers that can run AI models (like ChatGPT-style assistants), and some people don't? IGTP connects those two groups.

- **If you have a powerful computer:** You can let your trusted friends use it to run AI models — without them ever touching your computer directly.
- **If you don't have a powerful computer:** You can ask a friend who does to share their machine with you, and then chat with AI models through IGTP.

## What is Ollama?

IGTP runs on top of a free program called **Ollama**. Think of Ollama as a "container" that holds and runs AI models on your computer. IGTP is the bridge that lets your friends use those models securely over the internet.

## What is an AI Model?

An **AI model** is the "brain" behind an AI assistant. Different models have different personalities, abilities, and sizes. Some models are great at writing, others at coding, and others at answering questions. IGTP lets you use whatever models your friend has installed on their machine.

## The Two Sides

| If you're **sharing** | If you're **using** |
|---|---|
| You have a GPU-equipped computer | You want to use AI without buying hardware |
| You install Ollama + the IGTP daemon | You just need an IGTP account |
| You approve who can use your machine | You request access from a friend |
| Your GPU does the work in the background | You chat through the IGTP website |

## Is It Safe?

Yes. IGTP uses a **trust network** — you only share with people you've explicitly approved. Nobody can use your machine without your permission, and you can revoke access at any time.`,
  },
  {
    id: 'how-to-sign-up',
    category: 'Getting Started',
    title: 'How do I sign up?',
    content: `# How do I sign up?

Signing up for IGTP is quick and free. Here's how:

## Step 1: Get an Invitation

IGTP is currently **invitation-only** to keep the community trusted and safe. You'll need a friend who's already on IGTP to invite you.

1. Ask a friend who uses IGTP to invite you.
2. They'll enter your email address in the app, and you'll receive an email from IGTP.
3. Click the **"Accept Invitation"** link in that email.

> **Note:** The invitation link expires after 7 days. If it's expired, ask your friend to send a new one.

## Step 2: Create Your Account

After clicking the invitation link, you'll be taken to a sign-up page.

1. Enter your **name** (this is what your friends will see).
2. Enter your **email address** (it may already be filled in).
3. Create a **password** — make it something memorable but secure. At least 8 characters is recommended.
4. Click the green **"Create Account"** button.
5. You'll be logged in automatically and taken to your home page.

## Step 3: Explore the App

Once you're in, you'll see the main navigation bar at the top with these sections:

- **Browse** — Find machines your friends are sharing
- **My Machines** — Register your own computer as a shareable machine
- **Chat** — Start AI conversations
- **Network** — Manage your trust network (friends)
- **Settings** — API keys and other settings

## Already Have an Account?

Just go to the IGTP website and click **"Sign In"**. Enter your email and password to log in.`,
  },
  {
    id: 'what-do-i-need',
    category: 'Getting Started',
    title: 'What do I need to get started?',
    content: `# What do I need to get started?

What you need depends on whether you want to **share your machine** or **use someone else's machine**.

## If You Just Want to Use AI (the easy path)

You only need:

1. An IGTP account (see "How do I sign up?")
2. A friend on IGTP who is willing to share their machine with you
3. A modern web browser (Chrome, Firefox, Safari, Edge — any will work)

That's it! No special hardware, no installation required. You just browse to the IGTP website and chat.

---

## If You Want to Share Your Machine

This requires a bit more setup, but it's worth it if you want to contribute to the community.

### Hardware Requirements

Your computer needs a **GPU** (Graphics Processing Unit — a specialized processor often made by NVIDIA or AMD). This is what actually runs the AI models.

Minimum recommended:
- **NVIDIA GPU** with at least **8 GB VRAM** (the GPU's own memory)
- Or an **Apple Silicon Mac** (M1, M2, M3, M4 chip) — these have great built-in AI performance
- **16 GB of system RAM** (your computer's main memory)
- A stable internet connection

> **Not sure if you have a GPU?** On Windows, press Windows key + R, type dxdiag, press Enter, and look for "Display" — it will show your GPU. On Mac, click the Apple menu → "About This Mac" → "More Info."

### Software Requirements

1. **Ollama** — the free program that runs AI models (we'll walk you through installing it)
2. **The IGTP daemon** — a small background program that connects your computer to IGTP (we'll walk you through this too)

### Your Account

You'll need an IGTP account (same as above). When you register your machine, IGTP will show it to friends in your trust network.

---

> **Not sure which path is right for you?** Start by just using someone else's machine. If you enjoy it and want to contribute back, you can always set up sharing later.`,
  },
  {
    id: 'what-is-a-daemon',
    category: 'Sharing Your Machine',
    title: 'What is a daemon and why do I need one?',
    content: `# What is a daemon and why do I need one?

## What is a Daemon?

A **daemon** (pronounced "dee-mon") is just a program that runs quietly in the background on your computer. You don't see it on your screen, but it's always working behind the scenes.

Think of it like this: When you connect to Wi-Fi, there's a little program running invisibly that manages your internet connection. You never see it, but without it, your internet wouldn't work. That's a daemon.

## The IGTP Daemon

The **IGTP daemon** is a small program you install on your computer that does three things:

1. **Connects your computer to IGTP** — It regularly checks in with the IGTP servers so they know your machine is online and available.
2. **Receives jobs** — When an approved friend wants to use your AI models, the daemon picks up their request and passes it to Ollama.
3. **Sends back results** — When Ollama is done generating a response, the daemon sends the result back to your friend through IGTP.

## Why Can't IGTP Just Connect Directly?

Your home computer sits behind a router and firewall, which means the internet can't reach it directly. The daemon solves this by **reaching out to IGTP** (instead of waiting to be reached). It's like the difference between you calling someone vs. waiting for them to call you.

## Is It Safe?

Yes. The daemon:
- Only ever talks to IGTP's servers (no other connections)
- Only processes requests from people you've **explicitly approved**
- Can be stopped at any time with a simple command
- Uses no ports that expose your computer to the wider internet

## Do I Need It Running All the Time?

Only when you want your machine to be available. If you're using your computer for something intensive (gaming, video editing, etc.), you can pause the daemon and it will show your machine as "offline" to your friends.`,
  },
  {
    id: 'how-to-install-ollama',
    category: 'Sharing Your Machine',
    title: 'How to install Ollama',
    content: `# How to install Ollama

**Ollama** is the free program that actually runs AI models on your computer. Think of it as the engine that powers everything.

## Installing on Mac

1. Open your web browser and go to **ollama.com**
2. Click the big **"Download"** button
3. Your browser will download a file called something like **Ollama-darwin.dmg**
4. Open the downloaded file (double-click it in your Downloads folder)
5. Drag the Ollama icon into your Applications folder (just like installing any other Mac app)
6. Open Ollama from your Applications folder
7. You'll see a small llama icon appear in your menu bar (top-right of your screen)

**To verify it's working:** Click the llama icon in your menu bar. It should say "Ollama is running."

---

## Installing on Windows

1. Open your web browser and go to **ollama.com**
2. Click **"Download for Windows"**
3. Your browser downloads a file called **OllamaSetup.exe**
4. Find that file in your Downloads folder and double-click it
5. Click **"Yes"** if Windows asks "Do you want to allow this app to make changes?"
6. The installer will run automatically — no options to select
7. When it's done, you'll see a small llama icon in your system tray (bottom-right corner of your screen, near the clock)

**To verify it's working:** Right-click the llama icon in the system tray. It should show a menu with options like "View logs."

---

## Installing on Linux

1. Open a **Terminal** window:
   - On Ubuntu: press Ctrl + Alt + T
   - On other distros: search for "Terminal" in your app menu
2. Copy and paste the following command and press Enter:

    curl -fsSL https://ollama.com/install.sh | sh

3. Wait for the installation to complete (this may take a minute)
4. Ollama starts automatically as a background service

**To verify it's working:** Type **ollama list** and press Enter. You'll see a list of installed models (probably empty at first — that's fine).

---

## Downloading Your First Model

Once Ollama is installed, you should download at least one AI model. Here's how to download a popular one called **Llama 3**:

1. Open a Terminal (Mac/Linux) or PowerShell (Windows)
2. Type: **ollama pull llama3** and press Enter
3. Wait for the download to complete (it may be several gigabytes — this takes time)

> **Tip:** To see all available models, visit **ollama.com/library** in your browser.

Once you have models installed, the IGTP daemon will detect them automatically and make them available for your friends.`,
  },
  {
    id: 'how-to-install-daemon',
    category: 'Sharing Your Machine',
    title: 'How to install the IGTP daemon',
    content: `# How to install the IGTP daemon

The IGTP daemon is a small helper program that connects your computer to IGTP. Here's how to install it step by step.

> **Before you start:** Make sure Ollama is installed and running (see "How to install Ollama"). Also make sure you're logged into your IGTP account — you'll need to copy a token during this process.

---

## Step 1: Get Your Daemon Token

The daemon token is like a password that proves to IGTP that this daemon belongs to your account.

1. Log in to IGTP at the website
2. Click **"Settings"** in the top navigation bar
3. You'll see a section called **"Daemon Setup"** or you can go to **Settings → My Machines** and click **"Add Machine"**
4. Copy the token that appears — it will look something like **igtp_abc123...**

> **Keep this token private!** Anyone with this token could register a machine under your account. Don't share it.

---

## Step 2: Install on Mac

1. Open a **Terminal** window:
   - Press **Command + Space**, type "Terminal", and press Enter
   - Or open Finder → Applications → Utilities → Terminal

2. Copy and paste this command into Terminal and press Enter:

    curl -fsSL https://igtp.vercel.app/install.sh | sh

3. The installer will ask for your **daemon token** — paste it in and press Enter
4. It will ask for a **machine name** — type something like "Home Desktop" or "MacBook Pro" and press Enter
5. The daemon installs and starts automatically

You should see something like:

    IGTP daemon installed
    Machine registered: Home Desktop
    Daemon started

---

## Step 3: Install on Windows

1. Open **PowerShell as Administrator**:
   - Click the Start menu
   - Type "PowerShell"
   - Right-click on "Windows PowerShell" and select **"Run as administrator"**
   - Click **"Yes"** when asked if you want to allow changes

2. Copy and paste this command and press Enter:

    irm https://igtp.vercel.app/install.ps1 | iex

3. The installer will ask for your **daemon token** — paste it in and press Enter
4. It will ask for a **machine name** — type something like "Gaming PC" and press Enter
5. The daemon installs and registers as a Windows service (it will start automatically when Windows starts)

---

## Step 4: Install on Linux

1. Open a **Terminal** window
2. Run:

    curl -fsSL https://igtp.vercel.app/install.sh | sh

3. Enter your daemon token and machine name when prompted
4. The daemon will be installed as a systemd service

---

## Step 5: Verify It Worked

After installation, go back to IGTP in your browser:

1. Click **"My Machines"** in the navigation bar
2. You should see your machine listed with a **green "Online"** badge
3. If you have models in Ollama, you'll see them listed under your machine

> **Seeing "Offline" instead?** See the Troubleshooting section for help.`,
  },
  {
    id: 'manage-daemon',
    category: 'Sharing Your Machine',
    title: 'How to manage the daemon (start, stop, status, logs)',
    content: `# How to manage the daemon

Once the IGTP daemon is installed, you can control it from your Terminal or PowerShell at any time.

## Opening a Terminal or PowerShell

**Mac:** Press Command + Space, type "Terminal", press Enter.

**Windows:** Press the Windows key, type "PowerShell", press Enter.

**Linux:** Press Ctrl + Alt + T, or search for "Terminal."

---

## Check Status

To see if the daemon is running, type this and press Enter:

    igtp status

You'll see something like:

    Status: Running
    Machine: Home Desktop
    Connected: Yes
    Models available: 3

---

## Stop the Daemon

If you want to make your machine appear offline (for example, when you're gaming or doing something intensive):

    igtp stop

Your machine will show as **"Offline"** in IGTP. Friends won't be able to send new jobs to it.

---

## Start the Daemon

To bring your machine back online:

    igtp start

Your machine will show as **"Online"** again within a few seconds.

---

## View Logs

Logs show you what's happening with the daemon — what jobs ran, any errors, etc.

    igtp logs

To see the last 50 log entries:

    igtp logs --tail 50

Logs look like:

    2024-01-15 10:23:45  INFO  Job received: job_abc123
    2024-01-15 10:23:45  INFO  Forwarding to Ollama (model: llama3)
    2024-01-15 10:23:52  INFO  Job complete: 312 tokens generated

---

## Restart the Daemon

If the daemon seems stuck or isn't responding:

    igtp restart

---

## Does It Start Automatically?

**Mac and Linux:** Yes, the daemon is set up as a background service that starts when you log in.

**Windows:** Yes, it runs as a Windows service that starts with Windows.

To disable auto-start (if you only want to run it manually):

    igtp disable-autostart

To re-enable auto-start:

    igtp enable-autostart`,
  },
  {
    id: 'approve-access-requests',
    category: 'Sharing Your Machine',
    title: 'How to approve access requests',
    content: `# How to approve access requests

When a friend wants to use your machine, they send an **access request**. You need to approve it before they can connect.

## Getting Notified

When someone sends you a request, you'll see:

1. A **red number badge** on the bell icon in the top navigation bar
2. A notification in the **Notifications** page

## How to Approve or Deny

### Option 1: From the Notification Bell

1. Click the **bell icon** in the top right of the navigation bar
2. You'll see a list of notifications
3. Find the notification that says "[Friend's name] has requested access to [Your Machine Name]"
4. Click **"View Request"** on that notification

### Option 2: From the Network Page

1. Click **"Network"** in the top navigation bar
2. Look for the **"Incoming Requests"** section
3. You'll see cards for each pending request, showing who is requesting access and to which machine

### Approving the Request

On the request card, you'll see two buttons:

- **Green "Approve" button** — Click this to allow access. The friend will be notified and can start using your machine right away.
- **Red "Deny" button** — Click this to decline. The friend won't be able to use your machine.

> **You can also add a note** in the text box before approving or denying — for example, "Approved! Let me know if you have any issues."

## Managing Existing Access

To see who currently has access to your machines:

1. Click **"My Machines"** in the navigation bar
2. Click on a machine name to see its details
3. You'll see a list of users who have access

To **revoke access** from someone, click the **"Revoke"** button next to their name. They'll see your machine as unavailable immediately.`,
  },
  {
    id: 'what-happens-when-someone-uses-my-machine',
    category: 'Sharing Your Machine',
    title: 'What happens when someone uses my machine?',
    content: `# What happens when someone uses my machine?

Here's exactly what happens behind the scenes when a friend uses your shared machine.

## The Flow, Step by Step

1. **Your friend types a message** in the IGTP chat interface
2. **IGTP sends the request** to its servers
3. **The IGTP daemon on your computer** picks up the request (it's always checking for new work)
4. **Your daemon passes it to Ollama**, which is running on your computer
5. **Ollama generates the response** using your GPU — this is the part that uses your hardware
6. **Your daemon streams the response back** to IGTP's servers
7. **Your friend sees the response** appear in their chat window

## What You'll See

While a job is running, you generally won't notice anything different unless you're watching closely:

- Your GPU usage will go up (you can see this in Task Manager on Windows or Activity Monitor on Mac)
- The IGTP daemon logs will show the job being processed
- On the IGTP website, you can see your machine's **"Active Jobs"** count

## What You WON'T See

- You **cannot** see your friend's conversation content in real time
- You **don't** see who is chatting or what they're saying by default
- Your friend's data is sent through encrypted connections

## Does It Slow Down My Computer?

It depends on your hardware:

- **On a dedicated GPU:** Usually no impact on your regular computer tasks (browsing, documents, etc.). The GPU handles AI work separately.
- **On integrated graphics or shared memory:** You may notice some slowdown.
- **On CPU-only systems:** There could be significant slowdown, which is why a dedicated GPU is recommended.

## Can I Pause It?

Yes, at any time. Just run **igtp stop** in your Terminal. Your machine will appear offline and no new jobs will be sent. Any in-progress job will complete first.

## Usage History

You can see a log of all jobs that ran on your machine by going to **Settings → Jobs** in the IGTP website.`,
  },
  {
    id: 'browse-available-machines',
    category: "Using Someone's Machine",
    title: 'How to browse available machines',
    content: `# How to browse available machines

The **Browse** page shows all machines that people in your trust network have shared with you (or are available to request).

## Getting to Browse

Click **"Browse"** in the top navigation bar. You'll see a list of machine cards.

## What You See on Each Card

Each card shows:

- **Machine name** — The nickname the owner gave it (e.g., "Home Desktop", "Gaming Rig")
- **Owner's name** — Whose machine it is
- **Status badge:**
  - Green **Online** — The daemon is running and ready to accept jobs
  - Red **Offline** — The daemon isn't running (owner may have stopped it)
- **GPU information** — What graphics card the machine has (e.g., "NVIDIA RTX 4090")
- **Available models** — The AI models installed on this machine
- **Access status:**
  - **"Request Access"** — You can ask to use this machine
  - **"Pending"** — You've already requested and are waiting for approval
  - **"Approved"** — You have access and can start chatting

## Filtering Machines

At the top of the Browse page, you can filter by:

- **Status** — Show only online machines
- **Model** — Filter by a specific AI model you want to use

## What If I Don't See Any Machines?

A few reasons why the list might be empty:

1. **You haven't connected with anyone yet** — Go to the Network page to connect with friends first. See "How the trust network works" for details.
2. **Your friends haven't shared their machines** — Not everyone sets up machine sharing. You may need to ask them.
3. **All machines are offline** — Check back later when your friends' computers are on.`,
  },
  {
    id: 'request-access-to-machine',
    category: "Using Someone's Machine",
    title: 'How to request access to a machine',
    content: `# How to request access to a machine

Once you've found a machine you want to use, here's how to request access.

## Step 1: Find the Machine

1. Go to the **Browse** page (click "Browse" in the navigation bar)
2. Find the machine you want to use
3. Make sure it's **Online** (green badge) — if it's offline, you can still request but won't be able to use it until it's back online

## Step 2: Send the Request

1. Click the **"Request Access"** button on the machine card
2. A small dialog box will appear
3. You can optionally add a **message** to the owner — for example: "Hey! Would love to try out your setup." This is a nice touch but not required.
4. Click the **"Send Request"** button

## Step 3: Wait for Approval

After sending the request:

- The machine's owner will receive a notification
- The button on the machine card will now show **"Pending"**
- You'll receive a notification when they approve or deny your request

**Typical wait times:** This depends entirely on when your friend checks the app. It could be a few minutes or a few hours.

## Step 4: You're Approved!

When the owner approves your request:

- You'll see a notification: "[Owner's name] approved your request for [Machine Name]"
- The machine card now shows **"Approved"** or an **"Open Chat"** button
- You can now go to the **Chat** page and start a conversation using that machine

## What If My Request is Denied?

If the owner clicks "Deny," you'll see a notification saying your request was declined. You can try reaching out to them directly to discuss, or look for other machines to request access to.

## How Many Machines Can I Request?

You can request access to as many machines as you like, as long as the owners are in your trust network.`,
  },
  {
    id: 'start-a-conversation',
    category: "Using Someone's Machine",
    title: 'How to start a conversation with an AI model',
    content: `# How to start a conversation with an AI model

Once you have approved access to at least one machine, you can start chatting with AI models.

## Step 1: Go to Chat

Click **"Chat"** in the top navigation bar. You'll see your conversation history (empty at first).

## Step 2: Start a New Conversation

Click the **"New Conversation"** button (usually a "+" button or a prominent button at the top).

A dialog will appear asking you to choose:

1. **Machine** — Select which friend's machine to use from the dropdown
2. **Model** — Select which AI model to use from the list

> **Tip:** The dialog only shows machines where you have **approved access** and the machine is **online**. If a machine you expected to see isn't showing, it may be offline.

## Step 3: Name Your Conversation (Optional)

You can give the conversation a name (like "Brainstorming ideas" or "Python help"). This makes it easier to find later. If you skip this, it'll be named automatically.

Click **"Start Conversation"**.

## Step 4: Chat!

You're now in the chat window.

1. Type your message in the **text box at the bottom** of the screen
2. Press **Enter** or click the **"Send"** button (looks like a paper airplane)
3. You'll see the response appear above, with a loading animation while the AI thinks

## Understanding the Response

- Responses stream in word-by-word in real time — you don't have to wait for the whole thing to appear
- The response may use **formatting** like bold text, code blocks, and lists
- After each response, you can keep the conversation going by typing your next message

## Going Back to Other Conversations

Click the **"Chat"** link in the navigation bar to see all your conversations and switch between them.`,
  },
  {
    id: 'use-different-models',
    category: "Using Someone's Machine",
    title: 'How to use different models',
    content: `# How to use different models

## What is a Model?

An AI **model** is like a different "brain" you can talk to. Each model was trained differently and has different strengths:

- **llama3, llama3.1** — General purpose, great for conversation and writing
- **mistral** — Fast and good at following instructions
- **codellama** — Specialized for programming and code
- **phi3, phi4** — Small but capable, fast responses
- **gemma** — Google's model, good at reasoning

The models available to you depend on what the machine owner has installed.

## Starting a Conversation with a Specific Model

When you click **"New Conversation"**, the dialog shows you a list of available models. Simply select the one you want to try.

## Switching Models Mid-Conversation

Currently, each conversation is tied to the model you chose when you started it. To use a different model:

1. Go back to the **Chat** page
2. Start a **new conversation**
3. Select the different model

> **Why can't I change models in the middle?** The AI model remembers the entire conversation history in its own format. Switching mid-conversation would break that context.

## Which Model Should I Use?

| Task | Recommended Model |
|---|---|
| General conversation | llama3 or mistral |
| Writing and creative tasks | llama3.1 or gemma |
| Coding help | codellama or llama3.1 |
| Quick questions | phi3 or phi4 (faster) |
| Complex reasoning | llama3.1 or larger models |

If you're not sure, start with **llama3** — it's the most balanced general-purpose model.

## Model Sizes

You may see models like **llama3:8b** or **llama3:70b**. The number refers to the model's "size" in billions of parameters:
- **8b** — Smaller, faster, uses less GPU memory, slightly less capable
- **70b** — Larger, slower, needs more GPU memory, more capable

For most everyday tasks, the 8b version is excellent.`,
  },
  {
    id: 'what-are-tokens',
    category: "Using Someone's Machine",
    title: 'What are tokens and why do they matter?',
    content: `# What are tokens and why do they matter?

## What is a Token?

A **token** is the basic unit of text that AI models work with. Think of it as roughly equivalent to a syllable or a short word.

For example, the sentence *"Hello, how are you?"* is approximately 5 tokens.

Token counts are important because:
1. **They measure usage** — AI models count how much text they process in tokens
2. **They affect speed** — More tokens = longer processing time
3. **They show how much compute is being used** on the machine owner's GPU

## Two Types of Tokens

| Type | What it is | Example |
|---|---|---|
| **Input tokens** | The text you send (your question + conversation history) | Your message + previous messages |
| **Output tokens** | The text the AI generates (its response) | The AI's answer |

## Where to See Token Counts

In the chat window, after each response you'll see a small token count showing how many tokens were used for that exchange.

In **Settings → Jobs**, you can see a detailed breakdown of token usage across all your conversations.

## Why Does the Machine Owner Care?

If you're using someone else's GPU, the token count tells both of you how much work your computer is doing. It's a measure of "compute used."

Currently, IGTP is a trust-based, free-to-use platform among friends — there's no per-token billing between users. But the token count helps machine owners understand their usage and make sure it's reasonable.

## Context Window

There's also a limit called the **context window** — the maximum number of tokens a model can "hold in memory" during a conversation. Most models support 8,000–128,000 tokens of context.

If a conversation gets very long, older messages may be dropped from the model's memory to stay within this limit. The app handles this automatically, but be aware that very long conversations may "forget" early messages.`,
  },
  {
    id: 'how-to-start-new-conversation',
    category: 'Chat',
    title: 'How to start a new conversation',
    content: `# How to start a new conversation

## Getting to the Chat Page

Click **"Chat"** in the top navigation bar.

## Starting Fresh

1. Click the **"New Conversation"** button at the top of the conversations list
2. Choose a **machine** from the dropdown — this is the friend's computer you'll use
3. Choose a **model** — the AI brain you want to talk to
4. Optionally, type a name for this conversation so you can find it later
5. Click **"Start Conversation"**

You'll be taken directly into the new conversation, ready to type.

## What If No Machines Are Available?

The dropdown will be empty if:
- You haven't been approved for any machines yet (see "How to request access to a machine")
- All approved machines are currently offline (the owner turned off their daemon)

In this case, try requesting access to a friend's machine or check back when their machine is online.

## Tips for Your First Message

The AI model doesn't know who you are or why you're messaging. Give it context in your first message:

**Instead of:** "Help me."
**Try:** "I'm writing a short story about a detective in 1920s Paris. Help me brainstorm some plot ideas."

**Instead of:** "Explain this."
**Try:** "Can you explain what a REST API is in simple terms? I'm a beginner at programming."

## Continuing an Existing Conversation

Click on any conversation in the list on the Chat page to continue it. All previous messages will be there, and the AI will remember the context.`,
  },
  {
    id: 'how-conversations-remember-context',
    category: 'Chat',
    title: 'How conversations remember context',
    content: `# How conversations remember context

## The AI Remembers Everything in the Current Conversation

Within a single conversation, the AI can see and remember everything you've discussed. So you can:

- Refer back to things you mentioned earlier: "Going back to that point about the plot..."
- Build on previous answers: "Now make it funnier"
- Use pronouns naturally: "Tell me more about it"

This is called **conversation history** or **context**.

## How It Actually Works (Simply Explained)

Every time you send a message, IGTP sends the AI model:
1. **Your entire conversation history** (all previous messages)
2. **Your new message**

The model reads all of it and writes a response that fits the whole conversation. It doesn't have a "memory" like a human — it re-reads the whole conversation each time.

## The Context Window Limit

There's a limit to how much history can be sent at once. This limit is called the **context window**. Think of it like a notepad — there's only so much that fits.

- Most models support **8,000–32,000 tokens** of context
- Larger models support up to **128,000 tokens**
- When the conversation gets too long, older messages get dropped to make room

IGTP handles this automatically. You might notice the AI seems to "forget" something you said very early in a very long conversation — this is why.

## Conversations Don't Carry Over

Each conversation starts completely fresh. If you start a **New Conversation**, the AI has no idea what you discussed in your previous conversations. It only knows what's in the current conversation window.

## Tips for Managing Context

- **Be explicit when switching topics** — say "I want to switch topics now and ask about..."
- **For coding sessions** — paste the relevant code snippet again if you've been chatting for a long time
- **Start a new conversation** when you genuinely want a completely fresh start (different project, different topic)`,
  },
  {
    id: 'manage-conversations',
    category: 'Chat',
    title: 'How to manage your conversations',
    content: `# How to manage your conversations

## Viewing All Your Conversations

Click **"Chat"** in the navigation bar. You'll see a list of all your conversations, ordered by most recent activity.

Each conversation shows:
- The name you gave it (or an auto-generated name)
- The machine and model used
- When it was last active

## Renaming a Conversation

To rename a conversation:
1. Click on the conversation to open it
2. Click the conversation name at the top of the chat
3. Type a new name and press Enter

Keeping conversations named clearly helps you find them later.

## Deleting a Conversation

If you want to remove a conversation:
1. On the Chat page, find the conversation in the list
2. Click the **three-dot menu** or the **trash icon** next to the conversation
3. Confirm the deletion when prompted

> **Warning:** Deleted conversations cannot be recovered. All messages in that conversation will be permanently gone.

## Is There a Limit on Conversations?

There's no hard limit on how many conversations you can have. However, very old or inactive conversations might eventually be cleaned up. It's good practice to delete conversations you no longer need.

## Searching Conversations

Currently, conversation search isn't available. The best way to find past conversations is to give them descriptive names when you create them.

## What Happens If the Machine Goes Offline?

If a machine goes offline while you're mid-conversation:
- Messages you've already sent and received are still there
- You can't send new messages until the machine comes back online
- The conversation stays saved — you can resume it when the machine is back`,
  },
  {
    id: 'tips-for-better-responses',
    category: 'Chat',
    title: 'Tips for getting better responses',
    content: `# Tips for getting better responses

## Be Specific

The more context you give, the better the response.

**Weak:** "Write me something."

**Strong:** "Write a 3-paragraph email to my boss explaining that I'll be late to work tomorrow due to a car issue. Keep it professional but not overly formal."

## Give the AI a Role

You can tell the AI to act as a specific type of expert:

"You are an experienced Python developer. Help me debug this code."

"Pretend you're a personal chef. Suggest a dinner recipe using chicken, peppers, and rice."

## Ask for the Format You Want

Tell the AI exactly how you want the answer:

- "Give me a bulleted list."
- "Explain this in 3 simple steps."
- "Give me a table comparing X, Y, and Z."
- "Keep it under 100 words."

## Tell It What You Already Know

"I understand the basics of HTML but I'm confused about how CSS flexbox works."

This prevents over-explaining things you already know and skipping things you need.

## Use Follow-Up Messages

If the first response isn't quite right, don't start over — just give feedback:

- "That's good, but make it shorter."
- "Can you use simpler language?"
- "Add more examples."
- "Focus on the third point you mentioned."

## Paste the Relevant Text

If you're asking about a document, code, or article, paste the relevant portion directly into the chat. The AI can't access the internet or your files — it only knows what's in the conversation.

## Ask It to Think Step by Step

For complex questions, asking "think step by step" or "show your reasoning" often gets more accurate answers:

"Calculate the most efficient route. Think step by step."

"Debug this code. Walk me through your reasoning."

## Common Patterns That Work Well

| Task | Approach |
|---|---|
| Editing your writing | Paste your text + "improve the clarity of this" |
| Coding help | Paste your code + describe the error or what you want |
| Learning a concept | "Explain X as if I'm 12 years old" |
| Decision making | "List the pros and cons of X vs Y" |
| Brainstorming | "Give me 10 ideas for X" |`,
  },
  {
    id: 'what-is-the-api',
    category: 'API Access',
    title: 'What is the API?',
    content: `# What is the API?

## Simple Explanation

An **API** (Application Programming Interface) is a way for programs to talk to each other. Instead of using the IGTP website to chat with AI models, you can write code that does the same thing automatically.

Think of it like this: The IGTP website is a restaurant where you order food through a waiter. The API is a private back entrance where programs can order food directly from the kitchen.

## Who Needs the API?

The API is for **developers** — people who write code and want to integrate IGTP's AI capabilities into their own applications, scripts, or automation workflows.

For example:
- Build your own custom chatbot interface
- Automate summarizing emails or documents
- Add AI features to a personal project
- Write scripts that process text automatically

**If you just want to chat with AI models**, you don't need the API — just use the Chat page on the website.

## What Can the API Do?

| Capability | What it does |
|---|---|
| **Chat completion** | Send a conversation and get an AI response |
| **Embeddings** | Convert text into numbers (useful for search and similarity) |
| **Job status** | Check whether an asynchronous job is done |

## How Does IGTP's API Work?

IGTP's API routes your requests through to the machines your friends are sharing. You still need:
- An IGTP account
- An approved connection to at least one machine
- An API key (see "How to generate an API key")

The API follows the same rules as the website — you can only use machines you have approved access to.`,
  },
  {
    id: 'how-to-generate-api-key',
    category: 'API Access',
    title: 'How to generate an API key',
    content: `# How to generate an API key

An **API key** is like a special password that your programs use to identify themselves to IGTP. Instead of using your email and password, your code uses the API key.

## Step 1: Go to Settings

Click **"Settings"** in the top navigation bar.

## Step 2: Navigate to API Keys

Click **"API Keys"** in the Settings menu. You'll see the API Keys management page.

## Step 3: Create a New Key

1. Click the **"Generate New Key"** button
2. Give your key a descriptive name — for example, "My Python script" or "Home automation"
3. Click **"Create"**
4. Your new API key will appear on screen — it will start with **igtp_sk_** followed by a long string of characters

## Step 4: Copy and Save Your Key

> **Important:** This is the **only time** you'll see the full key. Copy it immediately and save it somewhere safe, like a password manager.

If you lose it, you'll need to delete it and generate a new one.

## Using Your API Key

In your code or API client, you'll include the key in the request headers:

    Authorization: Bearer igtp_sk_your_key_here

## Managing Your Keys

On the API Keys page, you can:
- See all your existing keys (the full value is hidden after creation — only the first/last few characters are shown)
- Delete keys you no longer need
- Generate new keys at any time

## Security Tips

- **Never share your API key publicly** — don't put it in code you share on GitHub
- **Don't hardcode it** in your code — use environment variables instead
- **Create separate keys** for different projects so you can revoke one without affecting others
- **Delete keys** you no longer use`,
  },
  {
    id: 'api-chat-request',
    category: 'API Access',
    title: 'How to send a chat request via API',
    content: `# How to send a chat request via API

This guide shows you how to send a chat message to an AI model through the IGTP API.

## Before You Start

Make sure you have:
- An IGTP API key (see "How to generate an API key")
- The ID of a machine you have access to
- A model name available on that machine

**Finding your machine ID:** Go to My Machines, click a machine, and the ID is in the URL (looks like **mch_abc123**).

## Chat Endpoint

    POST /api/ollama/chat

## Request Format

Send a JSON body with these fields:

    {
      "machineId": "mch_abc123",
      "model": "llama3",
      "messages": [
        {
          "role": "user",
          "content": "What is the capital of France?"
        }
      ]
    }

## Example Using curl on Mac or Linux

Open a Terminal and run:

    curl -X POST https://igtp.vercel.app/api/ollama/chat \\
      -H "Authorization: Bearer igtp_sk_your_key_here" \\
      -H "Content-Type: application/json" \\
      -d '{"machineId":"mch_abc123","model":"llama3","messages":[{"role":"user","content":"What is the capital of France?"}]}'

## Response

The API returns a job ID immediately (the request is processed asynchronously):

    {
      "jobId": "job_xyz789",
      "status": "queued"
    }

Then use the job ID to check for the result (see "How to check job results").

## Multi-Turn Conversations

To maintain conversation history, include all previous messages:

    {
      "machineId": "mch_abc123",
      "model": "llama3",
      "messages": [
        {"role": "user", "content": "My name is Alice."},
        {"role": "assistant", "content": "Hi Alice! How can I help you?"},
        {"role": "user", "content": "What is my name?"}
      ]
    }`,
  },
  {
    id: 'api-embedding-request',
    category: 'API Access',
    title: 'How to send an embedding request via API',
    content: `# How to send an embedding request via API

## What is an Embedding?

An **embedding** is a way to convert text into a list of numbers (a vector) that captures the meaning of the text. These numbers are useful for:

- **Semantic search** — Finding documents that are similar in meaning, not just keywords
- **Clustering** — Grouping similar pieces of text together
- **Building recommendation systems** — "If you like this, you might like that"

This is more of a developer/data science use case. If you just want to chat, you don't need embeddings.

## Embedding Endpoint

    POST /api/ollama/embed

## Request Format

    {
      "machineId": "mch_abc123",
      "model": "nomic-embed-text",
      "input": "The quick brown fox jumps over the lazy dog"
    }

> **Note:** Use an embedding-specific model like **nomic-embed-text** or **mxbai-embed-large**, not a chat model like llama3. Ask the machine owner what embedding models they have installed.

## Example Using curl

    curl -X POST https://igtp.vercel.app/api/ollama/embed \\
      -H "Authorization: Bearer igtp_sk_your_key_here" \\
      -H "Content-Type: application/json" \\
      -d '{"machineId":"mch_abc123","model":"nomic-embed-text","input":"The quick brown fox"}'

## Response

Like chat requests, embedding requests are processed asynchronously:

    {
      "jobId": "job_emb456",
      "status": "queued"
    }

Poll for the result using the job ID (see "How to check job results"). The final result will contain a vector of floating-point numbers representing the embedding.

## Batch Embeddings

To embed multiple texts at once, you can send an array:

    {
      "machineId": "mch_abc123",
      "model": "nomic-embed-text",
      "input": [
        "First document text here",
        "Second document text here",
        "Third document text here"
      ]
    }`,
  },
  {
    id: 'api-check-job-results',
    category: 'API Access',
    title: 'How to check job results',
    content: `# How to check job results

IGTP processes AI requests **asynchronously** — meaning when you send a chat or embedding request, you get a job ID back immediately, and then you check back for the result.

Think of it like placing an order at a counter: you get a ticket number right away, then you wait and check back when your order is ready.

## Job Status Endpoint

    GET /api/jobs/{jobId}

## Example: Checking a Job

    curl -X GET https://igtp.vercel.app/api/jobs/job_xyz789 \\
      -H "Authorization: Bearer igtp_sk_your_key_here"

## Response: Job in Progress

If the job is still running:

    {
      "id": "job_xyz789",
      "status": "running",
      "createdAt": "2024-01-15T10:23:45Z"
    }

## Response: Job Complete

When the job finishes:

    {
      "id": "job_xyz789",
      "status": "completed",
      "result": {
        "message": {
          "role": "assistant",
          "content": "The capital of France is Paris."
        },
        "usage": {
          "promptTokens": 12,
          "completionTokens": 8,
          "totalTokens": 20
        }
      },
      "completedAt": "2024-01-15T10:23:52Z"
    }

## Response: Job Failed

If something went wrong:

    {
      "id": "job_xyz789",
      "status": "failed",
      "error": "Machine went offline during processing"
    }

## Polling Pattern (Check Every Few Seconds)

Your code should check the job status repeatedly until it completes. Here's the general idea:

1. Send your chat or embed request → get a job ID
2. Wait 2 seconds
3. Check the job status
4. If it's "completed" or "failed" — you're done
5. If it's still "queued" or "running" — wait 2 seconds and check again

## Job Status Values

| Status | Meaning |
|---|---|
| queued | Waiting to be picked up by the daemon |
| running | Currently being processed |
| completed | Done, result is available |
| failed | Something went wrong |`,
  },
  {
    id: 'how-trust-network-works',
    category: 'Trust Network',
    title: 'How the trust network works',
    content: `# How the trust network works

## The Big Idea

IGTP is built around a **trust network** — a private circle of people you trust. Unlike a public AI service, you only interact with people you've explicitly connected with.

Think of it like a neighborhood where everyone knows each other, rather than a city where strangers can walk up to anyone.

## What the Trust Network Controls

- **Whose machines appear in your Browse page** — you only see machines owned by people in your network
- **Who can request access to your machines** — only people in your network can ask
- **Who you can invite to IGTP** — you invite specific people by email

## Two Levels of Connection

| Level | What it means |
|---|---|
| **Network connection** | You're connected as "friends" — you can see each other's machines and send/receive access requests |
| **Machine access** | A network connection PLUS explicit approval to use a specific machine |

Being in someone's network doesn't automatically give you access to their machines. The machine owner still needs to approve each request individually.

## How It Gets Built

1. You start with just yourself — an empty network
2. Someone who's already on IGTP invites you to join (that's how you got here)
3. You automatically become connected to the person who invited you
4. You can then send friend requests to other IGTP users you know
5. As you accept friend requests and send your own, your network grows

## Mutual Trust

Connections are **two-way** — both people need to agree. If Alice sends a friend request to Bob, Bob needs to accept before they're connected. This ensures neither party is surprised.

## Your Network is Private

Your network list is not public. Nobody outside IGTP can see who is in your trust network.`,
  },
  {
    id: 'how-to-send-friend-request',
    category: 'Trust Network',
    title: 'How to send a friend request',
    content: `# How to send a friend request

## Step 1: Go to Network

Click **"Network"** in the top navigation bar.

## Step 2: Find the "Add Connection" Section

On the Network page, look for a section called **"Add to Network"** or **"Find People"**. It has a search field.

## Step 3: Search for the Person

Type their name or email address in the search box. Results will show people on IGTP who match your search and who are not yet in your network.

> **Privacy note:** You can only find people who have their account set to "discoverable." If your friend isn't showing up, they may need to enable discoverability in their Settings.

## Step 4: Send the Request

1. Find the person in the search results
2. Click the **"Add to Network"** or **"Send Friend Request"** button next to their name
3. Optionally add a short message: "Hey, it's [your name] from [how you know them]!"
4. Click **"Send"**

The person will receive a notification that you've sent them a friend request.

## What Happens Next?

- Your request shows as **"Pending"** until they respond
- If they accept, you'll receive a notification and they'll appear in your network
- If they decline or ignore it, nothing changes

## Inviting Someone Not Yet on IGTP

If the person you want to connect with isn't on IGTP yet, you can **invite them by email**. See "How to invite someone who isn't on IGTP yet." `,
  },
  {
    id: 'how-to-accept-friend-requests',
    category: 'Trust Network',
    title: 'How to accept or deny friend requests',
    content: `# How to accept or deny friend requests

When someone sends you a friend request, you have full control over whether to accept or decline it.

## Getting Notified

You'll know you have a pending friend request when:
1. You see a **red number badge** on the bell icon in the navigation bar
2. You check the **Notifications** page and see "Someone sent you a friend request"

## How to Respond

### Option 1: From Notifications

1. Click the **bell icon** in the navigation bar
2. Find the friend request notification
3. Click **"View Request"**

### Option 2: From the Network Page

1. Click **"Network"** in the navigation bar
2. Look for the **"Friend Requests"** or **"Incoming Requests"** section
3. You'll see cards showing each pending request with the person's name

### Accepting

1. Click the **green "Accept"** button on the request card
2. That person is now added to your trust network
3. They'll receive a notification that you accepted
4. You can now see each other's shared machines in Browse

### Declining

1. Click the **red "Decline"** or **"Ignore"** button
2. The request is removed
3. The other person won't receive a notification that you declined (to avoid awkwardness)
4. They won't be able to see your machines

## What if I Don't Recognize the Person?

If you receive a request from someone you don't know, it's perfectly fine to decline. Only connect with people you actually trust — that's the whole point of the trust network.

If it seems like spam or misuse, you can also report it by clicking the **three-dot menu** on the request card and selecting **"Report."** `,
  },
  {
    id: 'how-to-remove-from-network',
    category: 'Trust Network',
    title: 'How to remove someone from your network',
    content: `# How to remove someone from your network

If you want to disconnect from someone in your trust network, here's how to do it.

## Step 1: Go to Network

Click **"Network"** in the top navigation bar.

## Step 2: Find the Person

In your connections list, find the person you want to remove.

## Step 3: Remove the Connection

1. Click on their name or the **three-dot menu** next to their name
2. Select **"Remove from Network"** or **"Disconnect"**
3. Confirm when prompted — a dialog will ask "Are you sure?"
4. Click the **"Remove"** button to confirm

## What Happens When You Remove Someone

When you remove someone from your network:

- They can no longer see your machines in Browse
- Any pending access requests between you are cancelled
- Any active machine access they had is **immediately revoked**
- You no longer appear in each other's network lists
- They can no longer send you friend requests (unless you re-add them)

**Ongoing conversations** they started before being removed may be interrupted.

## Will They Be Notified?

They won't receive an explicit "You've been removed" notification. However, they'll notice that your machines no longer appear in their Browse page.

## Can They Add Me Back?

Not directly — you would need to send them a new friend request if you want to reconnect. The connection is fully broken.

## Removing Access Without Removing From Network

If you just want to **revoke machine access** without completely disconnecting from someone, you can do that separately:

1. Go to **My Machines**
2. Click on the machine
3. Find the person in the access list
4. Click **"Revoke Access"** next to their name

This removes their machine access while keeping them in your network.`,
  },
  {
    id: 'how-to-invite-someone',
    category: 'Trust Network',
    title: "How to invite someone who isn\\'t on IGTP yet",
    content: `# How to invite someone who isn't on IGTP yet

IGTP is invitation-only. If you want to bring a friend onto the platform, you can invite them by email.

## Step 1: Go to Settings → Invites

1. Click **"Settings"** in the navigation bar
2. Look for **"Invites"** or **"Invite a Friend"** section

Or go directly to: **Settings → Invites**

## Step 2: Enter Their Email

1. Type your friend's email address in the **"Email"** field
2. Optionally add a personal message — something like "Hey, I've been using this cool AI sharing platform, join me!"
3. Click the **"Send Invite"** button

## Step 3: Your Friend Gets an Email

Your friend will receive an email from IGTP with a link to create their account. The email will show that the invite came from you.

> **The invite link expires in 7 days.** If your friend doesn't sign up in time, you can send them a new invite.

## After They Sign Up

Once your friend creates their account through your invite:
- You'll receive a notification that they joined
- You'll **automatically** be connected in each other's trust network (no separate friend request needed!)
- They'll appear in your Network page

## How Many Invites Do I Have?

You can see how many invites you have remaining on the Invites page. The number may be limited to prevent spam. If you've run out, contact the IGTP team.

## Tracking Your Invites

On the Invites page, you can see:
- **Pending invites** — Sent but not yet accepted
- **Accepted invites** — Friends who have joined
- **Expired invites** — Links that expired before the person signed up

You can resend an invite to an expired invitation by clicking **"Resend"** next to it.`,
  },
  {
    id: 'managing-api-keys',
    category: 'Settings',
    title: 'Managing your API keys',
    content: `# Managing your API keys

API keys allow your programs and scripts to access IGTP without using your password. Here's how to manage them.

## Getting to API Keys

1. Click **"Settings"** in the navigation bar
2. Click **"API Keys"**

## Creating a New Key

1. Click **"Generate New Key"**
2. Enter a **name** that describes what the key is for (e.g., "Python chatbot", "Personal scripts")
3. Click **"Create"**
4. **Copy the key immediately** — it won't be shown again in full

The key starts with **igtp_sk_** followed by a long string of characters.

## Viewing Your Keys

On the API Keys page, you'll see a table showing:
- **Name** — What you called the key
- **Preview** — The first and last few characters
- **Created** — When you created it
- **Last used** — When the key was last used to make an API call

The full key value is hidden after creation to keep it secure.

## Deleting a Key

If a key is no longer needed or you think it may have been compromised:

1. Find the key in the list
2. Click the **"Delete"** or trash icon button next to it
3. Confirm the deletion

> **Important:** Deleting a key immediately invalidates it. Any programs using that key will stop working. Make sure to update those programs with a new key first.

## Best Practices

- Create one key per project or use-case
- Name keys clearly so you remember what uses them
- Delete keys you no longer use
- If you accidentally expose a key (e.g., commit it to GitHub), delete it and create a new one immediately
- Store keys in environment variables in your code, never in the code itself`,
  },
  {
    id: 'viewing-job-history',
    category: 'Settings',
    title: 'Viewing your job history',
    content: `# Viewing your job history

**Jobs** are the records of AI requests — each time you (or your API key) sends a chat or embedding request, it creates a job record.

## Getting to Job History

1. Click **"Settings"** in the navigation bar
2. Click **"Jobs"**

## What You'll See

The Jobs page shows a table with all your past jobs, ordered by most recent:

| Column | What it shows |
|---|---|
| **Type** | Chat or Embedding |
| **Model** | Which AI model was used |
| **Machine** | Which machine processed the job |
| **Status** | Completed, Failed, Running, or Queued |
| **Tokens** | How many tokens were used |
| **Created** | When the job was created |
| **Duration** | How long it took to complete |

## Filtering Jobs

You can filter the list by:
- **Status** — Show only failed jobs, or only completed ones
- **Date range** — See jobs from a specific time period
- **Machine** — Filter by which machine processed the jobs

## Why Look at Job History?

The job history is useful for:

- **Debugging API issues** — If your program isn't getting results, check whether the job was created and what status it has
- **Usage tracking** — Understand how many tokens you're consuming
- **Troubleshooting** — Find failed jobs and see what error occurred

## Understanding Failed Jobs

If a job shows **"Failed"**, click on it to see the error details. Common reasons for failure:
- The machine went offline mid-processing
- The model ran out of memory
- The request timed out
- Invalid request format (for API users)`,
  },
  {
    id: 'viewing-access-requests',
    category: 'Settings',
    title: 'Viewing your access requests',
    content: `# Viewing your access requests

You can view all access requests — both ones you've sent to others and ones you need to respond to.

## Your Outgoing Requests

To see access requests you've sent:

1. Click **"Settings"** in the navigation bar
2. Click **"My Requests"** (or go directly to the **Requests** page)

You'll see a list of all access requests you've sent, showing:
- **Machine name** — Which machine you requested access to
- **Machine owner** — Who owns the machine
- **Status:** Pending, Approved, or Denied
- **Date** — When you sent the request

## Incoming Requests (Requests for Your Machines)

To see who has requested access to **your machines**:

1. Click **"Network"** in the navigation bar
2. Look for the **"Access Requests"** section

Or, check your **Notifications** — incoming access requests trigger a notification.

## Request Statuses Explained

| Status | What it means |
|---|---|
| **Pending** | You sent the request, waiting for approval |
| **Approved** | Access granted — you can use this machine |
| **Denied** | The owner declined your request |
| **Revoked** | Access was removed after being approved |

## What if My Request Has Been Pending for a Long Time?

There's no automatic reminder system. If your request has been pending for a while:

1. Check your trust network — make sure you're still connected to the machine owner
2. Try reaching out to the owner directly through another channel
3. Some owners may not check the app frequently

## Cancelling a Pending Request

If you no longer want access to a machine, you can cancel your pending request:

1. Go to the **Requests** page
2. Find the pending request
3. Click **"Cancel Request"** `,
  },
  {
    id: 'daemon-wont-start',
    category: 'Troubleshooting',
    title: "The daemon won\\'t start",
    content: `# The daemon won't start

If you run **igtp start** and the daemon doesn't come online, here's how to diagnose and fix it.

## Step 1: Check if Ollama is Running

The IGTP daemon requires Ollama to be running first.

**Mac:** Look for the llama icon in your menu bar (top-right of screen). If it's not there, open Ollama from your Applications folder.

**Windows:** Look for the llama icon in your system tray (bottom-right, near the clock). If it's not there, open Ollama from the Start menu.

**Linux:** Open a Terminal and run:

    systemctl status ollama

If it's not running, start it:

    sudo systemctl start ollama

## Step 2: Check the Error Message

Run the daemon manually to see error output:

    igtp start

Read the error message carefully. Common errors and what they mean:

| Error | Cause | Fix |
|---|---|---|
| Cannot connect to Ollama | Ollama isn't running | Start Ollama first |
| Invalid token | Your daemon token is wrong | Re-run the installer with the correct token |
| Machine not found | Machine was deleted from IGTP | Re-register via installer |
| Connection refused | Network/firewall blocking | See Step 3 |
| Port in use | Another process using the port | Restart your computer |

## Step 3: Check Your Internet Connection

The daemon needs internet to connect to IGTP's servers. Make sure you can access other websites. If you're on a corporate or school network, a firewall may be blocking the connection.

## Step 4: Check the Logs

    igtp logs --tail 50

The logs may show more detailed error information.

## Step 5: Reinstall the Daemon

If nothing else works, try a clean reinstall:

    igtp uninstall

Then follow the installation instructions again (see "How to install the IGTP daemon").`,
  },
  {
    id: 'igtp-command-not-found',
    category: 'Troubleshooting',
    title: '"igtp" command not found',
    content: `# "igtp" command not found

If you open Terminal or PowerShell and type **igtp** but see an error like "command not found" or "is not recognized," here's what to do.

## What This Means

The **igtp** command isn't in your system's search path, which means either:
1. The daemon was never installed, or
2. The installation didn't complete correctly, or
3. Your terminal doesn't know where to find the command

## Mac or Linux Fix

### Check if it's installed

Open a Terminal and run:

    which igtp

If this returns nothing, the daemon isn't installed. Skip to Reinstall below.

### Fix the Path

If it IS installed but not found, you may need to update your PATH. Run these two commands:

    echo 'export PATH="$PATH:/usr/local/bin"' >> ~/.zshrc
    source ~/.zshrc

Then try **igtp status** again.

### Reinstall

    curl -fsSL https://igtp.vercel.app/install.sh | sh

Follow the prompts. The installer will add **igtp** to your PATH automatically.

---

## Windows Fix

### Open a New PowerShell Window

Sometimes the PATH update from installation doesn't take effect in your current window. Close PowerShell and open a new one, then try again.

### Check if It's Installed

In PowerShell, run:

    Get-Command igtp -ErrorAction SilentlyContinue

If nothing appears, reinstall.

### Reinstall

Open PowerShell **as Administrator** (right-click → Run as administrator) and run:

    irm https://igtp.vercel.app/install.ps1 | iex

---

## Still Not Working?

Try restarting your computer after installation. This ensures all PATH changes take effect across all applications.`,
  },
  {
    id: 'machine-shows-offline',
    category: 'Troubleshooting',
    title: 'My machine shows as offline',
    content: `# My machine shows as offline

Your machine shows as **"Offline"** in IGTP even though you think the daemon is running. Here's how to fix it.

## Step 1: Confirm the Daemon is Actually Running

Open a Terminal or PowerShell and run:

    igtp status

- If it says **"Running"**, the daemon is running but not connecting (see Step 3)
- If it says **"Stopped"** or shows an error, start it with:

    igtp start

## Step 2: Wait a Moment

After starting the daemon, it can take **10–30 seconds** for IGTP to update your machine's status. Refresh the page in your browser and check again.

## Step 3: Check Your Internet Connection

The daemon connects to IGTP's servers over the internet. Make sure:
- You can browse other websites normally
- You're not on a VPN that might block the connection
- Your Wi-Fi or ethernet is working

## Step 4: Check Ollama

The daemon reports as offline if Ollama isn't running (because there's nothing to serve).

**Mac:** Check for the llama icon in your menu bar.
**Windows:** Check for the llama icon in your system tray.

If Ollama isn't running, start it, then restart the daemon:

    igtp restart

## Step 5: Check Firewall Settings

Some firewalls block outbound connections from unknown programs.

**Mac:** Go to System Settings → Network → Firewall → Firewall Options. Make sure **igtp** is allowed.

**Windows:** Go to Settings → Windows Security → Firewall → Allow an app through firewall. Add igtp if needed.

## Step 6: Check the Logs

    igtp logs --tail 30

Look for error messages about connections or authentication.

## Step 7: Re-register the Machine

If the machine was deleted from IGTP and re-added, the daemon may have an outdated registration. Reinstall the daemon with a fresh token from Settings.`,
  },
  {
    id: 'cant-see-any-models',
    category: 'Troubleshooting',
    title: "I can\\'t see any models",
    content: `# I can't see any models

If you go to Browse or try to start a new conversation and see no models available, here's what might be happening.

## If You're the Machine Owner

### Check That Ollama Has Models Installed

In a Terminal or PowerShell, run:

    ollama list

You should see a table of installed models. If it's empty, you need to download a model:

    ollama pull llama3

Wait for the download to complete (it may be several gigabytes).

### Restart the Daemon After Adding Models

After installing new models, the daemon needs to sync. Run:

    igtp restart

Wait 30 seconds, then check your machine in IGTP — the models should now appear.

### Check the Daemon Status

    igtp status

The daemon needs to be running for models to show up in IGTP.

---

## If You're Trying to Use Someone Else's Machine

### Check Your Access

Make sure you actually have **approved access** to the machine:

1. Go to **Browse**
2. Does the machine show "Approved" or just "Request Access"?
3. If it shows "Request Access," you haven't been approved yet

### Check the Machine Status

If the machine shows **"Offline"**, the owner's daemon isn't running. You won't be able to see or use models until they bring it back online.

### Ask the Owner

If the machine is online and you have approved access but still see no models, contact the machine owner. They may have removed all their models or Ollama may not be running correctly on their end.`,
  },
  {
    id: 'job-stuck-on-queued',
    category: 'Troubleshooting',
    title: 'A job is stuck on "queued"',
    content: `# A job is stuck on "queued"

If you send a chat message and it stays in the "queued" state for more than a minute or two without progressing, here's what to check.

## What "Queued" Means

When a job is **queued**, it means IGTP has received your request but the machine's daemon hasn't picked it up yet.

## Common Causes

### 1. The Machine Went Offline

The most common cause. The machine you're trying to use went offline between when you requested access and now.

**Check:** Go to Browse. Is the machine still showing as "Online"? If it's offline, the job will stay queued until the machine comes back online.

**What to do:**
- Wait for the machine to come back online, OR
- Start a new conversation using a different machine

### 2. The Daemon is Overloaded

If the machine is processing many jobs simultaneously, yours may be waiting in line.

**Check:** Look at the machine's active jobs count on Browse.

**What to do:** Wait a few minutes. Jobs are processed in order.

### 3. Network Issues on the Machine's Side

The daemon may be running but having trouble communicating with IGTP's servers.

**If you own the machine:**

1. Run: **igtp logs --tail 20**
2. Look for connection errors
3. Try: **igtp restart**

### 4. Ollama Crashed on the Machine

Ollama may have crashed on the host machine. The daemon might be running but Ollama isn't responding.

**If you own the machine:**
- Restart Ollama (reopen the app on Mac/Windows, or run **sudo systemctl restart ollama** on Linux)
- Then restart the daemon: **igtp restart**

## If the Job Never Completes

After waiting more than 5 minutes:
1. Consider the job as failed
2. Start a new conversation
3. Check Settings → Jobs to see the status of the old job`,
  },
  {
    id: 'not-getting-notifications',
    category: 'Troubleshooting',
    title: "I\\'m not getting notifications",
    content: `# I'm not getting notifications

Notifications in IGTP appear as a red badge on the bell icon in the navigation bar. If you're missing notifications, here's what to check.

## Checking Your Notifications Manually

Even if the bell badge isn't showing, you can always check manually:

1. Click the **bell icon** in the navigation bar
2. Or go directly to the **Notifications** page

If there are unread notifications, they'll appear here.

## Why the Badge Might Not Update

The notification count updates in near-real-time using a background connection. This connection can occasionally drop.

**Fix:** Simply **refresh the page** (press F5 or Command+R on Mac). The badge count will update on reload.

## Missing an Expected Notification

If someone said they approved your request or sent you a friend request but you're not seeing it:

1. **Refresh the page** — This is the most common fix
2. **Log out and back in** — Go to Settings → Sign out, then log back in
3. **Check if you're in the right account** — Are you logged into the account you think you are? (Your name appears in the top-right corner of the navbar)

## Email Notifications

IGTP currently sends email notifications for:
- Accepted friend requests
- Approved machine access requests

If you're not receiving emails:
1. Check your spam or junk folder
2. Search for emails from the IGTP domain
3. Make sure the email address on your account is correct (check Settings)

## Real-Time Updates

IGTP uses a technology called **Server-Sent Events** to push real-time notification updates to your browser. If your network blocks long-lived connections (some corporate or school networks do), real-time updates may not work.

In that case, refreshing the page manually will always show the current count.`,
  },
  {
    id: 'how-to-reinstall-daemon',
    category: 'Troubleshooting',
    title: 'How to reinstall the daemon',
    content: `# How to reinstall the daemon

If the daemon is misbehaving and you want a completely fresh start, here's how to reinstall it.

## Step 1: Uninstall the Current Daemon

Open a Terminal (Mac/Linux) or PowerShell (Windows) and run:

    igtp uninstall

> **Note:** On Windows, run PowerShell as Administrator for this command.

This will:
- Stop the daemon if it's running
- Remove the daemon service and auto-start
- Remove the **igtp** command
- **Keep** your machine registration in IGTP (your machine won't disappear from the website)

## Step 2: Get a Fresh Daemon Token

If you want to register as the same machine:
1. Log into IGTP in your browser
2. Go to **My Machines**
3. Click on your machine name
4. Look for **"Daemon Token"** or **"Regenerate Token"**
5. Copy the new token

If you want to register as a brand new machine, just go through the normal setup flow.

## Step 3: Run the Installer Again

**Mac or Linux:**

    curl -fsSL https://igtp.vercel.app/install.sh | sh

**Windows (PowerShell as Administrator):**

    irm https://igtp.vercel.app/install.ps1 | iex

## Step 4: Enter Your Token and Machine Name

Follow the prompts:
1. Paste your daemon token when asked
2. Enter your machine name (keep the same name if it's the same machine)

## Step 5: Verify

    igtp status

You should see "Running" with a green status. Check your machine in the IGTP website — it should show as Online within 30 seconds.`,
  },
  {
    id: 'how-to-uninstall-everything',
    category: 'Troubleshooting',
    title: 'How to uninstall everything',
    content: `# How to uninstall everything

If you want to completely remove IGTP from your computer, here's how to do it cleanly.

## Step 1: Uninstall the IGTP Daemon

Open a Terminal (Mac/Linux) or PowerShell as Administrator (Windows) and run:

    igtp uninstall

This removes:
- The IGTP daemon service
- The **igtp** command-line tool
- The auto-start configuration
- Any local daemon configuration files

## Step 2: Remove Your Machine From IGTP (Optional)

If you want your machine to no longer appear in IGTP at all:

1. Log into IGTP in your browser
2. Go to **My Machines**
3. Find your machine in the list
4. Click the **three-dot menu** → **"Delete Machine"**
5. Confirm the deletion

This removes the machine from everyone's Browse page and revokes any access that was granted to it.

## Step 3: Uninstall Ollama (Optional)

IGTP doesn't manage Ollama, but if you also want to remove Ollama:

**Mac:** Open Finder → Applications → drag Ollama to the Trash. To also remove downloaded models, open a Terminal and run:

    rm -rf ~/.ollama

**Windows:** Go to Settings → Apps → search for "Ollama" → Uninstall.

**Linux:** Open a Terminal and run these commands one by one:

    sudo systemctl stop ollama
    sudo systemctl disable ollama
    sudo rm /usr/local/bin/ollama
    rm -rf ~/.ollama

## Step 4: Delete Your IGTP Account (Optional)

If you want to completely delete your account and all data:

1. Go to **Settings**
2. Look for **"Account"** or **"Delete Account"** at the bottom
3. Follow the prompts to confirm account deletion

> **Warning:** Account deletion is permanent and cannot be undone. All your conversations, connections, machines, and API keys will be deleted.

## Done!

After these steps, IGTP and Ollama are completely removed from your computer.`,
  },
]

export const CATEGORIES = [...new Set(HELP_ARTICLES.map((a) => a.category))]
