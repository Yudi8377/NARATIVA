# NARATIVA multi-repository library importer

The importer is implemented in `scripts/library-import.mjs` and runs from the GitHub Actions workflow `.github/workflows/library-import.yml` (manual or weekly). It reads `scripts/library-sources.json`, downloads exact pinned paths from multiple public GitHub repositories, stores assets in `website/library/imported/`, writes per-file `.meta.json` attribution/license metadata, and generates `website/library/import-report.json`.

## Rights and safety gate

- Add only files whose specific reuse license has been reviewed; a repository-level LICENSE is not proof that every asset has that license.
- Only `CC0-1.0`, `CC-BY-4.0`, and `CC-BY-SA-4.0` are accepted by default.
- Every source needs `licenseVerified: true`, a canonical `licenseUrl`, a source URL, an exact file path and a pinned branch/tag/commit where possible.
- Maximum 5 MB per file. Allowed extensions: TXT, Markdown, SVG, PNG, JPG/JPEG, WebP, VTT and SRT. SVGs containing scripts/event handlers are rejected.
- The manifest is intentionally empty until specific files are rights-reviewed. The automation is ready, but it will not scrape arbitrary repositories or claim third-party manga/anime is licensed without evidence.

## Manifest example

```json
{
  "id": "sample-work",
  "title": "Title",
  "author": "Author",
  "repository": "owner/repository",
  "ref": "commit-sha-or-tag",
  "path": "path/to/file.txt",
  "sourceUrl": "https://github.com/owner/repository/blob/main/path/to/file.txt",
  "license": "CC-BY-4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
  "licenseVerified": true,
  "attribution": "Author, Title",
  "contentType": "text"
}
```

The workflow needs no third-party API key for public GitHub raw files. Its repository token can commit imported files because the workflow grants `contents: write`.
