import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
/**
 * Data Point Formatting Card
 */
export declare class DataPointCardSettings extends formattingSettings.SimpleCard {
    defaultColor: formattingSettings.ColorPicker;
    showAllDataPoints: formattingSettings.ToggleSwitch;
    fill: formattingSettings.ColorPicker;
    fillRule: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
}
/**
 * Labels Formatting Card
 */
export declare class LabelsCardSettings extends formattingSettings.SimpleCard {
    show: formattingSettings.ToggleSwitch;
    color: formattingSettings.ColorPicker;
    fontSize: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
}
/**
 * Legend Formatting Card
 */
export declare class LegendCardSettings extends formattingSettings.SimpleCard {
    show: formattingSettings.ToggleSwitch;
    position: formattingSettings.ItemDropdown;
    name: string;
    displayName: string;
}
/**
* visual settings model class
*
*/
export declare class VisualFormattingSettingsModel extends formattingSettings.Model {
    funnel: FunnelSettings;
    labels: LabelSettings;
    legend: LegendSettings;
    colors: ColorSettings;
    general: GeneralSettings;
    animation: AnimationSettings;
    interaction: InteractionSettings;
    cards: (GeneralSettings | ColorSettings | LegendSettings | FunnelSettings | LabelSettings | AnimationSettings | InteractionSettings)[];
}
export declare class FunnelSettings extends formattingSettings.SimpleCard {
    barHeight: formattingSettings.NumUpDown;
    barGap: formattingSettings.NumUpDown;
    barCornerRadius: formattingSettings.NumUpDown;
    barBorderWidth: formattingSettings.NumUpDown;
    barBorderColor: formattingSettings.ColorPicker;
    barOpacity: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
}
export declare class LabelSettings extends formattingSettings.SimpleCard {
    showValues: formattingSettings.ToggleSwitch;
    valueFontSize: formattingSettings.NumUpDown;
    valueColor: formattingSettings.ColorPicker;
    stageFontSize: formattingSettings.NumUpDown;
    stageColor: formattingSettings.ColorPicker;
    valueFormat: formattingSettings.ItemDropdown;
    customFormat: formattingSettings.TextInput;
    labelPosition: formattingSettings.ItemDropdown;
    name: string;
    displayName: string;
}
export declare class LegendSettings extends formattingSettings.SimpleCard {
    show: formattingSettings.ToggleSwitch;
    position: formattingSettings.ItemDropdown;
    fontSize: formattingSettings.NumUpDown;
    title: formattingSettings.TextInput;
    titleFontSize: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
}
export declare class ColorSettings extends formattingSettings.SimpleCard {
    useCustomColors: formattingSettings.ToggleSwitch;
    colorPalette: formattingSettings.ItemDropdown;
    customColors: formattingSettings.ColorPicker;
    gradientStart: formattingSettings.ColorPicker;
    gradientEnd: formattingSettings.ColorPicker;
    useGradient: formattingSettings.ToggleSwitch;
    highlightColor: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
}
export declare class GeneralSettings extends formattingSettings.SimpleCard {
    background: formattingSettings.ColorPicker;
    showTooltip: formattingSettings.ToggleSwitch;
    tooltipFormat: formattingSettings.TextInput;
    padding: formattingSettings.NumUpDown;
    borderRadius: formattingSettings.NumUpDown;
    borderColor: formattingSettings.ColorPicker;
    borderWidth: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
}
export declare class AnimationSettings extends formattingSettings.SimpleCard {
    enableAnimation: formattingSettings.ToggleSwitch;
    animationDuration: formattingSettings.NumUpDown;
    animationEasing: formattingSettings.ItemDropdown;
    name: string;
    displayName: string;
}
export declare class InteractionSettings extends formattingSettings.SimpleCard {
    enableDrilldown: formattingSettings.ToggleSwitch;
    enableHighlight: formattingSettings.ToggleSwitch;
    enableSelection: formattingSettings.ToggleSwitch;
    selectionMode: formattingSettings.ItemDropdown;
    name: string;
    displayName: string;
}
