import { api } from "@/lib/api-client";

export const locationsService = {
  listStates(country: string) {
    return api.get<string[]>("/locations/states", { params: { country } });
  },

  listCities(country: string, state: string) {
    return api.get<string[]>("/locations/cities", {
      params: { country, state },
    });
  },
};
