import React, { useEffect } from 'react';
import { Redirect, Route, useHistory } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  calendarOutline,
  homeOutline,
  pulseOutline,
  restaurantOutline,
  trendingUpOutline,
} from 'ionicons/icons';

import Home from './pages/Home';
import Track from './pages/Track';
import Recipes from './pages/Recipes';
import Plan from './pages/Plan';
import Progress from './pages/Progress';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import OnboardingPage from './pages/OnboardingPage';
import { getDb } from './db/database';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode — respects the OS preference via dark.system.css.
 * For more info: https://ionicframework.com/docs/theming/dark-mode
 */
import '@ionic/react/css/palettes/dark.system.css';

/* Patty theme */
import './theme/variables.css';
import './theme/md3.css';

setupIonicReact();

/**
 * StartupGate — rendered at the root `/` path.
 * Reads `onboarding_complete` from SQLite and redirects to
 * `/onboarding` (first launch) or `/tabs/home` (returning user).
 * Must live inside IonReactRouter to access useHistory.
 */
const StartupGate: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getDb();
        const res = await db.query(
          "SELECT value FROM settings WHERE key = 'onboarding_complete';",
        );
        const done =
          res.values && res.values.length > 0 && res.values[0].value === '1';
        if (!cancelled) {
          history.replace(done ? '/tabs/home' : '/onboarding');
        }
      } catch {
        if (!cancelled) history.replace('/onboarding');
      }
    })();
    return () => { cancelled = true; };
  }, [history]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--md-surface)',
      }}
    >
      <span style={{ fontSize: 64 }}>🥗</span>
    </div>
  );
};

// ── Tab shell ──────────────────────────────────────────────────────────────────────────

const TabShell: React.FC = () => (
  <IonTabs>
    <IonRouterOutlet>
      <Route exact path="/tabs/home">
        <Home />
      </Route>
      <Route exact path="/tabs/track">
        <Track />
      </Route>
      <Route exact path="/tabs/recipes">
        <Recipes />
      </Route>
      <Route exact path="/tabs/plan">
        <Plan />
      </Route>
      <Route exact path="/tabs/progress">
        <Progress />
      </Route>
      <Route exact path="/tabs/profile">
        <ProfilePage />
      </Route>
      <Route exact path="/tabs/notifications">
        <NotificationsPage />
      </Route>
      <Route exact path="/tabs">
        <Redirect to="/tabs/home" />
      </Route>
    </IonRouterOutlet>

    <IonTabBar slot="bottom">
      <IonTabButton tab="home" href="/tabs/home">
        <IonIcon icon={homeOutline} />
        <IonLabel>Home</IonLabel>
      </IonTabButton>
      <IonTabButton tab="track" href="/tabs/track">
        <IonIcon icon={pulseOutline} />
        <IonLabel>Track</IonLabel>
      </IonTabButton>
      <IonTabButton tab="recipes" href="/tabs/recipes">
        <IonIcon icon={restaurantOutline} />
        <IonLabel>Recipes</IonLabel>
      </IonTabButton>
      <IonTabButton tab="plan" href="/tabs/plan">
        <IonIcon icon={calendarOutline} />
        <IonLabel>Plan</IonLabel>
      </IonTabButton>
      <IonTabButton tab="progress" href="/tabs/progress">
        <IonIcon icon={trendingUpOutline} />
        <IonLabel>Progress</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);

// ── Root app ──────────────────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet id="main-outlet">
        {/* Onboarding — no tab bar */}
        <Route exact path="/onboarding">
          <OnboardingPage />
        </Route>

        {/* Main tab shell */}
        <Route path="/tabs">
          <TabShell />
        </Route>

        {/* Root: check DB and redirect */}
        <Route exact path="/">
          <StartupGate />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
