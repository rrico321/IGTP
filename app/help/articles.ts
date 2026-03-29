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

After clicking the invitation link, you'll be taken to a sign-up page where you enter your **name** — this is what your friends will see on the platform.

That's it! IGTP uses a simple login system — no passwords to remember. Just select your name from the login page to sign in.

## Step 3: Explore the App

Once you're in, you'll see the main navigation bar at the top with these sections:

- **Browse** — Find machines your friends are sharing
- **My Machines** — Register your own computer as a shareable machine
- **Chat** — Start AI conversations
- **Network** — Manage your trust network (friends)
- **Settings** — API keys and other settings

## Already Have an Account?

Just go to the IGTP website and select your name from the login page.`,
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
3. **Node.js 20+** — required to run the daemon (the installer will help you install it if needed)

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

Only when you want your machine to be available. If you're using your computer for something intensive (gaming, video editing, etc.), you can stop the daemon and it will show your machine as "offline" to your friends.`,
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

> **Before you start:** Make sure Ollama is installed and running (see "How to install Ollama"). Also make sure you're logged into your IGTP account — you'll need to generate an API key during this process.

---

## Step 1: Generate an API Key

The daemon needs an API key to authenticate with IGTP.

1. Log in to IGTP at the website
2. Click **"Settings"** in the navigation bar
3. Click **"API Keys"**
4. Click **"Generate API Key"** and give it a label like "My Machine"
5. Copy the key — it will look something like **igtp_xxxx_xxxx_xxxx_xxxx**

> **Keep this key private!** Anyone with this key could act as you. Don't share it publicly.

---

## Step 2: Install on Mac or Linux

1. Open a **Terminal** window:
   - **Mac:** Press **Command + Space**, type "Terminal", and press Enter
   - **Linux:** Press **Ctrl + Alt + T**

2. Copy and paste this command into Terminal and press Enter:

    curl -fsSL https://igtp.vercel.app/install.sh | sh

