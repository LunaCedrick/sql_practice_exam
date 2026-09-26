import { loadQuestionBank } from "./questionBank.js";

const SAVE_KEY = "sql-practice-progress-v1";

const els = {
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  errorText: document.getElementById("errorText"),
  start: document.getElementById("start"),
  exam: document.getElementById("exam"),
  results: document.getElementById("results"),
  examReview: document.getElementById("examReview"),
  startTitle: document.getElementById("startTitle"),
  startDetails: document.getElementById("startDetails"),
  resumeArea: document.getElementById("resumeArea"),
  resumeBtn: document.getElementById("resumeBtn"),
  discardSaveBtn: document.getElementById("discardSaveBtn"),
  timer: document.getElementById("timer"),
  qnum: document.getElementById("qnum"),
  topic: document.getElementById("topic"),
  kind: document.getElementById("kind"),
  bar: document.getElementById("bar"),
  questionBody: document.getElementById("questionBody"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  openNavigator: document.getElementById("openNavigator"),
  openReviewNavigator: document.getElementById("openReviewNavigator"),
  questionNavigator: document.getElementById("questionNavigator"),
  navigatorTitle: document.getElementById("navigatorTitle"),
  navigatorSubtitle: document.getElementById("navigatorSubtitle"),
  navigatorStatus: document.getElementById("navigatorStatus"),
  navigatorNumbers: document.getElementById("navigatorNumbers"),
  navigatorLegend: document.getElementById("navigatorLegend"),
  closeNavigator: document.getElementById("closeNavigator"),
  prevBtn: document.getElementById("prevBtn"),
  saveExitBtn: document.getElementById("saveExitBtn"),
  flagBtn: document.getElementById("flagBtn"),
  nextBtn: document.getElementById("nextBtn"),
  submitBtn: document.getElementById("submitBtn"),
  mockBtn: document.getElementById("mockBtn"),
  quickBtn: document.getElementById("quickBtn"),
  practiceBtn: document.getElementById("practiceBtn"),
  score: document.getElementById("score"),
  correct: document.getElementById("correct"),
  incorrect: document.getElementById("incorrect"),
  unanswered: document.getElementById("unanswered"),
  analytics: document.getElementById("analytics"),
  newTakeBtn: document.getElementById("newTakeBtn"),
  reviewAllBtn: document.getElementById("reviewAllBtn"),
  reviewMissedBtn: document.getElementById("reviewMissedBtn"),
  backStartBtn: document.getElementById("backStartBtn"),
  review: document.getElementById("review"),
  reviewQnum: document.getElementById("reviewQnum"),
  reviewTopic: document.getElementById("reviewTopic"),
  reviewKind: document.getElementById("reviewKind"),
  reviewBar: document.getElementById("reviewBar"),
  reviewQuestionBody: document.getElementById("reviewQuestionBody"),
  reviewOptions: document.getElementById("reviewOptions"),
  reviewFeedback: document.getElementById("reviewFeedback"),
  reviewPrevBtn: document.getElementById("reviewPrevBtn"),
  reviewBackBtn: document.getElementById("reviewBackBtn"),
  reviewNextBtn: document.getElementById("reviewNextBtn")
};

let bank = null;
let state = emptyState();
let reviewState = emptyReviewState();
let navigatorContext = "exam";

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
  els.quickBtn.addEventListener("click", () => begin("quick"));
  els.practiceBtn.addEventListener("click", () => begin("practice"));
  els.resumeBtn.addEventListener("click", resumeProgress);
  els.discardSaveBtn.addEventListener("click", discardSavedProgress);
  els.prevBtn.addEventListener("click", () => move(-1));
  els.saveExitBtn.addEventListener("click", saveAndExit);
  els.flagBtn.addEventListener("click", toggleFlag);
  els.nextBtn.addEventListener("click", nextAction);
  els.submitBtn.addEventListener("click", submitExam);
  els.openNavigator.addEventListener("click", () => openQuestionNavigator("exam"));
  els.openReviewNavigator.addEventListener("click", () => openQuestionNavigator("review"));
  els.closeNavigator.addEventListener("click", () => els.questionNavigator.close());
  els.navigatorNumbers.addEventListener("click", selectNavigatorQuestion);
  els.questionNavigator.addEventListener("click", event => {
    if (event.target === els.questionNavigator) els.questionNavigator.close();
  });
  els.newTakeBtn.addEventListener("click", () => begin(state.mode === "quick" ? "quick" : "mock"));
  els.reviewAllBtn.addEventListener("click", () => startExamReview("all"));
  els.reviewMissedBtn.addEventListener("click", () => startExamReview("missed"));
  els.reviewPrevBtn.addEventListener("click", () => moveExamReview(-1));
  els.reviewNextBtn.addEventListener("click", () => moveExamReview(1));
  els.reviewBackBtn.addEventListener("click", () => show("results"));
  els.backStartBtn.addEventListener("click", () => {
    state = emptyState();
    els.timer.textContent = "";
    clearProgress();
    renderStart();
    show("start");
  });
  window.addEventListener("beforeunload", () => {
    if (state.startedAt && !state.finished) saveProgress();
  });
}

