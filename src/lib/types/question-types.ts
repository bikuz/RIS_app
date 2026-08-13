export type DropdownOption = {
	value: string;
	label: string;
};

export type QuestionControl = {
	id: string;
	type: 'dropdown' | 'slider';
	label: string;
	options?: DropdownOption[];
	defaultValue: string | number;
	min?: number;
	max?: number;
	step?: number;
};

export type QuestionConfig = {
	id: string;
	question: string;
	hint: string;
	controls: QuestionControl[];
	hasMapVisualization: boolean;
	hasChartVisualization: boolean;
};

export type ChartData = {
	categories: string[];
	series: Array<{
		name: string;
		data: number[];
	}>;
};

export type QuestionAnswer = {
	mapSummary: string;
	chartSummary: string;
	mapData?: any;
	chartData?: ChartData;
};

export type Topic = {
	[questionId: string]: {
		config: QuestionConfig;
		answers: {
			[parameterKey: string]: QuestionAnswer;
		};
	};
};

export type AllTopicConfigs = {
	[topicName: string]: Topic;
};
