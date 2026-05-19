export type BrazilState = {
  code: string;
  name: string;
  capital: string;
  center: [number, number];
};

export const BRAZIL_STATES: BrazilState[] = [
  {
    code: "AC",
    name: "Acre",
    capital: "Rio Branco",
    center: [-9.97499, -67.8243],
  },
  {
    code: "AL",
    name: "Alagoas",
    capital: "Maceio",
    center: [-9.66599, -35.735],
  },
  {
    code: "AP",
    name: "Amapa",
    capital: "Macapa",
    center: [0.034934, -51.0694],
  },
  {
    code: "AM",
    name: "Amazonas",
    capital: "Manaus",
    center: [-3.11903, -60.0217],
  },
  {
    code: "BA",
    name: "Bahia",
    capital: "Salvador",
    center: [-12.9714, -38.5014],
  },
  {
    code: "CE",
    name: "Ceara",
    capital: "Fortaleza",
    center: [-3.73186, -38.5267],
  },
  {
    code: "DF",
    name: "Distrito Federal",
    capital: "Brasilia",
    center: [-15.793889, -47.882778],
  },
  {
    code: "ES",
    name: "Espirito Santo",
    capital: "Vitoria",
    center: [-20.3155, -40.3128],
  },
  {
    code: "GO",
    name: "Goias",
    capital: "Goiania",
    center: [-16.6869, -49.2648],
  },
  {
    code: "MA",
    name: "Maranhao",
    capital: "Sao Luis",
    center: [-2.52972, -44.3028],
  },
  {
    code: "MT",
    name: "Mato Grosso",
    capital: "Cuiaba",
    center: [-15.6014, -56.0979],
  },
  {
    code: "MS",
    name: "Mato Grosso do Sul",
    capital: "Campo Grande",
    center: [-20.4697, -54.6201],
  },
  {
    code: "MG",
    name: "Minas Gerais",
    capital: "Belo Horizonte",
    center: [-19.9167, -43.9345],
  },
  { code: "PA", name: "Para", capital: "Belem", center: [-1.45583, -48.4902] },
  {
    code: "PB",
    name: "Paraiba",
    capital: "Joao Pessoa",
    center: [-7.1195, -34.845],
  },
  {
    code: "PR",
    name: "Parana",
    capital: "Curitiba",
    center: [-25.4284, -49.2733],
  },
  {
    code: "PE",
    name: "Pernambuco",
    capital: "Recife",
    center: [-8.04756, -34.877],
  },
  {
    code: "PI",
    name: "Piaui",
    capital: "Teresina",
    center: [-5.08921, -42.8016],
  },
  {
    code: "RJ",
    name: "Rio de Janeiro",
    capital: "Rio de Janeiro",
    center: [-22.9068, -43.1729],
  },
  {
    code: "RN",
    name: "Rio Grande do Norte",
    capital: "Natal",
    center: [-5.79448, -35.211],
  },
  {
    code: "RS",
    name: "Rio Grande do Sul",
    capital: "Porto Alegre",
    center: [-30.0346, -51.2177],
  },
  {
    code: "RO",
    name: "Rondonia",
    capital: "Porto Velho",
    center: [-8.76077, -63.8999],
  },
  {
    code: "RR",
    name: "Roraima",
    capital: "Boa Vista",
    center: [2.82384, -60.6753],
  },
  {
    code: "SC",
    name: "Santa Catarina",
    capital: "Florianopolis",
    center: [-27.5949, -48.5482],
  },
  {
    code: "SP",
    name: "Sao Paulo",
    capital: "Sao Paulo",
    center: [-23.5505, -46.6333],
  },
  {
    code: "SE",
    name: "Sergipe",
    capital: "Aracaju",
    center: [-10.9472, -37.0731],
  },
  {
    code: "TO",
    name: "Tocantins",
    capital: "Palmas",
    center: [-10.2491, -48.3243],
  },
];

type IbgeCity = {
  nome?: string;
};

const citiesByStateCache = new Map<string, Promise<string[]>>();

function normalizeValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function findBrazilStateCode(
  rawValue: string | null | undefined,
): string | null {
  if (!rawValue) return null;

  const normalized = normalizeValue(rawValue);
  const match = BRAZIL_STATES.find((state) => {
    return (
      normalizeValue(state.code) === normalized ||
      normalizeValue(state.name) === normalized
    );
  });

  return match?.code ?? null;
}

export function getBrazilStateCenter(
  stateCode: string | null | undefined,
): [number, number] | null {
  if (!stateCode) return null;

  const normalized = stateCode.trim().toUpperCase();
  const state = BRAZIL_STATES.find((item) => item.code === normalized);
  return state?.center ?? null;
}

async function fetchCitiesFromIbge(
  stateCode: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const response = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateCode}/municipios?orderBy=nome`,
    {
      signal,
      headers: { Accept: "application/json" },
    },
  );

  if (!response.ok) {
    throw new Error("failed_to_fetch_cities");
  }

  const payload = (await response.json()) as IbgeCity[];
  return payload
    .map((item) => item.nome)
    .filter(
      (name): name is string =>
        typeof name === "string" && name.trim().length > 0,
    );
}

function fallbackCities(stateCode: string): string[] {
  const state = BRAZIL_STATES.find((item) => item.code === stateCode);
  return state ? [state.capital] : [];
}

export async function getBrazilCitiesByState(
  stateCode: string,
  signal?: AbortSignal,
): Promise<string[]> {
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
