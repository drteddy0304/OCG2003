export const FUSION_RECIPES: Record<string, string[]>;
export function fusionRecipe(fusionId: string): string[] | null;
export function fusionChoices(fusionDeck: string[], materialIds: string[]): string[];
export function bestFusionChoice(fusionDeck: string[], materialIds: string[], attackById: Record<string, number>): string | null;
