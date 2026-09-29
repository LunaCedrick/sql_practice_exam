# CODEX_PLSQL_IMPLEMENTATION_PROMPT_UPDATED.md

## Goal
Implement the Oracle PL/SQL reviewer in the **existing** Oracle SQL practice-exam website using the already-structured `PLSQL_questions-1-76_structured.json`. Match the SQL reviewer's clean, readable question display. This task is **application integration and presentation, not extraction, rewriting, reclassification, or restructuring of the JSON**. The revised JSON is the source of truth. Preserve the SQL reviewer and its current behavior.

## Read first
1. Inspect the actual repository versions of `index.html`, `js/app.js`, `js/questionBank.js`, the existing SQL JSON banks, and `data/PLSQL_questions-1-76_structured.json`. The attached app files are reference snapshots; work on the repository's current files. If the structured JSON is not yet in `data/`, put an unchanged copy there.
2. The earlier `CODEX_PLSQL_IMPLEMENTATION_PROMPT.md` was written **before** the structured JSON existed. Its instructions to normalize the JSON are superseded by this document. The SQL `CODEX_IMPLEMENTATION_PROMPT.md` describes the original SQL behavior, but current repository code takes precedence where the old prompt differs.
3. Avoid modifying question text, options, answer keys, topic labels, code, table values, explanations, `feedback`, or technical notes. If a display issue exposes a source-data ambiguity, report it instead of silently correcting it.

## Bank contract and integration
- `PLSQL_questions-1-76_structured.json` contains exactly 76 questions with IDs 1–76, all currently `available: true` and `scorable: true`; there are 16 distinct topic labels. `feedback` is present on all 76 questions. Questions 52 and 58 contain visible `[image cut off]` text: display that text as-is and never invent the missing material.
- Keep the SQL and PL/SQL banks separate. Their numeric question IDs may overlap. Use a reviewer-scoped key (or the existing reviewer-scoped session) for answers, confirmations, flags, resume data, scoring, and analytics. Switching reviewers must not mix progress or answers.
- Load the PL/SQL JSON from its actual path via the existing question-bank loader; validate that it loads, has unique IDs 1–76, and has consistent option IDs and `correct` arrays. Show a useful load error rather than a blank screen. Do not reintroduce a hard-coded question array.
- Use the JSON's `settings.mockQuestionCount` as the PL/SQL mock count: **65** (or the number of scorable questions if fewer). Remove duplicated PL/SQL `65` literals from app logic and UI labels; derive the displayed number from the same setting. Practice shows all 76 in source order. Quick Quiz follows the site's existing five-question behavior. Preserve SQL's existing mock size and logic.

## Exact question display contract: how EACH question is formatted
Use the same consistent hierarchy for every question, omitting only fields that are empty:

1. **Question header:** show `Question {id}` and a clearly readable `topic` chip. Display current session position separately from the source ID; a randomized mock may show "Question 7 of 65" while the actual question is "Source question 53". Do not renumber the source question.
2. **Question stem:** render `stem` as the main bold/prominent question text. Render `instruction` directly beneath it (for example, "Choose two."). Do not place answer explanations in the question body.
3. **Scenario/context sections:** render `sections` in array order. A text section uses its optional title and readable paragraph spacing. A `sql-sequence` section renders each `items[]` entry in exact order as a separate dark monospaced SQL/PLSQL statement panel followed immediately by its own light, preformatted result panel. Never combine results from different statements or move them beneath all code. Q6 exercises this layout and has an additional text context section after the sequence.
4. **Structured tables:** render each `tables[]` object separately, in array order, with `title`, ordered `columns` as headers, and ordered `rows` as cells. Use a light table card, subtle gridlines or row dividers, readable padding, and horizontal scrolling on narrow screens. Do not convert tables into plain paragraphs, collapse empty cells, change `NULL` to an empty cell, or merge multiple tables. Q11, Q13, Q14, Q16, Q35, Q45, Q53, and Q62 contain structured table descriptions.
5. **Question code:** render each `codeBlocks[]` item as a separate titled dark monospaced panel, in array order. Preserve the exact `code` characters, blank lines, line numbers, indentation, comments, punctuation, and slash terminators. Provide safe horizontal overflow for long lines, and allow text selection/copying. Do not prettify or "fix" invalid syntax: invalid code may be the point of the question. Q1, Q4, Q11, Q13, Q35, Q45, Q52, Q53, Q62, and Q72 are useful checks.
6. **Answer choices:** display each `options[]` item as an individually selectable A/B/C... card, preserving its `id` and original order in Practice. Use radio controls for `type: "single"` and checkboxes for `type: "multi"`. For `format: "sql"`, show the *entire* `option.text` in a preformatted, monospaced block inside that option card; preserve every newline, indentation level, quote, and operator. For `format: "text"`, show normal readable text. Never infer code formatting from the text or truncate long choices. Examples with code choices include Q14, Q58, Q63, Q68, and Q72.
7. **Navigation:** keep Previous/Next and question-list controls available without covering content. The question body may scroll; options and any confirm control must remain reachable by keyboard and on mobile. Use visual spacing to distinguish stem, tables, source code, and options.

**Normal layout order:** header -> stem -> instruction -> sections -> tables -> codeBlocks -> options. The JSON already uses this field separation. If a question needs a different interleaving than the current schema can express, do not invent a new sequence or change source data silently; report the limitation. The header, topic, and question context are visible before answering, but answers and walkthroughs are not.

