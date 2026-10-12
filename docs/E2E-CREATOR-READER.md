# Authenticated Creator → Reader E2E Test

The script `scripts/e2e-creator-reader.mjs` exercises the real Supabase REST/Auth path using a dedicated test account:
1. Sign in.
2. Create a temporary draft and canonical version.
3. Confirm anonymous access cannot see the draft.
4. Publish the work.
5. Confirm anonymous access can read the published book and canonical body.
6. Create a temporary active Commerce product and confirm anonymous visibility.
7. Delete the temporary product and work in a `finally` cleanup block.

## Run

Set these environment variables locally or as GitHub Actions repository secrets:
- `NARATIVA_E2E_EMAIL`
- `NARATIVA_E2E_PASSWORD`

Then run:

```bash
node scripts/e2e-creator-reader.mjs
```

Or run the manual workflow **NARATIVA authenticated creator-reader E2E** from GitHub Actions.

Use a dedicated non-admin test account with no production content. The test intentionally creates and deletes a temporary published work and Commerce product. If credentials are missing, the script reports **SKIP**; that is not a passing end-to-end test.
