# ReviewOps Demo Plan

## One-line pitch
ReviewOps is an internal eCommerce review operations console. Codex reads raw customer reviews, normalizes hidden tags/themes, powers semantic search, drafts responses to negative reviews, and proposes merchant-facing product copy changes for human approval.

The demo is not "AI search" and not "AI chat." The highlight is that Codex uses MCP tools to prepare real changes inside the app, while the human reviews and approves them.

---

## Demo goal
Show two things clearly:

1. Codex can be embedded into a real web app workflow.
2. Codex + MCP can do multi-step business work beyond a single prompt.

The strongest visible loop is:

- merchant searches reviews in natural language
- Codex-organized hidden metadata makes search much better
- Codex notices a repeated issue like sizing complaints
- Codex proposes a product-page change such as "Runs small; consider sizing up"
- merchant clicks approve
- storefront updates

That gives a clean before/after moment.

---

## Core product concept
The app has two surfaces:

### 1) Internal admin / ops console
Used by the merchant team.

This is where Codex work is visible:
- ingest and browse reviews
- natural-language review search
- hidden normalized tags/themes
- grouped complaint clusters
- proposed actions queue
- approve / reject / edit actions
- audit log of every AI action

### 2) Storefront product page
Used for the wow moment.

This page should visibly show:
- product title, image, price, description
- customer reviews
- average rating
- product FAQ or “fit notes” section

This is where an approved Codex suggestion visibly changes the page, for example:
- before: standard description only
- after approval: “Fit note: runs small; consider sizing up”

That closes the loop from review text -> structured insight -> approved action -> live storefront impact.

---

## Seed data (keep it tiny)
Use 3 to 5 products and ~20 reviews total.

Example product set:
- Premium Hoodie
- Everyday Tee
- Ceramic Mug
- Baseball Cap

Example repeated review themes:
- hoodie runs small
- tee is very soft / comfortable
- mug packaging issue on arrival
- shipping delay complaints
- cap quality praise

This is enough for:
- semantic search
- tag normalization
- review clustering
- negative review response drafting
- product copy suggestion

---

## User roles

### Merchant admin
Can:
- sign in
- search reviews
- run Codex analysis
- inspect proposed actions
- approve/reject/edit proposals
- publish approved storefront changes

### Storefront visitor
Can:
- browse product page
- read product description
- read reviews
- see updated fit note / FAQ once approved

---

## Main user flows

## Flow A: Search and trust-building
1. Admin signs in.
2. Searches: “show me hoodie reviews about sizing”.
3. Results include reviews that say things like “runs tiny”, “too tight”, and “fit was off”.
4. UI shows why they matched:
   - review text
   - semantic similarity
   - hidden normalized tag: `Sizing Issue`
   - related product: Premium Hoodie

Why this matters:
It proves the hidden structured layer improves retrieval beyond raw keyword search.

## Flow B: Run ReviewOps agent
1. Admin clicks “Analyze new reviews”.
2. Codex uses MCP tools to:
   - fetch unprocessed reviews
   - classify themes
   - normalize tags
   - cluster similar complaints
   - draft responses for bad reviews
   - create suggested product-copy updates
   - write proposals into the app
3. UI streams progress and then shows a proposal queue.

## Flow C: Approve a storefront change (wow moment)
1. Proposal appears:
   - Type: Product copy update
   - Product: Premium Hoodie
   - Suggested change: add fit note: “Runs small; consider sizing up”
   - Reason: 6 recent reviews mention small/tight fit
2. Admin clicks approve.
3. App publishes the change.
4. Storefront product page refreshes and visibly shows the new fit note.

## Flow D: Review response drafting
1. Negative reviews are flagged.
2. Codex drafts brand-safe responses.
3. Admin reviews and approves one.
4. App marks it as ready to send or saved as approved draft.

---

## Pages / screens to build

## 1. Auth pages
Keep simple:
- login
- optional seeded admin user

