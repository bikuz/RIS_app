<script lang="ts">
    import { 
        Cloud, 
        Users, 
        Leaf, 
        Snowflake, 
        Sun, 
        Mountain, 
        Wind,
        CheckCircle,
        Lightbulb,
        BarChart3,
        Map,
        Database,
        ChevronRight,
        ArrowLeft,
        Sparkles
    } from '@lucide/svelte';

    // Question database with hints
    const questionsData = {
        climate: [
            {
                qs: "What is the annual average temperature trend over the past 30 years?",
                hint: 'It will describe whether temperatures have risen, fallen, or remained stable, possibly with a rate of change.'
            },
            {
                qs: "How does the annual temperature anomaly compare to the global average?",
                hint: 'It will indicate if a region is warming faster, slower, or in line with the global average.'
            },
            {
                qs: "Which areas have observed temperature rise more than how much (x) degrees in last 30 years?",
                hint: 'It will show regions where temperatures increased beyond the given threshold.'
            },
            {
                qs: "Which areas have observed highest rainfall in last 30 years?",
                hint: 'It will show the regions with extreme precipitation trends.'
            }
        ],
        demography: [
            {
                qs: "How has the sex ratio changed over time in the HKH region?",
                hint: "Analysis of gender distribution patterns and demographic shifts over time."
            },
            {
                qs: "What is the current child dependency ratio vs. aged dependency ratio?",
                hint: "Understanding population structure and dependency burden across age groups."
            },
            {
                qs: "Which areas have the highest population density?",
                hint: "Identification of population concentration hotspots and settlement patterns."
            }
        ],
        ecosystem: [
            {
                qs: "Where are NDVI/EVI values indicating vegetation stress?",
                hint: "Mapping areas with declining vegetation health and ecosystem degradation."
            },
            {
                qs: "Which regions have the highest frequency of landslides or wildfires?",
                hint: "Identifying disaster-prone areas and environmental risk zones."
            },
            {
                qs: "How has land cover changed over time?",
                hint: "Tracking deforestation, urbanization, and land use transformation patterns."
            }
        ],
        cryosphere: [
            {
                qs: "What is the rate of glacier retreat in the past decade?",
                hint: "Quantifying ice loss and glacial changes due to climate warming."
            },
            {
                qs: "How has snow cover duration changed annually?",
                hint: "Analysis of seasonal snow patterns and their temporal variations."
            },
            {
                qs: "Where are new glacial lakes forming?",
                hint: "Mapping emerging glacial lakes and potential flood risk areas."
            }
        ],
        weather: [
            {
                qs: "What is the 54-hour precipitation forecast for Region X?",
                hint: "Short-term weather prediction for rainfall and precipitation patterns."
            },
            {
                qs: "Are thunderstorms/hailstorms predicted in the next 2 days?",
                hint: "Severe weather forecasting and extreme event prediction."
            }
        ],
        physiography: [
            {
                qs: "What is the elevation profile of a specific HKH region?",
                hint: "Topographic analysis and terrain characteristics of mountain regions."
            },
            {
                qs: "Which areas have slopes >30° (high landslide risk)?",
                hint: "Identification of steep terrain and landslide susceptibility zones."
            }
        ],
        "air-quality": [
            {
                qs: "What are current PM2.5/O₃ levels in urban vs. rural areas?",
                hint: "Comparative analysis of air pollution between different settlement types."
            },
            {
                qs: "Which pollutant dominates in industrial zones?",
                hint: "Identification of primary air quality concerns in industrial areas."
            }
        ]
    } as const;

    type TopicKey = keyof typeof questionsData;
    
    type QuestionItem = {
        readonly qs: string;
        readonly hint: string;
    };

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

    // State variables
    let currentTopic: string = '';
    let currentQuestion: string = '';
    let currentSection: 'welcome' | 'question' | 'results' = 'welcome';
    let directQuestions: readonly QuestionItem[] = [];

    // Dropdown selections
    let selectedQuestion3Area = 'HKH Region';
    let selectedQuestion4Area = 'HKH Region';
    let selectedDegree = '0.5';

    // Dropdown options
    const areaOptions = [
        'HKH Region',
        'Afghanistan',
        'Bangladesh',
        'Bhutan',
        'China',
        'India',
        'Myanmar',
        'Nepal',
        'Pakistan'
    ];

    const degreeOptions = ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0'];

    function selectTopic(topic: string) {
        currentTopic = topic;
        currentSection = 'question';
        directQuestions = questionsData[topic as TopicKey] || [];
    }

    function selectQuestion(question: string) {
        currentQuestion = question;
        currentSection = 'results';
    }

    function goBack() {
        if (currentSection === 'results') {
            currentSection = 'question';
        }
    }

    function getTopicName(topic: string): string {
        return topic.charAt(0).toUpperCase() + topic.slice(1).replace('-', ' ');
    }

    function getTopicColor(topic: string): string {
        return topicColors[topic as TopicKey] || 'from-gray-500 to-slate-500';
    }

    function getTopicIcon(topic: string) {
        return topicIcons[topic as TopicKey] || Cloud;
    }

    function getCurrentQuestionHint(): string {
        const topicQuestions = questionsData[currentTopic as TopicKey] || [];
        const questionObj = topicQuestions.find(q => q.qs === currentQuestion);
        return questionObj?.hint || '';
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
                                ? 'bg-gradient-to-r ' + topicColors[topic as TopicKey] + ' text-white shadow-lg shadow-blue-500/25' 
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
            {#if currentSection === 'question'}
                <div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                    <div class="flex items-center space-x-4 mb-8">
                        <div class="p-3 bg-gradient-to-r {topicColors[currentTopic as TopicKey]} rounded-xl">
                            <svelte:component this={topicIcons[currentTopic as TopicKey]} class="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-slate-800">
                                What would you like to know about <span class="bg-gradient-to-r {topicColors[currentTopic as TopicKey]} bg-clip-text text-transparent">{getTopicName(currentTopic)}</span>?
                            </h3>
                            <p class="text-slate-600 mt-1">Choose a question to explore the data</p>
                        </div>
                    </div>

                    <!-- Questions List -->
                    <div class="grid gap-4">
                        {#each directQuestions as question, index}
                            <button 
                                onclick={() => selectQuestion(question.qs)} 
                                class="group w-full text-left p-6 rounded-2xl border-2 border-green-200/50 hover:border-green-300 bg-gradient-to-r from-green-50/50 to-emerald-50/50 hover:from-green-100/70 hover:to-emerald-100/70 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-lg"
                            >
                                <div class="flex items-start space-x-4">
                                    <div class="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex-shrink-0 flex items-center justify-center mt-1">
                                        <span class="text-white font-bold text-sm">{index + 1}</span>
                                    </div>
                                    <div class="flex-1">
                                        <p class="text-slate-800 font-semibold group-hover:text-green-700 leading-relaxed mb-2">
                                            {question.qs}
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
            {#if currentSection === 'results'}
                <div class="space-y-8">
                    <!-- Question Header -->
                    <div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                        <div class="flex items-center justify-between mb-6">
                            <div class="flex items-center space-x-4">
                                <div class="p-3 bg-gradient-to-r {topicColors[currentTopic as TopicKey]} rounded-xl">
                                    <svelte:component this={topicIcons[currentTopic as TopicKey]} class="w-6 h-6 text-white" />
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
                                        {currentQuestion}
                                    </p>
                                    <p class="text-sm text-slate-600 leading-relaxed">
                                        {getCurrentQuestionHint()}
                                    </p>
                                    
                                    <!-- Interactive Controls for Questions 3 and 4 -->
                                    {#if currentQuestion.includes('temperature rise more than how much (x) degrees')}
                                        <div class="flex flex-wrap gap-4 mt-4 p-4 bg-white/60 rounded-xl border border-slate-200/50">
                                            <div class="flex items-center space-x-3">
                                                <label class="text-sm font-semibold text-slate-700">Area:</label>
                                                <select bind:value={selectedQuestion3Area} class="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                    {#each areaOptions as area}
                                                        <option value={area}>{area}</option>
                                                    {/each}
                                                </select>
                                            </div>
                                            <div class="flex items-center space-x-3">
                                                <label class="text-sm font-semibold text-slate-700">Temperature Rise:</label>
                                                <select bind:value={selectedDegree} class="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                    {#each degreeOptions as degree}
                                                        <option value={degree}>{degree}°C</option>
                                                    {/each}
                                                </select>
                                            </div>
                                        </div>
                                    {/if}
                                    
                                    {#if currentQuestion.includes('highest rainfall in last 30 years')}
                                        <div class="flex flex-wrap gap-4 mt-4 p-4 bg-white/60 rounded-xl border border-slate-200/50">
                                            <div class="flex items-center space-x-3">
                                                <label class="text-sm font-semibold text-slate-700">Area:</label>
                                                <select bind:value={selectedQuestion4Area} class="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                    {#each areaOptions as area}
                                                        <option value={area}>{area}</option>
                                                    {/each}
                                                </select>
                                            </div>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Map Section -->
                    <div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                        <div class="flex items-center space-x-4 mb-6">
                            <div class="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                                <Map class="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 class="text-xl font-bold text-slate-800">Geospatial Visualization</h4>
                                <p class="text-slate-600">Interactive map analysis</p>
                            </div>
                        </div>

                        <!-- Map Answer Summary -->
                        <div class="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-blue-200/30">
                            <div class="flex items-start space-x-4">
                                <div class="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex-shrink-0">
                                    <Map class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h5 class="font-bold text-blue-900 mb-3">Map Analysis Summary</h5>
                                    <p class="text-blue-800 leading-relaxed">
                                        {#if currentQuestion.includes('temperature rise more than how much (x) degrees')}
                                            The map shows areas in {selectedQuestion3Area} where temperature has risen more than {selectedDegree}°C in the last 30 years. Spatial patterns reveal regional variations in warming trends across the selected region.
                                        {:else if currentQuestion.includes('highest rainfall in last 30 years')}
                                            The map displays rainfall distribution patterns across {selectedQuestion4Area} over the past 30 years, highlighting areas with the highest precipitation levels and seasonal variations.
                                        {:else}
                                            The interactive map below shows the spatial distribution and geographic patterns related to your selected question about {getTopicName(currentTopic)}. Geographic hotspots and regional variations are clearly visualized.
                                        {/if}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Map Visualization -->
                        <div class="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden">
                            <div class="h-96 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                <div class="text-center">
                                    <div class="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl w-fit mx-auto mb-4">
                                        <Map class="w-12 h-12 text-white" />
                                    </div>
                                    <p class="text-slate-600 font-medium">Interactive map will be displayed here</p>
                                    <p class="text-slate-500 text-sm mt-2">
                                        {#if currentQuestion.includes('temperature rise more than how much (x) degrees')}
                                            Showing temperature rise > {selectedDegree}°C in {selectedQuestion3Area}
                                        {:else if currentQuestion.includes('highest rainfall in last 30 years')}
                                            Showing rainfall patterns in {selectedQuestion4Area}
                                        {:else}
                                            Geospatial visualization for {getTopicName(currentTopic)}
                                        {/if}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Chart Section -->
                    <div class="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
                        <div class="flex items-center space-x-4 mb-6">
                            <div class="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                                <BarChart3 class="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h4 class="text-xl font-bold text-slate-800">Statistical Analysis</h4>
                                <p class="text-slate-600">Charts and trends visualization</p>
                            </div>
                        </div>

                        <!-- Chart Answer Summary -->
                        <div class="bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-green-200/30">
                            <div class="flex items-start space-x-4">
                                <div class="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex-shrink-0">
                                    <BarChart3 class="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h5 class="font-bold text-green-900 mb-3">Chart Analysis Summary</h5>
                                    <p class="text-green-800 leading-relaxed">
                                        {#if currentQuestion.includes('temperature rise more than how much (x) degrees')}
                                            The charts below show temporal trends and statistical analysis of temperature changes exceeding {selectedDegree}°C in {selectedQuestion3Area}. Time series data reveals patterns and acceleration in warming trends.
                                        {:else if currentQuestion.includes('highest rainfall in last 30 years')}
                                            Statistical charts display rainfall trends, seasonal patterns, and comparative analysis for {selectedQuestion4Area} over the 30-year period, including anomaly detection and trend analysis.
                                        {:else}
                                            The statistical charts provide quantitative analysis and temporal trends related to your question about {getTopicName(currentTopic)}. Data patterns, correlations, and statistical insights are presented through various chart types.
                                        {/if}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Chart Visualization -->
                        <div class="bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden">
                            <div class="h-96 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                                <div class="text-center">
                                    <div class="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl w-fit mx-auto mb-4">
                                        <BarChart3 class="w-12 h-12 text-white" />
                                    </div>
                                    <p class="text-slate-600 font-medium">Interactive charts will be displayed here</p>
                                    <p class="text-slate-500 text-sm mt-2">
                                        {#if currentQuestion.includes('temperature rise more than how much (x) degrees')}
                                            Statistical analysis for {selectedDegree}°C rise in {selectedQuestion3Area}
                                        {:else if currentQuestion.includes('highest rainfall in last 30 years')}
                                            Rainfall trend analysis for {selectedQuestion4Area}
                                        {:else}
                                            Data visualization for {getTopicName(currentTopic)}
                                        {/if}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
