import { Component, ElementRef, inject, viewChildren } from '@angular/core';
import { ClipboardService } from '../../core/clipboard.service';
import { formatCurrency } from '../../shared/currency-utils';
import { CopyAllCapsButton } from '../../shared/ui/copy-all-caps-button/copy-all-caps-button';
import { DecimalInput } from '../../shared/ui/decimal-input/decimal-input';
import { ResultBody } from '../../shared/ui/result-body/result-body';
import { PremiumKind } from './premium';
import { PremiumSheetStore } from './premium-sheet.store';

const CELLS_PER_ROW = 3;
const FEE_COLUMN = 2;

/**
 * The original-theme premium table. Rows calculate as soon as a cell is left or Enter is pressed,
 * and the arrow keys move between cells like a spreadsheet.
 */
@Component({
  selector: 'app-premium-sheet',
  imports: [DecimalInput, ResultBody, CopyAllCapsButton],
  templateUrl: './premium-sheet.html',
  host: { class: 'xl-sheet' },
})
export class PremiumSheet {
  protected readonly store = inject(PremiumSheetStore);
  protected readonly clipboard = inject(ClipboardService);
  protected readonly formatCurrency = formatCurrency;

  /** Every editable cell, row by row: old, new, fee, old, new, fee... */
  private readonly cells = viewChildren<ElementRef<HTMLInputElement>>('cell');

  // The commit methods write to the cell themselves. Its text can already differ from the stored
  // value (700 typed over 700.00), and a [value] binding would not see a change to push back.

  protected commitPremium(rowIndex: number, kind: PremiumKind, input: HTMLInputElement): void {
    input.value = this.store.commitPremium(rowIndex, kind, input.value);
  }

  protected commitFee(rowIndex: number, input: HTMLInputElement): void {
    if (this.store.commitFee(rowIndex, input.value)) input.value = '';
  }

  protected onKey(event: KeyboardEvent, rowIndex: number, column: number): void {
    const input = event.target as HTMLInputElement;
    let rowStep = 0;
    let columnStep = 0;
    if (event.key === 'ArrowUp') rowStep = -1;
    else if (event.key === 'ArrowDown') rowStep = 1;
    else if (event.key === 'ArrowLeft' && input.selectionStart === 0) columnStep = -1;
    else if (event.key === 'ArrowRight' && input.selectionEnd === input.value.length)
      columnStep = 1;
    else {
      if (event.key === 'Enter') {
        if (column === FEE_COLUMN) this.commitFee(rowIndex, input);
        else this.commitPremium(rowIndex, column === 0 ? 'old' : 'new', input);
      }
      return;
    }

    const targetRow = rowIndex + rowStep;
    const targetColumn = column + columnStep;
    if (targetRow < 0 || targetColumn < 0 || targetColumn >= CELLS_PER_ROW) return;
    const target = this.cells()[targetRow * CELLS_PER_ROW + targetColumn]?.nativeElement;
    if (!target) return;

    event.preventDefault();
    target.focus();
    target.select();
  }

  protected copy(text: string, event: Event): void {
    this.clipboard.copy(text, event.currentTarget as HTMLElement);
  }
}
