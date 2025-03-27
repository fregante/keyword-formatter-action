# keyword-formatter-action

> Formats keywords in titles of issues and PRs to use `backticks`

Keywords can come from a static list, from a directory listing or from the contents of a file.

## Examples

Enforce a format for certain words:

```diff
- "monorepo-package" SyntaxError: 🍄 not allowed here
+ `monorepo-package` - SyntaxError: 🍄 not allowed here
```

You can automatically install a [demo workflow](./workflow/title-formatter.yml) with [ghat](https://github.com/fregante/ghat):

```sh
npx -y ghat fregante/keyword-formatter-action/workflow
```

> [!NOTE]
> The action only formats standalone words. If you set `keywords: "fix"`, it won't match `fixed` nor `fix-stuff`.

## Usage

```yaml
name: Labeler

on:
  pull_request_target:
    types: [opened, edited]
  issues:
    types: [opened, edited]

jobs:
  Label:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      issues: write
    steps:
      - name: Turn keywords into `keywords`
        uses: fregante/keyword-formatter-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          keywords: alpha, omega

      - name: Turn keywords from file into `keywords`
        uses: fregante/keyword-formatter-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          keywords-path: source/list.txt

      - name: Read list of files in directory, use the extension-less names as keywords
        uses: fregante/keyword-formatter-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          keywords-path: source/features

      - name: Support and include prefixes in the formatted keyword (unicorn/alpha becomes `unicorn/alpha`)
        uses: fregante/keyword-formatter-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          keywords: alpha, omega
          prefix: unicorn/
```

## Inputs

See [action.yml](./action.yml)

## Outputs

See [action.yml](./action.yml)

## Related

- [title-to-labels-action](https://github.com/fregante/title-to-labels-action) - Cleans up the titles of issues and PRs from common opening keywords.
- 🛕 [action-release](https://github.com/fregante/ghatemplates/blob/main/readme.md#action-release) - A workflow to help you release your actions
- [daily-version-action](https://github.com/fregante/daily-version-action) - Creates a new tag using the format Y.M.D, but only if HEAD isn’t already tagged.
- [setup-git-user](https://github.com/fregante/setup-git-user) - GitHub Action that sets git user and email to enable committing
