import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// تأكد أن هذا المسار صحيح في مشروعك، إذا حدث خطأ استبدل Colors.gold بـ 'gold' مباشرة
const Colors = {
  black: "#000000",
  white: "#FFFFFF",
  gold: "#D4AF37",
  gray: "#8E8E93",
};

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.delay(400),
    ]).start(() => {
      startDots();
      setTimeout(() => {
        // إذا كان مجلد dashboard موجوداً سيتم الانتقال له بنجاح
        router.replace("/dashboard");
      }, 2500);
    });
  }, []);

  const startDots = () => {
    const dot = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    Animated.parallel([
      dot(dotAnim1, 0),
      dot(dotAnim2, 150),
      dot(dotAnim3, 300),
    ]).start();
  };

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
        <Animated.View
          style={[
            styles.iconContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View style={styles.iconGlow} />
          <Ionicons name="diamond" size={64} color={Colors.gold} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.bankName}>GLOBAL ZENITH BANK</Text>
          <Text style={styles.tagline}>Private Wealth Management</Text>
        </Animated.View>

        <Animated.View style={[styles.dotsRow, { opacity: taglineAnim }]}>
          <Animated.View style={[styles.dot, { opacity: dotAnim1 }]} />
          <Animated.View style={[styles.dot, { opacity: dotAnim2 }]} />
          <Animated.View style={[styles.dot, { opacity: dotAnim3 }]} />
        </Animated.View>
      </View>

      <Animated.Text style={[styles.footer, { opacity: taglineAnim }]}>
        Secured & Encrypted · FDIC Insured
      </Animated.Text>
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
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
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
    opacity: 0.12,
  },
  bankName: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "bold", // تم استبدال الخط المفقود بسمك عريض قياسي
    letterSpacing: 3,
    textAlign: "center",
  },
  tagline: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  footer: {
    color: Colors.gray,
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.5,
    textAlign: "center",
    paddingBottom: 16,
  },
});
