# Corrections for Questions 51–100

## Files

- Replace the earlier bank with `questions-51-100-v2.json`.
- Source correction document: `coorection 51-100.docx`.

## Global Codex rules

1. Preserve the exact question order and IDs 51–100.
2. Keep Question 87 unavailable and excluded from scoring.
3. Render each object in `tables` as a separate responsive table. Never merge two source tables.
4. Render every `codeBlocks` item as formatted SQL in the order stored.
5. Do not put calculated answer results in the question body unless the source question explicitly displays those results.
6. In Practice Mode, show per-choice explanations only after submission.
7. Score only from `correct`. A `technicalNote` explains conflicts but never changes scoring.
8. If the document-highlighted answer conflicts with Oracle SQL behavior, preserve document scoring and clearly state the technical correction in `technicalNote`.

## Corrected questions

### Question 53

- Added the EMP sample-data table.
- Restored the complete aggregate query.
- Kept answer D.
- The explanation now states that a select-list alias cannot be used by GROUP BY in this Oracle SQL context.

### Question 59

- Restored the incomplete SALES query.
- Added the displayed detailed and subtotal output as a structured table.
- Kept answer A: `GROUP BY ch.channel_type, ROLLUP(t.month, co.country_code)`.

### Question 60

- Added separate BRICKS and BRICKS_STAGE structure tables.
- Do not merge the tables in the UI.
- Kept answers A and D.

### Question 62

- Corrected and separated ORDERS and INVOICES tables.
- Corrected the highlighted rows to B and F: `(1, NULL)` and `(4, 01-FEB-2019)`.
- Rewrote every option explanation using complete-row INTERSECT comparison.

### Question 68

- Converted the displayed ENAME/SAL/COMM output into one structured table.
- Kept answer A.

### Question 70

- Replaced the incomplete EMP table with the eight-row ID/NAME/SALARY table from the correction document.
- Removed dictated result rows and calculation from the question body.
- Keep result derivation only in post-submission explanations.
- Kept answer A.

### Question 71

- Restored the CUSTOMERS structure.
- Restored the incomplete SELECT query.
- Kept answers B and C.
- CUST_ID length is not inferred because the image does not show it clearly.

### Question 79

- Split BRICKS and BOXES into separate tables.
- Kept answers A and C.

### Question 85

- Restored DEPT output and EMP output as two separate tables.
- Restored the first query, second query, and evaluated CROSS JOIN query.
- Removed the answer calculation from the question body.
- Kept answer A.

### Question 90

- Corrected the official answers to E and F.
- Explained why C executes but uses default CACHE and therefore does not best reduce possible gaps.
- Preserved the technical distinction in `technicalNote`.

### Question 96

- Preserved the complete EMPLOYEES structure, requirements, and all five query choices.
- Official scoring is C because C is highlighted in the correction document.
- `technicalNote` states that C is invalid because HAVING precedes GROUP BY and that E is the technically correct Oracle SQL query.

### Question 97

- Restored the BOOKS structure, requirements, and exact query choices.
- Official scoring is A and C because those choices are highlighted in the correction document.
- `technicalNote` states that C is syntactically invalid (`OR 1000`) and B is the technically correct second query.

## Validation checklist

- Exactly 50 IDs from 51 through 100.
- Question 87 remains unavailable.
- Q53 has one EMP table and one query.
- Q59 has the incomplete query and displayed ROLLUP output.
- Q60 has two separate structure tables.
- Q62 scores B and F and has two separate data tables.
- Q68 output is a table.
- Q70 contains no dictated result section.
- Q71 has the CUSTOMERS table and incomplete query.
- Q79 has separate BRICKS and BOXES tables.
- Q85 has two output tables and three queries.
- Q90 scores E and F.
- Q96 scores C with the technical correction noted.
- Q97 scores A and C with the technical correction noted.
- Every answer choice has an understandable explanation.