function emptyReviewState() {
  return {
    mode: "all",
    questions: [],
    index: 0
  };
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
    elapsedMs: 0,
    finished: false,
    lastResult: null
  };
}

function renderStart() {
  const total = bank.questions.length;
  const available = bank.availableQuestions.length;
  const unavailable = bank.unavailableQuestions.length;
  const mockCount = Math.min(bank.mockQuestionCount, bank.scorableQuestions.length);
  const quickCount = quickQuestionCount();

  els.startTitle.textContent = `${total} Question Reviewer`;
  els.startDetails.textContent =
    `Practice mode gives feedback each time you answer a question. ` +
    `Mock exam randomly selects ${mockCount} scorable questions from ${available} available questions. ` +
    `Quick Quiz randomly selects ${quickCount} scorable questions with results shown at the end. ` +
    `${unavailable} question is marked unavailable. Goodluck!`;
  updateResumeControls();
}

function begin(mode) {
  if (loadProgress() && !confirm("Start a new session and discard saved progress?")) return;
  clearProgress();
  const questions = sessionQuestions(mode);

  state = {
    ...emptyState(),
    mode,
    questions,
    startedAt: Date.now()
  };
  renderTimer();
  show("exam");
  render();
  saveProgress();
}

function sessionQuestions(mode) {
  if (mode === "practice") {
    return bank.questions.map(question => withRuntimeOptions(question, false));
  }

  const count = mode === "quick" ? quickQuestionCount() : Math.min(bank.mockQuestionCount, bank.scorableQuestions.length);
  return shuffle(bank.scorableQuestions)
    .slice(0, count)
    .map(question => withRuntimeOptions(question, true));
}

function quickQuestionCount() {
  return Math.min(5, bank.scorableQuestions.length);
}

function resumeProgress() {
  const saved = loadProgress();
  if (!saved) {
    updateResumeControls();
    return;
  }

  state = {
    ...emptyState(),
    ...saved,
    startedAt: Date.now(),
    finished: false
  };
  renderTimer();
  show("exam");
  render();
}

function saveAndExit() {
  saveProgress();
  state = emptyState();
  els.timer.textContent = "";
  renderStart();
  show("start");
}

function discardSavedProgress() {
  if (!confirm("Discard saved progress?")) return;
  clearProgress();
  updateResumeControls();
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

  els.prevBtn.disabled = state.index === 0;
  els.flagBtn.disabled = !question.available;
  const nextLabel = nextText(question);
  els.nextBtn.textContent = nextLabel;
  els.nextBtn.dataset.mobileLabel = nextLabel;
  els.nextBtn.disabled = isLastQuestion() && nextLabel === "Next";
  els.nextBtn.title = els.nextBtn.disabled ? "Use Submit to finish the exam." : "";
}

function currentQuestion() {
  return state.questions[state.index];
}

function kindText(question) {
  if (!question.available) return "Unavailable";
  return question.type === "multi" ? "Select all that apply" : "Choose one";
}

function renderQuestionBody(question) {
  els.questionBody.innerHTML = questionBodyHtml(question);
}

