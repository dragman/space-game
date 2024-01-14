import { AdvancedDynamicTexture, Button, Control, TextBlock } from "@babylonjs/gui";

export class Gui {
    static instance = null;

    static getInstance() {
        if (!Gui.instance) {
            Gui.instance = new Gui();
        }
        return Gui.instance;
    }

    advancedTexture: AdvancedDynamicTexture;
    logTextControl: TextBlock;
    nextTurnButton: Button;

    constructor() {
        this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("ui1");
        this.advancedTexture.renderScale = 1.2;

        this.logTextControl = new TextBlock();
        this.logTextControl.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.logTextControl.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.logTextControl.width = "98%";
        this.logTextControl.height = "98%";
        this.logTextControl.text = "";
        this.logTextControl.color = "white";
        this.logTextControl.alpha = 0.8;
        this.advancedTexture.addControl(this.logTextControl);

        const button = Button.CreateSimpleButton("but", "End Turn");
        button.paddingBottomInPixels = 10;
        button.paddingRightInPixels = 10;
        button.width = "140px";
        button.height = "100px";
        button.color = "black";
        button.background = "white";
        button.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.nextTurnButton = button;
        this.advancedTexture.addControl(button);
    }
}

function getFormattedDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const milliseconds = now.getMilliseconds().toString().padStart(3, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export function log(text: string, appendNewline: boolean = true): void {
    if (!IS_DEVELOPMENT) {
        return;
    }

    const newLine = appendNewline ? "\n" : "";
    Gui.getInstance().logTextControl.text += `[${getFormattedDateTime()}] ${text}${newLine}`;
}