## 2. Admin dashboard
Cards:
- total products
- new reviews awaiting analysis
- negative reviews needing response
- pending proposals
- latest approved changes

Sections:
- “Run Codex ReviewOps” button
- recent actions feed
- quick search bar

## 3. Review intelligence page
Main demo page.

Layout suggestion:
- top: natural-language search bar
- left: results list
- center: selected review / cluster detail
- right: AI insights + proposed actions

For each result show:
- star rating
- product
- review text
- normalized hidden tags
- sentiment
- severity
- matched because...

## 4. Proposal queue page
Each proposal card should show:
- proposal type
- affected product/review
- suggested change
- rationale
- confidence
- approve / reject / edit buttons

Proposal types:
- merge tags
- assign tags to reviews
- draft response to low-rating review
- escalate issue
- product description update
- FAQ / fit note addition

## 5. Storefront product page
This is the visual payoff.

Show:
- product hero
- title / price
- description
- reviews
- fit note / FAQ / highlights section

Make the approved AI change land here.

## 6. Audit log page
Show each agent action and each human approval.
This reinforces trust and makes the workflow feel enterprise-ready.

---

## Data model (minimal)

### users
- id
- name
- email
- password
- role

### products
- id
- name
- slug
- description
- fit_note (nullable)
- status

### reviews
- id
- product_id
- author_name
- rating
- body
- source
- created_at
- processed_at (nullable)

### review_tags
- id
- name
- normalized_name
- visibility (`internal` / `public`)

### review_tag_assignments
- id
- review_id
- review_tag_id
- confidence
- assigned_by (`agent` / `human`)

### review_clusters
- id
- product_id
- title
- summary
- severity
- review_count

### proposals
- id
- type
- status (`pending`, `approved`, `rejected`, `applied`)
- target_type
- target_id
- payload_json
- rationale
- confidence
- created_by (`agent`)
- approved_by (nullable)
- approved_at (nullable)

### action_logs
- id
- actor_type (`agent`, `human`, `system`)
- action
- target_type
- target_id
- metadata_json
- created_at

### optional: embeddings/search index table
If needed for semantic search storage, depending on implementation.

---

## What Codex should do
Codex should not directly mutate core storefront records first. It should prepare proposals, then humans approve.

Codex responsibilities:
- classify review sentiment and severity
- normalize tag vocabulary
- assign hidden tags to reviews
- cluster repeated themes by product
- identify business actions from clusters
- draft response templates for negative reviews
- suggest product-page copy updates
- suggest FAQ / fit-note changes
- write proposals and rationale back into the app

Human responsibilities:
- approve/reject/edit proposals
- publish changes to storefront
- optionally send or save response drafts

This is the right trust model for the demo.

---

## MCP tools to build
Keep this small and purposeful. The OpenAI best-practices page says to start with only a few tools that unlock a real workflow, not every possible tool.

### MCP tool group A: Read tools
These provide the agent with business context.

#### 1. `list_products`
Returns products and key metadata.

Use cases:
- identify which product a review cluster belongs to
- propose copy changes to the correct item

#### 2. `get_product`
Returns one product’s full details.

#### 3. `list_reviews`
Returns reviews, optionally filtered by:
- product
- rating threshold
- processed/unprocessed
- date range

#### 4. `search_reviews`
Optional helper if you want server-side retrieval.
Can return:
- raw review text matches
- semantic matches
- associated tags
- associated product metadata

#### 5. `get_review_cluster_candidates`
Returns pre-grouped review candidates or raw reviews for clustering.

### MCP tool group B: Proposal-writing tools
These are the most important tools.

#### 6. `create_tag_merge_proposal`
Payload:
- source tags
- target normalized tag
- rationale

#### 7. `create_review_tag_proposal`
Payload:
- review ids
- normalized tag
- confidence
- rationale

#### 8. `create_review_response_proposal`
Payload:
- review id
- response draft
- tone
- rationale

