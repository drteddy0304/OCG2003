export const FUSION_RECIPES: Record<string, [string, string]>;
export function fusionRecipe(fusionId: string): [string, string] | null;
export function fusionChoices(fusionDeck: string[], materialIds: string[]): string[];
