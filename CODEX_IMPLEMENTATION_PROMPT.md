# CODEX_IMPLEMENTATION_PROMPT.md

## Project Overview

You are modifying an existing Oracle SQL mock exam website.

The current website contains a hard-coded JavaScript BANK array of 100 questions.

Replace the embedded question bank with external JSON files.

### Question Bank Files

- questions-1-50.json
- questions-51-100.json
- questions-101-150.json
- questions-151-200.json
- questions-201-249.json

These files collectively represent the official Oracle SQL reviewer.

Scoring MUST use the document-highlighted answers stored in each JSON file.

---

## JSON Schema

Each question contains fields such as:

```json
{
  "id": 1,
  "available": true,
  "scorable": true,
  "topic": "Privileges and Roles",
  "stem": "Question text",
  "instruction": "Choose two.",
  "type": "single | multi | unavailable",
  "sections": [],
  "tables": [],
  "codeBlocks": [],
  "options": [],
  "correct": ["A","C"],
  "answerExplanation": "...",
  "technicalNote": "..."
}
```

---

# Practice Mode Requirements

## Question Loading

- Load ALL available questions.
- Preserve the original sequence.
- Display Question 1 through Question 249.
- Question 87 exists but is unavailable.
- Do not renumber anything.

## Question 87

Display:

```text
Question unavailable in supplied reviewer.
```

- No answer controls.
- Not included in scoring.

## Immediate Feedback

Practice mode MUST show results immediately after pressing Submit/Confirm.

Display:

- Correct / Incorrect banner
- Official answer(s)
- Explanation for every choice
- Overall answer explanation
- Technical note (if present)

### Example

A. Incorrect
Explanation...

B. Correct
Explanation...

C. Incorrect
Explanation...

D. Incorrect
Explanation...

---

# Mock Exam Requirements

## Random Exam

- Randomly select 63 questions.
- Exclude unavailable questions.
- Randomize question order.
- Randomize answer-choice order.

## Submission

Show:

- Total score
- Correct count
- Incorrect count
- Unanswered count
- Topic performance

---

# Rendering Rules

Render question content in this order:

1. Stem
2. Sections
3. Tables
4. SQL code blocks
5. Answer choices

---

# Table Rendering

Questions may contain:

```json
"tables": [
  {
    "title": "EMPLOYEES table",
    "columns": [...],
    "rows": [...]
  }
]
```

Render as responsive HTML tables.

Requirements:

- Mobile friendly
- Horizontal scroll allowed
- Preserve column order
- Preserve row order

---

# SQL Rendering

Questions may contain:

```json
"codeBlocks": [
  {
    "title": "Query",
    "language": "sql",
    "code": "SELECT ..."
  }
]
```

Display using styled code blocks.

Requirements:

- Preserve whitespace
- Preserve indentation
- Preserve line breaks
- Easy copy/paste

---

# Scoring Rules

Use only:

```json
"correct": [...] 
```

for scoring.

Do NOT infer answers.

Do NOT use technical notes for score calculation.

Always use document-highlighted answers.

---

# Technical Notes

Some questions contain:

```json
"technicalNote": "..."
```

Show AFTER explanations.

Visual style:

- Yellow warning box
- Not part of score
- Informational only

---

# Topic Analytics

Display:

- Strongest topics
- Weakest topics
- Accuracy by topic
- Total attempts by topic

Use question.topic.

---

# Architecture Requirements

Remove hard-coded BANK array.

Use:

```text
/data/questions-1-50.json
/data/questions-51-100.json
/data/questions-101-150.json
/data/questions-151-200.json
/data/questions-201-249.json
```

Load asynchronously.

Combine into one runtime bank.

---

# Dynamic Counts

Do NOT hardcode:

- 100 questions
- 249 questions
- 63 questions in UI text

Counts must be derived dynamically.

---

# Validation Checklist

Before completion ensure:

- Questions 1-249 load.
- Question 87 unavailable.
- No duplicate IDs.
- SQL blocks render.
- Tables render.
- Per-choice explanations display.
- Technical notes display.
- Practice mode uses original order.
- Mock exam uses 63 random questions.
- Scoring uses JSON correct answers only.
- No hard-coded BANK remains.

---

# Final Deliverables

Provide:

- Updated index.html
- Supporting JavaScript modules
- JSON loader
- Runtime question-bank merger
- Practice mode implementation
- Mock exam implementation
- Topic analytics
- Responsive rendering for tables and SQL blocks
