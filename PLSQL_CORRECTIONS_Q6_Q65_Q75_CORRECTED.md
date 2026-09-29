# Corrected PL/SQL reviewer replacements for Codex (Q6, Q65, Q75)

**This file supersedes `PLSQL_CORRECTIONS_Q6_Q65_Q75_FOR_CODEX.md`. Do not apply that earlier file.** Its Q6 instruction to add `DBMS_OUTPUT.PUT_LINE(x);` and its claim that Q65 D is unavailable are wrong. Compare against the two embedded images in `correction.docx` and apply the replacements below to `PLSQL_questions-1-76_structured.json`. Do not edit other questions or change the reviewer-highlighted keys.

## Question 6: correct choice A's procedure call

**What the reviewer shows:** the highlighted choice connects as `ora2`, declares `x NUMBER:=5`, and calls `ora1.proc1(x);`. The JSON currently omits the `ora1.` schema qualifier. The screenshot does **not** show an extra `DBMS_OUTPUT.PUT_LINE(x);` in choice A; that line belongs to a different, unhighlighted choice. Keep A as the reviewer answer.

Replace Q6 `options[id="A"].text` with the following code, preserving line breaks. The trailing `/` is the script terminator already present in the existing JSON; it is not clearly visible under the highlighted option in the cropped screenshot, so do not claim it was transcribed from the image:

```sql
CONNECT ora2/ora2@pdb1
SET SERVEROUTPUT ON
DECLARE
  x NUMBER := 5;
BEGIN
  ora1.proc1(x);
END;
/
```

Replace Q6 `options[id="A"].explanation` with:

> The script connects as ora2 and calls the procedure owned by ora1 using `ora1.proc1(x)`. This matches the procedure's owner in the setup and passes writable variable x for its OUT NUMBER parameter. An OUT parameter does not receive x's initial value of 5, so the procedure's `v1 * 10` expression does not print 50; this does not make the procedure call invalid.

Replace Q6 `answerExplanation` with:

> Choice A is the reviewer-highlighted script. It connects as ora2, uses the granted EXECUTE privilege to call `ora1.proc1(x)`, and supplies a writable variable for the OUT parameter. The procedure does not assign v1 before reading it, so its multiplication uses NULL; the question asks which script executes successfully, not which prints 50.

Replace Q6 `feedback` with:

> First, ora1 creates `proc1(v1 OUT NUMBER)` and grants ora2 permission to execute it. Choice A connects as ora2, declares x, and calls `ora1.proc1(x)`. The `ora1.` prefix identifies the procedure's owner; `x` is a writable actual argument for OUT. The OUT parameter is not initialized from x's value of 5, so `v1 * 10` uses NULL. The highlighted choice does not contain a later `DBMS_OUTPUT.PUT_LINE(x)` call.

Replace Q6 `technicalNote` with:

> Choice A's `ora1.proc1(x)` is schema-qualified, matching the procedure created by ora1 and the EXECUTE grant to ora2. The OUT parameter does not receive x's initial value of 5, and the procedure does not assign v1 before evaluating `v1 * 10`; this affects output, not the source-highlighted choice's validity as a procedure call.

Leave Q6's other options, `correct: ["A"]`, topic, and scenario unchanged. **Do not add** `DBMS_OUTPUT.PUT_LINE(x);` to choice A.

## Question 65: replace highlighted choice D with the actual associative-array block

**What the reviewer shows:** D is the cyan-highlighted block at lower right of the screenshot. It declares a cursor, then an associative-array type and variable. It assigns `'wheat'` to `product_list(1)` and prints that element. The current JSON instead invents a cursor FOR loop and treats `product_list` as a loop record; replace that transcription and the reasoning based on it.

Replace Q65 `options[id="D"].text` with:

```sql
DECLARE
  CURSOR c_products IS
    SELECT pdt_name FROM products;
  TYPE c_list IS TABLE OF products.pdt_name%TYPE INDEX BY BINARY_INTEGER;
  product_list c_list;
BEGIN
  product_list(1) := 'wheat';
  DBMS_OUTPUT.PUT_LINE(product_list(1));
END;
/
```

The cursor is declared but not used by the executable statements. Do not introduce `FOR product_list IN c_products LOOP` or `product_list(1)` as a cursor-record access. Preserve `format: "sql"` and `correct: true` for D.