### Display examples from the actual PL/SQL bank
- **Q11:** topic chip -> stem/instruction -> four-row EMPLOYEES table -> numbered PL/SQL code panel -> answer cards. Do not omit the EMP_ID row.
- **Q14:** PRODUCTS table -> five separate answer cards; code-formatted options stay inside their respective cards. The reviewer key is A and E, but that is hidden until confirmation/submission.
- **Q6:** first statement -> its result -> GRANT statement -> its result -> additional context -> answer cards. The output panel must not be styled as executable SQL.
- **Q53:** PRODUCTS table -> procedure/calling block code -> answer cards. Preserve source spelling such as `PRICES` and `VARCHAR(10)` exactly as recorded; do not "repair" it while rendering.
- **Q58:** multiline SQL/PLSQL option cards, including the `[image cut off]` marker where it occurs. Do not complete the clipped choice.
- **Q72:** declaration code block -> code answer choices; preserve CLOB declarations and code indentation.

## Feedback and explanation timing
**Before answer confirmation or exam submission:** display only question content and selectable choices. Never expose `correct`, `options[].correct`, `options[].explanation`, `feedback`, `answerExplanation`, or `technicalNote` in visible UI, attributes, tooltips, or assistive text. The client-side JSON necessarily contains keys, but the UI must not reveal them prematurely.

**Practice Mode:** after the user presses Confirm/Submit for a question, freeze that question's selection and show, in this order:
1. Correct/Incorrect status and official answer letters from `correct`.
2. The PL/SQL `feedback` text under **How to read the code** for code-based questions or **How to read the concept** for conceptual questions. This is a learning walkthrough, not the answer key; show it exactly once.
3. Each option's reviewer verdict and its own `options[].explanation`, associated with the original option ID, including options the user did not select.
4. `answerExplanation` under **Overall explanation**.
5. `technicalNote`, if nonempty, in a visually distinct **Technical note** panel after all explanations. It is informational and must never change the score.

**Mock Exam and Quick Quiz:** no correctness, walkthrough, or explanations while the attempt is active. After final submission, show the reviewer-specific results and let the user review every question (correct, incorrect, and unanswered) with the same walkthrough/choice explanations/overall explanation/technical note. Preserve choice IDs even if choices were shuffled for the exam.

## Scoring, results, and state
- Score only against `question.correct` (a set of option IDs); a multi-answer question is correct only when the selected set exactly matches the official set. Never score using explanations, `feedback`, or `technicalNote`. The source-highlighted keys must remain unchanged, including Q14 `A,E`, Q57 `C,E,G`, and Q61 `D,E,G`.
- For each reviewer, show score, correct/incorrect/unanswered, strongest and weakest topics, and topic accuracy derived from the questions **actually in that attempt**. Do not mix SQL topics into PL/SQL results. Display unanswered separately; do not mislabel unanswered as incorrect. Handle topics with zero answered questions without claiming they are strengths or weaknesses; explain the accuracy denominator in the UI if needed.
- Preserve reviewer-scoped saved progress and flags, including selected option IDs, original runtime order/shuffle, current position, and Practice confirmed state. On resume, previously confirmed Practice questions must remain locked with feedback shown; active mock questions must remain unrevealed.

## Styling, accessibility, and safety
- Match the existing SQL reviewer's visual language: topic chip, dark code cards, light result cards, light table cards, and readable result summaries. Keep the PL/SQL interface consistent without redesigning SQL.
- Preserve whitespace for `codeBlocks[].code`, `sections[].items[].sql`, result text, and SQL-formatted `options[].text` (for example with `pre/code` or equivalent `white-space: pre-wrap`/controlled horizontal scrolling). A CSS change is required if the current `.option-code` style collapses multiline indentation.
- Ensure code and tables remain legible on narrow screens; no clipped characters, obscured controls, or unintended page-wide overflow. Use semantic table headers, keyboard-operable radio/checkbox controls, visible focus, and accessible status text.
- Treat all bank strings as untrusted text. Escape HTML or use DOM text nodes for stem, section text, code, result, table cells, choices, walkthroughs, explanations, and notes. Test `<`, `>`, `&`, apostrophes, and PL/SQL labels; never inject raw JSON text into HTML.
- Do not use a hidden answer hint. Do not alter question data to make UI implementation easier.

## Validation checklist (must execute and report)
1. Validate JSON parsing, 76 unique IDs 1–76, 16 topic labels, expected arrays, and every `correct` ID matching a choice's `correct: true` flag. Confirm Q14/Q57/Q61 keys and Q52/Q58 cut-off markers remain unchanged.
2. Start PL/SQL Practice: verify all 76 in source order, source question number/topic visible, no answer leak; inspect Q6, Q11, Q14, Q53, Q58, Q72 for complete code/table/option formatting.
3. Confirm a Practice answer: walkthrough appears once and only after Confirm; all option explanations, overall explanation, and technical note appear in the correct order. Navigate away and resume to verify persisted state.
4. Start PL/SQL Mock: verify 65 randomized scorable questions, no pre-submit answer leak, correct post-submit review for correct/incorrect/unanswered items. Quick Quiz uses five. Check shuffled multi-answer scoring by IDs.
5. Verify PL/SQL results use the 16 PL/SQL topics represented in the attempt, with coherent denominators; switch to SQL and verify SQL counts, rendering, scoring, and results remain unchanged.
6. Inspect mobile layout, keyboard navigation, multiline option code, table overflow, HTML escaping, and browser console. If the site is opened via `file://` and fetch fails, explain the need for the project's existing local serving approach rather than silently hiding the load error.

## Deliverables
- Update the existing app loader/rendering/CSS only as needed; install the unchanged `PLSQL_questions-1-76_structured.json` at the path actually used by the app. Do not regenerate the PL/SQL bank.
- Report changed files, the actual bank path, tests run/results, and any unresolved display or source-data limitations. State explicitly that the question content, answer keys, and topics were not modified.
