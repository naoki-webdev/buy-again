import { translations } from "@/locales/generated";

type LeafKeys<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : {
      [Key in keyof T & string]: LeafKeys<
        T[Key],
        Prefix extends "" ? Key : `${Prefix}.${Key}`
      >;
    }[keyof T & string];

export type TranslationKey = LeafKeys<typeof translations.en>;
