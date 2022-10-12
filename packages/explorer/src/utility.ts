export const normalizeNum = (num: bigint): bigint => num / 10n ** 18n;

export const sleep = (time: number): Promise<undefined> =>
	new Promise(resolve => setTimeout(resolve, time));

export const range = (start: number, length: number): number[] =>
	Array.from(new Array(length), (_, i) => start + i);
