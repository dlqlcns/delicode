import { createRecipeWithDetails, findRecipeByName } from './recipesApi.js';

const { GEMINI_API_KEY } = process.env;

const MODEL_NAME = 'gemini-2.0-flash';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80';

function normalizeList(values = []) {
  return values
    .map(value => String(value || '').trim())
    .filter(Boolean);
}

function buildPrompt({ ingredients, exclude, question }) {
  const sections = [
    '너는 한국어로 대화하는 레시피 생성 비서야.',
    '응답은 무조건 JSON 배열로만 해. 불필요한 설명이나 마크다운은 금지야.',
    '각 원소는 다음 스키마를 가진다:',
    '{"name":"요리명","category":"카테고리","description":"한 줄 설명","time":"조리 시간 (예: 25분)","image_url":"이미지 URL","ingredients":[{"ingredient":"재료명","amount":"수량","unit":"단위"}],"steps":["조리 단계 설명1","조리 단계 설명2", ...]}',
    '모든 텍스트는 한국어로 작성하고, 최소 3개 최대 5개의 레시피를 만들어.',
    'steps는 4단계 이상으로 자세히 적어 줘.',
    'image_url은 https://로 시작하는 실제 이미지 주소를 제공하고, 없으면 음식이 잘 보이는 일반적인 음식 사진 URL을 써.',
  ];

  if (ingredients.length) sections.push(`사용 가능한 재료: ${ingredients.join(', ')}`);
  if (exclude.length) sections.push(`제외할 재료: ${exclude.join(', ')}`);
  if (question.trim()) sections.push(`사용자 추가 요청: ${question.trim()}`);

  sections.push('제외 재료는 절대 포함하지 마. JSON 배열 이외 다른 텍스트는 쓰지 마.');

  return sections.join('\n');
}

function extractTextFromResponse(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .map(part => part.text || '')
    .join('')
    .trim();
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function coerceTime(value) {
  if (value === undefined || value === null) return '30분';
  if (typeof value === 'number') return `${value}분`;
  const text = String(value).trim();
  return text.endsWith('분') ? text : `${text}분`;
}

function normalizeIngredients(list = []) {
  return toArray(list)
    .map(item => ({
      ingredient: item?.ingredient || item?.name || String(item || ''),
      amount: item?.amount || '',
      unit: item?.unit || '',
    }))
    .filter(entry => entry.ingredient);
}

function normalizeSteps(list = []) {
  return toArray(list)
    .map((step, index) => {
      if (typeof step === 'string') {
        return { step_description: step, step_order: index + 1 };
      }
      return {
        step_description: step?.step_description || step?.description || String(step || ''),
        step_order: step?.step_order || step?.order || index + 1,
      };
    })
    .filter(entry => entry.step_description);
}

function normalizeAiRecipe(raw) {
  const safeName = raw?.name || raw?.title || 'AI 레시피';
  const normalizedIngredients = normalizeIngredients(raw?.ingredients);
  const normalizedSteps = normalizeSteps(raw?.steps || raw?.instructions);
  return {
    name: safeName,
    category: raw?.category || '기타',
    description: raw?.description || raw?.summary || `${safeName}를 빠르게 만들어 보세요.`,
    time: coerceTime(raw?.time || raw?.time_minutes || raw?.cook_time),
    image_url: raw?.image_url || raw?.image || FALLBACK_IMAGE,
    ingredients: normalizedIngredients.length
      ? normalizedIngredients
      : [{ ingredient: '기본 재료', amount: '', unit: '' }],
    steps: normalizedSteps.length
      ? normalizedSteps
      : [
        { step_description: `${safeName} 준비 재료를 손질합니다.`, step_order: 1 },
        { step_description: '양념을 섞고 맛을 조절합니다.', step_order: 2 },
        { step_description: '모든 재료를 섞어 완성합니다.', step_order: 3 },
      ],
  };
}

function extractRecipesFromText(text) {
  if (!text) return [];
  const trimmed = text.trim();
  const fenced = trimmed.match(/```json([\s\S]*?)```/i);
  const candidate = fenced?.[1] || trimmed;

  const start = candidate.indexOf('[');
  const end = candidate.lastIndexOf(']');
  const jsonSlice = start !== -1 && end !== -1 ? candidate.slice(start, end + 1) : candidate;

  try {
    const parsed = JSON.parse(jsonSlice);
    if (Array.isArray(parsed)) return parsed.map(normalizeAiRecipe);
    if (parsed && typeof parsed === 'object') return [normalizeAiRecipe(parsed)];
    return [];
  } catch (err) {
    console.error('Gemini JSON 파싱 실패', err);
    return [];
  }
}

async function requestGeminiRecipes(prompt) {
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

  return extractRecipesFromText(text);
}

async function persistAiRecipe(recipe) {
  const existing = await findRecipeByName(recipe.name);
  if (existing) {
    return { ...existing, isAi: true };
  }

  const saved = await createRecipeWithDetails(recipe);
  return { ...saved, isAi: true };
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

  const generated = await requestGeminiRecipes(prompt);
  const filtered = generated.filter(recipe => !recipe.ingredients.some(item =>
    normalizedExclude.some(ex => item.ingredient?.toLowerCase?.().includes(ex.toLowerCase())),
  ));

  const uniqueRecipes = filtered.length ? filtered : generated;

  const persisted = [];
  for (const recipe of uniqueRecipes) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const saved = await persistAiRecipe(recipe);
      persisted.push(saved);
    } catch (err) {
      console.error('AI 레시피 저장 실패', err);
    }
  }

  return persisted;
}

