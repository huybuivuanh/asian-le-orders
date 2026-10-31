import { useRewardsAuth } from "@/hooks/useRewardsAuth";
import {
  rewardsErrorMessage,
  signInRewardsDevice,
  signOutRewardsDevice,
} from "@/services/rewards";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";

/** Settings → Rewards: signs this device in to Asian Le Rewards (the shared POS account),
 * so completing an online order can collect the member's points. Kept on staff logout. */
export default function RewardsDeviceCard() {
  const rewards = useRewardsAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInRewardsDevice(email, password);
      setPassword("");
    } catch (err) {
      setError(rewardsErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  let content: React.ReactNode;
  if (!rewards.configured) {
    content = (
      <Text className="text-sm text-gray-500">
        Rewards isn&apos;t set up in this build (missing EXPO_PUBLIC_REWARDS_FIREBASE_* config).
      </Text>
    );
  } else if (!rewards.ready) {
    content = <ActivityIndicator />;
  } else if (rewards.email) {
    content = (
      <View className="gap-3">
        <View>
          <Text className="text-base font-semibold text-gray-900">{rewards.email}</Text>
          <Text
            className={`text-xs mt-0.5 ${rewards.isPosAccount ? "text-gray-400" : "text-red-600"}`}
          >
            {rewards.isPosAccount
              ? "Signed in — completing an online order collects the member's points"
              : "This account doesn't have POS access — sign in with the POS account"}
          </Text>
        </View>
        <TouchableOpacity
          className="self-start rounded-lg bg-gray-100 px-4 py-2"
          onPress={() => void signOutRewardsDevice()}
        >
          <Text className="text-sm font-semibold text-gray-700">Sign out of Rewards</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    content = (
      <View className="gap-3">
        <Text className="text-sm text-gray-500">
          Sign in once with the POS rewards account to collect points on online orders.
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-base text-gray-900"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          onSubmitEditing={() => void handleSignIn()}
          className="rounded-lg border border-gray-200 px-3 py-2.5 text-base text-gray-900"
        />
        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        <TouchableOpacity
          className={`rounded-lg bg-sky-600 py-3 ${busy || !email || !password ? "opacity-50" : ""}`}
          disabled={busy || !email || !password}
          onPress={() => void handleSignIn()}
        >
          <Text className="text-center font-bold text-white">
            {busy ? "Signing in…" : "Sign in to Rewards"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm shadow-black/5">
      <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
        Rewards
      </Text>
      {content}
    </View>
  );
}
