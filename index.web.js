import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register the main component
AppRegistry.registerComponent(appName, () => App);

// Run the app in the web browser
AppRegistry.runApplication(appName, {
    rootTag: document.getElementById('root')
});