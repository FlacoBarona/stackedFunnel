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
    dataPoint: DataPointCardSettings;
    labels: LabelsCardSettings;
    legend: LegendCardSettings;
    cards: (DataPointCardSettings | LabelsCardSettings | LegendCardSettings)[];
}
