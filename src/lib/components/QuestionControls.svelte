<script lang="ts">
    import type { QuestionControl } from '$lib/types/question-types';
    import { ChevronDown } from '@lucide/svelte';

    let { controls, values, onValueChange } = $props<{
        controls: QuestionControl[];
        values: Record<string, any>;
        onValueChange: (controlId: string, value: any) => void;
    }>();

    // Debug logging
    $effect(() => {
        console.log('QuestionControls values updated:', values);
    });
</script>

<div class="flex flex-wrap gap-4 p-4 bg-white/60 rounded-xl border border-slate-200/50">
    {#each controls as control}
        <div class="flex items-center space-x-3">
            <label class="text-sm font-semibold text-slate-700">{control.label}:</label>
            
            {#if control.type === 'dropdown'}
                <div class="relative">
                    <select 
                        value={values[control.id] ?? control.defaultValue}
                        onchange={(e) => {
                            console.log('Dropdown changed:', control.id, e.currentTarget.value);
                            onValueChange(control.id, e.currentTarget.value);
                        }}
                        class="appearance-none px-3 py-2 pr-8 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    >
                        {#each control.options || [] as option}
                            <option value={option.value}>{option.label}</option>
                        {/each}
                    </select>
                    <ChevronDown class="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
            
            {:else if control.type === 'slider'}
                <div class="flex items-center space-x-2">
                    <input 
                        type="range"
                        min={control.min || 0}
                        max={control.max || 100}
                        step={control.step || 1}
                        value={values[control.id] ?? control.defaultValue}
                        oninput={(e) => {
                            const value = parseFloat(e.currentTarget.value);
                            console.log('Slider changed:', control.id, value);
                            onValueChange(control.id, value);
                        }}
                        class="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span class="text-sm font-medium text-slate-600 min-w-[3rem]">
                        {values[control.id] ?? control.defaultValue}{control.step === 0.1 ? '°C' : ''}
                    </span>
                </div>
            
            <!-- {:else if control.type === 'multi-select'}
                <div class="relative">
                    <select 
                        multiple
                        value={values[control.id] ?? control.defaultValue}
                        onchange={(e) => {
                            const selectedValues = Array.from(e.currentTarget.selectedOptions).map(option => option.value);
                            console.log('Multi-select changed:', control.id, selectedValues);
                            onValueChange(control.id, selectedValues);
                        }}
                        class="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {#each control.options || [] as option}
                            <option value={option.value}>{option.label}</option>
                        {/each}
                    </select>
                </div> -->
            {/if}
        </div>
    {/each}
</div>

<style>
    .slider::-webkit-slider-thumb {
        appearance: none;
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
    }
    
    .slider::-moz-range-thumb {
        height: 16px;
        width: 16px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: none;
    }
</style>
