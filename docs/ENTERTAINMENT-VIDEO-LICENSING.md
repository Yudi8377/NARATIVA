# NARATIVA Entertainment — video sourcing and licensing standard

## Product goal

NARATIVA Entertainment combines (1) original video works submitted by NARATIVA creators and (2) videos from external sources that are legally available for the exact way NARATIVA presents them. A video being free to watch does not automatically mean it can be downloaded, rehosted, edited, monetized, or redistributed.

## Allowed presentation methods

Each catalog item must explicitly use one approved method:

- **Official embed/player:** the source platform permits embedding and the video owner/source settings allow it. Keep the original source attribution and do not bypass access controls, ads, age restrictions, or geographic restrictions.
- **Direct playback from an authorized host:** use only a media URL where the host and license permit embedding/playback. Preserve creator attribution and license information.
- **NARATIVA-hosted copy:** only when the rights holder or applicable license explicitly permits downloading, rehosting, and the intended commercial use. Store proof of rights and a copy of the license terms used at review time.
- **Outbound source link:** when embed, hosting, or playback rights are unclear, link to the official item instead of copying or embedding it.

Do not scrape video files, rip streams, bypass DRM, or mirror third-party catalogs automatically.

## License review checklist

For every item, record:

- Stable catalog ID and title
- Creator, rights holder, and source URL
- Media URL or official embed URL, if permitted
- License name and version (or documented public-domain basis)
- License evidence URL and review date
- Required attribution text and link
- Whether commercial use is allowed
- Whether edits/remixes are allowed
- Share-alike or no-derivatives requirements
- Territory, expiration, and any platform-specific restrictions
- Moderation status, age rating, and accessibility metadata
- Reviewer and audit trail

Never infer that an entire site, collection, or repository has one license. Verify each video/file separately.

## License guidance

- **CC0 / verified public domain:** generally the most flexible, subject to jurisdiction and third-party rights such as music, likeness, trademarks, and privacy.
- **CC BY:** reuse, including commercial reuse, is generally allowed when the license conditions and attribution are met.
- **CC BY-SA:** adaptations may need to be distributed under the same or a compatible license.
- **CC BY-NC:** noncommercial-use restriction may conflict with NARATIVA's commercial platform; exclude from commercial placements unless a separate permission is obtained.
- **CC BY-ND:** adaptations are restricted; do not edit, dub, remix, or create derivative versions unless separate permission allows it.
- **“Free to watch” or “no copyright” in a title/description:** not adequate proof. Obtain reliable license evidence.

Creative Commons license deeds: https://creativecommons.org/licenses/
Blender Open Movies: https://studio.blender.org/films/
Wikimedia Commons licensing: https://commons.wikimedia.org/wiki/Commons:Licensing
Internet Archive terms and item metadata: https://archive.org/about/terms.php

## Creator submissions

Before publication, require a rights declaration covering video, soundtrack, voice, images, performances, and any third-party assets. A submission is not a publication approval. Provide a complaint/takedown process, dispute review, and repeat-infringer policy appropriate to the service's markets.

## Data model proposal

Suggested video catalog fields:

- `id`, `title`, `description`, `creator_id`, `creator_display_name`
- `source_type`: creator, open-licensed, public-domain, partner
- `source_url`, `playback_url`, `embed_provider`, `embed_id`
- `license_id`, `license_name`, `license_version`, `license_evidence_url`
- `attribution_text`, `commercial_use_allowed`, `derivatives_allowed`, `share_alike_required`
- `rights_verified_by`, `rights_verified_at`, `rights_review_status`
- `moderation_status`, `age_rating`, `language`, `genre`, `thumbnail_url`
- `published_at`, `visibility`, `created_at`, `updated_at`

Use server-side validation and database row-level security. The client must not be able to mark its own submission as rights-verified or published. Keep a takedown workflow and an audit record for rights-status changes.

## Prototype status

The Entertainment page currently provides:
- A dedicated video discovery interface
- A small sample catalog using official Blender-hosted open-movie assets
- Links to external media discovery and license reference sites
- A local-only creator submission preview that stores data on the current browser only

Not yet implemented:
- Real creator uploads, authenticated submissions, cloud media storage, or a shared catalog
- Automatic source/API ingestion, license verification, moderation, recommendations, or watch history
- Production video hosting, signed playback, content reporting, and rights-management administration

The prototype must not be represented as a complete rights-cleared global video catalog.
