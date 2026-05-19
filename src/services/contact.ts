import { api } from "@/lib/api-client";

export const contactService = {
  send(message: string) {
    return api.post<{ message_key: string }>("/contact", { message });
  },
};
