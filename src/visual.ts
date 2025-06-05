/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";
import * as d3 from 'd3';

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { VisualFormattingSettingsModel } from "./settings";

interface FunnelValue {
    legend: string;
    value: number;
    idx?: number;
    selectionId?: powerbi.visuals.ISelectionId;
}

interface FunnelData {
    stage: string;
    values: FunnelValue[];
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private updateCount: number;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private svg: d3.Selection<SVGElement, any, null, undefined>;
    private container: d3.Selection<SVGElement, any, null, undefined>;
    private legendContainer: d3.Selection<SVGElement, any, null, undefined>;
    private host: powerbi.extensibility.visual.IVisualHost;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private funnelData: FunnelData[];

    constructor(options: VisualConstructorOptions) {
        console.log('Constructor called');
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.updateCount = 0;

        // Initialize formatting settings
        this.formattingSettings = new VisualFormattingSettingsModel();

        // Create SVG container with explicit dimensions
        this.svg = d3.select(this.target)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .style('background-color', '#f0f0f0'); // Light gray background to see the container

        // Create main container for the funnel
        this.container = this.svg.append('g')
            .attr('class', 'funnel-container');

        // Create legend container
        this.legendContainer = this.svg.append('g')
            .attr('class', 'legend-container');
    }

    public update(options: VisualUpdateOptions) {
        try {
            console.log('Update called with options:', options);
            
            if (!options || !options.dataViews || !options.dataViews[0]) {
                console.error('No data available');
                return;
            }

            const dataView = options.dataViews[0];
            console.log('DataView received in update:', JSON.stringify(dataView, null, 2));
            console.log('Current Selection State:', this.selectionManager.getSelectionIds());
            
            // Get dimensions
            const width = options.viewport.width;
            const height = options.viewport.height;

            if (width <= 0 || height <= 0) {
                console.error('Invalid viewport dimensions');
                return;
            }

            // Update SVG dimensions and background
            this.svg
                .attr('width', width)
                .attr('height', height)
                .style('background-color', this.formattingSettings.general.background.value.value);

            // Clear previous content
            this.container.selectAll('*').remove();
            this.legendContainer.selectAll('*').remove();
            this.svg.selectAll('foreignObject.funnel-scroll').remove();
            d3.select(this.target).selectAll('.funnel-tooltip').remove();

            // --- Tooltip ---
            const tooltip = d3.select(this.target)
                .append('div')
                .attr('class', 'funnel-tooltip')
                .style('position', 'absolute')
                .style('pointer-events', 'none')
                .style('background', 'rgba(0,0,0,0.8)')
                .style('color', '#fff')
                .style('padding', '6px 10px')
                .style('border-radius', '4px')
                .style('font-size', '12px')
                .style('display', 'none')
                .style('z-index', 10);

            // --- Data Preparation ---
            let funnelData: FunnelData[] = [];
            let legendCategories: string[] = ["All"];
            let stages: string[] = [];
            let selectionIds: powerbi.visuals.ISelectionId[] = [];

            if (dataView.categorical) {
                const categorical = dataView.categorical;
                const categoryColumns = categorical.categories;
                const valueFields = categorical.values;

                if (valueFields && valueFields.length > 0) {
                    // Process stages and values
                    if (categoryColumns && categoryColumns.length > 0) {
                        // Get stages from the first category
                        stages = categoryColumns[0].values.map(String);
                        
                        // Get legend categories if available
                        if (categoryColumns.length > 1) {
                            legendCategories = Array.from(new Set(categoryColumns[1].values.map(String)));
                        } else {
                           // If no second category for legend, use the stages as legend categories
                           legendCategories = Array.from(new Set(stages));
                        }

                        // Create funnel data with segments and selection IDs
                        const stageMap = new Map<string, FunnelData>();
                        
                        stages.forEach((stage, i) => {
                            if (!stageMap.has(stage)) {
                                stageMap.set(stage, {
                                    stage,
                                    values: []
                                });
                            }
                            
                            const stageData = stageMap.get(stage)!;
                            const value = Number(valueFields[0].values[i]);
                            const legend = categoryColumns.length > 1 
                                ? String(categoryColumns[1].values[i]) 
                                : stage;
                            
                            // Create Selection ID
                            // For categorical data, include both the stage and the segment/product in the SelectionId
                            const selectionId = this.host.createSelectionIdBuilder()
                                .withCategory(categoryColumns[0], i) // Stage category
                                .withCategory(categoryColumns.length > 1 ? categoryColumns[1] : null, categoryColumns.length > 1 ? i : null) // Segment/Product category
                                .createSelectionId();

                            console.log(`Creating selectionId for stage index ${i}, category ${categoryColumns.length > 0 ? categoryColumns[0].values[i] : 'N/A'}, segment ${categoryColumns.length > 1 ? categoryColumns[1].values[i] : 'N/A'}:`, selectionId);

                            // Add segment to the stage
                            stageData.values.push({
                                legend,
                                value,
                                idx: i,
                                selectionId // Add selectionId to segment data
                            });
                            // Don't collect all selectionIds here, let onSelectionChanged handle the current selection state
                            // selectionIds.push(selectionId);
                        });

                        funnelData = Array.from(stageMap.values());

                        // Sort segments within each stage by value (descending)
                        funnelData.forEach(stage => {
                            stage.values.sort((a, b) => b.value - a.value);
                        });
                    } else {
                        // Handle case with just values (calculated measures)
                        stages = valueFields.map((field, i) => field.source.displayName || `Measure ${i + 1}`);
                        legendCategories = ["All"]; // Default legend for this case
                        
                        funnelData = stages.map((stage, i) => {
                            const value = Number(valueFields[i].values[0]);
                             // Create Selection ID for value only - this might not support filtering by stage in this case
                            const selectionId = this.host.createSelectionIdBuilder()
                                .withMeasure(valueFields[i].source.queryName)
                                .createSelectionId();

                            console.log(`Creating selectionId for value field ${valueFields[i].source.displayName}:`, selectionId);

                            // Don't collect all selectionIds here
                            // selectionIds.push(selectionId);

                            return {
                                stage,
                                values: [{
                                    legend: "All",
                                    value,
                                    idx: i,
                                    selectionId // Add selectionId to segment data
                                }]
                            };
                        });
                    }
                }
            } else if (dataView.table) {
                 console.log('Processing table data for interactivity and rates');
                const columns = dataView.table.columns;
                const rows = dataView.table.rows;
                console.log('Table columns:', columns);
                console.log('Table rows:', rows);
                
                if (rows && rows.length > 0) {
                    stages = rows.map((_, i) => `Row ${i + 1}`); // Using row index as stage name for simplicity
                    legendCategories = ["Value"]; // Default legend for table data

                    funnelData = rows.map((row, i) => {
                        const value = Number(row[0] as number);

                         // Create Selection ID for the row
                        const selectionId = this.host.createSelectionIdBuilder()
                            .withTable(dataView.table, i)
                            .createSelectionId();

                        console.log(`Creating selectionId for table row ${i}:`, selectionId);

                        // Don't collect all selectionIds here
                        // selectionIds.push(selectionId);

                        return {
                            stage: stages[i],
                            values: [{
                                legend: "Value", // Using a default legend for table data
                                value,
                                idx: i,
                                selectionId // Add selectionId to segment data
                            }]
                        };
                    });
                }
            }

            if (!funnelData || funnelData.length === 0) {
                console.error('No valid data to display');
                return;
            }

            console.log('Processed funnel data with Selection IDs:', funnelData);
            this.funnelData = funnelData;

            // --- Calculate Conversion and Drop-off Rates ---
            const totalStages = funnelData.length;
            const stageTotals = funnelData.map(d => d3.sum(d.values, v => v.value));
            const firstStageTotal = stageTotals[0] || 1; // Avoid division by zero

            const rates: { stage: string; conversion: number; dropOff: number | null }[] = [];

            funnelData.forEach((stageData, i) => {
                const currentStageTotal = stageTotals[i];
                const conversion = (currentStageTotal / firstStageTotal) * 100;
                const dropOff = i > 0 ? ((stageTotals[i-1] - currentStageTotal) / stageTotals[i-1]) * 100 : null;
                
                rates.push({
                    stage: stageData.stage,
                    conversion: Math.round(conversion * 100) / 100, // Round to 2 decimal places
                    dropOff: dropOff !== null ? Math.round(dropOff * 100) / 100 : null
                });
            });

            console.log('Calculated rates:', rates);

            // For each stage, sum the values for width calculation
            const totals = funnelData.map(d => d3.sum(d.values, v => v.value));
            const maxTotal = (d3.max(totals) || 1) as number;

            // --- Color Scale Setup ---
            // Bring back the colorScale based on formatting settings
            const colorScale: d3.ScaleOrdinal<string, string> = d3.scaleOrdinal<string, string>()
                .domain(legendCategories);

            // Bring back the switch statement for color palettes
            switch (this.formattingSettings.colors.colorPalette.value.value) {
                case 'category20':
                case 'category10': // Added category10 as an option
                    // Use a palette with enough distinct colors, e.g., d3.schemeCategory10 or d3.schemeAccent
                    // Category10 has 10 colors, Accent has 10. Both are sufficient.
                    colorScale.range(d3.schemeCategory10);
                    break;
                case 'custom':
                     // If customColors is a single color, repeat it for all categories.
                     const customColor = this.formattingSettings.colors.customColors.value.value;
                     colorScale.range(legendCategories.map(() => customColor));
                    break;
                case 'default':
                default:
                    // Default to a standard categorical palette like Category10
                    colorScale.range(d3.schemeCategory10);
                    break;
            }

            // Capture formatting settings and rates for use in event handlers
            const currentFormattingSettings = this.formattingSettings;
            const currentRates = rates;

            // Capture 'this' for use in D3 event handlers
            const self = this;

            // --- Responsive Layout ---
            const leftLabelWidth = Math.max(80, width * 0.15);
            const legendHeight = this.formattingSettings.legend.show.value ? 30 : 0;
            const legendTop = 10;
            const chartTop = legendTop + legendHeight + 20;
            const availableHeight = height - chartTop - 10;
            const availableWidth = width - leftLabelWidth;
            const funnelWidth = Math.max(availableWidth, 100);

            // Calculate bar dimensions
            let funnelLevels = funnelData.length;
            let barGap = this.formattingSettings.funnel.barGap.value;
            let barHeight = Math.max(18, Math.floor((availableHeight - (funnelLevels - 1) * barGap) / funnelLevels));
            if (barHeight < 18) {
                barHeight = 18;
                barGap = Math.max(2, Math.floor((availableHeight - funnelLevels * barHeight) / (funnelLevels - 1)));
            }

            const totalFunnelHeight = funnelLevels * barHeight + (funnelLevels - 1) * barGap;
            const centerOffset = Math.max((width - (leftLabelWidth + funnelWidth)) / 2, 0);

            // --- Scrollable Area ---
            const totalContentWidth = leftLabelWidth + funnelWidth;
            const totalContentHeight = totalFunnelHeight;
            const needsHScroll = totalContentWidth > (width - centerOffset * 2); // Re-evaluate needsHScroll based on foreignObject width
            const needsVScroll = totalContentHeight > (height - chartTop - 10); // Re-evaluate needsVScroll based on foreignObject height

            let scrollForeign = this.svg.append('foreignObject')
                .attr('class', 'funnel-scroll')
                .attr('x', centerOffset)
                .attr('y', chartTop)
                .attr('width', width - centerOffset * 2)
                .attr('height', height - chartTop - 10);

            let scrollDiv = scrollForeign.append('xhtml:div')
                .style('width', '100%') // Set div width to 100% of foreignObject
                .style('height', '100%') // Set div height to 100% of foreignObject
                .style('overflow-y', needsVScroll ? 'auto' : 'hidden')
                .style('overflow-x', needsHScroll ? 'auto' : 'hidden')
                .style('display', 'block')
                .style('position', 'relative');

            let scrollSvg = d3.select(scrollDiv.node()).append('svg')
                .attr('width', totalContentWidth)
                .attr('height', totalContentHeight)
                .style('display', 'block');

            // Left labels group
            let leftLabelsGroup = scrollSvg.append('g')
                .attr('class', 'funnel-left-labels');

            // Bars group
            let barsGroup = scrollSvg.append('g')
                .attr('class', 'funnel-bars')
                .attr('transform', `translate(${leftLabelWidth},0)`);

            // Re-append the legend container to the main svg
            let legendGroup = this.svg.append('g') // Append to main svg
                .attr('class', 'legend-container'); // Keep the class

            // --- Interactivity State ---
            // No need for local selectedLegend state if relying on Power BI selection
            // let selectedLegend: string | null = null;

            // Draw the funnel
            funnelData.forEach((stageData, i) => {
                const y = i * (barHeight + barGap);
                
                // Left label
                leftLabelsGroup.append('text')
                    .attr('x', leftLabelWidth - 10)
                    .attr('y', y + barHeight / 2)
                    .attr('text-anchor', 'end')
                    .attr('dominant-baseline', 'middle')
                    .text(stageData.stage)
                    .style('font-size', `${this.formattingSettings.labels.stageFontSize.value}px`)
                    .style('fill', this.formattingSettings.labels.stageColor.value.value);

                // Bars
                let x = 0;
                const total = totals[i];
                const stageWidth = (total / maxTotal) * funnelWidth;
                const barXOffset = (funnelWidth - stageWidth) / 2;

                stageData.values.forEach(seg => {
                    const segWidth = (seg.value / total) * stageWidth;
                    const bar = barsGroup.append('rect')
                        .datum(seg)
                        .attr('x', barXOffset + x)
                        .attr('y', y)
                        .attr('width', segWidth)
                        .attr('height', barHeight)
                        .attr('fill', colorScale(seg.legend)) // Use colorScale to get color based on legend category
                        .attr('rx', this.formattingSettings.funnel.barCornerRadius.value)
                        .attr('ry', this.formattingSettings.funnel.barCornerRadius.value)
                        .attr('cursor', 'pointer')
                        .attr('opacity', function(this: SVGRectElement) {
                             // Opacity is controlled by onSelectionChanged
                             return 1; // Default to full opacity, highlighting will dim
                         });

                    // Add interactivity (Power BI Selection)
                    bar.on('click', function(event, d: FunnelValue) { // Correct D3v5+ event handler signature
                         console.log('Clicked segment data:', d);
                         if (d && d.selectionId) { // Check if d and d.selectionId are valid before using
                             // Use captured 'self' to access selectionManager
                             // Simplify toggle logic: clear if selected, select if not.
                             const currentSelectionIds = self.selectionManager.getSelectionIds();
                             const isSelected = currentSelectionIds.some(selectedId => (selectedId as any).equals(d.selectionId)); // Use equals with type assertion

                             if (isSelected) {
                                 self.selectionManager.clear(); // Clear if already selected
                                 // Explicitly call onSelectionChanged to update visual state immediately
                                 self.onSelectionChanged(self.selectionManager.getSelectionIds());
                             } else {
                                 self.selectionManager.select(d.selectionId, false); // Select clicked item (single select)
                              }
                         }

                         event.stopPropagation(); // Prevent SVG click event

                    }); // No .bind(this) needed

                     // --- Tooltip Update ---
                    bar.on('mouseover', function(event) { // Use event parameter, traditional function
                        const d = d3.select(event.currentTarget).datum() as FunnelValue; // Reliably get bound data
                         // Find the rate for the current stage
                        const stageRate = currentRates.find(r => r.stage === (d as any).stage); // Access stage from data object, use captured rates

                        // Check if formattingSettings and general property exist before accessing showTooltip, use captured 'self'
                        if (self.formattingSettings && self.formattingSettings.general && self.formattingSettings.general.showTooltip.value) { // Use captured 'self'
                            let tooltipHtml = `<b>${(d as any).stage}</b><br>${d.legend}: ${d.value}`; // Access stage from data object
                             if(stageRate){
                                tooltipHtml += `<br>Conversion: ${stageRate.conversion}%`;
                                if(stageRate.dropOff !== null){
                                     tooltipHtml += `<br>Drop-off: ${stageRate.dropOff}%`;
                                }
                            }

                            tooltip.style('display', 'block')
                                .html(tooltipHtml);
                        }
                    })
                    .on('mousemove', function(event) { // Use function expression
                        // Check if formattingSettings and general property exist before accessing showTooltip, use captured 'self'
                        if (self.formattingSettings && self.formattingSettings.general && self.formattingSettings.general.showTooltip.value) { // Use captured 'self'
                            tooltip.style('left', (event.pageX + 10) + 'px')
                                .style('top', (event.pageY - 20) + 'px');
                        }
                    })
                    .on('mouseout', function() { // Use function expression
                        // Check if formattingSettings and general property exist before accessing showTooltip, use captured 'self'
                        if (self.formattingSettings && self.formattingSettings.general && self.formattingSettings.general.showTooltip.value) { // Use captured 'self'
                            tooltip.style('display', 'none');
                        }
                    });

                    // Value label
                    if (this.formattingSettings.labels.showValues.value && segWidth > 30) {
                        barsGroup.append('text')
                            .attr('x', barXOffset + x + segWidth / 2)
                            .attr('y', y + barHeight / 2)
                            .attr('text-anchor', 'middle')
                            .attr('dominant-baseline', 'middle')
                            .text(seg.value)
                            .style('fill', this.formattingSettings.labels.valueColor.value.value)
                            .style('font-size', `${this.formattingSettings.labels.valueFontSize.value}px`);
                    }

                    x += segWidth;
                });
            });

            // Draw legend if enabled
            if (this.formattingSettings.legend.show.value) {
                const legendAreaWidth = Math.max(width, legendCategories.length * 120);
                const legendLeft = (width - Math.min(legendAreaWidth, width)) / 2;

                // legendGroup was created and appended to main svg above
                legendGroup
                     .attr('transform', `translate(${legendLeft}, ${legendTop})`); // Position relative to main svg

                const legendItemWidth = 120;
                const legendItemHeight = 20;
                const legendSpacing = 10;
                const totalLegendWidth = legendCategories.length * (legendItemWidth + legendSpacing);

                // Calculate available width for legend scroll
                // const availableLegendScrollWidth = width - 20; // Use visual width minus padding

                // Create a scrollable container for the legend items
                const legendScrollForeign = legendGroup.append('foreignObject')
                    .attr('width', '100%') // Set foreignObject width to 100% of parent legendGroup
                    .attr('height', legendItemHeight + 10); // Add some padding for the scrollbar

                const legendScrollDiv = legendScrollForeign.append('xhtml:div')
                    .style('width', '100%') // Set div width to 100% of foreignObject
                    .style('height', '100%') // Set div height to 100% of foreignObject
                    .style('overflow-x', 'auto') // Enable horizontal scrolling
                    .style('overflow-y', 'hidden')
                    .style('display', 'flex'); // Use flexbox to arrange legend items horizontally

                const legendScrollSvg = d3.select(legendScrollDiv.node()).append('svg')
                    .attr('width', totalLegendWidth) // Set svg width to total width of legend items
                    .attr('height', legendItemHeight + 10);

                legendCategories.forEach((category, i) => {
                    // Append legend items to the legendScrollSvg
                    const legendItem = legendScrollSvg.append('g') // Append to legendScrollSvg
                        .attr('class', 'legend-item')
                        .attr('transform', `translate(${i * (legendItemWidth + legendSpacing)}, 0)`) // Position items horizontally
                        .style('cursor', 'pointer');

                     // Find a sample selection ID for the legend category
                    const sampleSegment = funnelData.flatMap(stage => stage.values).find(v => v.legend === category);
                    const legendSelectionId = sampleSegment ? sampleSegment.selectionId : null;

                    // Legend color box
                    legendItem.append('rect')
                        .attr('width', legendItemHeight)
                        .attr('height', legendItemHeight)
                        .attr('fill', colorScale(category)) // Use colorScale for legend item
                        .attr('rx', 3)
                        .attr('ry', 3)
                        .attr('opacity', function(this: SVGRectElement) {
                             // Opacity is controlled by onSelectionChanged
                             return 1; // Default to full opacity, highlighting will dim
                         });

                    // Legend text
                    legendItem.append('text')
                        .attr('x', legendItemHeight + 5)
                        .attr('y', legendItemHeight / 2)
                        .attr('dominant-baseline', 'middle')
                        .text(category)
                        .style('font-size', `${currentFormattingSettings.legend.fontSize.value}px`); // Use captured settings

                    // Add click interaction (Power BI Selection)
                    legendItem.on('click', function(event, d: any) { // Correct D3v5+ event handler signature
                         const category = d3.select(event.currentTarget).select('text').text();
                         // Find all selection IDs for the clicked legend category
                         const categorySelectionIds = funnelData.flatMap(stage => stage.values)
                             .filter(v => v.legend === category && v.selectionId !== undefined) // Filter out undefined selectionIds
                             .map(v => v.selectionId!);

                         // Simple toggle selection for the category
                         if (categorySelectionIds.length > 0) { // Check if there are valid selectionIds
                             // Use captured 'self' to access selectionManager
                             // Simplify toggle logic for legend: clear if any segment of this category is selected, select all if none are.
                             const currentSelectionIds = self.selectionManager.getSelectionIds();
                             const isCategorySelected = categorySelectionIds.some(id => currentSelectionIds.some(selectedId => (selectedId as any).equals(id))); // Check if at least one ID in the category is selected

                             if (isCategorySelected) {
                                 self.selectionManager.clear(); // Clear if any segment of this category is selected
                                 // Explicitly call onSelectionChanged to update visual state immediately
                                 self.onSelectionChanged(self.selectionManager.getSelectionIds());
                             } else {
                                  self.selectionManager.select(categorySelectionIds, false); // Select all items in the category (single select behavior)
                              }
                         }

                         event.stopPropagation(); // Prevent SVG click event

                     }.bind(this)); // No .bind(this) needed

                    // Add hover effect
                    legendItem.on('mouseover', function(event) { // Use event parameter, traditional function
                         const category = d3.select(event.currentTarget).select('text').text();
                         const sampleSegment = funnelData.flatMap(stage => stage.values).find(v => v.legend === category);

                         // Check if formattingSettings and general property exist before accessing showTooltip, use captured 'self'
                         if (self.formattingSettings && self.formattingSettings.general && self.formattingSettings.general.showTooltip.value) { // Use captured 'self'
                             let tooltipHtml = `<b>${category}</b>`;
                              if(sampleSegment){
                                 tooltipHtml += `<br>${sampleSegment.legend}: ${sampleSegment.value}`;
                                  // Find the rate for the current stage
                                 const stageRate = currentRates.find(r => r.stage === (sampleSegment as any).stage); // Use captured rates
                                  if(stageRate){
                                     tooltipHtml += `<br>Conversion: ${stageRate.conversion}%`;
                                     if(stageRate.dropOff !== null){
                                          tooltipHtml += `<br>Drop-off: ${stageRate.dropOff}%`;
                                     }
                                 }
                             }

                             tooltip.style('display', 'block')
                                 .html(tooltipHtml);
                         }
                          // Check if formattingSettings and colors.highlightColor exist before accessing value, use captured 'self'
                          if (self.formattingSettings && self.formattingSettings.colors && self.formattingSettings.colors.highlightColor) { // Use captured 'self'
                              d3.select(this).select('rect')
                                  .attr('stroke', self.formattingSettings.colors.highlightColor.value.value) // Use captured 'self'
                                  .attr('stroke-width', 2);
                          }
                      })
                      .on('mousemove', function(event) { // Use function expression
                         // Check if formattingSettings and general property exist before accessing showTooltip, use captured 'self'
                         if (self.formattingSettings && self.formattingSettings.general && self.formattingSettings.general.showTooltip.value) { // Use captured 'self'
                             tooltip.style('left', (event.pageX + 10) + 'px')
                                 .style('top', (event.pageY - 20) + 'px');
                         }
                      })
                      .on('mouseout', function() { // Use function expression
                         // Check if formattingSettings and general property exist before accessing showTooltip, use captured 'self'
                         if (self.formattingSettings && self.formattingSettings.general && self.formattingSettings.general.showTooltip.value) { // Use captured 'self'
                             tooltip.style('display', 'none');
                         }
                           d3.select(this).select('rect')
                               .attr('stroke', 'none');
                      });
                });
            }

            console.log('Visual update completed successfully');
             // Call onSelectionChanged initially to apply correct opacity based on current selection state
            this.onSelectionChanged(this.selectionManager.getSelectionIds());

        } catch (error) {
            console.error('Error in update method:', error);
        }
    }

