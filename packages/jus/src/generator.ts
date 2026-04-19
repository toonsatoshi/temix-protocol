import { JUSEntry, JUSSchema } from '@temix/types';

export interface TelegramButton {
  text: string;
  callback_data: string;
}

export type InlineKeyboard = TelegramButton[][];

export class JUSGenerator {
  /**
   * Generates a Telegram Inline Keyboard layout from a JUS Schema.
   */
  static generateKeyboard(schema: JUSSchema): InlineKeyboard {
    const entries = Object.values(schema.entries);
    const keyboard: InlineKeyboard = [];

    // Sort entries by their defined layout or just stack them
    // For MVP, we stack buttons one per row or follow explicit keyboardLayout if present
    entries.forEach((entry) => {
      const button: TelegramButton = {
        text: entry.ui.label,
        callback_data: entry.ui.callback,
      };

      if (entry.ui.keyboardLayout) {
        const { row } = entry.ui.keyboardLayout;
        if (!keyboard[row]) {
          keyboard[row] = [];
        }
        keyboard[row].push(button);
      } else {
        keyboard.push([button]);
      }
    });

    // Clean up empty rows if any
    return keyboard.filter((row) => row && row.length > 0);
  }
}
