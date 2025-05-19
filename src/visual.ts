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

    constructor(options: VisualConstructorOptions) {
        console.log('Constructor called');
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.updateCount = 0;

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
            console.log('Update called');
            
            if (!options || !options.dataViews || !options.dataViews[0]) {
                console.error('No data available');
                return;
            }

            const dataView = options.dataViews[0];
            
            if (!dataView.categorical) {
                console.error('No categorical data');
                return;
            }

            const categorical = dataView.categorical;
            const categoryColumns = categorical.categories; // Array: for hierarchy and legend
            const valueFields = categorical.values; // Array: for measures

            if (!categoryColumns || !valueFields || !categoryColumns[0] || !valueFields[0]) {
                console.error('Missing required fields');
                return;
            }

            // Get dimensions
            const width = options.viewport.width;
            const height = options.viewport.height;

            if (width <= 0 || height <= 0) {
                console.error('Invalid viewport dimensions');
                return;
            }

            // Update SVG dimensions
            this.svg
                .attr('width', width)
                .attr('height', height);

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
            // Compose stage labels from all category columns except the legend one
            const numStages = categoryColumns[0].values.length;
            const hasLegendCategory = categoryColumns.length > 1;
            const legendCategoryCol = hasLegendCategory ? categoryColumns[1] : null;
            const legendCategories = hasLegendCategory ? Array.from(new Set(legendCategoryCol.values.map(String))) : ["All"];
            // Compose stage keys (e.g., Phase) and legend keys (e.g., City)
            const stages = Array(numStages).fill(0).map((_, i) =>
                categoryColumns.map((col, j) => (j === 1 ? null : col.values[i])).filter(x => x !== null).join(' / ')
            );
            // Data for each stage: [{stage, values: [{legend, value, idx}]}]
            const data = stages.map((stage, i) => {
                let legend = hasLegendCategory ? legendCategoryCol.values[i] : "All";
                return {
                    stage,
                    values: [{
                        legend: legend,
                        value: Number(valueFields[0].values[i]),
                        idx: i
                    }]
                };
            });
            // Group by stage, then by legend
            const grouped = d3.groups(data, d => d.stage);
            const funnelData = grouped.map(([stage, arr]) => {
                // For each stage, group by legend
                const legendMap = new Map();
                arr.forEach(d => {
                    d.values.forEach(v => {
                        if (!legendMap.has(v.legend)) legendMap.set(v.legend, 0);
                        legendMap.set(v.legend, legendMap.get(v.legend) + v.value);
                    });
                });
                return {
                    stage,
                    values: Array.from(legendMap.entries()).map(([legend, value]) => ({ legend, value }))
                };
            });
            // For each stage, sum the values for width calculation
            const totals = funnelData.map(d => d3.sum(d.values, v => v.value));
            const maxTotal = d3.max(totals) || 1;

            // --- Responsive Layout ---
            const leftLabelWidth = Math.max(80, width * 0.15); // Responsive label width
            const legendHeight = 30;
            const legendTop = 10;
            const chartTop = legendTop + legendHeight + 20;
            const availableHeight = height - chartTop - 10;
            const availableWidth = width - leftLabelWidth;
            const funnelWidth = Math.max(availableWidth, 100); // Always fit funnel to available width
            // --- Draw Left Labels and Bars (evenly distributed, fill area) ---
            // Calculate barHeight and barGap to fit all bars in availableHeight
            let funnelLevels = funnelData.length;
            let barGap = 10;
            let barHeight = Math.max(18, Math.floor((availableHeight - (funnelLevels - 1) * barGap) / funnelLevels));
            if (barHeight < 18) {
                barHeight = 18;
                barGap = Math.max(2, Math.floor((availableHeight - funnelLevels * barHeight) / (funnelLevels - 1)));
            }
            const totalFunnelHeight = funnelLevels * barHeight + (funnelLevels - 1) * barGap;
            const centerOffset = Math.max((width - (leftLabelWidth + funnelWidth)) / 2, 0);
            const color = d3.scaleOrdinal(d3.schemeCategory10).domain(legendCategories);

            const totalContentWidth = leftLabelWidth + funnelWidth;
            const needsHScroll = funnelWidth > (width - leftLabelWidth);

            // --- Scrollable Area: Both Labels and Bars ---
            this.svg.selectAll('foreignObject.funnel-scroll').remove();
            let scrollForeign = this.svg.append('foreignObject')
                .attr('class', 'funnel-scroll')
                .attr('x', centerOffset)
                .attr('y', chartTop)
                .attr('width', totalContentWidth)
                .attr('height', totalFunnelHeight);
            let scrollDiv = scrollForeign.append('xhtml:div')
                .style('width', totalContentWidth + 'px')
                .style('height', totalFunnelHeight + 'px')
                .style('overflow-y', 'hidden')
                .style('overflow-x', needsHScroll ? 'auto' : 'hidden')
                .style('display', 'block');
            let scrollSvg = d3.select(scrollDiv.node()).append('svg')
                .attr('width', totalContentWidth)
                .attr('height', totalFunnelHeight);
            // Left labels group
            let leftLabelsGroup = scrollSvg.append('g')
                .attr('class', 'funnel-left-labels');
            // Bars group
            let barsGroup = scrollSvg.append('g')
                .attr('class', 'funnel-bars')
                .attr('transform', `translate(${leftLabelWidth},0)`);

            // --- Interactivity State ---
            let selectedLegend: string | null = null;

            funnelData.forEach((stageData, i) => {
                const y = i * (barHeight + barGap);
                // Left label
                leftLabelsGroup.append('text')
                    .attr('x', leftLabelWidth - 10)
                    .attr('y', y + barHeight / 2)
                    .attr('text-anchor', 'end')
                    .attr('dominant-baseline', 'middle')
                    .text(stageData.stage)
                    .style('font-size', '14px');
                // Bars
                let x = 0;
                const total = totals[i];
                const stageWidth = (total / maxTotal) * funnelWidth;
                const barXOffset = (funnelWidth - stageWidth) / 2;
                stageData.values.forEach(seg => {
                    const segWidth = (seg.value / total) * stageWidth;
                    barsGroup.append('rect')
                        .attr('x', barXOffset + x)
                        .attr('y', y)
                        .attr('width', segWidth)
                        .attr('height', barHeight)
                        .attr('fill', color(seg.legend))
                        .attr('cursor', 'pointer')
                        .attr('opacity', function(this: SVGRectElement, d: any) {
                            if (selectedLegend && d && d.legend !== selectedLegend) return 0.3;
                            return 1;
                        })
                        .on('mouseover', (event) => {
                            tooltip.style('display', 'block')
                                .html(`<b>${stageData.stage}</b><br>${seg.legend}: ${seg.value}`);
                        })
                        .on('mousemove', (event) => {
                            tooltip.style('left', (event.pageX + 10) + 'px')
                                .style('top', (event.pageY - 20) + 'px');
                        })
                        .on('mouseout', () => {
                            tooltip.style('display', 'none');
                        })
                        .on('click', () => {
                            if (selectedLegend === seg.legend) {
                                selectedLegend = null;
                                barsGroup.selectAll('rect').attr('opacity', 1);
                            } else {
                                selectedLegend = seg.legend;
                                barsGroup.selectAll('rect')
                                    .attr('opacity', function(this: SVGRectElement, d: any) {
                                        if (selectedLegend && d && d.legend !== selectedLegend) return 0.3;
                                        return 1;
                                    });
                            }
                        });
                    // Value label (centered in segment if wide enough)
                    if (segWidth > 30) {
                        barsGroup.append('text')
                            .attr('x', barXOffset + x + segWidth / 2)
                            .attr('y', y + barHeight / 2)
                            .attr('text-anchor', 'middle')
                            .attr('dominant-baseline', 'middle')
                            .text(seg.value)
                            .style('fill', '#fff')
                            .style('font-size', '12px');
                    }
                    x += segWidth;
                });
            });

            const legendAreaWidth = Math.max(width, legendCategories.length * 120);
            const legendLeft = (width - Math.min(legendAreaWidth, width)) / 2;

            let legendGroup = this.legendContainer
                .attr('transform', `translate(${legendLeft}, ${legendTop})`);

            // Draw legend items
            const legendItemWidth = 120;
            const legendItemHeight = 20;
            const legendSpacing = 10;

            legendCategories.forEach((category, i) => {
                const legendItem = legendGroup.append('g')
                    .attr('class', 'legend-item')
                    .attr('transform', `translate(${i * (legendItemWidth + legendSpacing)}, 0)`)
                    .style('cursor', 'pointer');

                // Legend color box
                legendItem.append('rect')
                    .attr('width', legendItemHeight)
                    .attr('height', legendItemHeight)
                    .attr('fill', color(category))
                    .attr('rx', 3)
                    .attr('ry', 3);

                // Legend text
                legendItem.append('text')
                    .attr('x', legendItemHeight + 5)
                    .attr('y', legendItemHeight / 2)
                    .attr('dominant-baseline', 'middle')
                    .text(category)
                    .style('font-size', '12px');

                // Add click interaction
                legendItem.on('click', () => {
                    if (selectedLegend === category) {
                        selectedLegend = null;
                        barsGroup.selectAll('rect').attr('opacity', 1);
                    } else {
                        selectedLegend = category;
                        barsGroup.selectAll('rect')
                            .attr('opacity', function(this: SVGRectElement, d: any) {
                                if (selectedLegend && d && d.legend !== selectedLegend) return 0.3;
                                return 1;
                            });
                    }
                });

                // Add hover effect
                legendItem.on('mouseover', function() {
                    d3.select(this).select('rect')
                        .attr('stroke', '#666')
                        .attr('stroke-width', 2);
                }).on('mouseout', function() {
                    d3.select(this).select('rect')
                        .attr('stroke', 'none');
                });
            });

            console.log('Visual update completed successfully');
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
}