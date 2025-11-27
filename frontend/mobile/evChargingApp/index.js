/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Silence all React Native warnings and console logs in ALL environments (Dev + Release)
LogBox.ignoreAllLogs(true);
const emptyFn = () => {};
// eslint-disable-next-line no-console
console.log = emptyFn;
// eslint-disable-next-line no-console
console.info = emptyFn;
// eslint-disable-next-line no-console
console.warn = emptyFn;
// eslint-disable-next-line no-console
console.error = emptyFn;
// eslint-disable-next-line no-console
console.debug = emptyFn;

AppRegistry.registerComponent(appName, () => App);