function questionBodyHtml(question) {
  if (!question.available) {
    return `
      <p class="stem">Question unavailable in supplied reviewer.</p>
      <div class="unavailable">${escapeHtml(question.answerExplanation || "No question content or answer is supplied.")}</div>
    `;
  }

  const sections = question.sections.map(renderSection).join("");
  const tables = question.tables.map(renderTable).join("");
  const codeBlocks = question.codeBlocks.map(renderCodeBlock).join("");

  return `
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

  if (section.type === "sql-sequence") {
    return renderSqlSequence(section);
  }

  if (section.type === "list") {
    return renderListSection(section);
  }

  const title = section.title ? `<p class="table-title">${escapeHtml(section.title)}</p>` : "";
  const text = section.text || section.content || "";
  return `<div class="content-section">${title}${escapeHtml(text)}</div>`;
}

function renderListSection(section) {
  const title = section.title ? `<p class="table-title">${escapeHtml(section.title)}</p>` : "";
  const items = Array.isArray(section.items) ? section.items : [];
  return `
    <div class="content-section">
      ${title}
      <ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    </div>
  `;
}

function renderSqlSequence(section) {
  const title = section.title ? `<p class="code-title">${escapeHtml(section.title)}</p>` : "";
  const items = Array.isArray(section.items) ? section.items : [];
  const sequence = items.map(item => `
    <div class="code-card">
      <pre><code>${escapeHtml(item.sql || "")}</code></pre>
      ${item.result ? `<pre class="sql-result"><code>${escapeHtml(item.result)}</code></pre>` : ""}
    </div>
  `).join("");

  return `<div class="content-section sql-sequence">${title}${sequence}</div>`;
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
  saveProgress();
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

function practiceNavStatus(question) {
  if (state.mode !== "practice" || !question.available || !state.confirmed[question.id]) return "";
  return sameSet(state.answers[question.id] || [], question.correct) ? "correct" : "incorrect";
}

function openQuestionNavigator(context) {
  navigatorContext = context;
  renderQuestionNavigator();
  els.questionNavigator.showModal();
}

function renderQuestionNavigator() {
  const reviewing = navigatorContext === "review";
  const questions = reviewing ? reviewState.questions : state.questions;
  const currentIndex = reviewing ? reviewState.index : state.index;
  const current = questions[currentIndex];

  els.navigatorTitle.textContent = reviewing ? "Browse review questions" : "Go to question";
  els.navigatorSubtitle.textContent = reviewing
    ? `${reviewTitle()} - ${currentIndex + 1} of ${questions.length}`
    : `Question ${current.id} - ${currentIndex + 1} of ${questions.length}`;

  let answered = 0;
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  let flagged = 0;
  let unavailable = 0;

  els.navigatorNumbers.replaceChildren();
  questions.forEach((question, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "num";
    button.dataset.index = index;
    button.textContent = reviewing ? state.questions.indexOf(question) + 1 : question.id;

    if (index === currentIndex) {
      button.classList.add("current");
      button.setAttribute("aria-current", "step");
    }

    let statusLabel = "unanswered";
    if (reviewing) {
      const status = reviewStatus(question);
      button.classList.add(status);
      statusLabel = status;
      if (status === "correct") correct += 1;
      else if (status === "incorrect") incorrect += 1;
      else unanswered += 1;
    } else {
      const hasAnswer = (state.answers[question.id] || []).length > 0;
      const practiceStatus = practiceNavStatus(question);
      if (hasAnswer) {
        answered += 1;
        button.classList.add("answered");
        statusLabel = "answered";
      }
      if (practiceStatus) {
        button.classList.add(practiceStatus);
        statusLabel = practiceStatus;
      }
      if (state.flags[question.id]) {
        button.classList.add("flagged");
        flagged += 1;
      }
      if (!question.available) {
        button.classList.add("unavailable");
        unavailable += 1;
        statusLabel = "unavailable";
      }
    }

    button.setAttribute("aria-label", `Question ${button.textContent}, ${statusLabel}`);
    els.navigatorNumbers.append(button);
  });

  if (reviewing) {
    els.navigatorStatus.innerHTML = `<span><strong>${correct}</strong> correct</span><span><strong>${incorrect}</strong> incorrect</span><span><strong>${unanswered}</strong> unanswered</span>`;
    els.navigatorLegend.innerHTML = '<span><i class="navigator-dot answered"></i>Correct</span><span><i class="navigator-dot incorrect"></i>Incorrect</span><span><i class="navigator-dot"></i>Unanswered</span>';
  } else {
    els.navigatorStatus.innerHTML = `<span><strong>${answered}</strong> answered</span><span><strong>${flagged}</strong> flagged</span>${unavailable ? `<span><strong>${unavailable}</strong> unavailable</span>` : ""}`;
    els.navigatorLegend.innerHTML = `<span><i class="navigator-dot answered"></i>${state.mode === "practice" ? "Correct" : "Answered"}</span>${state.mode === "practice" ? '<span><i class="navigator-dot incorrect"></i>Incorrect</span>' : ""}<span><i class="navigator-dot flagged"></i>Flagged</span><span><i class="navigator-dot"></i>Unanswered</span>`;
  }
}

function selectNavigatorQuestion(event) {
  const button = event.target.closest("button[data-index]");
  if (!button) return;

  if (navigatorContext === "review") {
    reviewState.index = Number(button.dataset.index);
    renderExamReview();
  } else {
    state.index = Number(button.dataset.index);
    render();
    saveProgress();
  }
  els.questionNavigator.close();
}

function nextText(question) {
  if (state.mode === "practice" && question.available && !state.confirmed[question.id]) return "Confirm";
  return "Next";
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
    saveProgress();
    return;
  }

  if (isLastQuestion()) {
    alert("You are on the last question. Use Submit when you are ready to finish.");
    return;
  }

  move(1);
}

function move(delta) {
  state.index = Math.max(0, Math.min(state.questions.length - 1, state.index + delta));
  render();
  saveProgress();
}

function isLastQuestion() {
  return state.index === state.questions.length - 1;
}

function toggleFlag() {
  const question = currentQuestion();
  state.flags[question.id] = !state.flags[question.id];
  render();
  saveProgress();
}

function submitExam() {
  const result = calculateResult();
  const unanswered = result.unanswered;

  if (["mock", "quick"].includes(state.mode) && unanswered && !confirm(`${unanswered} questions are unanswered. Submit anyway?`)) {
    return;
  }

  state.finished = true;
  state.lastResult = result;
  clearProgress();
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
  const quick = state.mode === "quick";
  els.score.textContent = `${result.percent}%`;
  els.correct.textContent = `${result.correct}/${result.total}`;
  els.incorrect.textContent = result.incorrect;
  els.unanswered.textContent = result.unanswered;
  els.review.innerHTML = "";
  els.newTakeBtn.textContent = quick ? "New quick quiz" : "New randomized take";

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

function startExamReview(mode = "all") {
  const questions = mode === "missed" ? missedQuestions() : state.questions;

  if (!questions.length) {
    alert("Perfect score. No missed items to review.");
    return;
  }

  reviewState = {
    mode,
    questions,
    index: 0
  };
  show("examReview");
  renderExamReview();
}

function renderExamReview() {
  const question = reviewState.questions[reviewState.index];
  const progress = ((reviewState.index + 1) / reviewState.questions.length) * 100;
  const status = reviewStatus(question);
  const title = reviewTitle();

  els.reviewQnum.textContent = `${title} ${reviewState.index + 1} of ${reviewState.questions.length}`;
  els.reviewTopic.textContent = question.topic;
  els.reviewKind.textContent = `${reviewStatusLabel(question)} - Question ${question.id}`;
  els.reviewBar.style.width = `${progress}%`;
  els.reviewQuestionBody.innerHTML = questionBodyHtml(question);
  els.reviewOptions.innerHTML = reviewOptionsHtml(question);
  els.reviewFeedback.innerHTML = `
    ${reviewAnswerSummary(question)}
    ${feedbackHtml(question)}
  `;

  els.reviewPrevBtn.disabled = reviewState.index === 0;
  els.reviewNextBtn.disabled = reviewState.index === reviewState.questions.length - 1;
  els.reviewNextBtn.title = els.reviewNextBtn.disabled ? "This is the last reviewed question." : "";
  els.reviewBackBtn.textContent = "Back to results";
  els.reviewBackBtn.dataset.mobileLabel = "Results";
  els.reviewNextBtn.dataset.mobileLabel = "Next";
  els.reviewPrevBtn.dataset.mobileLabel = "Prev";

  if (status === "correct") {
    els.reviewKind.className = "chip good";
  } else if (status === "incorrect") {
    els.reviewKind.className = "chip bad";
  } else {
    els.reviewKind.className = "chip";
  }

  els.reviewQuestionBody.closest(".qscroll")?.scrollTo({ top: 0, behavior: "smooth" });
}

function reviewTitle() {
  if (reviewState.mode === "missed") return "Missed review";
  if (state.mode === "quick") return "Quick Quiz review";
  return "Mock review";
}

function moveExamReview(delta) {
  reviewState.index = Math.max(0, Math.min(reviewState.questions.length - 1, reviewState.index + delta));
  renderExamReview();
}

function missedQuestions() {
  return state.questions.filter(question =>
    question.available &&
    question.scorable &&
    !sameSet(state.answers[question.id] || [], question.correct)
  );
}

function reviewStatus(question) {
  if (!question.available || !(state.answers[question.id] || []).length) return "unanswered";
  return sameSet(state.answers[question.id] || [], question.correct) ? "correct" : "incorrect";
}

function reviewStatusLabel(question) {
  const status = reviewStatus(question);
  if (status === "correct") return "Correct";
  if (status === "incorrect") return "Incorrect";
  return "Unanswered";
}

function reviewAnswerSummary(question) {
  const chosen = state.answers[question.id] || [];
  return `
    <div class="feedback">
      <p><strong>Your answer:</strong> ${chosen.length ? escapeHtml(chosen.join(", ")) : "No answer"}</p>
      <p><strong>Correct answer:</strong> ${escapeHtml(question.correct.join(", "))}</p>
    </div>
  `;
}

function reviewOptionsHtml(question) {
  if (!question.available) return "";
  const chosen = state.answers[question.id] || [];
  const inputType = question.type === "multi" ? "checkbox" : "radio";

  return question.runtimeOptions.map(option => {
    const selected = chosen.includes(option.id);
    const classes = [
      "option",
      selected ? "selected" : "",
      option.correct ? "correct" : ""
    ].filter(Boolean).join(" ");
    const markers = [
      option.correct ? "Correct answer" : "",
      selected ? "Your answer" : ""
    ].filter(Boolean).join(" - ");

    return `
      <label class="${classes}">
        <input type="${inputType}" name="review-answer" value="${escapeAttribute(option.id)}"
          ${selected ? "checked" : ""} disabled>
        <span class="option-letter">${escapeHtml(option.id)}</span>
        <span class="option-text">
          ${renderOptionText(option)}
          ${markers ? `<span class="option-status">${escapeHtml(markers)}</span>` : ""}
        </span>
      </label>
    `;
  }).join("");
}

function show(screen) {
  ["loading", "error", "start", "exam", "results", "examReview"].forEach(name => {
    els[name].classList.toggle("hidden", name !== screen);
  });
}

function updateResumeControls() {
  const saved = loadProgress();
  els.resumeArea.classList.toggle("hidden", !saved);
}

function saveProgress() {
  if (!state.startedAt || state.finished || !state.questions.length) return;
  const checkpoint = {
    ...state,
    elapsedMs: elapsedMs(),
    startedAt: 0,
    lastResult: null
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(checkpoint));
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!isValidProgress(saved)) {
      clearProgress();
      return null;
    }
    return saved;
  } catch {
    clearProgress();
    return null;
  }
}

function clearProgress() {
  localStorage.removeItem(SAVE_KEY);
}

function isValidProgress(saved) {
  return saved &&
    ["mock", "practice", "quick"].includes(saved.mode) &&
    Array.isArray(saved.questions) &&
    saved.questions.length > 0 &&
    Number.isInteger(saved.index) &&
    saved.index >= 0 &&
    saved.index < saved.questions.length &&
    saved.answers &&
    saved.flags &&
    saved.confirmed;
}

function elapsedMs() {
  return state.elapsedMs + (state.startedAt ? Date.now() - state.startedAt : 0);
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
  renderTimer();
}, 1000);

function renderTimer() {
  if (!state.startedAt || state.finished || state.mode === "quick") {
    els.timer.textContent = "";
    return;
  }

  const elapsed = Math.floor(elapsedMs() / 1000);
  els.timer.textContent = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
}
