import { Component } from '@angular/core';
import { PremiumCalculator } from './features/premium/premium-calculator';
import { YearsLicensedCalculator } from './features/years-licensed/years-licensed-calculator';
import { ThemeToggle } from './shared/ui/theme-toggle/theme-toggle';

/** The page shell: the notes, the theme toggle and the two calculators side by side. */
@Component({
  selector: 'app-root',
  imports: [ThemeToggle, YearsLicensedCalculator, PremiumCalculator],
  templateUrl: './app.html',
})
export class App {}
