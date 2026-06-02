import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="onboarding/startup/basics" />
      <Stack.Screen name="onboarding/startup/details" />
      <Stack.Screen name="onboarding/startup/pitch-video" />
      <Stack.Screen name="onboarding/investor/basics" />
      <Stack.Screen name="onboarding/investor/preferences" />
      <Stack.Screen name="onboarding/investor/portfolio" />
      <Stack.Screen name="onboarding/investor/verification" />
    </Stack>
  );
}
