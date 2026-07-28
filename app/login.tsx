import { FirebaseError } from "firebase/app";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";

function getErrorMessage(error: unknown): string {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="mb-1 text-3xl font-bold text-gray-900">
          Welcome back
        </Text>
        <Text className="mb-8 text-base text-gray-500">
          Sign in to continue
        </Text>

        <View className="mb-4">
          <Text className="mb-1.5 text-sm font-medium text-gray-700">
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            className="rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900"
          />
        </View>

        <View className="mb-2">
          <Text className="mb-1.5 text-sm font-medium text-gray-700">
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            className="rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {error ? (
          <Text className="mb-2 text-sm text-red-600">{error}</Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          className={`mt-4 items-center rounded-lg py-3 ${
            canSubmit ? "bg-blue-500" : "bg-blue-300"
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-base font-semibold text-white">
              Log in
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
