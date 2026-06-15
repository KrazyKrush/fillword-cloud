import https from 'https';

const GIGACHAT_AUTH_URL: string = process.env.GIGACHAT_AUTH_URL || 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const GIGACHAT_API_URL: string = process.env.GIGACHAT_API_URL || 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';
const GIGACHAT_CLIENT_ID: string = process.env.GIGACHAT_CLIENT_ID || '';
const GIGACHAT_CLIENT_SECRET: string = process.env.GIGACHAT_CLIENT_SECRET || '';
const GIGACHAT_TIMEOUT_MS: number = parseInt(process.env.GIGACHAT_TIMEOUT_MS || '30000', 10);

// Агент для обхода проблем с сертификатами
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export interface GigaChatResponse {
  words: string[];
  isFallback: boolean;
  message?: string;
  generatedBy: 'ai' | 'fallback' | 'local';
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
  'технологии': ['компьютер', 'телефон', 'интернет', 'программа', 'код', 'сайт', 'сервер', 'база', 'данные', 'сеть', 'чип', 'робот'],
  'медицина': ['врач', 'больница', 'таблетка', 'укол', 'анализ', 'диагноз', 'лечение', 'хирург', 'терапевт', 'скорая', 'рецепт', 'вирус'],
  'история': ['царь', 'империя', 'война', 'революция', 'реформа', 'древний', 'век', 'эпоха', 'династия', 'битва', 'крепость', 'фараон'],
  'искусство': ['картина', 'художник', 'краска', 'кисть', 'галерея', 'шедевр', 'портрет', 'пейзаж', 'скульптура', 'фреска', 'музей', 'эскиз'],
  'цветы': ['роза', 'тюльпан', 'ромашка', 'лилия', 'пион', 'гвоздика', 'орхидея', 'сирень', 'ландыш', 'фиалка', 'ирис', 'мак'],
  'фрукты': ['яблоко', 'груша', 'слива', 'персик', 'абрикос', 'вишня', 'апельсин', 'мандарин', 'лимон', 'киви', 'банан', 'ананас'],
  'овощи': ['огурец', 'помидор', 'перец', 'капуста', 'морковь', 'свёкла', 'картофель', 'лук', 'чеснок', 'редис', 'тыква', 'горох'],
  'профессии': ['врач', 'учитель', 'повар', 'пилот', 'строитель', 'инженер', 'программист', 'художник', 'певец', 'пожарный', 'судья', 'адвокат'],
  'транспорт': ['машина', 'автобус', 'поезд', 'самолёт', 'корабль', 'велосипед', 'трамвай', 'метро', 'такси', 'грузовик', 'мотоцикл', 'вертолёт'],
  'новый год': ['ёлка', 'подарок', 'снегурочка', 'мороз', 'хлопушка', 'гирлянда', 'мишура', 'салют', 'мандарин', 'праздник', 'хоровод', 'снеговик'],
};

const SYSTEM_PROMPT = `Ты — генератор слов для филворда. Создай список русских слов по заданной теме.

СТРОГИЕ ПРАВИЛА:
1. ТОЛЬКО отдельные слова, не словосочетания
2. ТОЛЬКО существительные в именительном падеже, единственном числе
3. Длина каждого слова: от 3 до 10 букв
4. Все слова строго по теме
5. Без повторений и однокоренных слов
6. Каждое слово на отдельной строке
7. Без пробелов внутри слов
8. НИКАКИХ словосочетаний типа "детскийсад" — только "сад"

ЗАПРЕЩЕНО:
- Словосочетания (даже слитно)
- Сложные составные слова длиннее 10 букв
- Слова с дефисом
- Аббревиатуры

ФОРМАТ ОТВЕТА:
Только слова, каждое на новой строке.
Без номеров, маркеров, пояснений.

Пример правильного ответа:
звезда
планета
ракета
спутник`;

