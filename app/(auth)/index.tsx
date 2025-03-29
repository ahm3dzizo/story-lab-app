import { Redirect } from 'expo-router';
import { routes } from '../routes';

export default function AuthIndex() {
  return <Redirect href={routes.auth.login} />;
} 