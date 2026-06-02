import { Linking, Alert } from 'react-native';

export function safeOpenUrl(url: string | null | undefined) {
  if (!url) return;
  if (!url.startsWith('https://') && !url.startsWith('http://') && !url.startsWith('mailto:')) {
    Alert.alert('Invalid link', 'This link cannot be opened.');
    return;
  }
  Linking.openURL(url).catch(() => Alert.alert('Could not open link'));
}
