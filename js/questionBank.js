const QUESTION_FILES = [
  "./data/questions-1-50.json",
  "./data/questions-51-100.json",
  "./data/questions-101-150.json",
  "./data/questions-151-200.json",
  "./data/questions-201-249.json"
];

export async function loadQuestionBank() {
  const files = await Promise.all(QUESTION_FILES.map(loadFile));
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
