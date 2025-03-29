import type { MD3Theme } from 'react-native-paper';

export interface CustomTheme extends MD3Theme {
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: {
      fontSize: number;
      fontWeight: string;
    };
    h2: {
      fontSize: number;
      fontWeight: string;
    };
    h3: {
      fontSize: number;
      fontWeight: string;
    };
    body: {
      fontSize: number;
    };
    caption: {
      fontSize: number;
    };
  };
}

export interface Theme extends MD3Theme {
  colors: MD3Theme['colors'] & {
    scrim: string;
    shadow: string;
  };
} 