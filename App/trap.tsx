import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

function formatBalance(raw: string): string {
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return "$0.00";
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TrapScreen() {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState("142500");
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const warningPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const [amountVal, balanceVal, recipientVal, txRaw] = await Promise.all([
        AsyncStorage.getItem("gzb_transfer_amount"),
        AsyncStorage.getItem("gzb_balance"),
        AsyncStorage.getItem("gzb_transfer_recipient"),
        AsyncStorage.getItem("gzb_transactions"),
      ]);
      const transferAmount = parseFloat((amountVal ?? "0").replace(/[^0-9.]/g, "")) || 0;
      const currentBalance = parseFloat((balanceVal ?? "0").replace(/[^0-9.]/g, "")) || 0;
      if (amountVal) setBalance(amountVal);
      const newBalance = Math.max(0, currentBalance - transferAmount);
      await AsyncStorage.setItem("gzb_balance", newBalance.toString());

      const existingTx: any[] = txRaw ? JSON.parse(txRaw) : [];
      const alreadyAdded = existingTx.some((t) => t.id === "held_transfer");
      if (!alreadyAdded && transferAmount > 0) {
        const today = new Date();
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const dateLabel = `${months[today.getMonth()]} ${today.getDate()}`;
        const newTx = {
          id: "held_transfer",
          title: recipientVal || "Wire Transfer",
          subtitle: "Clearing Hold",
          amount: transferAmount.toFixed(2),
          isDebit: true,
          icon: "time",
          date: dateLabel,
          held: true,
        };
        const updatedTx = [newTx, ...existingTx];
        await AsyncStorage.setItem("gzb_transactions", JSON.stringify(updatedTx));
      }
    })();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(warningPulse, {
          toValue: 1.08,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(warningPulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleUpgradePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.94, useNativeDriver: true, tension: 300, friction: 10 }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start(() => {
      handleShake();
    });
  };

  return (
    <View
      style={[
        styles.overlay,
        {
          paddingTop: Platform.OS === "web" ? 67 : insets.top,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom,
        },
      ]}
    >
      {/* Background dimmer with animated card */}
      <View style={styles.backdrop} />

      <Animated.View
        style={[
          styles.card,
          {
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        {/* Warning header */}
        <View style={styles.warningHeader}>
          <Animated.View
            style={[
              styles.warningIconWrap,
              { transform: [{ scale: warningPulse }] },
            ]}
          >
            <Ionicons name="warning" size={32} color={Colors.red} />
          </Animated.View>
          <Text style={styles.warningTitle}>TRANSFER HELD</Text>
          <View style={styles.warningBadge}>
            <Text style={styles.warningBadgeText}>ACTION REQUIRED</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.bodyText}>
            Your transaction of{" "}
            <Text style={styles.bodyHighlight}>{formatBalance(balance)}</Text> has been successfully processed, but is currently{" "}
            <Text style={{ color: Colors.red }}>HELD</Text> in the clearing phase.
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="lock-closed" size={14} color={Colors.gold} />
              <Text style={styles.infoText}>
                To release funds, your account must be upgraded to a{" "}
                <Text style={styles.infoHighlight}>GOLDEN ACCOUNT</Text>
              </Text>
            </View>
          </View>

          <View style={styles.feeCard}>
            <Text style={styles.feeLabel}>One-Time Activation Fee</Text>
            <Text style={styles.feeAmount}>$50.00</Text>
            <Text style={styles.feeNote}>Non-refundable • Instant account upgrade</Text>
          </View>

          {[
            ["Transfer Amount", formatBalance(balance)],
            ["Current Status", "CLEARING HOLD"],
            ["Estimated Release", "After upgrade"],
          ].map(([label, value]) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text
                style={[
                  styles.detailValue,
                  label === "Current Status" && { color: Colors.red },
                ]}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Animated.View style={{ transform: [{ scale: btnScale }], flex: 1 }}>
            <Pressable style={styles.upgradeBtn} onPress={handleUpgradePress}>
              <Ionicons name="diamond" size={16} color={Colors.black} />
              <Text style={styles.upgradeBtnText}>Upgrade Now — $50</Text>
            </Pressable>
          </Animated.View>

          <Pressable
            style={styles.cancelBtn}
            onPress={() => {
              Haptics.selectionAsync();
              router.replace("/dashboard");
            }}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.black,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  card: {
    width: "100%",
    backgroundColor: Colors.darkCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    overflow: "hidden",
  },

  warningHeader: {
    backgroundColor: "rgba(255,59,48,0.08)",
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
  },
  warningIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,59,48,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
  },
  warningTitle: {
    color: Colors.red,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  warningBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255,59,48,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
  },
  warningBadgeText: {
    color: Colors.red,
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },

  divider: { height: 1, backgroundColor: Colors.darkBorder },

  body: { padding: 20, gap: 14 },
  bodyText: {
    color: Colors.grayLight,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  bodyHighlight: {
    color: Colors.white,
    fontFamily: "Inter_600SemiBold",
  },

  infoCard: {
    backgroundColor: "rgba(255,215,0,0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
    padding: 12,
  },
  infoRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  infoText: {
    color: Colors.grayLight,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 20,
  },
  infoHighlight: {
    color: Colors.gold,
    fontFamily: "Inter_600SemiBold",
  },

  feeCard: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  feeLabel: {
    color: Colors.gray,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  feeAmount: {
    color: Colors.gold,
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  feeNote: {
    color: Colors.gray,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    color: Colors.gray,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  detailValue: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },

  actions: {
    padding: 20,
    paddingTop: 0,
    gap: 10,
  },
  upgradeBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  upgradeBtnText: {
    color: Colors.black,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  cancelBtn: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: Colors.gray,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },

});
