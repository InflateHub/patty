import { Redirect, Route } from 'react-router-dom';
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

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
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
          <Route exact path="/">
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
    </IonReactRouter>
  </IonApp>
);

export default App;