#### 9. `create_product_copy_change_proposal`
Payload:
- product id
- proposed field (`description`, `fit_note`, `faq`, etc.)
- before
- after
- supporting review ids
- rationale

This is the key wow tool.

#### 10. `create_escalation_proposal`
Payload:
- cluster or review ids
- severity
- recommended escalation reason

### MCP tool group C: Approval / apply tools
Use these only after explicit human approval in the UI.

#### 11. `approve_proposal`
Marks proposal approved.

#### 12. `apply_proposal`
Applies proposal to the live system.
Examples:
- merge tags
- assign tags
- update product fit note
- save approved response draft

#### 13. `reject_proposal`
Marks rejected with optional note.

### MCP tool group D: Logging tools

#### 14. `log_action`
Structured audit entry for every meaningful agent action.

---

## Suggested agent workflow

### Agent job: `analyze_new_reviews`
1. Call `list_reviews` for unprocessed or recent reviews.
2. Call `list_products` or `get_product` as needed for context.
3. Infer themes, sentiment, and severity.
4. Group similar issues by product.
5. Normalize likely duplicate tags.
6. Draft proposals instead of applying changes.
7. Call `create_*_proposal` tools to store all suggestions.
8. Call `log_action` for traceability.

### Agent job: `improve_storefront_for_product`
Triggered when a cluster is strong enough.

1. Read product details.
2. Read related review cluster.
3. Decide whether to suggest:
   - fit note
   - FAQ entry
   - description update
4. Create proposal with supporting evidence.

### Agent job: `draft_negative_review_responses`
1. Fetch low-rated reviews.
2. Draft empathetic, brand-safe responses.
3. Store as proposals.

---

## Search experience
The search box should feel magical but understandable.

### Search sources
Search should use a combination of:
- raw review text
- product title and description
- hidden normalized tags
- cluster summaries
- optional embeddings for semantic similarity

### Example queries to demo
- “hoodie reviews about sizing”
- “bad reviews mentioning shipping”
- “positive reviews about comfort”
- “quality complaints for the mug”

### Search result explanation
For each result, explain why it matched:
- semantic match to review text
- hidden tag match: `Sizing Issue`
- related cluster match
- product description overlap

This keeps the experience interpretable.

---

## What to show on the storefront page
This page should be visually polished even if simple.

### Product page blocks
- title
- image
- price
- short description
- fit note / shopper guidance
- reviews list
- average rating
- optional FAQ

### Best demo change
Before:
- no fit note

After approval:
- “Fit note: Customers say this hoodie runs small. Consider sizing up for a roomier fit.”

That is instantly understandable and visibly tied to review intelligence.

Other possible approved changes:
- FAQ: “Is this mug dishwasher safe?”
- shipping/packaging reassurance note
- “customers love the softness” highlight

---

## Demo script outline

### Part 1: product problem
Open admin console and say:
- “We have lots of reviews, but the useful signal is buried.”

### Part 2: semantic retrieval
Search “hoodie runs small” and show:
- reviews with “too tight”, “fit was off”, “runs tiny”
- hidden tag `Sizing Issue`

### Part 3: Codex action
Click “Analyze new reviews” and stream progress.
Then show pending proposals:
- tag merge
- review response draft
- product fit note update

### Part 4: wow moment
Approve the product fit-note proposal.
Open storefront product page.
Show updated fit note live.

### Part 5: trust / governance
Open action log and explain:
- Codex prepared the action
- human approved it
- every step is auditable

---

## Technical architecture recommendation

## Best choice for this hackathon: hosted Laravel app + Codex SDK worker + your own MCP tools

Recommended architecture:
- Laravel app for auth, DB, admin UI, storefront UI
- separate agent service (Node or Python) that runs Codex workflows
- custom MCP server exposing your app/domain actions as tools
- Laravel queues or jobs to trigger agent runs

