const GIGACHAT_AUTH_URL: string = process.env.GIGACHAT_AUTH_URL || 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const GIGACHAT_API_URL: string = process.env.GIGACHAT_API_URL || 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
const GIGACHAT_CLIENT_ID: string = process.env.GIGACHAT_CLIENT_ID || '';
const GIGACHAT_CLIENT_SECRET: string = process.env.GIGACHAT_CLIENT_SECRET || '';
const GIGACHAT_TIMEOUT_MS: number = parseInt(process.env.GIGACHAT_TIMEOUT_MS || '15000', 10);

export interface GigaChatResponse {
  words: string[];
  isFallback: boolean;
  message?: string;
}

interface FallbackDictionary {
  [key: string]: string[];
}

const FALLBACK_WORDS: FallbackDictionary = {
  'животные': ['слон', 'тигр', 'зебра', 'жираф', 'лев', 'обезьяна', 'волк', 'лиса', 'медведь', 'заяц', 'олень', 'барсук'],
  'космос': ['звезда', 'планета', 'комета', 'галактика', 'орбита', 'спутник', 'ракета', 'метеор', 'астероид', 'телескоп', 'вселенная', 'солнце'],
  'география': ['париж', 'берлин', 'рим', 'мадрид', 'вена', 'осло', 'гора', 'река', 'озеро', 'море', 'остров', 'пустыня'],
  'литература': ['пушкин', 'лермонтов', 'есенин', 'блок', 'ахматова', 'толстой', 'гоголь', 'чехов', 'бунин', 'стих', 'поэма', 'роман'],
  'музыка': ['нота', 'аккорд', 'мелодия', 'ритм', 'гитара', 'рояль', 'скрипка', 'барабан', 'флейта', 'джаз', 'рок', 'опера'],
  'наука': ['атом', 'молекула', 'физика', 'химия', 'биология', 'ген', 'клетка', 'опыт', 'теория', 'закон', 'формула', 'метод'],
  'еда': ['хлеб', 'сыр', 'молоко', 'яблоко', 'банан', 'суп', 'каша', 'мясо', 'рыба', 'торт', 'сок', 'чай'],
  'спорт': ['футбол', 'хоккей', 'теннис', 'баскетбол', 'волейбол', 'лыжи', 'бег', 'прыжок', 'мяч', 'шайба', 'гол', 'сетка'],
  'город': ['улица', 'дом', 'парк', 'мост', 'дорога', 'школа', 'магазин', 'театр', 'музей', 'вокзал', 'рынок', 'церковь'],
  'природа': ['лес', 'поле', 'цветок', 'дерево', 'трава', 'птица', 'рыба', 'дождь', 'снег', 'ветер', 'солнце', 'луна'],
};

export async function generateWords(topic: string, count: number = 12): Promise<GigaChatResponse> {
  if (!topic || !topic.trim()) {
    return { words: [], isFallback: true, message: 'Тема не указана' };
  }

  if (!GIGACHAT_CLIENT_ID || !GIGACHAT_CLIENT_SECRET) {
    return fallbackGenerate(topic, count);
  }

  try {
    const credentials: string = Buffer.from(`${GIGACHAT_CLIENT_ID}:${GIGACHAT_CLIENT_SECRET}`).toString('base64');
    const authResponse = await fetch(GIGACHAT_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${credentials}` },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) return fallbackGenerate(topic, count);

    const authData: any = await authResponse.json();
    const accessToken: string = authData.access_token;
    if (!accessToken) return fallbackGenerate(topic, count);

    const prompt: string = `Предложи ${count} слов по теме "${topic}" в именительном падеже, единственном числе, без повторений. Верни ТОЛЬКО список слов, каждое с новой строки, без нумерации.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GIGACHAT_TIMEOUT_MS);

    const chatResponse = await fetch(GIGACHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ model: 'GigaChat', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 500 }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!chatResponse.ok) return fallbackGenerate(topic, count);

    const chatData: any = await chatResponse.json();
    const content: string = chatData?.choices?.[0]?.message?.content || '';
    const words: string[] = content.split('\n').map((line: string) => line.replace(/^\d+[.)]\s*/, '').trim()).filter((line: string) => line.length > 1 && /^[а-яё]+$/i.test(line)).slice(0, count);

    if (words.length < 5) return fallbackGenerate(topic, count);
    return { words, isFallback: false };
  } catch {
    return fallbackGenerate(topic, count);
  }
}

function fallbackGenerate(topic: string, count: number): GigaChatResponse {
  const topicLower: string = topic.toLowerCase();
  let words: string[] = [];
  for (const [key, value] of Object.entries(FALLBACK_WORDS)) {
    if (topicLower.includes(key)) { words = [...value]; break; }
  }
  if (words.length === 0) {
    const letters = 'абвгдежзиклмнопрстуфхцчшщыэюя';
    words = Array.from({ length: count }, () => {
      const len = Math.floor(Math.random() * 6) + 4;
      let w = '';
      for (let i = 0; i < len; i++) w += letters[Math.floor(Math.random() * letters.length)];
      return w;
    });
  }
  return { words: words.slice(0, count), isFallback: true, message: 'Сервис ИИ временно недоступен.' };
}

export async function checkAiStatus(): Promise<{ isAvailable: boolean; responseTimeMs: number }> {
  if (!GIGACHAT_CLIENT_ID || !GIGACHAT_CLIENT_SECRET) return { isAvailable: false, responseTimeMs: 0 };
  const startTime = Date.now();
  try {
    const credentials = Buffer.from(`${GIGACHAT_CLIENT_ID}:${GIGACHAT_CLIENT_SECRET}`).toString('base64');
    const response = await fetch(GIGACHAT_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${credentials}` },
      body: 'grant_type=client_credentials',
    });
    return { isAvailable: response.ok, responseTimeMs: Date.now() - startTime };
  } catch {
    return { isAvailable: false, responseTimeMs: Date.now() - startTime };
  }
}