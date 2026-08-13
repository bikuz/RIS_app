import type { AllTopicConfigs } from '$lib/types/question-types';
import { clim } from './climate';
import { demography } from './demography';
import { ecosystem } from './ecosystem';

export const questionConfigs: AllTopicConfigs = {
	climate: clim,
	demography: demography,
	ecosystem: ecosystem
};