export async function generateWords(topic: string, count: number = 12): Promise<GigaChatResponse> {
  if (!topic || !topic.trim()) {
    return { words: [], isFallback: true, message: 'Тема не указана', generatedBy: 'local' };
  }

  // Проверяем локальный словарь
  const localWords = findLocalWords(topic, count);
  if (localWords.length >= 5) {
    console.log(`[GigaChat] Найдены слова в локальном словаре по теме "${topic}"`);
    return { words: localWords.slice(0, count), isFallback: false, generatedBy: 'local' };
  }

  // Если ключи не настроены
  if (!GIGACHAT_CLIENT_ID || !GIGACHAT_CLIENT_SECRET) {
    console.log('[GigaChat] Ключи не настроены');
    return generateFallback(topic, count);
  }

  try {
    // Шаг 1: Получаем токен
    console.log('[GigaChat] Получаю токен...');
    const credentials = Buffer.from(`${GIGACHAT_CLIENT_ID}:${GIGACHAT_CLIENT_SECRET}`).toString('base64');

    const authResponse = await fetch(GIGACHAT_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'RqUID': crypto.randomUUID(),
      },
      body: 'grant_type=client_credentials&scope=GIGACHAT_API_PERS',
      // @ts-ignore
      agent: httpsAgent,
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.log(`[GigaChat] Ошибка авторизации (${authResponse.status}):`, errorText.substring(0, 200));
      return generateFallback(topic, count);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    if (!accessToken) {
      console.log('[GigaChat] Токен не получен');
      return generateFallback(topic, count);
    }

    console.log('[GigaChat] Токен получен');

    // Шаг 2: Запрос к GigaChat
    console.log(`[GigaChat] Запрашиваю ${count} слов по теме "${topic}"...`);

    const userMessage = `Сгенерируй ${count} слов по теме "${topic}".`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GIGACHAT_TIMEOUT_MS);

    const chatResponse = await fetch(GIGACHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        model: 'GigaChat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        top_p: 0.9,
        n: 1,
        stream: false,
      }),
      signal: controller.signal,
      // @ts-ignore
      agent: httpsAgent,
    });

    clearTimeout(timeoutId);

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.log(`[GigaChat] Ошибка API (${chatResponse.status}):`, errorText.substring(0, 300));
      return generateFallback(topic, count);
    }

    const chatData = await chatResponse.json();
    console.log('[GigaChat] Ответ получен');

    // Шаг 3: Парсим ответ
    const content = chatData?.choices?.[0]?.message?.content || '';
    console.log('[GigaChat] Ответ:', content.substring(0, 200));

    const words = content
      .split('\n')
      .map((line: string) => line.replace(/^[\d]+[.)\s]+/, '').replace(/^[-•*]\s*/, '').replace(/[""'']/g, '').trim())
      .filter((word: string) => word.length >= 2 && word.length <= 20 && /^[а-яё]+$/i.test(word))
      .map((word: string) => word.toLowerCase())
      .slice(0, count);

    console.log(`[GigaChat] Извлечено слов: ${words.length}`);

    if (words.length < 5) {
      const fallbackWords = generateFallback(topic, count - words.length);
      const allWords = [...new Set([...words, ...fallbackWords.words])];
      return {
        words: allWords.slice(0, count),
        isFallback: true,
        message: `ИИ сгенерировал только ${words.length} слов, остальные дополнены`,
        generatedBy: 'fallback',
      };
    }

    return { words, isFallback: false, generatedBy: 'ai' };

  } catch (error: any) {
    console.log('[GigaChat] Исключение:', error.message);
    return generateFallback(topic, count);
  }
}

function findLocalWords(topic: string, count: number): string[] {
  const topicLower = topic.toLowerCase().trim();

  for (const [key, value] of Object.entries(FALLBACK_WORDS)) {
    if (topicLower === key.toLowerCase()) return value.slice(0, count);
  }

  for (const [key, value] of Object.entries(FALLBACK_WORDS)) {
    if (topicLower.includes(key.toLowerCase()) || key.toLowerCase().includes(topicLower)) {
      return value.slice(0, count);
    }
  }

  return [];
}

function generateFallback(topic: string, count: number): GigaChatResponse {
  const localWords = findLocalWords(topic, count);
  if (localWords.length >= 3) {
    return {
      words: localWords.slice(0, count),
      isFallback: true,
      message: 'ИИ недоступен. Использованы слова из словаря.',
      generatedBy: 'local',
    };
  }

  const letters = 'абвгдежзиклмнопрстуфхцчшщыэюя';
  const words = Array.from({ length: count }, () => {
    const len = Math.floor(Math.random() * 6) + 4;
    let word = '';
    for (let i = 0; i < len; i++) {
      word += letters[Math.floor(Math.random() * letters.length)];
    }
    return word;
  });

  return {
    words,
    isFallback: true,
    message: 'ИИ недоступен. Сгенерированы случайные слова.',
    generatedBy: 'fallback',
  };
}

export async function checkAiStatus(): Promise<{ isAvailable: boolean; responseTimeMs: number }> {
  if (!GIGACHAT_CLIENT_ID || !GIGACHAT_CLIENT_SECRET) {
    console.log('[GigaChat Status] Ключи не указаны');
    return { isAvailable: false, responseTimeMs: 0 };
  }

  const startTime = Date.now();
  try {
    const credentials = Buffer.from(`${GIGACHAT_CLIENT_ID}:${GIGACHAT_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(GIGACHAT_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'RqUID': crypto.randomUUID(),
      },
      body: 'grant_type=client_credentials&scope=GIGACHAT_API_PERS',
      // @ts-ignore
      agent: httpsAgent,
    });

    const elapsed = Date.now() - startTime;
    console.log(`[GigaChat Status] HTTP: ${response.status}, Time: ${elapsed}ms`);
    return { isAvailable: response.ok, responseTimeMs: elapsed };
  } catch (error: any) {
    console.log('[GigaChat Status] Exception:', error.message);
    return { isAvailable: false, responseTimeMs: Date.now() - startTime };
  }
}