3. The installer will:
   - Check for Node.js 20+ (and help install it if needed)
   - Ask you to **paste your API key**
   - Auto-detect your hardware (GPU, CPU, RAM) or ask you to enter it manually
   - Ask for a **machine name** (e.g., "Home Desktop" or "MacBook Pro")
   - Register your machine with IGTP
   - Install the daemon to **~/.igtp/**
   - Set up auto-start

---

## Step 3: Install on Windows

1. Open **PowerShell as Administrator**:
   - Click the Start menu
   - Type "PowerShell"
   - Right-click on "Windows PowerShell" and select **"Run as administrator"**
   - Click **"Yes"** when asked if you want to allow changes

2. Copy and paste this command and press Enter:

    irm https://igtp.vercel.app/install.ps1 | iex

3. Follow the same prompts as Mac/Linux (API key, hardware, machine name)

---

## Step 4: Verify It Worked

After installation, go back to IGTP in your browser:

1. Click **"My Machines"** in the navigation bar
2. You should see your machine listed with a **green dot** indicating it's online
3. If you have models in Ollama, you'll see them listed under your machine

> **Seeing it as offline?** See the Troubleshooting section for help.`,
  },
  {
    id: 'manage-daemon',
    category: 'Sharing Your Machine',
    title: 'How to manage the daemon (start, stop, status, logs)',
    content: `# How to manage the daemon

Once the IGTP daemon is installed, you can control it from your Terminal or PowerShell at any time. The daemon installs to **~/.igtp/** and provides a simple CLI.

## Opening a Terminal or PowerShell

**Mac:** Press Command + Space, type "Terminal", press Enter.

**Windows:** Press the Windows key, type "PowerShell", press Enter.

**Linux:** Press Ctrl + Alt + T, or search for "Terminal."

---

## Check Status

To see if the daemon is running:

    ~/.igtp/igtp status

---

## Stop the Daemon

If you want to make your machine appear offline (for example, when you're gaming or doing something intensive):

    ~/.igtp/igtp stop

Your machine will show as **"Offline"** in IGTP. Friends won't be able to send new jobs to it.

---

## Start the Daemon

To bring your machine back online:

    ~/.igtp/igtp start

Your machine will show as **"Online"** again within a few seconds.

---

## View Logs

Logs show you what's happening with the daemon — what jobs ran, any errors, etc.

    ~/.igtp/igtp logs

---

## Uninstall

To completely remove the daemon from your machine:

    ~/.igtp/igtp uninstall

---

## Does It Start Automatically?

**Mac and Linux:** Yes, the daemon is set up as a launchd/systemd service that starts when you log in.

**Windows:** Yes, it runs as a scheduled task that starts with Windows.`,
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

1. Click the **bell icon** in the navigation bar to see notifications
2. Find the notification about the access request
3. Navigate to the machine's request page

On the request page, you'll see:

- **Green "Approve" button** — Click this to allow access. The friend will be notified and can start using your machine.
- **Red "Deny" button** — Click this to decline. The friend will be notified that their request was denied.

You can also add a note before approving or denying.

## Managing Existing Access

To see who currently has access to your machines:

1. Click **"My Machines"** in the navigation bar
2. Click on a machine name to see its details
3. You'll see requests and their statuses`,
  },
  {
    id: 'what-happens-when-someone-uses-my-machine',
    category: 'Sharing Your Machine',
    title: 'What happens when someone uses my machine?',
    content: `# What happens when someone uses my machine?

Here's exactly what happens behind the scenes when a friend uses your shared machine.

## The Flow, Step by Step

1. **Your friend types a message** in the IGTP chat interface
2. **IGTP creates a job** and stores it in the database
3. **The IGTP daemon on your computer** polls for new jobs (checking every few seconds)
4. **Your daemon passes the request to Ollama**, which is running on your computer
5. **Ollama generates the response** using your GPU — this is the part that uses your hardware
6. **Your daemon sends the response back** to IGTP's servers
7. **Your friend sees the response** appear in their chat window

## What You'll See

While a job is running, you generally won't notice anything different unless you're watching closely:

- Your GPU usage will go up (you can see this in Task Manager on Windows or Activity Monitor on Mac)
- The IGTP daemon logs will show the job being processed

## Does It Slow Down My Computer?

It depends on your hardware:

- **On a dedicated GPU:** Usually no impact on your regular computer tasks (browsing, documents, etc.). The GPU handles AI work separately.
- **On integrated graphics or shared memory:** You may notice some slowdown.
- **On Apple Silicon Macs:** The unified memory architecture means AI work shares memory with the rest of the system, but performance impact is usually minimal.

## Can I Pause It?

Yes, at any time. Just run **~/.igtp/igtp stop** in your Terminal. Your machine will appear offline and no new jobs will be sent.

## Usage History

You can see a log of all jobs that ran on your machine by going to **Settings → Jobs** in the IGTP website.`,
  },
  {
    id: 'browse-available-machines',
    category: "Using Someone's Machine",
    title: 'How to browse available machines',
    content: `# How to browse available machines

The **Browse** page shows all machines that people in your trust network have shared.

## Getting to Browse

Click **"Browse"** in the top navigation bar. You'll see a list of machine cards.

## What You See on Each Card

Each card shows:

- **Machine name** — The nickname the owner gave it (e.g., "Home Desktop", "Gaming Rig")
- **Owner's name** — Whose machine it is
- **Status indicator:**
  - Green dot = **Online** — The daemon is running and ready to accept jobs
  - Gray dot = **Offline** — The daemon isn't running
- **GPU information** — What graphics card the machine has (e.g., "NVIDIA RTX 4090") and VRAM
- **Available models** — The AI models installed on this machine

## Searching and Filtering

At the top of the Browse page, you can:

- **Search** by machine name or GPU model
- **Filter by GPU model** — Select a specific GPU type
- **Filter by minimum VRAM** — Only show machines with enough memory for your needs
- **Show all statuses** — Toggle to include offline machines in the results

## What If I Don't See Any Machines?

A few reasons why the list might be empty:

1. **You haven't connected with anyone yet** — Go to the Network page to add friends first
2. **Your friends haven't shared their machines** — Not everyone sets up machine sharing
3. **All machines are offline** — Check back later when your friends' computers are on`,
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

## Step 2: Send the Request

1. Click the **"Request Access"** button on the machine card
2. Fill in the request details — describe what you want to use the machine for and how long you need it
3. Submit the request

## Step 3: Wait for Approval

After sending the request:

- The machine's owner will receive a notification
- Your request will show as **"Pending"**
- You'll receive a notification when they approve or deny your request

**Typical wait times:** This depends entirely on when your friend checks the app. It could be a few minutes or a few hours.

## Step 4: You're Approved!

When the owner approves your request:

- You'll see a notification
- You can now go to the **Chat** page and start a conversation using that machine

## What If My Request is Denied?

If the owner denies your request, you'll see a notification. You can try reaching out to them directly, or look for other machines to request access to.

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

Click **"Chat"** in the top navigation bar.

## Step 2: Start a New Conversation

Click the **"+ New"** button in the sidebar.

A form will appear asking you to choose:

1. **Machine** — Select which friend's machine to use from the dropdown
2. **Model** — Select which AI model to use from the list

> **Note:** The form only shows machines where you have **approved access** and the machine is **online**.

## Step 3: Chat!

You're now in the chat window.

1. Type your message in the **text box at the bottom** of the screen
2. Press **Enter** or click the **send** button
3. The AI response will appear above — it streams in as the model generates it

## Understanding the Response

- Responses stream in as the AI generates them
- The response may use **formatting** like bold text, code blocks, and lists (rendered as markdown)
- After each response, you can keep the conversation going by typing your next message

## Going Back to Other Conversations

Click on any conversation in the sidebar to switch between them.`,
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
- **qwen** — Alibaba's model family, various sizes available

The models available to you depend on what the machine owner has installed in Ollama.

## Starting a Conversation with a Specific Model

When you click **"+ New"** in the Chat sidebar, the form shows you a list of available models on the selected machine. Simply select the one you want to try.

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

You may see models like **llama3:8b** or **qwen3:30b**. The number refers to the model's "size" in billions of parameters:
- **8b** — Smaller, faster, uses less GPU memory, slightly less capable
- **30b+** — Larger, slower, needs more GPU memory, more capable

For most everyday tasks, smaller models work great.`,
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

In **Settings → Jobs**, you can see a breakdown of token usage for each job, including prompt tokens, completion tokens, and total tokens.

## Why Does the Machine Owner Care?

If you're using someone else's GPU, the token count tells both of you how much work the computer is doing. It's a measure of "compute used."

Currently, IGTP is a trust-based, free-to-use platform among friends — there's no per-token billing between users. But the token count helps machine owners understand their usage.

## Context Window

There's also a limit called the **context window** — the maximum number of tokens a model can "hold in memory" during a conversation. Most models support 8,000–128,000 tokens of context.

If a conversation gets very long, older messages may be dropped from the model's memory to stay within this limit. The app handles this automatically, but be aware that very long conversations may "forget" early messages.`,
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

Each conversation starts completely fresh. If you start a new conversation, the AI has no idea what you discussed in your previous conversations. It only knows what's in the current conversation window.

## Tips for Managing Context

- **Be explicit when switching topics** — say "I want to switch topics now and ask about..."
- **For coding sessions** — paste the relevant code snippet again if you've been chatting for a long time
- **Start a new conversation** when you genuinely want a completely fresh start`,
  },
  {
    id: 'manage-conversations',
    category: 'Chat',
    title: 'How to manage your conversations',
    content: `# How to manage your conversations

## Viewing All Your Conversations

Click **"Chat"** in the navigation bar. You'll see a sidebar listing all your conversations, ordered by most recent activity.

Each conversation shows:
- The title
- The model used
- When it was last active

## Deleting a Conversation

If you want to remove a conversation:
1. On the Chat page, find the conversation in the sidebar
2. Click the **trash icon** next to the conversation
3. The conversation will be deleted

> **Warning:** Deleted conversations cannot be recovered. All messages in that conversation will be permanently gone.

## What Happens If the Machine Goes Offline?

If a machine goes offline while you have a conversation open:
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

An **API key** is like a special password that your programs use to identify themselves to IGTP.

## Step 1: Go to Settings

Click **"Settings"** in the top navigation bar.

## Step 2: Navigate to API Keys

Click **"API Keys"** in the Settings page. You'll see the API Keys management page.

## Step 3: Create a New Key

1. Enter a descriptive label — for example, "My Python script" or "Home automation"
2. Click **"Generate API Key"**
3. Your new API key will appear on screen — it will look something like **igtp_xxxx_xxxx_xxxx_xxxx**

## Step 4: Copy and Save Your Key

> **Important:** This is the **only time** you'll see the full key. Copy it immediately and save it somewhere safe, like a password manager.

If you lose it, you'll need to delete it and generate a new one.

## Using Your API Key

In your code or API client, include the key in the request headers:

    Authorization: Bearer igtp_xxxx_xxxx_xxxx_xxxx

## Managing Your Keys

On the API Keys page, you can:
- See all your existing keys (only the prefix is shown after creation)
- See when each key was last used
- Delete keys you no longer need by clicking the delete button

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

## Chat Endpoint

    POST /api/ollama/chat

## Request Format

Send a JSON body with these fields:

    {
      "machineId": "machine-1234567890",
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
      -H "Authorization: Bearer igtp_xxxx_xxxx_xxxx_xxxx" \\
      -H "Content-Type: application/json" \\
      -d '{"machineId":"machine-1234567890","model":"llama3","messages":[{"role":"user","content":"What is the capital of France?"}]}'

## Response

The API returns a job ID immediately (the request is processed asynchronously):

    {
      "jobId": "job-1234567890",
      "status": "queued"
    }

Then use the job ID to check for the result (see "How to check job results").

## Multi-Turn Conversations

To maintain conversation history, include all previous messages:

    {
      "machineId": "machine-1234567890",
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
      "machineId": "machine-1234567890",
      "model": "mxbai-embed-large",
      "input": "The quick brown fox jumps over the lazy dog"
    }

> **Note:** Use an embedding-specific model like **mxbai-embed-large** or **nomic-embed-text**, not a chat model like llama3. Check the machine's model list to see what embedding models are available.

## Example Using curl

    curl -X POST https://igtp.vercel.app/api/ollama/embed \\
      -H "Authorization: Bearer igtp_xxxx_xxxx_xxxx_xxxx" \\
      -H "Content-Type: application/json" \\
      -d '{"machineId":"machine-1234567890","model":"mxbai-embed-large","input":"The quick brown fox"}'

## Response

Like chat requests, embedding requests are processed asynchronously:

    {
      "jobId": "job-1234567890",
      "status": "queued"
    }

Poll for the result using the job ID (see "How to check job results").`,
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

    curl -X GET https://igtp.vercel.app/api/jobs/job-1234567890 \\
      -H "Authorization: Bearer igtp_xxxx_xxxx_xxxx_xxxx"

## Job Status Values

| Status | Meaning |
|---|---|
| queued | Waiting to be picked up by the daemon |
| running | Currently being processed by Ollama |
| completed | Done, result is available |
| failed | Something went wrong |
| timed_out | Exceeded the maximum runtime |

## Polling Pattern

Your code should check the job status repeatedly until it completes:

1. Send your chat or embed request → get a job ID
2. Wait 2 seconds
3. Check the job status
4. If it's "completed" or "failed" — you're done
5. If it's still "queued" or "running" — wait 2 seconds and check again`,
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

## Mutual Trust

Connections can be **one-way or mutual**. When Alice adds Bob to her network, Alice trusts Bob. If Bob also adds Alice, it becomes mutual trust. The Network page shows which connections are mutual and which are one-way.

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

## Step 2: Find the Person

Scroll down to the **"People on IGTP"** section. You'll see a list of users who aren't yet in your network.

## Step 3: Send the Request

Click the **"Add to Network"** button next to the person's name. The button will change to show **"Pending"** while you wait for them to accept.

## What Happens Next?

- The person will receive a notification that you've sent them a friend request
- Your request shows as **"Pending"** until they respond
- If they accept, they'll appear in your network and you can see each other's machines
- If they deny it, nothing changes — you won't be notified

## Inviting Someone Not Yet on IGTP

If the person you want to connect with isn't on IGTP yet, scroll to the **"Invite Someone New"** section at the bottom of the Network page. Enter their email address to send them an invite.`,
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
2. You check the **Notifications** page

## How to Respond

Go to the **Network** page by clicking "Network" in the navigation bar. If you have incoming friend requests, you'll see a **"Pending Friend Requests"** section showing each request.

### Accepting

1. Click the **green "Accept"** button on the request
2. That person is now added to your trust network
3. They'll receive a notification that you accepted
4. You can now see each other's shared machines in Browse

### Denying

1. Click the **red "Deny"** button
2. The request is removed
3. They won't be in your network

## What if I Don't Recognize the Person?

If you receive a request from someone you don't know, it's perfectly fine to deny it. Only connect with people you actually trust — that's the whole point of the trust network.`,
  },
  {
    id: 'how-to-remove-from-network',
    category: 'Trust Network',
    title: 'How to remove someone from your network',
    content: `# How to remove someone from your network

If you want to disconnect from someone in your trust network, here's how.

## Step 1: Go to Network

Click **"Network"** in the top navigation bar.

## Step 2: Find the Person

In the friend cards section, find the person you want to remove.

## Step 3: Remove the Connection

Click the **"Remove"** link next to their name. A confirmation dialog will appear asking "Remove this person from your trust network?" Click OK to confirm.

## What Happens When You Remove Someone

When you remove someone from your network:

- They can no longer see your machines in Browse
- You can no longer see their machines
- You no longer appear in each other's network

## Can They Add Me Back?

Yes — they would need to send you a new friend request, and you would need to accept it.`,
  },
  {
    id: 'how-to-invite-someone',
    category: 'Trust Network',
    title: "How to invite someone who isn\\'t on IGTP yet",
    content: `# How to invite someone who isn't on IGTP yet

IGTP is invitation-only. If you want to bring a friend onto the platform, you can invite them by email.

## Option 1: From the Network Page

1. Go to the **Network** page
2. Scroll to the **"Invite Someone New"** section at the bottom
3. Enter your friend's email address
4. Click **"Send Invite"**

## Option 2: From Settings

1. Click **"Settings"** in the navigation bar
2. Click **"Invites"** on the Settings page
3. Enter the email address and send

## What Happens Next

Your friend will receive an email with a link to create their IGTP account. The invite link expires after 7 days.

## After They Sign Up

Once your friend creates their account through your invite, you'll automatically be connected in each other's trust network — no separate friend request needed!

## Tracking Your Invites

On the **Settings → Invites** page, you can see:
- **Pending invites** — Sent but not yet accepted
- **Accepted invites** — Friends who have joined`,
  },
  {
    id: 'managing-api-keys',
    category: 'Settings',
    title: 'Managing your API keys',
    content: `# Managing your API keys

API keys allow your programs and the IGTP daemon to authenticate with IGTP. Here's how to manage them.

## Getting to API Keys

1. Click **"Settings"** in the navigation bar
2. Click **"API Keys"**

## Creating a New Key

1. Enter a **label** that describes what the key is for (e.g., "My daemon", "Python script")
2. Click **"Generate API Key"**
3. **Copy the key immediately** — it won't be shown again in full

The key looks like **igtp_xxxx_xxxx_xxxx_xxxx** (four groups separated by underscores).

## Viewing Your Keys

On the API Keys page, you'll see a list showing:
- **Prefix** — The first part of the key (for identification)
- **Label** — What you named the key
- **Last used** — When the key was last used
- **Created** — When you created it

## Deleting a Key

If a key is no longer needed or you think it may have been compromised:

1. Find the key in the list
2. Click the **delete button** next to it

> **Important:** Deleting a key immediately invalidates it. Any programs or daemons using that key will stop working. Make sure to update them with a new key first.

## Best Practices

- Create one key per use-case (one for your daemon, one for scripts, etc.)
- Name keys clearly so you remember what uses them
- Delete keys you no longer use
- If you accidentally expose a key, delete it and create a new one immediately`,
  },
  {
    id: 'viewing-job-history',
    category: 'Settings',
    title: 'Viewing your job history',
    content: `# Viewing your job history

**Jobs** are the records of AI requests — each time you send a chat message or make an API call, it creates a job record.

## Getting to Job History

1. Click **"Settings"** in the navigation bar
2. Click **"Jobs"**

## What You'll See

The Jobs page shows a list of all your past jobs with details including:

- **Job type** — Chat or Embedding
- **Model** — Which AI model was used
- **Status** — Completed, Failed, Running, Queued, or Timed Out
- **Token usage** — Prompt tokens, completion tokens, and total
- **When it was created**

## Why Look at Job History?

The job history is useful for:

- **Debugging API issues** — If your program isn't getting results, check whether the job was created and what status it has
- **Usage tracking** — Understand how many tokens you're consuming
- **Troubleshooting** — Find failed jobs and see what went wrong`,
  },
  {
    id: 'viewing-access-requests',
    category: 'Settings',
    title: 'Viewing your access requests',
    content: `# Viewing your access requests

You can view all access requests you've sent to use other people's machines.

## Getting There

1. Click **"Settings"** in the navigation bar
2. Click **"My Requests"**

## What You'll See

A list of all access requests you've sent, showing:
- **Machine name** — Which machine you requested access to
- **Machine owner** — Who owns the machine
- **Status:** Pending, Approved, or Denied
- **Date** — When you sent the request
- **Owner's note** — Any message the owner included when responding

## Request Statuses Explained

| Status | What it means |
|---|---|
| **Pending** | You sent the request, waiting for approval |
| **Approved** | Access granted — you can use this machine |
| **Denied** | The owner declined your request |

## What if My Request Has Been Pending for a Long Time?

There's no automatic reminder system. If your request has been pending for a while:

1. Check your trust network — make sure you're still connected to the machine owner
2. Try reaching out to the owner directly through another channel
3. Some owners may not check the app frequently`,
  },
  {
    id: 'daemon-wont-start',
    category: 'Troubleshooting',
    title: "The daemon won\\'t start",
    content: `# The daemon won't start

If you run **~/.igtp/igtp start** and the daemon doesn't come online, here's how to diagnose and fix it.

## Step 1: Check if Ollama is Running

The IGTP daemon requires Ollama to be running first.

**Mac:** Look for the llama icon in your menu bar (top-right of screen). If it's not there, open Ollama from your Applications folder.

**Windows:** Look for the llama icon in your system tray (bottom-right, near the clock). If it's not there, open Ollama from the Start menu.

**Linux:** Open a Terminal and run:

    systemctl status ollama

If it's not running, start it:

    sudo systemctl start ollama

## Step 2: Check the Logs

    ~/.igtp/igtp logs

Look for error messages about connections or authentication.

## Step 3: Check Your Internet Connection

The daemon needs internet to connect to IGTP's servers. Make sure you can access other websites. If you're on a corporate or school network, a firewall may be blocking the connection.

## Step 4: Verify Your API Key

If the logs show authentication errors, your API key may be invalid. Generate a new one at Settings → API Keys, then update the daemon config at **~/.igtp/daemon/.env**.

## Step 5: Reinstall the Daemon

If nothing else works, try a clean reinstall:

    ~/.igtp/igtp uninstall

Then follow the installation instructions again (see "How to install the IGTP daemon").`,
  },
  {
    id: 'machine-shows-offline',
    category: 'Troubleshooting',
    title: 'My machine shows as offline',
    content: `# My machine shows as offline

Your machine shows as offline in IGTP even though you think the daemon is running. Here's how to fix it.

## Step 1: Confirm the Daemon is Actually Running

Open a Terminal or PowerShell and run:

    ~/.igtp/igtp status

- If it shows the daemon is running, continue to Step 2
- If it's stopped, start it with: **~/.igtp/igtp start**

## Step 2: Wait a Moment

After starting the daemon, it can take a few seconds for IGTP to update your machine's status. The daemon sends heartbeats every 60 seconds. Refresh the page in your browser and check again.

## Step 3: Check Your Internet Connection

The daemon connects to IGTP's servers over the internet. Make sure:
- You can browse other websites normally
- You're not on a VPN that might block the connection

## Step 4: Check Ollama

The daemon needs Ollama to be running.

**Mac:** Check for the llama icon in your menu bar.
**Windows:** Check for the llama icon in your system tray.

If Ollama isn't running, start it, then stop and restart the daemon:

    ~/.igtp/igtp stop
    ~/.igtp/igtp start

## Step 5: Check the Logs

    ~/.igtp/igtp logs

Look for error messages about connections or authentication.`,
  },
  {
    id: 'cant-see-any-models',
    category: 'Troubleshooting',
    title: "I can\\'t see any models",
    content: `# I can't see any models

If you try to start a new conversation and see no models available, here's what might be happening.

## If You're the Machine Owner

### Check That Ollama Has Models Installed

In a Terminal or PowerShell, run:

    ollama list

You should see a table of installed models. If it's empty, you need to download a model:

    ollama pull llama3

Wait for the download to complete (it may be several gigabytes).

### Wait for the Daemon to Sync

The daemon automatically syncs models with IGTP every 60 seconds. After installing new models, wait a minute and then refresh the page — the models should appear.

### Check the Daemon Status

    ~/.igtp/igtp status

The daemon needs to be running for models to show up in IGTP.

---

## If You're Trying to Use Someone Else's Machine

### Check Your Access

Make sure you actually have **approved access** to the machine:

1. Go to **Browse**
2. Does the machine show that you have access?
3. If not, you need to request access first

### Check the Machine Status

If the machine shows as **offline** (gray dot), the owner's daemon isn't running. You won't be able to use models until they bring it back online.

### Ask the Owner

If the machine is online and you have approved access but still see no models, contact the machine owner. They may need to install models in Ollama or restart their daemon.`,
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

The most common cause. The machine you're trying to use went offline.

**Check:** Go to Browse. Is the machine still showing as online (green dot)? If it's offline, the job will stay queued until the machine comes back online.

**What to do:**
- Wait for the machine to come back online, OR
- Start a new conversation using a different machine

### 2. The Daemon is Overloaded

If the machine is processing many jobs simultaneously, yours may be waiting in line.

### 3. Network Issues on the Machine's Side

The daemon may be running but having trouble communicating with IGTP's servers.

**If you own the machine:**

1. Run: **~/.igtp/igtp logs**
2. Look for connection errors
3. Try stopping and restarting: **~/.igtp/igtp stop** then **~/.igtp/igtp start**

### 4. Ollama Crashed on the Machine

Ollama may have crashed on the host machine.

**If you own the machine:**
- Restart Ollama (reopen the app on Mac/Windows, or run **sudo systemctl restart ollama** on Linux)
- Then restart the daemon

## If the Job Never Completes

After waiting more than 5 minutes:
1. Consider the job as failed
2. Start a new conversation
3. Check Settings → Jobs to see the status of the old job`,
  },
  {
    id: 'how-to-uninstall-everything',
    category: 'Troubleshooting',
    title: 'How to uninstall everything',
    content: `# How to uninstall everything

If you want to completely remove IGTP from your computer, here's how to do it cleanly.

## Step 1: Uninstall the IGTP Daemon

Open a Terminal (Mac/Linux) or PowerShell (Windows) and run:

    ~/.igtp/igtp uninstall

This removes the IGTP daemon, the CLI tool, and the auto-start configuration.

## Step 2: Remove Your Machine From IGTP (Optional)

If you want your machine to no longer appear in IGTP at all, you can delete it from the My Machines page in the website.

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

## Done!

After these steps, IGTP and Ollama are completely removed from your computer.`,
  },
]

export const CATEGORIES = [...new Set(HELP_ARTICLES.map((a) => a.category))]
