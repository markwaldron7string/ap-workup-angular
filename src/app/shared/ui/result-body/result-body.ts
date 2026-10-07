import { Component, input } from '@angular/core';
import { BodyParagraph } from '../../calc-result';

/** Renders a result message: paragraphs separated by a blank line, with the strong runs emphasised. */
@Component({
  selector: 'app-result-body',
  templateUrl: './result-body.html',
})
export class ResultBody {
  readonly body = input.required<BodyParagraph[]>();
}