Replace Q65 `options[id="D"].explanation` with:

> `product_list` is an associative array indexed by integers. The assignment `product_list(1) := 'wheat'` creates element 1, and `DBMS_OUTPUT.PUT_LINE(product_list(1))` reads and prints that value. The declared cursor is unused; it does not turn `product_list` into a cursor-loop record.

Replace Q65 `answerExplanation` with:

> The reviewer highlights C and D. In C, the procedure receives the record value supplied by its default expression, subject to Oracle-version support for that record syntax. In D, an integer-indexed associative array is declared; assigning `'wheat'` to element 1 and then reading element 1 prints `wheat`. D does not contain a cursor FOR loop.

Replace Q65 `feedback` with:

> Compare the collection types before following the executable lines. A nested table or varray declared without a constructor is uninitialized. An associative array declared with `INDEX BY BINARY_INTEGER` can gain an element when code assigns a value at a key. In choice D, `product_list(1) := 'wheat'` creates element 1 and the next line prints it. The cursor declaration is not used.

Replace Q65 `technicalNote` with:

> Choice C's default record expression may depend on the Oracle release's support for qualified record expressions. Choice D does not have the cursor-record indexing problem described in the previous JSON: the corrected reviewer code indexes an associative array, not a cursor FOR-loop record.

Leave Q65's other choices, `correct: ["C", "D"]`, topic, and stem unchanged. Remove the previous claim that D is invalid because a cursor-loop variable is a record.

## Question 75: improve beginner-facing explanations without inventing a product

The source highlights A (`Category`) but does not name the application. Do not imply that the other dimensions are universally ineligible. Keep `correct: ["A"]`, all option texts, and the stem unchanged. Replace only the fields below.

- Q75 `options[id="A"].explanation`:

> Category is the reviewer-highlighted answer to this application's audit-trail setting. A dimension is a way an application organizes data; here the question asks which dimension can be selected when activating its data audit trail. Because the application is not identified, the screenshot does not provide a product rule that explains why Category is eligible.

- Q75 `options[id="B"].explanation`:

> Account is not the highlighted answer. Account may be a data dimension in an application, but merely being a dimension does not establish that this unnamed application's audit trail can be activated for it. The question provides no product-specific rule to prove that comparison.

- Q75 `options[id="C"].explanation`:

> Time is not the highlighted answer. A change can have a timestamp, but the time of an audit event is different from a dimension on which an application lets you activate auditing. The screenshot does not identify the application's available settings.

- Q75 `options[id="D"].explanation`:

> Entity is not the highlighted answer. Entity can identify a member of an application's data model, but the screenshot does not show whether that application permits audit activation for Entity. Do not treat the reviewer verdict as a universal rule for every product.

- Q75 `answerExplanation`:

> The reviewer highlights A, Category. This is a question about an application's audit configuration, not a general PL/SQL syntax rule. The application is unnamed, so the source key supports scoring A but does not independently establish a product-wide rule excluding Account, Time, or Entity.

- Q75 `feedback`:

> An audit trail records changes to data. A dimension is a category used to organize that data, while an audit-activation setting determines which changes the application records. The reviewer identifies Category as the setting tested here. Because the application is not named, learn the source answer without generalizing it to all Oracle products.

- Q75 `technicalNote`:

> The question does not name the application or provide its audit-configuration documentation. Category is the reviewer-highlighted answer; the screenshot alone does not establish why that product permits Category rather than Account, Time, or Entity.

## Mandatory verification and completion report

1. Parse the resulting JSON and compare it with the input: only Q6 option A text/explanation and its three question-level explanation fields; Q65 option D text/explanation and its three question-level explanation fields; and Q75 four option explanations and its three question-level explanation fields may change.
2. Confirm 76 question IDs remain, and scoring keys remain Q6 `A`, Q65 `C,D`, Q75 `A`. Do not change `options[].correct` or any other question.
3. Visually compare Q6's `ora1.proc1(x);` with the highlighted screenshot and verify no added output line in A. Visually compare Q65 D's type, assignment, and output with the cyan-highlighted screenshot. Preserve readable multiline code in the website.
4. In Practice, explanations and `feedback` appear only after confirmation; in Mock, only in post-submit review. Report the exact fields changed and any screenshot text too small to verify instead of silently filling it in.
