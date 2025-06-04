/*
 *  Power BI Visualizations
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

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

/**
 * Data Point Formatting Card
 */
export class DataPointCardSettings extends formattingSettings.SimpleCard {
    defaultColor = new formattingSettings.ColorPicker({
        name: "defaultColor",
        displayName: "Default color",
        value: { value: "" }
    });

    showAllDataPoints = new formattingSettings.ToggleSwitch({
        name: "showAllDataPoints",
        displayName: "Show all",
        value: true
    });

    fill = new formattingSettings.ColorPicker({
        name: "fill",
        displayName: "Color",
        value: { value: "#01B8AA" }
    });

    fillRule = new formattingSettings.ColorPicker({
        name: "fillRule",
        displayName: "Color saturation",
        value: { value: "" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        value: 12
    });

    name: string = "dataPoint";
    displayName: string = "Data Colors";
}

/**
 * Labels Formatting Card
 */
export class LabelsCardSettings extends formattingSettings.SimpleCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        value: true
    });

    color = new formattingSettings.ColorPicker({
        name: "color",
        displayName: "Color",
        value: { value: "#000000" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text Size",
        value: 12
    });

    name: string = "labels";
    displayName: string = "Labels";
}

/**
 * Legend Formatting Card
 */
export class LegendCardSettings extends formattingSettings.SimpleCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        value: true
    });

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayName: "Position",
        value: { value: "top", displayName: "Top" },
        items: [
            { value: "top", displayName: "Top" },
            { value: "bottom", displayName: "Bottom" },
            { value: "left", displayName: "Left" },
            { value: "right", displayName: "Right" }
        ]
    });

    name: string = "legend";
    displayName: string = "Legend";
}

/**
* visual settings model class
*
*/
export class VisualFormattingSettingsModel extends formattingSettings.Model {
    public funnel: FunnelSettings = new FunnelSettings();
    public labels: LabelSettings = new LabelSettings();
    public legend: LegendSettings = new LegendSettings();
    public colors: ColorSettings = new ColorSettings();
    public general: GeneralSettings = new GeneralSettings();
    public animation: AnimationSettings = new AnimationSettings();
    public interaction: InteractionSettings = new InteractionSettings();

    cards = [
        this.funnel,
        this.labels,
        this.legend,
        this.colors,
        this.general,
        this.animation,
        this.interaction
    ];
}

export class FunnelSettings extends formattingSettings.SimpleCard {
    public barHeight = new formattingSettings.NumUpDown({
        name: "barHeight",
        displayName: "Bar Height",
        value: 30
    });

    public barGap = new formattingSettings.NumUpDown({
        name: "barGap",
        displayName: "Gap Between Bars",
        value: 10
    });

    public barCornerRadius = new formattingSettings.NumUpDown({
        name: "barCornerRadius",
        displayName: "Bar Corner Radius",
        value: 3
    });

    public barBorderWidth = new formattingSettings.NumUpDown({
        name: "barBorderWidth",
        displayName: "Bar Border Width",
        value: 1
    });

    public barBorderColor = new formattingSettings.ColorPicker({
        name: "barBorderColor",
        displayName: "Bar Border Color",
        value: { value: "#000000" }
    });

    public barOpacity = new formattingSettings.NumUpDown({
        name: "barOpacity",
        displayName: "Bar Opacity",
        value: 1
    });

    public name: string = "funnel";
    public displayName: string = "Funnel Settings";
}

export class LabelSettings extends formattingSettings.SimpleCard {
    public showValues = new formattingSettings.ToggleSwitch({
        name: "showValues",
        displayName: "Show Values",
        value: true
    });

    public valueFontSize = new formattingSettings.NumUpDown({
        name: "valueFontSize",
        displayName: "Value Font Size",
        value: 12
    });

    public valueColor = new formattingSettings.ColorPicker({
        name: "valueColor",
        displayName: "Value Color",
        value: { value: "#FFFFFF" }
    });

    public stageFontSize = new formattingSettings.NumUpDown({
        name: "stageFontSize",
        displayName: "Stage Label Font Size",
        value: 14
    });

    public stageColor = new formattingSettings.ColorPicker({
        name: "stageColor",
        displayName: "Stage Label Color",
        value: { value: "#000000" }
    });

    public valueFormat = new formattingSettings.ItemDropdown({
        name: "valueFormat",
        displayName: "Value Format",
        value: { value: "none", displayName: "None" },
        items: [
            { value: "none", displayName: "None" },
            { value: "percentage", displayName: "Percentage" },
            { value: "thousands", displayName: "Thousands" },
            { value: "millions", displayName: "Millions" },
            { value: "billions", displayName: "Billions" },
            { value: "custom", displayName: "Custom" }
        ]
    });

    public customFormat = new formattingSettings.TextInput({
        name: "customFormat",
        displayName: "Custom Format",
        value: "",
        placeholder: "Enter custom format (e.g., #,##0.00)"
    });

    public labelPosition = new formattingSettings.ItemDropdown({
        name: "labelPosition",
        displayName: "Label Position",
        value: { value: "inside", displayName: "Inside" },
        items: [
            { value: "inside", displayName: "Inside" },
            { value: "outside", displayName: "Outside" }
        ]
    });

    public name: string = "labels";
    public displayName: string = "Label Settings";
}

