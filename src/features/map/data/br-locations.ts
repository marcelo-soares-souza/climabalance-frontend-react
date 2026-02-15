export type BrazilState = {
  code: string;
  name: string;
  capital: string;
};

export const BRAZIL_STATES: BrazilState[] = [
  { code: 'AC', name: 'Acre', capital: 'Rio Branco' },
  { code: 'AL', name: 'Alagoas', capital: 'Maceio' },
  { code: 'AP', name: 'Amapa', capital: 'Macapa' },
  { code: 'AM', name: 'Amazonas', capital: 'Manaus' },
  { code: 'BA', name: 'Bahia', capital: 'Salvador' },
  { code: 'CE', name: 'Ceara', capital: 'Fortaleza' },
  { code: 'DF', name: 'Distrito Federal', capital: 'Brasilia' },
  { code: 'ES', name: 'Espirito Santo', capital: 'Vitoria' },
  { code: 'GO', name: 'Goias', capital: 'Goiania' },
  { code: 'MA', name: 'Maranhao', capital: 'Sao Luis' },
  { code: 'MT', name: 'Mato Grosso', capital: 'Cuiaba' },
  { code: 'MS', name: 'Mato Grosso do Sul', capital: 'Campo Grande' },
  { code: 'MG', name: 'Minas Gerais', capital: 'Belo Horizonte' },
  { code: 'PA', name: 'Para', capital: 'Belem' },
  { code: 'PB', name: 'Paraiba', capital: 'Joao Pessoa' },
  { code: 'PR', name: 'Parana', capital: 'Curitiba' },
  { code: 'PE', name: 'Pernambuco', capital: 'Recife' },
  { code: 'PI', name: 'Piaui', capital: 'Teresina' },
  { code: 'RJ', name: 'Rio de Janeiro', capital: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte', capital: 'Natal' },
  { code: 'RS', name: 'Rio Grande do Sul', capital: 'Porto Alegre' },
  { code: 'RO', name: 'Rondonia', capital: 'Porto Velho' },
  { code: 'RR', name: 'Roraima', capital: 'Boa Vista' },
  { code: 'SC', name: 'Santa Catarina', capital: 'Florianopolis' },
  { code: 'SP', name: 'Sao Paulo', capital: 'Sao Paulo' },
  { code: 'SE', name: 'Sergipe', capital: 'Aracaju' },
  { code: 'TO', name: 'Tocantins', capital: 'Palmas' },
];

type IbgeCity = {
  nome?: string;
};

const citiesByStateCache = new Map<string, Promise<string[]>>();

function normalizeValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function findBrazilStateCode(rawValue: string | null | undefined): string | null {
  if (!rawValue) return null;

  const normalized = normalizeValue(rawValue);
  const match = BRAZIL_STATES.find((state) => {
    return normalizeValue(state.code) === normalized || normalizeValue(state.name) === normalized;
  });

  return match?.code ?? null;
}

async function fetchCitiesFromIbge(stateCode: string, signal?: AbortSignal): Promise<string[]> {
  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateCode}/municipios?orderBy=nome`,
    {
      signal,
      headers: { Accept: 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error('failed_to_fetch_cities');
  }

  const payload = (await response.json()) as IbgeCity[];
  return payload
    .map((item) => item.nome)
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);
}

function fallbackCities(stateCode: string): string[] {
  const state = BRAZIL_STATES.find((item) => item.code === stateCode);
  return state ? [state.capital] : [];
}

export async function getBrazilCitiesByState(stateCode: string, signal?: AbortSignal): Promise<string[]> {
  const normalizedStateCode = stateCode.trim().toUpperCase();
  if (!normalizedStateCode) return [];

  const cacheKey = normalizedStateCode;
  const cachedPromise = citiesByStateCache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }

  const requestPromise = fetchCitiesFromIbge(normalizedStateCode, signal)
    .then((cities) => {
      if (cities.length === 0) return fallbackCities(normalizedStateCode);
      return cities;
    })
    .catch(() => fallbackCities(normalizedStateCode));

  citiesByStateCache.set(cacheKey, requestPromise);
  return requestPromise;
}
