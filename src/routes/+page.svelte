<script lang="ts">
    import { 
        Cloud, Users, Leaf, Snowflake, Sun, Mountain, Wind,
        CheckCircle, Lightbulb, BarChart3, Map, Database,
        ChevronRight, ArrowLeft, Sparkles
    } from '@lucide/svelte';
    
    import QuestionControls from '$lib/components/QuestionControls.svelte';
    import VisualizationSection from '$lib/components/VisualizationSection.svelte';
    import { questionConfigs } from '$lib/data/question-configs';
    import type { QuestionConfig, QuestionAnswer } from '$lib/types/question-types';

    const topicIcons = {
        climate: Cloud,
        demography: Users,
        ecosystem: Leaf,
        cryosphere: Snowflake,
        weather: Sun,
        physiography: Mountain,
        'air-quality': Wind
    } as const;

    const topicColors = {
        climate: 'from-blue-500 to-cyan-500',
        demography: 'from-purple-500 to-pink-500',
        ecosystem: 'from-[#b1d777] to-emerald-500',
        cryosphere: 'from-cyan-500 to-blue-500',
        weather: 'from-yellow-500 to-orange-500',
        physiography: 'from-stone-500 to-amber-500',
        'air-quality': 'from-gray-500 to-slate-500'
    } as const;

    // State variables using Svelte 5 runes
    let currentTopic = $state('');
    let currentQuestionId = $state('');
    let currentSection = $state<'welcome' | 'question' | 'results'>('welcome');
    let controlValues = $state<Record<string, any>>({});

    // Derived values - these should be simple expressions, not functions
    let currentQuestionConfig = $derived(
        currentQuestionId && currentTopic 
            ? questionConfigs[currentTopic]?.[currentQuestionId]?.config 
            : null
    );

    // Generate parameter key for answer lookup
    let parameterKey = $derived(
        currentQuestionConfig 
            ? currentQuestionConfig.controls
                .map(control => `${control.id}:${controlValues[control.id] ?? control.defaultValue}`)
                .join(',')
            : ''
    );

    // Get current answer based on selected parameters
    let currentAnswer = $derived(
        currentQuestionId && currentTopic && parameterKey
            ? questionConfigs[currentTopic]?.[currentQuestionId]?.answers[parameterKey]
            : null
    );

    // Debug logging to see what's happening
    $effect(() => {
        console.log('State changed:', $state.snapshot({
            currentTopic,
            currentQuestionId,
            currentSection,
            controlValues,
            parameterKey,
            hasConfig: !!currentQuestionConfig,
            hasAnswer: !!currentAnswer
        }));
    });

    function selectTopic(topic: string) {
        currentTopic = topic;
        currentSection = 'question';
        currentQuestionId = '';
        controlValues = {}; // Reset control values
    }

    function selectQuestion(questionId: string) {
        currentQuestionId = questionId;
        currentSection = 'results';
        
        // Initialize control values with defaults
        const config = questionConfigs[currentTopic]?.[questionId]?.config;
        if (config) {
            const newControlValues: Record<string, any> = {};
            config.controls.forEach(control => {
                newControlValues[control.id] = control.defaultValue;
            });
            controlValues = newControlValues;
            console.log('Initialized control values:', newControlValues);
        }
    }

    function handleControlValueChange(controlId: string, value: any) {
        console.log('Control value changing:', controlId, value);
        // Create a new object to ensure reactivity
        controlValues = {
            ...controlValues,
            [controlId]: value
        };
    }

    function goBack() {
        if (currentSection === 'results') {
            currentSection = 'question';
            currentQuestionId = '';
            controlValues = {};
        }
    }

    function getTopicName(topic: string): string {
        return topic.charAt(0).toUpperCase() + topic.slice(1).replace('-', ' ');
    }

    function getTopicQuestions(topic: string) {
        const topicData = questionConfigs[topic];
        if (!topicData) return [];
        return Object.values(topicData).map(item => item.config);
    }

    function getTopicColor(topic: string): string {
        return topicColors[topic as keyof typeof topicColors] || 'from-gray-500 to-slate-500';
    }

    function getTopicIcon(topic: string) {
        return topicIcons[topic as keyof typeof topicIcons] || Cloud;
    }
