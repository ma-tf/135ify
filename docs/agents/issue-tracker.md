# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**:

  ```bash
  gh issue list --state open --json number,title,body,labels,comments \
    --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'
  ```

  with appropriate `--label` and `--state` filters.

- **Comment on an issue**: `gh issue comment <number> --body "..."`
  - **Do not use backticks in the body** — zsh interprets backtick-enclosed text as command substitution, silently
    stripping it. Use plain names or single quotes for inline code.
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Set parent issue**: `gh issue edit <number> --parent <parent-number>`
- **Add sub-issues**: `gh issue edit <number> --add-sub-issue <child-number>`
- **Remove sub-issues**: `gh issue edit <number> --remove-sub-issue <child-number>`
- **Add "blocked by" dependency**: `gh issue edit <number> --add-blocked-by <blocking-number>`
- **Remove "blocked by" dependency**: `gh issue edit <number> --remove-blocked-by <blocking-number>`
- **Add "blocking" dependency**: `gh issue edit <number> --add-blocking <blocked-number>`
- **Remove "blocking" dependency**: `gh issue edit <number> --remove-blocking <blocked-number>`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Further reading

[Available docs](https://cli.github.com/manual/gh) for `gh`
