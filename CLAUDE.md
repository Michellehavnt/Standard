# CLAUDE.md - AI Assistant Guidelines

This document provides essential context and guidelines for AI assistants (particularly Claude) working in this repository.

## Repository Overview

**Claude-Standard-Umgebung** (Claude Standard Environment) is a template repository designed to provide a standardized development environment for AI-assisted software development.

### Purpose

This repository serves as a foundation for projects where AI assistants collaborate with developers. It establishes conventions, workflows, and best practices to ensure consistent and high-quality contributions.

## Project Structure

```
Standard/
├── CLAUDE.md                 # AI assistant guidelines (this file)
├── .claude/skills/           # Project skills (HyperFrames video skills, checked in)
├── AFPitch/                  # Pitch page (static HTML)
├── hyperframes/              # HyperFrames starter example (HTML -> MP4), see hyperframes/README.md
├── videos/                   # One HyperFrames project per video (videos/<name>/)
│   └── affiliatefinder-reel/ # 30s vertical reel for AffiliateFinder (BRIEF.md inside)
├── tools/                    # Vendored third-party kits, see tools/README.md
│   ├── ais-os/               # AIS-OS starter kit (AI operating system skills)
│   └── hyperframes-student-kit/  # Nate Herk's video editing kit (skills + scripts)
├── sales-call-analyzer/      # Sales call analysis app (backend + frontend)
└── sales-intel-dashboard/    # Sales intelligence dashboard
```

> **Note**: This is the initial structure. Update this section as the project evolves.

## Development Guidelines

### Code Style and Conventions

1. **Language**: Use clear, descriptive naming conventions
2. **Comments**: Write comments for complex logic; avoid obvious comments
3. **Documentation**: Keep documentation in sync with code changes
4. **Testing**: Write tests for new functionality
5. **Security**: Never commit secrets, credentials, or sensitive data

### Git Workflow

1. **Branching**:
   - Main branch contains stable code
   - Feature branches follow the pattern: `claude/<description>-<session-id>`
   - Always create descriptive branch names

2. **Commits**:
   - Write clear, concise commit messages
   - Use imperative mood ("Add feature" not "Added feature")
   - Reference issues when applicable
   - Keep commits atomic and focused

3. **Pull Requests**:
   - Provide clear descriptions of changes
   - Include test plans when applicable
   - Request reviews for significant changes

### File Operations

- **Read before edit**: Always read a file before modifying it
- **Minimal changes**: Only modify what's necessary
- **No over-engineering**: Keep solutions simple and focused
- **Preserve formatting**: Maintain existing code style in files

## AI Assistant Instructions

### When Starting Work

1. Explore the repository structure to understand the current state
2. Check for existing documentation and conventions
3. Review recent commits to understand ongoing work
4. Use the TodoWrite tool to plan multi-step tasks

### When Making Changes

1. **Understand first**: Read relevant files before proposing changes
2. **Plan thoroughly**: Break complex tasks into smaller steps
3. **Test changes**: Verify modifications work as expected
4. **Document**: Update documentation when adding features

### When Committing

1. Stage only relevant files
2. Write descriptive commit messages
3. Never commit:
   - Secrets or credentials
   - Generated files (unless intentional)
   - Temporary or debug code
   - Unrelated changes

### Security Considerations

- Never expose API keys, passwords, or tokens
- Validate user input at system boundaries
- Be cautious with file operations outside the project
- Report potential security issues found in the code

## Common Commands

```bash
# Git operations
git status                    # Check current state
git diff                      # View unstaged changes
git log --oneline -10         # View recent commits

# Development (update based on project type)
# npm install                 # Install dependencies
# npm test                    # Run tests
# npm run build               # Build project
```

## Project-Specific Notes

### Video animation with HyperFrames (`hyperframes/`)

[HyperFrames](https://github.com/heygen-com/hyperframes) renders HTML, CSS and GSAP compositions to deterministic MP4 files. Use it for any request to make, animate or render a video, motion graphic, captioned clip or slideshow.

- **Start with the `/hyperframes` skill.** It routes to the right workflow and domain skills. The skills are versioned in `.claude/skills/`.
- **Project folders:** `hyperframes/` is the starter example. Real videos live in `videos/<name>/`, one HyperFrames project each, with a `BRIEF.md` that records the confirmed brief. Read the project's `CLAUDE.md` before editing compositions. `hyperframes/README.md` explains setup and commands.
- **Requirements:** Node.js 22+, FFmpeg, and Chrome Headless Shell (`npx hyperframes browser ensure`). Verify with `npx hyperframes doctor`.
- **Commands** (run inside `hyperframes/`): `npm run dev` (preview), `npm run check` (validation gate, always run after edits), `npm run render` (MP4 into `renders/`, git-ignored).
- **No CDN assets.** GSAP is vendored at `hyperframes/vendor/gsap.min.js`. Keep all media under `hyperframes/assets/` so renders work offline and in sandboxed environments.

### Vendored kits and their skills (`tools/`)

`tools/README.md` lists every third-party kit, its upstream commit and what was left out. Their skills are copied unchanged into `.claude/skills/`, so a skill's relative paths refer to its kit root:

- AIS-OS skills (`/onboard`, `/grill-me`, `/audit`, `/link`, `/level-up`, `/3d-brain`): kit root `tools/ais-os/`. Run their scripts from that folder and keep the kit's own `CLAUDE.md` and `context/` there, not at the repo root.
- HyperFrames Student Kit skills (`/edit-video`, `/short-form-edit`, `/cut-silences`, `/cut-mistakes`, `/video-storytelling`, `/style-library`, `/motion-showreel`, `/make-a-video`, `/short-form-video`, `/website-to-hyperframes`, `/hyperframes-video-beats`, `/gsap`): kit root `tools/hyperframes-student-kit/`. Run `npm ci` there once. Its transcription and generation scripts need API keys in that folder's git-ignored `.env`.
- `/scroll-craft` (scroll-driven websites) and `/human-speak` (remove AI writing patterns) are self-contained.
- When a student-kit skill and an official HyperFrames skill disagree on composition rules, the official `/hyperframes-core` contract wins; the kit targets an older HyperFrames release.

Other sections to add as the project grows: build instructions for the other apps, API documentation, architecture decisions, known issues.

## Quick Reference

| Task | Approach |
|------|----------|
| Explore codebase | Use Task tool with Explore agent |
| Find files | Use Glob tool with patterns |
| Search code | Use Grep tool for content search |
| Edit files | Read first, then use Edit tool |
| Multi-step tasks | Use TodoWrite to track progress |
| Ask for clarity | Use AskUserQuestion tool |

## Updating This Document

This CLAUDE.md should be updated when:
- Project structure changes significantly
- New conventions are established
- Important dependencies are added
- Workflow processes change

---

*Last updated: 2026-10-08*
*Repository: Claude-Standard-Umgebung*
