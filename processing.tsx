import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const STEPS = [
  { id: 1, label: "Initiating secure connection", duration: 2200 },
  { id: 2, label: "Verifying recipient account", duration: 2500 },
  { id: 3, label: "Encrypting transaction data (AES-256)", duration: 2500 },
  { id: 4, label: "Finalizing bank clearing", duration: 2000 },
];

function StepItem({
  label,
  state,
}: {
  label: string;
  state: "pending" | "active" | "done";
}) {
  const fadeAnim = useRef(new Animated.Value(state === "pending" ? 0.3 : 1)).current;

  useEffect(() => {
    if (state === "active") {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [state]);

  return (
    <Animated.View style={[styles.stepRow, { opacity: fadeAnim }]}>
      <View
        style={[
          styles.stepIcon,
          state === "done" && styles.stepIconDone,
          state === "active" && styles.stepIconActive,
        ]}
      >
        {state === "done" ? (
          <View style={styles.stepCheckDot} />
        ) : state === "active" ? (
          <SpinnerDot />
        ) : (
          <View style={styles.stepPendingDot} />
        )}
      </View>
      <Text
        style={[
          styles.stepLabel,
          state === "active" && styles.stepLabelActive,
          state === "done" && styles.stepLabelDone,
        ]}
      >
        {label}
      </Text>
      {state === "done" && (
        <Text style={styles.stepDone}>Done</Text>
      )}
    </Animated.View>
  );
}

function SpinnerDot() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[styles.spinnerDot, { transform: [{ rotate }] }]}
    />
  );
}

export default function ProcessingScreen() {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    let elapsed = 0;
    let stepIdx = 0;

    const advance = () => {
      if (stepIdx >= STEPS.length) {
        router.replace("/trap");
        return;
      }
      const step = STEPS[stepIdx];
      setCurrentStep(stepIdx);
      const targetProgress = (stepIdx + 1) / STEPS.length;
      Animated.timing(progressAnim, {
        toValue: targetProgress,
        duration: step.duration * 0.9,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();

      elapsed += step.duration;
      stepIdx++;
      setTimeout(advance, step.duration);
    };

    advance();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? 67 : insets.top,
          paddingBottom: Platform.OS === "web" ? 34 : insets.bottom,
        },
      ]}
    >
      <View style={styles.centerContent}>
        {/* Animated icon */}
        <Animated.View
          style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}
        >
          <View style={styles.iconGlow} />
          <View style={styles.iconRing}>
            <View style={styles.iconInner} />
          </View>
          <Text style={styles.iconText}>⚡</Text>
        </Animated.View>

        <Text style={styles.title}>Processing Transfer</Text>
        <Text style={styles.subtitle}>Please do not close the app</Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth }]}
            />
          </View>
          <Text style={styles.progressLabel}>
            Step {Math.min(currentStep + 1, STEPS.length)} of {STEPS.length}
          </Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsCard}>
          {STEPS.map((step, index) => {
            let state: "pending" | "active" | "done" = "pending";
            if (index < currentStep) state = "done";
            else if (index === currentStep) state = "active";
            return (
              <StepItem key={step.id} label={step.label} state={state} />
            );
          })}
        </View>

        <View style={styles.encryptionBadge}>
          <Text style={styles.encryptionText}>
            256-bit SSL Encrypted
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  iconWrap: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.gold,
    opacity: 0.08,
  },
  iconRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.gold,
    opacity: 0.3,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.gold,
    opacity: 0.5,
  },
  iconText: {
    fontSize: 36,
  },
  title: {
    color: Colors.white,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    color: Colors.gray,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  progressContainer: {
    width: "100%",
    gap: 8,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.darkBorder,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  progressLabel: {
    color: Colors.gray,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },

  stepsCard: {
    width: "100%",
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    padding: 16,
    gap: 14,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.darkSurface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.darkBorder,
  },
  stepIconDone: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  stepIconActive: {
    borderColor: Colors.gold,
  },
  stepCheckDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.black,
  },
  stepPendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.darkBorder,
  },
  spinnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gold,
    borderTopColor: "transparent",
  },
  stepLabel: {
    flex: 1,
    color: Colors.gray,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  stepLabelActive: {
    color: Colors.white,
    fontFamily: "Inter_500Medium",
  },
  stepLabelDone: {
    color: Colors.grayLight,
  },
  stepDone: {
    color: Colors.green,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },

  encryptionBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    backgroundColor: Colors.darkCard,
  },
  encryptionText: {
    color: Colors.gray,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
});