</script>

<div class="container mx-auto px-6 py-8">
    <div class="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <!-- Sidebar - Topic Selection -->
        <div class="xl:col-span-1">
            <div class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sticky top-24">
                <div class="flex items-center space-x-3 mb-6">
                    <div class="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                        <Database class="w-5 h-5 text-white" />
                    </div>
                    <h2 class="text-lg font-bold text-slate-800">Data Categories</h2>
                </div>
                
                <nav class="space-y-3">
                    {#each Object.entries(topicIcons) as [topic, IconComponent]}
                        <button 
                            onclick={() => selectTopic(topic)} 
                            class="group w-full text-left p-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] {currentTopic === topic 
                                ? 'bg-gradient-to-r ' + getTopicColor(topic) + ' text-white shadow-lg shadow-blue-500/25' 
                                : 'bg-white/50 hover:bg-white/80 text-slate-700 hover:shadow-md border border-slate-200/50'}"
                        >
                            <div class="flex items-center space-x-3">
                                <div class="p-2 rounded-lg {currentTopic === topic ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}">
                                    <svelte:component 
                                        this={IconComponent} 
                                        class="w-5 h-5 {currentTopic === topic ? 'text-white' : 'text-slate-600'}" 
                                    />
                                </div>
                                <span class="font-semibold">{getTopicName(topic)}</span>
                                <ChevronRight class="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </button>
                    {/each}
                </nav>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="xl:col-span-4">
            <!-- Welcome Message -->
            {#if currentSection === 'welcome'}
                <div class="bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12">
                    <div class="text-center max-w-4xl mx-auto">
                        <div class="flex justify-center mb-6">
                            <div class="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl">
                                <Sparkles class="w-12 h-12 text-white" />
                            </div>
                        </div>
                        
                        <h1 class="text-3xl font-black text-slate-800 mb-4 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            Environmental Data for Sustainable Decision Making
                        </h1>
                        
                        <p class="text-xl text-slate-600 mb-8 leading-relaxed">
                            Discover insights about climate, demographics, ecosystems, and more in the Hindu Kush Himalaya region. 
                            Simply select a topic from the sidebar to begin your exploration journey.
                        </p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                            <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:shadow-lg transition-all duration-300">
                                <div class="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl w-fit mx-auto mb-4">
                                    <BarChart3 class="w-8 h-8 text-white" />
                                </div>
                                <h3 class="font-bold text-slate-800 mb-2">Interactive Charts</h3>
                                <p class="text-slate-600 text-sm">Dynamic visualizations that bring data to life</p>
                            </div>
                            
                            <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:shadow-lg transition-all duration-300">
                                <div class="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl w-fit mx-auto mb-4">
                                    <Map class="w-8 h-8 text-white" />
                                </div>
                                <h3 class="font-bold text-slate-800 mb-2">Visual Maps</h3>
                                <p class="text-slate-600 text-sm">Geospatial insights at your fingertips</p>
                            </div>
                            
                            <div class="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:shadow-lg transition-all duration-300">
                                <div class="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl w-fit mx-auto mb-4">
                                    <Lightbulb class="w-8 h-8 text-white" />
                                </div>
                                <h3 class="font-bold text-slate-800 mb-2">Clear Explanations</h3>
                                <p class="text-slate-600 text-sm">Easy-to-understand insights for everyone</p>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}

            <!-- Question Selection -->
            {#if currentSection === 'question' && currentTopic}
                <div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                    <div class="flex items-center space-x-4 mb-8">
                        <div class="p-3 bg-gradient-to-r {getTopicColor(currentTopic)} rounded-xl">
                            <svelte:component this={getTopicIcon(currentTopic)} class="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-slate-800">
                                What would you like to know about <span class="bg-gradient-to-r {getTopicColor(currentTopic)} bg-clip-text text-transparent">{getTopicName(currentTopic)}</span>?
                            </h3>
                            <p class="text-slate-600 mt-1">Choose a question to explore the data</p>
                        </div>
                    </div>

                    <!-- Questions List -->
                    <div class="grid gap-4">
                        {#each getTopicQuestions(currentTopic) as question, index}
                            <button 
                                onclick={() => selectQuestion(question.id)} 
                                class="group w-full text-left p-6 rounded-2xl border-2 border-green-200/50 hover:border-green-300 bg-gradient-to-r from-green-50/50 to-emerald-50/50 hover:from-green-100/70 hover:to-emerald-100/70 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg"
                            >
                                <div class="flex items-start space-x-4">
                                    <div class="w-8 h-8 rounded-full bg-gradient-to-r {getTopicColor(currentTopic)} flex-shrink-0 flex items-center justify-center mt-1">
                                        <span class="text-white font-bold text-sm">{index + 1}</span>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-slate-800 font-semibold group-hover:text-green-700 leading-relaxed mb-2">
                                            {question.question}
                                        </p>
                                        <p class="text-sm text-slate-500 font-medium leading-relaxed">
                                            {question.hint}
                                        </p>
                                    </div>
                                    <ChevronRight class="w-5 h-5 text-slate-400 group-hover:text-green-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                                </div>
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Results Section -->
            {#if currentSection === 'results' && currentQuestionConfig}
                <div class="space-y-8">
                    <!-- Question Header -->
                    <div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                        <div class="flex items-center justify-between mb-6">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 bg-gradient-to-r {getTopicColor(currentTopic)} rounded-xl">
                                    <svelte:component this={getTopicIcon(currentTopic)} class="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 class="text-2xl font-bold text-slate-800 capitalize">{getTopicName(currentTopic)}</h3>
                                    <p class="text-slate-600 mt-1">Analysis Results</p>
                                </div>
                            </div>
                            <button 
                                onclick={goBack} 
                                class="flex items-center space-x-2 px-6 py-3 text-slate-600 hover:text-slate-800 bg-white/60 hover:bg-white/80 border border-slate-200 rounded-xl hover:shadow-md transition-all duration-300"
                            >
                                <ArrowLeft class="w-4 h-4" />
                                <span class="font-medium">Back to Questions</span>
                            </button>
                        </div>

                        <!-- Selected Question Display -->
                        <div class="bg-gradient-to-r from-slate-50/80 to-slate-100/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/30">
                            <div class="flex items-start space-x-4">
                                <div class="p-2 bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg flex-shrink-0">
                                    <Lightbulb class="w-5 h-5 text-white" />
                                </div>
                                <div class="flex-1">
                                    <h4 class="font-bold text-slate-800 mb-3">Selected Question</h4>
                                    <p class="text-slate-700 leading-relaxed font-medium mb-3">
                                        {currentQuestionConfig.question}
                                    </p>
                                    <p class="text-sm text-slate-600 leading-relaxed mb-4">
                                        {currentQuestionConfig.hint}
                                    </p>
                                    
                                    <!-- Dynamic Question Controls -->
                                    {#if currentQuestionConfig.controls.length > 0}
                                        <QuestionControls 
                                            controls={currentQuestionConfig.controls}
                                            values={controlValues}
                                            onValueChange={handleControlValueChange}
                                        />
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Show fallback if no answer found -->
                    {#if !currentAnswer}
                        <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                            <p class="text-yellow-800">
                                No answer found for parameter combination: "{parameterKey}"
                            </p>
                            <p class="text-sm text-yellow-600 mt-2">
                                Available answers: {Object.keys(questionConfigs[currentTopic]?.[currentQuestionId]?.answers || {}).join(', ')}
                            </p>
                        </div>
                    {:else}
                        <!-- Map Visualization -->
                        {#if currentQuestionConfig.hasMapVisualization}
                            <VisualizationSection 
                                type="map"
                                answer={currentAnswer}
                                questionTitle={currentQuestionConfig.question}
                                selectedParams={controlValues}
                            />
                        {/if}

                        <!-- Chart Visualization -->
                        {#if currentQuestionConfig.hasChartVisualization}
                            <VisualizationSection 
                                type="chart"
                                answer={currentAnswer}
                                questionTitle={currentQuestionConfig.question}
                                selectedParams={controlValues}
                            />
                        {/if}
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</div>
