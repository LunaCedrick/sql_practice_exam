import { loadQuestionBank } from "./questionBank.js";

const els = {
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  errorText: document.getElementById("errorText"),
  start: document.getElementById("start"),
  exam: document.getElementById("exam"),
  results: document.getElementById("results"),
  startTitle: document.getElementById("startTitle"),
  startDetails: document.getElementById("startDetails"),
  timer: document.getElementById("timer"),
  qnum: document.getElementById("qnum"),
  topic: document.getElementById("topic"),
  kind: document.getElementById("kind"),
  bar: document.getElementById("bar"),
  questionBody: document.getElementById("questionBody"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  numbers: document.getElementById("numbers"),
  summary: document.getElementById("summary"),
  prevBtn: document.getElementById("prevBtn"),
  flagBtn: document.getElementById("flagBtn"),
  nextBtn: document.getElementById("nextBtn"),
  submitBtn: document.getElementById("submitBtn"),
  mockBtn: document.getElementById("mockBtn"),
  practiceBtn: document.getElementById("practiceBtn"),
  score: document.getElementById("score"),
  correct: document.getElementById("correct"),
  incorrect: document.getElementById("incorrect"),
  unanswered: document.getElementById("unanswered"),
  analytics: document.getElementById("analytics"),
  newTakeBtn: document.getElementById("newTakeBtn"),
  reviewMissedBtn: document.getElementById("reviewMissedBtn"),
  backStartBtn: document.getElementById("backStartBtn"),
  review: document.getElementById("review")
};

let bank = null;
let state = emptyState();

init();

async function init() {
  bindEvents();
  try {
    bank = await loadQuestionBank();
    renderStart();
    show("start");
  } catch (error) {
    els.errorText.textContent = error.message;
    show("error");
  }
}

function bindEvents() {
  els.mockBtn.addEventListener("click", () => begin("mock"));
  els.practiceBtn.addEventListener("click", () => begin("practice"));
  els.prevBtn.addEventListener("click", () => move(-1));
  els.flagBtn.addEventListener("click", toggleFlag);
  els.nextBtn.addEventListener("click", nextAction);
  els.submitBtn.addEventListener("click", submitExam);
  els.newTakeBtn.addEventListener("click", () => begin("mock"));
  els.reviewMissedBtn.addEventListener("click", renderMissedReview);
  els.backStartBtn.addEventListener("click", () => {
    state = emptyState();
    els.timer.textContent = "";
    show("start");
  });
}

function emptyState() {
  return {
    mode: "",
    questions: [],
    index: 0,
    answers: {},
    flags: {},
    confirmed: {},
    startedAt: 0,
    finished: false,
    lastResult: null
  };
}

function renderStart() {
  const total = bank.questions.length;
  const available = bank.availableQuestions.length;
  const unavailable = bank.unavailableQuestions.length;
  const mockCount = Math.min(bank.mockQuestionCount, bank.scorableQuestions.length);

  els.startTitle.textContent = `${total} Question Reviewer`;
  els.startDetails.textContent =
    `Practice mode uses the original sequence and includes unavailable placeholders. ` +
    `Mock exam randomly selects ${mockCount} scorable questions from ${available} available questions. ` +
    `${unavailable} question is marked unavailable.`;
}

function begin(mode) {
  const questions = mode === "practice"
    ? bank.questions.map(question => withRuntimeOptions(question, false))
    : shuffle(bank.scorableQuestions).slice(0, Math.min(bank.mockQuestionCount, bank.scorableQuestions.length))
      .map(question => withRuntimeOptions(question, true));

  state = {
    ...emptyState(),
    mode,
    questions,
    startedAt: Date.now()
  };
  show("exam");
  render();
}

function withRuntimeOptions(question, shuffleChoices) {
  return {
    ...question,
    runtimeOptions: shuffleChoices ? shuffle(question.options) : [...question.options]
  };
}

function render() {
  const question = currentQuestion();
  const progress = ((state.index + 1) / state.questions.length) * 100;

  els.qnum.textContent = `Question ${question.id} (${state.index + 1} of ${state.questions.length})`;
  els.topic.textContent = question.topic;
  els.kind.textContent = kindText(question);
  els.bar.style.width = `${progress}%`;

  renderQuestionBody(question);
  renderOptions(question);
  renderFeedback(question);
  renderNumbers();
  renderSummary();

  els.prevBtn.disabled = state.index === 0;
  els.flagBtn.disabled = !question.available;
  els.nextBtn.textContent = nextText(question);
}

function currentQuestion() {
  return state.questions[state.index];
}

function kindText(question) {
  if (!question.available) return "Unavailable";
  return question.type === "multi" ? "Select all that apply" : "Choose one";
}

function renderQuestionBody(question) {
  if (!question.available) {
    els.questionBody.innerHTML = `
      <p class="stem">Question unavailable in supplied reviewer.</p>
      <div class="unavailable">${escapeHtml(question.answerExplanation || "No question content or answer is supplied.")}</div>
    `;
    return;
  }

  const sections = question.sections.map(renderSection).join("");
  const tables = question.tables.map(renderTable).join("");
  const codeBlocks = question.codeBlocks.map(renderCodeBlock).join("");

  els.questionBody.innerHTML = `
    <p class="stem">${escapeHtml(question.stem)}</p>
    ${question.instruction ? `<p class="instruction">${escapeHtml(question.instruction)}</p>` : ""}
    ${sections}
    ${tables}
    ${codeBlocks}
  `;
}

function renderSection(section) {
  if (typeof section === "string") {
    return `<div class="content-section">${escapeHtml(section)}</div>`;
  }

  const title = section.title ? `<p class="table-title">${escapeHtml(section.title)}</p>` : "";
  const text = section.text || section.content || "";
  return `<div class="content-section">${title}${escapeHtml(text)}</div>`;
}

function renderTable(table) {
  const title = table.title ? `<p class="table-title">${escapeHtml(table.title)}</p>` : "";
  const columns = Array.isArray(table.columns) ? table.columns : [];
  const rows = Array.isArray(table.rows) ? table.rows : [];

  return `
    <div class="table-card">
      ${title}
      <div class="table-wrap">
        <table>
          <thead><tr>${columns.map(column => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.map(row => `<tr>${columns.map((column, index) => `<td>${escapeHtml(cellValue(row, column, index))}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function cellValue(row, column, index) {
  if (Array.isArray(row)) return row[index] ?? "";
  return row?.[column] ?? "";
}

function renderCodeBlock(block) {
  const title = block.title ? `<p class="code-title">${escapeHtml(block.title)}</p>` : "";
  return `
    <div class="code-card">
      ${title}
      <pre><code>${escapeHtml(block.code || "")}</code></pre>
    </div>
  `;
}

function renderOptions(question) {
  if (!question.available) {
    els.options.innerHTML = "";
    return;
  }

  const chosen = state.answers[question.id] || [];
  const disabled = state.mode === "practice" && state.confirmed[question.id];
  const inputType = question.type === "multi" ? "checkbox" : "radio";

  els.options.innerHTML = question.runtimeOptions.map(option => `
    <label class="option ${chosen.includes(option.id) ? "selected" : ""}">
      <input type="${inputType}" name="answer" value="${escapeAttribute(option.id)}"
        ${chosen.includes(option.id) ? "checked" : ""} ${disabled ? "disabled" : ""}>
      <span class="option-letter">${escapeHtml(option.id)}</span>
      <span class="option-text">${renderOptionText(option)}</span>
    </label>
  `).join("");

  els.options.querySelectorAll("input").forEach(input => {
    input.addEventListener("change", event => selectAnswer(question, event.target));
  });
}

function renderOptionText(option) {
  if (option.format === "sql") {
    return `<code class="option-code">${escapeHtml(option.text || "")}</code>`;
  }
  return escapeHtml(option.text || "");
}

function selectAnswer(question, input) {
  const current = state.answers[question.id] || [];
  if (question.type === "single") {
    state.answers[question.id] = [input.value];
  } else {
    state.answers[question.id] = input.checked
      ? [...current, input.value]
      : current.filter(value => value !== input.value);
  }
  render();
}

function renderFeedback(question) {
  const shouldShow = state.mode === "practice" && state.confirmed[question.id] && question.available;
  els.feedback.innerHTML = shouldShow ? feedbackHtml(question) : "";
}

function feedbackHtml(question) {
  const chosen = state.answers[question.id] || [];
  const ok = sameSet(chosen, question.correct);
  const official = question.correct.join(", ");
  const choiceReviews = question.runtimeOptions.map(option => `
    <div class="choice-review">
      <div><strong>${escapeHtml(option.id)}.</strong> <span class="${option.correct ? "good" : "bad"}">${option.correct ? "Correct" : "Incorrect"}</span></div>
      <div>${escapeHtml(option.explanation || "No choice explanation supplied.")}</div>
    </div>
  `).join("");

  return `
    <div class="feedback ${ok ? "correct" : "incorrect"}">
      <h3 class="${ok ? "good" : "bad"}">${ok ? "Correct" : "Incorrect"}</h3>
      <p><strong>Official answer(s):</strong> ${escapeHtml(official)}</p>
      ${choiceReviews}
      ${question.answerExplanation ? `<p><strong>Overall explanation:</strong> ${escapeHtml(question.answerExplanation)}</p>` : ""}
      ${technicalNoteHtml(question)}
    </div>
  `;
}

function technicalNoteHtml(question) {
  return question.technicalNote
    ? `<div class="technical-note"><strong>Technical note:</strong> ${escapeHtml(question.technicalNote)}</div>`
    : "";
}

function renderNumbers() {
  els.numbers.innerHTML = state.questions.map((question, index) => {
    const answered = (state.answers[question.id] || []).length > 0;
    const classes = [
      "num",
      index === state.index ? "current" : "",
      answered ? "answered" : "",
      !question.available ? "unavailable" : "",
      state.flags[question.id] ? "flagged" : ""
    ].filter(Boolean).join(" ");

    return `<button class="${classes}" type="button" data-index="${index}">${question.id}</button>`;
  }).join("");

  els.numbers.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      state.index = Number(button.dataset.index);
      render();
    });
  });

  els.numbers.querySelector(".current")?.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function renderSummary() {
  const answered = state.questions.filter(question => (state.answers[question.id] || []).length).length;
  const flagged = Object.values(state.flags).filter(Boolean).length;
  const unavailable = state.questions.filter(question => !question.available).length;
  els.summary.textContent = `Answered ${answered}/${state.questions.length} - Flagged ${flagged} - Unavailable ${unavailable}`;
}

function nextText(question) {
  if (state.mode === "practice" && question.available && !state.confirmed[question.id]) return "Confirm";
  return state.index === state.questions.length - 1 ? "Finish" : "Next";
}

function nextAction() {
  const question = currentQuestion();

  if (state.mode === "practice" && question.available && !state.confirmed[question.id]) {
    if (!(state.answers[question.id] || []).length) {
      alert("Select an answer first.");
      return;
    }
    state.confirmed[question.id] = true;
    render();
    return;
  }

  if (state.index === state.questions.length - 1) {
    submitExam();
  } else {
    move(1);
  }
}

function move(delta) {
  state.index = Math.max(0, Math.min(state.questions.length - 1, state.index + delta));
  render();
}

function toggleFlag() {
  const question = currentQuestion();
  state.flags[question.id] = !state.flags[question.id];
  render();
}

function submitExam() {
  const result = calculateResult();
  const unanswered = result.unanswered;

  if (state.mode === "mock" && unanswered && !confirm(`${unanswered} questions are unanswered. Submit anyway?`)) {
    return;
  }

  state.finished = true;
  state.lastResult = result;
  renderResults(result);
  show("results");
}

function calculateResult() {
  const scorable = state.questions.filter(question => question.available && question.scorable);
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  for (const question of scorable) {
    const answer = state.answers[question.id] || [];
    if (!answer.length) {
      unanswered++;
    } else if (sameSet(answer, question.correct)) {
      correct++;
    } else {
      incorrect++;
    }
  }

  const total = scorable.length;
  const percent = total ? Math.round((correct / total) * 100) : 0;

  return {
    total,
    correct,
    incorrect,
    unanswered,
    percent,
    topics: topicStats(scorable)
  };
}

function topicStats(questions) {
  const stats = new Map();
  for (const question of questions) {
    if (!stats.has(question.topic)) {
      stats.set(question.topic, { topic: question.topic, total: 0, correct: 0, incorrect: 0, unanswered: 0 });
    }
    const row = stats.get(question.topic);
    const answer = state.answers[question.id] || [];
    row.total++;
    if (!answer.length) row.unanswered++;
    else if (sameSet(answer, question.correct)) row.correct++;
    else row.incorrect++;
  }

  return [...stats.values()]
    .map(row => ({ ...row, accuracy: row.total ? Math.round((row.correct / row.total) * 100) : 0 }))
    .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total || a.topic.localeCompare(b.topic));
}

function renderResults(result) {
  els.score.textContent = `${result.percent}%`;
  els.correct.textContent = `${result.correct}/${result.total}`;
  els.incorrect.textContent = result.incorrect;
  els.unanswered.textContent = result.unanswered;
  els.review.innerHTML = "";

  const strongest = result.topics.slice(0, 5);
  const weakest = [...result.topics].sort((a, b) => a.accuracy - b.accuracy || b.total - a.total).slice(0, 5);

  els.analytics.innerHTML = `
    <div class="topic-grid">
      ${topicCard("Strongest topics", strongest)}
      ${topicCard("Weakest topics", weakest)}
    </div>
    <h2>Accuracy by topic</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Topic</th><th>Correct</th><th>Incorrect</th><th>Unanswered</th><th>Total attempts</th><th>Accuracy</th></tr></thead>
        <tbody>
          ${result.topics.map(row => `
            <tr>
              <td>${escapeHtml(row.topic)}</td>
              <td>${row.correct}</td>
              <td>${row.incorrect}</td>
              <td>${row.unanswered}</td>
              <td>${row.total}</td>
              <td>${row.accuracy}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function topicCard(title, rows) {
  return `
    <div class="topic-card">
      <h3>${escapeHtml(title)}</h3>
      ${rows.length ? rows.map(row => `
        <div class="topic-row">
          <span>${escapeHtml(row.topic)}</span>
          <strong>${row.accuracy}% (${row.correct}/${row.total})</strong>
        </div>
      `).join("") : "<p>No scored topics yet.</p>"}
    </div>
  `;
}

function renderMissedReview() {
  const missed = state.questions.filter(question =>
    question.available &&
    question.scorable &&
    !sameSet(state.answers[question.id] || [], question.correct)
  );

  els.review.innerHTML = missed.length
    ? `<h2>Missed items</h2>${missed.map(reviewCard).join("")}`
    : `<p class="good">Perfect score.</p>`;
}

function reviewCard(question) {
  return `
    <div class="review-card">
      <h3>Question ${question.id}: ${escapeHtml(question.topic)}</h3>
      <p><strong>${escapeHtml(question.stem)}</strong></p>
      ${question.codeBlocks.map(renderCodeBlock).join("")}
      ${feedbackHtml(question)}
    </div>
  `;
}

function show(screen) {
  ["loading", "error", "start", "exam", "results"].forEach(name => {
    els[name].classList.toggle("hidden", name !== screen);
  });
}

function sameSet(a, b) {
  const left = [...a].sort();
  const right = [...b].sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

setInterval(() => {
  if (!state.startedAt || state.finished) return;
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  els.timer.textContent = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
}, 1000);
