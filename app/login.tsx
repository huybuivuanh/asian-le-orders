import { FirebaseError } from "firebase/app";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";

import SafeAreaViewWrapper from "@/components/SafeAreaViewWrapper";
import Button from "@/components/ui/Button";
import Wordmark from "@/components/ui/Wordmark";
import { AccessError, useAuth } from "@/contexts/AuthContext";
import { colors } from "@/theme/colors";

// Same input style as the website admin's login.
const INPUT_CLASS =
  "rounded-lg border border-foreground/20 bg-white px-3 py-2.5 text-base text-foreground";

function getErrorMessage(error: unknown): string {
  // Signed in, but the account isn't staff/admin of a business.
  if (error instanceof AccessError) return error.message;
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "That email address looks invalid.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Incorrect email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  return "Something went wrong. Please try again.";
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaViewWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="w-full max-w-sm flex-1 justify-center self-center px-4">
          <View className="mb-6 items-center gap-2">
            <Wordmark tone="light" size="lg" />
            <Text className="text-sm text-foreground/60">Sign in to continue</Text>
          </View>

          {error ? (
            <View
              className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2"
              accessibilityRole="alert"
            >
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          <View className="mb-4">
            <Text className="mb-1 text-sm font-medium text-foreground">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              placeholderTextColor={colors.placeholder}
              className={INPUT_CLASS}
            />
          </View>

          <View className="mb-6">
            <Text className="mb-1 text-sm font-medium text-foreground">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              placeholderTextColor={colors.placeholder}
              className={INPUT_CLASS}
              onSubmitEditing={handleSubmit}
            />
          </View>

          <Button
            label="Sign in"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaViewWrapper>
  );
}
