const SQL_QUESTION_FILES = [
  "./data/questions-1-50.json",
  "./data/questions-51-100.json",
  "./data/questions-101-150.json",
  "./data/questions-151-200.json",
  "./data/questions-201-249.json"
];

const PLSQL_QUESTION_FILES = ["./data/PLSQL_questions-1-76_structured.json"];

export async function loadQuestionBank(reviewer = "sql") {
  const files = await Promise.all((reviewer === "plsql" ? PLSQL_QUESTION_FILES : SQL_QUESTION_FILES).map(loadFile));
  const questions = files
    .flatMap(file => file.questions.map(question => normalizeQuestion(question)))
    .sort((a, b) => a.id - b.id);

  const ids = new Set();
  const duplicates = [];
  for (const question of questions) {
    if (ids.has(question.id)) duplicates.push(question.id);
    ids.add(question.id);
  }

  if (duplicates.length) {
    throw new Error(`Duplicate question IDs found: ${duplicates.join(", ")}`);
  }

  if (reviewer === "plsql") validatePlsqlQuestions(questions);

  const mockQuestionCount = Number(
    files.find(file => file.settings?.mockQuestionCount)?.settings.mockQuestionCount
  );

  return {
    files,
    questions,
    availableQuestions: questions.filter(question => question.available),
    scorableQuestions: questions.filter(question => question.available && question.scorable),
    unavailableQuestions: questions.filter(question => !question.available),
    mockQuestionCount: Number.isFinite(mockQuestionCount) ? mockQuestionCount : Math.min(questions.length, 1)
  };
}

function validatePlsqlQuestions(questions) {
  const expectedIds = Array.from({ length: 76 }, (_, index) => index + 1);
  if (questions.length !== expectedIds.length || questions.some((question, index) => question.id !== expectedIds[index])) {
    throw new Error("The PL/SQL question bank must contain unique question IDs 1–76.");
  }

  for (const question of questions) {
    const optionIds = question.options.map(option => option.id);
    if (new Set(optionIds).size !== optionIds.length) {
      throw new Error(`PL/SQL question ${question.id} has duplicate option IDs.`);
    }
    const correctIds = question.correct;
    if (new Set(correctIds).size !== correctIds.length || correctIds.some(id => !optionIds.includes(id))) {
      throw new Error(`PL/SQL question ${question.id} has an invalid correct answer list.`);
    }
    const flaggedCorrectIds = question.options.filter(option => option.correct).map(option => option.id);
    if (correctIds.length !== flaggedCorrectIds.length || correctIds.some(id => !flaggedCorrectIds.includes(id))) {
      throw new Error(`PL/SQL question ${question.id} has inconsistent correct answer flags.`);
    }
  }
}

async function loadFile(url) {
  let response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (error) {
    throw new Error(`Unable to fetch ${url}. Open this page through a local web server, not directly as a file.`);
  }

  if (!response.ok) {
    throw new Error(`Unable to load ${url}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.questions)) {
    throw new Error(`${url} does not contain a questions array.`);
  }
  return data;
}

function normalizeQuestion(question) {
  return {
    ...question,
    id: Number(question.id),
    available: question.available !== false,
    scorable: question.scorable !== false && question.type !== "unavailable",
    topic: question.topic || "Uncategorized",
    stem: question.stem || "",
    instruction: question.instruction || "",
    type: question.type || (question.correct?.length > 1 ? "multi" : "single"),
    sections: Array.isArray(question.sections) ? question.sections : [],
    tables: Array.isArray(question.tables) ? question.tables : [],
    codeBlocks: Array.isArray(question.codeBlocks) ? question.codeBlocks : [],
    options: Array.isArray(question.options) ? question.options : [],
    correct: Array.isArray(question.correct) ? question.correct : [],
    answerExplanation: question.answerExplanation || "",
    technicalNote: question.technicalNote || ""
  };
}
