const { GEMINI_API_KEY } = process.env;

const MODEL_NAME = 'gemini-2.0-flash';

function normalizeList(values = []) {
  return values
    .map(value => String(value || '').trim())
    .filter(Boolean);
}

function buildPrompt({ ingredients, exclude, question }) {
  const sections = [
    '너는 한국어로 대화하는 간단한 레시피 제안 비서야.',
    '3~5개의 요리를 제안하고, 각 요리마다 핵심 재료와 한 줄 설명을 포함해 줘.',
  ];

  if (ingredients.length) sections.push(`사용 가능한 재료: ${ingredients.join(', ')}`);
  if (exclude.length) sections.push(`제외할 재료: ${exclude.join(', ')}`);
  if (question.trim()) sections.push(`사용자 추가 요청: ${question.trim()}`);

  return sections.join('\n');
}

function extractTextFromResponse(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .map(part => part.text || '')
    .join('')
    .trim();
}

export async function generateRecipeSuggestions({ ingredients = [], exclude = [], question = '' } = {}) {
  if (!GEMINI_API_KEY) {
    const error = new Error('Gemini API key가 구성되지 않았습니다.');
    error.status = 500;
    throw error;
  }

  const normalizedIngredients = normalizeList(ingredients);
  const normalizedExclude = normalizeList(exclude);
  const prompt = buildPrompt({ ingredients: normalizedIngredients, exclude: normalizedExclude, question });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const error = new Error('Gemini 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const text = extractTextFromResponse(data);

  if (!text) {
    const error = new Error('Gemini 응답을 불러오지 못했습니다.');
    error.status = 502;
    throw error;
  }

  return text;
}

