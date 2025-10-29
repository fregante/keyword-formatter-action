# Troubleshooting Guide

## Common Issues

### Action Fails with "Invalid regex pattern"

**Cause**: The regex pattern provided is syntactically incorrect or potentially unsafe.

**Solution**:
- Verify your regex pattern syntax: `/pattern/` must start and end with `/`
- Avoid nested quantifiers that can cause catastrophic backtracking (e.g., `/(a+)+/`)
- Test your regex pattern using an online tool first

**Example**:
```yaml
# ❌ Unsafe pattern
keywords: /(fix|feat)+/

# ✅ Safe pattern
keywords: /fix|feat/
```

### Action Fails with "Keywords path does not exist"

**Cause**: The specified file or directory path cannot be found.

**Solution**:
- Ensure you've checked out the repository first using `actions/checkout@v4`
- Verify the path is correct and relative to the repository root
- Check file/directory exists in your repository

**Example**:
```yaml
steps:
  # ✅ Required: Check out the repository first
  - uses: actions/checkout@v4
  
  - uses: fregante/keyword-formatter-action@v1
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
      keywords-path: .github/keywords.txt
```

### Action Fails with "Too many keywords"

**Cause**: More than 1000 keywords were provided.

**Solution**:
- Reduce the number of keywords to 1000 or fewer
- Consider using regex patterns for similar keywords
- Split into multiple action runs with different keyword sets

**Example**:
```yaml
# ❌ Too many individual keywords
keywords-path: directory-with-2000-files/

# ✅ Use regex to match patterns
keywords: /eslint\/[a-z-]+/
```

### Action Times Out or Fails Intermittently

**Cause**: Transient GitHub API issues.

**Solution**:
The action automatically retries API calls with exponential backoff. If failures persist:
- Check [GitHub Status](https://www.githubstatus.com/)
- Increase workflow timeout if needed
- Retry the workflow

### Title Not Updated Despite Success Message

**Cause**: Another action or user may have modified the title concurrently.

**Solution**:
- The action fetches the latest title before each run to handle multiple actions
- Check workflow logs for warning messages about verification failures
- Ensure actions run sequentially if order matters

**Example**:
```yaml
# ✅ Run actions in sequence, not parallel
jobs:
  format:
    runs-on: ubuntu-latest
    steps:
      - uses: fregante/keyword-formatter-action@v1
        name: Format package names
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          keywords-path: packages/
      
      - uses: fregante/keyword-formatter-action@v1
        name: Format error codes
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          keywords: ERROR_CODE, WARNING_CODE
```

## Best Practices for Popular Repositories

### 1. Use Dry Run Mode First

Test the action on a few issues/PRs before enabling it for all:

```yaml
- uses: fregante/keyword-formatter-action@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    keywords: fix, feat, chore
    dry-run: true  # Test without making changes
```

### 2. Limit Scope with Event Filters

In busy repositories, only run on specific events:

```yaml
on:
  issues:
    types: [opened]  # Only on new issues, not edits
  pull_request_target:
    types: [opened]  # Only on new PRs
```

### 3. Use Specific Keywords

Avoid overly generic keywords that might match unintentionally:

```yaml
# ❌ Too generic - will match common words
keywords: run, test, fix

# ✅ Specific to your project
keywords-path: packages/  # Package names
prefix: eslint/  # With prefix like "eslint/no-console"
```

### 4. Handle Rate Limiting

For very active repositories, be aware of GitHub API rate limits:

```yaml
# Use pull_request_target instead of pull_request for external contributors
on:
  pull_request_target:
    types: [opened, edited]
```

The action automatically handles rate limiting with retries.

### 5. Combine with Other Title Actions

You can safely use multiple title-formatting actions:

```yaml
steps:
  - uses: actions/checkout@v4
  
  - uses: fregante/keyword-formatter-action@v1
    name: Format keywords
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
      keywords: alpha, beta, gamma
  
  - uses: fregante/title-to-labels-action@v1
    name: Add labels from title
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
```

### 6. Monitor Workflow Performance

Check workflow run times periodically:

```yaml
# Keep keyword lists reasonable to maintain performance
keywords-path: common-terms.txt  # ~100 keywords
# Rather than:
keywords-path: all-words-in-dictionary/  # 10,000+ files
```

### 7. Document Expected Format

Add a comment in your issue template explaining the formatting:

```markdown
<!-- 
Keywords like package names, commands, or error codes will be 
automatically formatted with backticks for better readability.
-->
```

## Error Messages Reference

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Keywords must be a non-empty string` | Empty or invalid keywords input | Provide valid keywords |
| `Regex pattern cannot be empty` | Regex specified as `//` | Add pattern between slashes |
| `Potentially unsafe regex pattern` | Pattern may cause ReDoS | Simplify regex, avoid nested quantifiers |
| `Keywords path does not exist` | File/directory not found | Check path and ensure checkout action runs first |
| `Permission denied reading keywords path` | Insufficient file permissions | Check file permissions in repository |
| `The file is empty` | Keywords file has no content | Add keywords to the file |
| `The directory is empty` | No files in specified directory | Add files or use different directory |
| `Too many keywords` | More than 1000 keywords | Reduce keyword count or use regex |
| `Prefix is too long` | Prefix exceeds 100 characters | Shorten prefix |
| `New title is too long` | Formatted title exceeds 256 chars | Use shorter keywords or fewer keywords |

## Debug Mode

Enable detailed logging by setting `ACTIONS_STEP_DEBUG`:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
```

This will show:
- Environment details (owner, repo, issue number)
- Input processing details
- Keyword matching details
- API call attempts and retries

## Getting Help

If you encounter an issue not covered here:

1. Check the [existing issues](https://github.com/fregante/keyword-formatter-action/issues)
2. Enable debug mode and review the logs
3. Try dry-run mode to see what would be changed
4. Open a new issue with:
   - Workflow configuration
   - Error message
   - Debug logs (with sensitive data removed)
   - Example issue/PR title that caused the problem
