import type { AllTopicConfigs, DropdownOption } from '$lib/types/question-types';
import { clim } from './climate';
import { demography } from './demography';
import { ecosystem } from './ecosystem';

export const questionConfigs: AllTopicConfigs = {
    climate: clim,
    demography:demography,
    ecosystem:ecosystem
    // Add other topics (demography, ecosystem, etc.) with their specific configurations
}