### Why this is the best fit
You want a hosted web app demo, not a setup that depends on every viewer having a personal Codex subscription or local Codex install.

Use Codex on your side of the system.
The merchant/admin user logs into your app, then your backend/worker invokes the agent workflow.

---

## Which Codex option to use?

### Option A: Codex SDK
Best default for this hackathon.

Use when you want:
- backend orchestration
- automated jobs
- internal workflows
- integration inside your own application

This matches the Codex SDK docs, which describe it as a way to programmatically control local Codex agents and use Codex in CI/CD, internal tools, workflows, and applications.

How it fits here:
- your worker service runs the Codex flow
- the agent uses MCP tools to talk to your app/domain
- the website streams results from that worker back to the UI

### Option B: Codex app-server
Probably overkill for the hackathon unless you want to build a richer Codex-native client.

Use when you want:
- deep integration in your own product
- authentication
- conversation history
- approvals
- streamed agent events

However, the CLI reference also notes `codex app-server` is primarily for development/debugging and may change without notice, so it is not the best “fastest path” for this demo.

### Option C: Codex as an MCP server
Not the primary choice for this project.

This pattern is useful when another agent uses Codex itself as a tool. The official Agents SDK guide shows turning Codex CLI into an MCP server so another agent can call `codex()` and `codex-reply()`.

That is a great pattern for coding workflows, but for this demo your main need is the reverse: Codex should be the agent, and your app should expose MCP tools to it.

---

## Recommended final setup

### For the hackathon build
Use:
- Laravel app
- Codex SDK in a separate worker/service
- custom MCP server for app actions
- API key auth on your side

Do not require each end user to run Codex locally.
Do not require each end user to bring a Codex subscription.

Your demo audience only needs to understand:
- they log into the web app
- Codex powers the operational workflow behind the scenes

---

## Auth / deployment model
There are two separate auth stories here:

### 1. Your app users
Use standard Laravel auth for the website.
These are the merchant/admin users of your demo.

### 2. Codex execution
Use your own backend-side Codex authentication.
OpenAI’s auth docs say Codex can authenticate either with ChatGPT sign-in or an API key, and they explicitly recommend API key auth for programmatic Codex CLI workflows such as CI/CD jobs.

For the hackathon, backend-side API key auth is the cleanest mental model.

---

## Suggested implementation order

### Phase 1: app skeleton
- Laravel auth
- product page
- reviews table
- proposal queue

### Phase 2: basic search
- full-text search over reviews and product descriptions
- hidden tags shown in admin only

### Phase 3: agent proposals
Build only 3 proposal types first:
- tag assignment
- negative review response draft
- product fit-note update

### Phase 4: approval loop
- approve proposal
- apply proposal
- show storefront change live

### Phase 5: polish
- action log
- streaming progress UI
- matched-because explanation in search results

---

## Minimal proposal types for v1
If you need to cut scope, keep only these:

1. `create_review_tag_proposal`
2. `create_review_response_proposal`
3. `create_product_copy_change_proposal`
4. `approve_proposal`
5. `apply_proposal`
6. `log_action`

That is enough for a strong demo.

---

## What success looks like
By the end of the demo, the audience should believe:

- Codex is doing real operational work, not just chatting
- MCP tools make Codex useful inside business software
- human approval makes the workflow trustworthy
- review intelligence can directly improve the storefront

The single best final screenshot is:
- left: admin proposal queue showing “Add fit note: runs small”
- right: storefront hoodie page showing the newly approved fit note live

---

## Open questions to resolve while building
- whether semantic search uses embeddings immediately or starts with full-text + hidden tags
- whether approved response drafts are “saved” only or actually sent anywhere
- whether proposals are applied synchronously or via queue jobs
- whether cluster generation is done fully by Codex or partially by deterministic app logic

Recommendation: keep all of these simple for the hackathon and bias toward visible UX over perfect infrastructure.
