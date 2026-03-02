import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

// The SSR engine provides a BootstrapContext per request; pass it along so the
// platform injector is reused instead of recreated, preventing the NG0401 error.
const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);

export default bootstrap;
