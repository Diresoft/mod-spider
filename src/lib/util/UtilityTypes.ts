import type { Writable } from "svelte/store";

export type OmitMemberKeys<T, Omit> = { [K in keyof T]: T[K] extends Omit ? never : K; }[keyof T];
export type OmitMembers<T, Omit>    = Pick<T, OmitMemberKeys<T, Omit>>;
export type OmitFunctions<T>        = OmitMembers<T, Function>;

export type IncludeMemberKeys<T, Include> = { [K in keyof T]: T[K] extends Include ? K : never; }[keyof T];
export type IncludeMembers<T, Include>    = Pick<T, IncludeMemberKeys<T, Include>>;
export type IncludeFunctions<T>           = IncludeMembers<T, Function>;

export type StoreType<T> = T extends Writable< infer R > ? R : never;

export type InvalidKeysOf<T extends object> = { [K in keyof T]?: boolean };