export class LegendSettings extends formattingSettings.SimpleCard {
    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show Legend",
        value: true
    });

    public position = new formattingSettings.ItemDropdown({
        name: "position",
        displayName: "Position",
        value: { value: "top", displayName: "Top" },
        items: [
            { value: "top", displayName: "Top" },
            { value: "bottom", displayName: "Bottom" },
            { value: "left", displayName: "Left" },
            { value: "right", displayName: "Right" }
        ]
    });

    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font Size",
        value: 12
    });

    public title = new formattingSettings.TextInput({
        name: "title",
        displayName: "Legend Title",
        value: "",
        placeholder: "Enter legend title"
    });

    public titleFontSize = new formattingSettings.NumUpDown({
        name: "titleFontSize",
        displayName: "Title Font Size",
        value: 14
    });

    public name: string = "legend";
    public displayName: string = "Legend Settings";
}

export class ColorSettings extends formattingSettings.SimpleCard {
    public useCustomColors = new formattingSettings.ToggleSwitch({
        name: "useCustomColors",
        displayName: "Use Custom Colors",
        value: false
    });

    public colorPalette = new formattingSettings.ItemDropdown({
        name: "colorPalette",
        displayName: "Color Palette",
        value: { value: "default", displayName: "Default" },
        items: [
            { value: "default", displayName: "Default" },
            { value: "category10", displayName: "Category 10" },
            { value: "category20", displayName: "Category 20" },
            { value: "custom", displayName: "Custom" }
        ]
    });

    public customColors = new formattingSettings.ColorPicker({
        name: "customColors",
        displayName: "Custom Colors",
        value: { value: "#1f77b4" }
    });

    public gradientStart = new formattingSettings.ColorPicker({
        name: "gradientStart",
        displayName: "Gradient Start Color",
        value: { value: "#1f77b4" }
    });

    public gradientEnd = new formattingSettings.ColorPicker({
        name: "gradientEnd",
        displayName: "Gradient End Color",
        value: { value: "#ff7f0e" }
    });

    public useGradient = new formattingSettings.ToggleSwitch({
        name: "useGradient",
        displayName: "Use Gradient",
        value: false
    });

    public highlightColor = new formattingSettings.ColorPicker({
        name: "highlightColor",
        displayName: "Highlight Color",
        value: { value: "#ffd700" }
    });

    public name: string = "colors";
    public displayName: string = "Color Settings";
}

export class GeneralSettings extends formattingSettings.SimpleCard {
    public background = new formattingSettings.ColorPicker({
        name: "background",
        displayName: "Background Color",
        value: { value: "#FFFFFF" }
    });

    public showTooltip = new formattingSettings.ToggleSwitch({
        name: "showTooltip",
        displayName: "Show Tooltip",
        value: true
    });

    public tooltipFormat = new formattingSettings.TextInput({
        name: "tooltipFormat",
        displayName: "Tooltip Format",
        value: "{category}: {value}",
        placeholder: "Enter tooltip format (e.g., {category}: {value})"
    });

    public padding = new formattingSettings.NumUpDown({
        name: "padding",
        displayName: "Padding",
        value: 10
    });

    public borderRadius = new formattingSettings.NumUpDown({
        name: "borderRadius",
        displayName: "Border Radius",
        value: 0
    });

    public borderColor = new formattingSettings.ColorPicker({
        name: "borderColor",
        displayName: "Border Color",
        value: { value: "#000000" }
    });

    public borderWidth = new formattingSettings.NumUpDown({
        name: "borderWidth",
        displayName: "Border Width",
        value: 0
    });

    public name: string = "general";
    public displayName: string = "General Settings";
}

export class AnimationSettings extends formattingSettings.SimpleCard {
    public enableAnimation = new formattingSettings.ToggleSwitch({
        name: "enableAnimation",
        displayName: "Enable Animation",
        value: true
    });

    public animationDuration = new formattingSettings.NumUpDown({
        name: "animationDuration",
        displayName: "Animation Duration (ms)",
        value: 500
    });

    public animationEasing = new formattingSettings.ItemDropdown({
        name: "animationEasing",
        displayName: "Animation Easing",
        value: { value: "easeInOut", displayName: "Ease In Out" },
        items: [
            { value: "linear", displayName: "Linear" },
            { value: "easeIn", displayName: "Ease In" },
            { value: "easeOut", displayName: "Ease Out" },
            { value: "easeInOut", displayName: "Ease In Out" }
        ]
    });

    public name: string = "animation";
    public displayName: string = "Animation Settings";
}

export class InteractionSettings extends formattingSettings.SimpleCard {
    public enableDrilldown = new formattingSettings.ToggleSwitch({
        name: "enableDrilldown",
        displayName: "Enable Drilldown",
        value: false
    });

    public enableHighlight = new formattingSettings.ToggleSwitch({
        name: "enableHighlight",
        displayName: "Enable Highlight",
        value: true
    });

    public enableSelection = new formattingSettings.ToggleSwitch({
        name: "enableSelection",
        displayName: "Enable Selection",
        value: true
    });

    public selectionMode = new formattingSettings.ItemDropdown({
        name: "selectionMode",
        displayName: "Selection Mode",
        value: { value: "single", displayName: "Single" },
        items: [
            { value: "single", displayName: "Single" },
            { value: "multiple", displayName: "Multiple" }
        ]
    });

    public name: string = "interaction";
    public displayName: string = "Interaction Settings";
}
