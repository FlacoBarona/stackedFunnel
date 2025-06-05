import powerbi from "powerbi-visuals-api";
import IColorInfo = powerbi.IColorInfo;

/**
 * Interface for Palette of colors.
 *
 * @interface
 * @property {IColorInfo} [key: string] - Map of key to IColorInfo.
 */
interface IPalette {
    [key: string]: IColorInfo;
}

/**
 * Interface for IColorPalette.
 *
 * @interface
 */
export interface IColorPalette {
    getColor(key: string): IColorInfo;
    reset(): IColorPalette;
    clear(): void;
}

/**
 * Singleton reference of ColorPalette.
 *
 * @instance
 */
let colorManagerInstance: IColorPalette | undefined = undefined;

/**
 * Factory method for creating a ColorPalette.
 *
 * @function
 * @param {IColorInfo[]} colors - Array of ColorInfo objects that contain
 * hex values for colors.
 */
export function createColorPalette(colors: IColorInfo[]): IColorPalette {
    if (!colorManagerInstance) {
        colorManagerInstance = new ColorPalette(colors);
    } else {
        // If singleton exists, update its colors and reset index
        (colorManagerInstance as any).colors = colors; // Assuming direct access is okay or add a setColors method
        colorManagerInstance.reset();
    }
    return colorManagerInstance;
}

class ColorPalette implements IColorPalette {
    private colorPalette: IPalette = {};
    private colors: IColorInfo[];
    private colorIndex: number = 0;

    constructor(colors: IColorInfo[]) {
        this.colors = colors;
    }

    /**
     * Gets color from colorPalette and returns an IColorInfo
     *
     * @function
     * @param {string} key - Key of assign color in colorPalette.
     */
    public getColor(key: string): IColorInfo {
        let color = this.colorPalette[key];
        if (color) {
            return color;
        }

        let colors = this.colors;
        if (!colors || colors.length === 0) { // Add a check for empty colors array
             console.warn("Color palette is empty.");
             return { value: "#cccccc" }; // Return a default color if no colors are available
        }

        color = this.colorPalette[key] = colors[this.colorIndex++];

        if (this.colorIndex >= colors.length) {
            this.colorIndex = 0;
        }

        return color;
    }

    /**
     * resets colorIndex to 0
     *
     * @function
     */
    public reset(): IColorPalette {
        this.colorIndex = 0;
        return this;
    }

    /**
     * Clears colorPalette of cached keys and colors
     *
     * @function
     */
    public clear(): void {
        this.colorPalette = {};
    }
} 