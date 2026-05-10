---
description: Group changes into semantic commits (Local only)
---

Group all current changes into meaningful semantic commits locally. Do NOT push the changes.

Optional context for commit messages: `<context>`

## Rules:

- **First inspect the full repository state:**
  - `git status --short`
  - `git diff --stat`
  - `git diff`
  - `git log --oneline -10`
- **Identify related file groups by intent:** feature, fix, refactor, tests, docs, chore, release, or config.
- **Create multiple commits** when there are independent changes. Do not mix unrelated changes in the same commit.
- If `<context>` is not empty, use it as context to adjust commit messages, but do not force that text if it does not accurately describe the changes.
- Use **clear, semantic, concise commit messages** that follow the repo's recent style (e.g., Conventional Commits).
- **Security Check:** Before committing, check for sensitive or suspicious files (`.env`, tokens, credentials, keys, secrets). If any appear, stop and ask.
- Include new, modified, and deleted files that belong to each group.
- **Restrictions:**
  - Do not revert existing changes.
  - Do not use `--no-verify`.
  - Do not amend commits.
  - **Do NOT run `git push`.**

## Flow:

1. **Plan:** Show the proposed commit plan with the files included in each commit.
2. **Confirm:** If the grouping is clear, continue. If there is real ambiguity, ask before committing.
3. **Commit:** For each group:
   - Add only the files for that group with `git add <files>`.
   - Create the commit with a semantic message.
4. **Summary:** When finished, summarize the commits created locally and show the current state of the branch.