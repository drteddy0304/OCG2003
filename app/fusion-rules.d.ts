export const FUSION_RECIPES: Record<string, string[]>;
export function fusionRecipe(fusionId: string): string[] | null;
export function isFusionSubstitute(id: string): boolean;
export function canSelectFusionMaterial(recipe: string[], selectedIds: string[], candidateId: string): boolean;
export function isValidFusionSelection(recipe: string[], selectedIds: string[]): boolean;
export function fusionMaterialSelection(recipe: string[], materialIds: string[], selectedIds?: string[]): string[] | null;
export function fusionChoices(fusionDeck: string[], materialIds: string[]): string[];
export function bestFusionChoice(fusionDeck: string[], materialIds: string[], attackById: Record<string, number>): string | null;