    private prepareHierarchyData(categories: powerbi.DataViewCategoryColumn[], values: powerbi.DataViewValueColumn[]): d3.HierarchyNode<any> {
        // Create hierarchical structure
        const root = {
            name: "root",
            children: []
        };

        // Group data by hierarchy levels
        const groupedData = new Map();
        categories.forEach((category, i) => {
            const value = Number(values[0].values[i]);
            const path = category.values.map(v => v.toString());
            let current = groupedData;
            
            path.forEach((level, j) => {
                if (!current.has(level)) {
                    current.set(level, new Map());
        }
                if (j === path.length - 1) {
                    current.get(level).set('value', value);
                    current.get(level).set('category', level);
                }
                current = current.get(level);
            });
        });

        // Convert Map to hierarchical structure
        const convertMapToHierarchy = (map: Map<any, any>, name: string) => {
            const node: any = {
                name: name,
                children: []
            };

            map.forEach((value, key) => {
                if (key === 'value') {
                    node.value = value;
                } else if (key === 'category') {
                    node.category = value;
                } else {
                    node.children.push(convertMapToHierarchy(value, key));
                }
            });

            return node;
        };

        return d3.hierarchy(convertMapToHierarchy(groupedData, 'root'));
    }

    private drillDown(node: d3.HierarchyNode<any>) {
        // Implement drill-down logic here
        // This would typically involve updating the visual with the children data
        console.log('Drilling down to:', node.data.name);
    }

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    /**
     * This function is called to notify the visual about the selection state changes
     *
     */
    public onSelectionChanged(e?: powerbi.extensibility.ISelectionId[]) {
        console.log('Selection changed:', e);
         // Update visual based on the selection state
         const selectionIds = e || [];
         const hasSelection = selectionIds.length > 0;

         this.svg.selectAll('.funnel-bars rect')
            .attr('opacity', (d: any) => {
                 if (!hasSelection) return 1;
                 // Check if the segment's selectionId is in the current selection
                 return (d.selectionId && selectionIds.some(selectedId => (selectedId as any).equals(d.selectionId))) ? 1 : 0.3;
            });

         this.svg.selectAll('.legend-item rect')
             .attr('opacity', (d: any, i: number, nodes: any[]) => {
                 if (!hasSelection) return 1;
                 const legendCategory = d3.select(nodes[i].parentNode).select('text').text();
                 // Find a corresponding selection ID in the current selection based on category
                 const sampleSegment = (this as unknown as Visual).funnelData.flatMap(stage => stage.values).find(v => v.legend === legendCategory); // Use type assertion for this
                 const legendSelectionId = sampleSegment ? sampleSegment.selectionId : null;

                return (legendSelectionId && selectionIds.some(selectedId => (selectedId as any).equals(legendSelectionId))) ? 1 : 0.3;
             });
    }
}