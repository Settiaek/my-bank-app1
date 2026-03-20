import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const RECENT_CONTACTS = [
  { id: "1", name: "James Wilson", initials: "JW", bank: "Chase" },
  { id: "2", name: "Sarah Chen", initials: "SC", bank: "BofA" },
  { id: "3", name: "Michael Torres", initials: "MT", bank: "Wells Fargo" },
];

export default function TransferScreen() {
  const insets = useSafeAreaInsets();
  const [iban, setIban] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const btnScale = useRef(new Animated.Value(1)).current;

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const cleanAmount = amount.replace(/[^0-9.]/g, "") || "0";
    const contact = RECENT_CONTACTS.find((c) => c.id === selectedContact);
    const recipientName = contact ? contact.name : iban || "Unknown";
    AsyncStorage.setItem("gzb_transfer_amount", cleanAmount);
    AsyncStorage.setItem("gzb_transfer_recipient", recipientName);
    Animated.sequence([
      Animated.spring(btnScale, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(btnScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start(() => {
      router.push("/processing");
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.replace("/dashboard")} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Money</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recent Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT CONTACTS</Text>
          <View style={styles.contactsRow}>
            {RECENT_CONTACTS.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.contactItem}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedContact(contact.id);
                  setIban("GB29 NWBK 6016 1331 9268 19");
                }}
              >
                <View
                  style={[
                    styles.contactAvatar,
                    selectedContact === contact.id && styles.contactAvatarSelected,
                  ]}
                >
                  <Text style={styles.contactInitials}>{contact.initials}</Text>
                  {selectedContact === contact.id && (
                    <View style={styles.contactCheckmark}>
                      <Ionicons name="checkmark" size={10} color={Colors.black} />
                    </View>
                  )}
                </View>
                <Text style={styles.contactName}>{contact.name.split(" ")[0]}</Text>
                <Text style={styles.contactBank}>{contact.bank}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Recipient IBAN / Account</Text>
            <TextInput
              style={styles.fieldInput}
              value={iban}
              onChangeText={setIban}
              placeholder="Enter IBAN or account number"
              placeholderTextColor={Colors.gray}
              autoCapitalize="characters"
              selectionColor={Colors.gold}
            />
          </View>

          <View style={styles.fieldDivider} />

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Amount (USD)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.fieldInput, styles.amountInput]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.gray}
                keyboardType="numeric"
                selectionColor={Colors.gold}
              />
            </View>
          </View>

          <View style={styles.fieldDivider} />

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Transfer Note (Optional)</Text>
            <TextInput
              style={styles.fieldInput}
              value={note}
              onChangeText={setNote}
              placeholder="Add a reference note"
              placeholderTextColor={Colors.gray}
              selectionColor={Colors.gold}
            />
          </View>
        </View>

        {/* Security note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={14} color={Colors.gold} />
          <Text style={styles.securityText}>
            All transfers are protected by AES-256 encryption and 2-factor authentication
          </Text>
        </View>

        {/* Transfer details */}
        <View style={styles.detailsCard}>
          {[
            ["Transfer Fee", "Free"],
            ["Processing Time", "Instant"],
            ["Daily Limit", "$1,000.00"],
            ["Network", "SWIFT / SEPA"],
          ].map(([label, value]) => (
            <View key={label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Confirm Button */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>Confirm Transfer</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.black} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.darkCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  section: { gap: 12 },
  sectionLabel: {
    color: Colors.gray,
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  contactsRow: {
    flexDirection: "row",
    gap: 16,
  },
  contactItem: { alignItems: "center", gap: 6 },
  contactAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.darkSurface,
    borderWidth: 2,
    borderColor: Colors.darkBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarSelected: {
    borderColor: Colors.gold,
    backgroundColor: Colors.darkCard,
  },
  contactInitials: {
    color: Colors.grayLight,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  contactCheckmark: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  contactName: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  contactBank: {
    color: Colors.gray,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },

  formCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    overflow: "hidden",
  },
  formField: { padding: 16, gap: 8 },
  fieldLabel: {
    color: Colors.gray,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  fieldInput: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    minHeight: 24,
  },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  currencySymbol: {
    color: Colors.gold,
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
  },
  amountInput: { fontSize: 24, fontFamily: "Inter_600SemiBold", flex: 1 },
  fieldDivider: { height: 1, backgroundColor: Colors.darkBorder },

  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 4,
  },
  securityText: {
    color: Colors.gray,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },

  detailsCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorder,
    padding: 16,
    gap: 12,
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

  confirmBtn: {
    backgroundColor: Colors.blue,
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  confirmBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
