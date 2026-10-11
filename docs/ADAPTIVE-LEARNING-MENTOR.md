# NARATIVA Adaptive Learning Mentor

Status: **Phase A — local, rules-based personalization**. This document distinguishes shipped behavior from the future live-model system.

## User promise

The Creative Learning Room should take a learner from first principles to professional/expert practice. The mentor must respond to the learner's actual case, target deliverable, skill level, chosen tool, and observed evidence. A generic tutorial that changes only the software name is not sufficient.

## Implemented in Phase A

- Skill level: beginner, intermediate, advanced, expert.
- Outcome context: social, portfolio, client/commercial, print, deep learning, production.
- Problem context: tonal exposure, color, composition, detail/retouch, workflow, export, story/audio, typography, or uncertain diagnosis.
- Output intent: natural/accurate, cinematic, clean/professional, accessible, consistent, or delivery-ready.
- Case-specific intervention guidance that changes by selected software family and problem type.
- Goal and output-specific quality checks.
- Step-level self-evaluation, retry guidance, and best-effort progress saved in browser localStorage.
- Official software learning/documentation links surfaced next to the lesson.
- Image analysis remains local and limited to simple pixel-level measurements; the system does not claim semantic image understanding.
- No uploaded photo is sent to an AI provider in this phase.

## Knowledge-source policy

Do not claim to have ingested “all knowledge” or the whole internet. Maintain a curated, traceable source catalog:
1. Official product manuals and vendor training materials for current UI/workflows.
2. Open-source manuals and tutorials under their applicable terms.
3. Technical standards and specifications relevant to the deliverable (color management, codecs, accessibility, print, file formats).
4. Peer-reviewed research or reputable technical publications for deeper theory.
5. Case studies with source attribution, publication date/version, and explicit applicability limits.

Every ingested document should carry: canonical URL, title, publisher/author, publication/update date if available, software/version applicability, license/usage status, retrieval timestamp, language, topic tags, and checksum. Keep copyright restrictions; index snippets/metadata where redistribution is not permitted rather than copying entire paid manuals. User work remains private unless they explicitly opt into sharing.

## Target architecture for a real AI mentor

1. **Case intake:** tool, goal, skill level, deliverable specs, symptom, constraints, optional user-approved image/file.
2. **Evidence collection:** local measurements and/or vision model only when explicitly enabled; ask for missing facts instead of inventing them.
3. **Knowledge retrieval (RAG):** retrieve a small set of version-relevant sources; pass citations and relevant excerpts to the model.
4. **Planning:** produce a lesson plan with prerequisite map, one actionable step at a time, why it works, alternatives, risks, expected result, and a verification test.
5. **Tutor loop:** user reports result or submits a revised artifact; compare evidence with target and branch to troubleshooting, remediation, or next skill.
6. **Mastery assessment:** practical artifact, rubric, explanation of decisions, transfer task, and delayed review—not just clicking “success”.
7. **Quality control:** cite factual/technical claims; distinguish verified facts, heuristics, and creative preferences; never invent software menu names or standards.
8. **Provider abstraction:** model vendors must be replaceable. API keys remain server-side in Supabase secrets. Never ship keys in GitHub Pages JavaScript.
9. **Safety/cost:** authentication or abuse controls, per-user rate limits, token/image-size caps, timeout, cancellation, audit metadata without storing private media unnecessarily, cost limits, and explicit consent for remote analysis.
10. **Evaluation:** test across software versions, beginner/expert cases, accessibility, localization, factual accuracy, source citation correctness, and whether users can complete the task. A green deploy is not proof of pedagogical quality.

## Expert-level lesson contract

Each substantive lesson should contain:
- Learning objective and prerequisites.
- Mental model / underlying principle.
- Step-by-step action tied to the selected tool and version.
- Why the action works.
- At least one alternative and when to choose it.
- Failure modes and diagnostic branches.
- A concrete expected result and observable acceptance criteria.
- Practice task, self-check, and transfer challenge.
- Citations to relevant authoritative sources.
- Clear boundaries: when a human specialist or different tool is required.

## Current limitations and next phases

- Phase A does not call a live language/vision model; personalization is a local rule engine. Its guidance is more contextual than the previous fixed tutorial, but cannot be described as expert AI reasoning.
- No semantic image understanding, live screen observation, external app control, or automated software operation is connected.
- Official links are references; the application has not automatically ingested every linked page.
- Browser-local progress is device/browser-specific and is not synced between accounts/devices.
- Next: add a secure Supabase Edge Function with a server-side AI provider secret; introduce source-indexing/retrieval, versioned curriculum records, grounded response schema, citations, usage controls, and automated evals. Enable remote image analysis only after explicit consent and budget/security controls.
