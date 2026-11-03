import { useRewardsAuth } from "@/hooks/useRewardsAuth";
import {
  rewardsErrorMessage,
  signInRewardsDevice,
  signOutRewardsDevice,
} from "@/services/rewards";
import { useState } from "react";
import { colors } from "@/theme/colors";
import { ActivityIndicator, Text, TextInput, View } from "react-native";
import Button from "./ui/Button";
import Card from "./ui/Card";

const INPUT_CLASS =
  "rounded-lg border border-foreground/20 bg-white px-3 py-2.5 text-base text-foreground";

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
      <Text className="text-sm text-foreground/60">
        Rewards isn&apos;t set up in this build (missing EXPO_PUBLIC_REWARDS_FIREBASE_* config).
      </Text>
    );
  } else if (!rewards.ready) {
    content = <ActivityIndicator color={colors.foreground} />;
  } else if (rewards.email) {
    content = (
      <View className="gap-3">
        <View>
          <Text className="text-base font-semibold text-foreground">{rewards.email}</Text>
          <Text
            className={`mt-0.5 text-sm ${rewards.isPosAccount ? "text-foreground/60" : "text-red-600"}`}
          >
            {rewards.isPosAccount
              ? "Signed in — completing an online order collects the member's points"
              : "This account doesn't have POS access — sign in with the POS account"}
          </Text>
        </View>
        <Button
          label="Sign out of Rewards"
          variant="secondary"
          size="sm"
          className="self-start"
          onPress={() => void signOutRewardsDevice()}
        />
      </View>
    );
  } else {
    content = (
      <View className="gap-3">
        <Text className="text-sm text-foreground/60">
          Sign in once with the POS rewards account to collect points on online orders.
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholderTextColor={colors.placeholder}
          className={INPUT_CLASS}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          onSubmitEditing={() => void handleSignIn()}
          placeholderTextColor={colors.placeholder}
          className={INPUT_CLASS}
        />
        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        <Button
          label="Sign in to Rewards"
          loading={busy}
          disabled={!email || !password}
          onPress={() => void handleSignIn()}
        />
      </View>
    );
  }

  return <Card title="Rewards">{content}</Card>;
}
