# Hospitality Skills for AI Agents

A collection of AI agent skills built for the hospitality industry. Built by hoteliers, for hoteliers. The goal: automate day-to-day operations across every department — from Marketing to Housekeeping to the GM's office.

These skills currently run on [Claude Code](https://docs.anthropic.com/en/docs/claude-code) by Anthropic. They are completely free and will always be. The only thing you need is a paid Claude subscription (starts at $20/month).

New to Claude Code? Check out this [short intro](#getting-started). But honestly, the best way to learn with agentic AI is to just ask questions. Every time you're not sure about something, type it in the chat — Claude will have an answer.

**Contributions welcome!** Found a way to improve a skill or have a new one to add? [Open a PR](#contributing).

Run into a problem or have a question? [Open an issue](https://github.com/mathiascoudert/kitchen_club/issues) — I'm happy to help.

## What are Skills?

Skills are markdown files that give AI agents specialized knowledge and workflows for specific tasks. When you add these to your project, your agent can recognize when you're working on a hospitality task and apply the right frameworks, SOPs, and best practices.

## Available Skills

*Coming soon — skills are being added across the following departments:*

### Marketing & Revenue
- Digital marketing campaigns
- Social media content
- OTA listing optimization
- Email marketing sequences
- Website conversion optimization

### Front Office & Guest Experience
- Guest communication templates
- Review response management
- Upselling workflows
- Check-in/check-out optimization

### Housekeeping & Operations
- Room assignment optimization
- Maintenance request workflows
- Inventory management
- Cleaning schedules and SOPs

### Revenue Management
- Rate strategy analysis
- Competitor benchmarking
- Forecasting assistance
- Channel management

### General Management
- Reporting and analytics
- Staff scheduling
- Budget planning
- Compliance checklists

## Installation

### Option 1: CLI Install (Recommended)

```bash
# Install all skills
npx skills add mathiascoudert/kitchen_club

# Install specific skills
npx skills add mathiascoudert/kitchen_club --skill review-response

# List available skills
npx skills add mathiascoudert/kitchen_club --list
```

### Option 2: Clone and Copy

```bash
git clone https://github.com/mathiascoudert/kitchen_club.git
cp -r kitchen_club/skills/* .claude/skills/
```

### Option 3: Fork and Customize

1. Fork this repository
2. Customize skills for your property
3. Clone your fork into your projects

## Getting Started

1. **Install Claude Code** — Follow the [official guide](https://docs.anthropic.com/en/docs/claude-code)
2. **Get a Claude subscription** — Plans start at $20/month at [claude.ai](https://claude.ai)
3. **Install the skills** — Use any of the installation options above
4. **Start asking** — Just describe what you need in plain language

```
"Help me write a response to this negative review"
→ Uses review-response skill

"Create a social media post for our weekend brunch"
→ Uses social-content skill

"Build a housekeeping schedule for 45 rooms"
→ Uses housekeeping-ops skill

"Analyze our RevPAR against the comp set"
→ Uses revenue-management skill
```

## Contributing

Have a skill that helps your hotel run better? PRs and issues are welcome!

## License

[MIT](LICENSE) — Use these however you want.
