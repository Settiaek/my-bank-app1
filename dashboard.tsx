import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
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

const BALANCE_KEY = "gzb_balance";
const TRANSACTIONS_KEY = "gzb_transactions";

const DEFAULT_TRANSACTIONS = [
  { id: "1", title: "Apple Store", subtitle: "Technology", amount: "1200.00", isDebit: true, icon: "phone-portrait", date: "Today" },
  { id: "2", title: "Stock Dividends", subtitle: "Investment Income", amount: "4500.00", isDebit: false, icon: "trending-up", date: "Yesterday" },
  { id: "3", title: "Ritz-Carlton Hotel", subtitle: "Accommodation", amount: "3750.00", isDebit: true, icon: "home", date: "Mar 15" },
  { id: "4", title: "Wire Transfer In", subtitle: "International", amount: "25000.00", isDebit: false, icon: "swap-horizontal", date: "Mar 14" },
  { id: "5", title: "Porsche Lease", subtitle: "Automotive", amount: "2800.00", isDebit: true, icon: "car", date: "Mar 12" },
];

type Transaction = typeof DEFAULT_TRANSACTIONS[0] & { held?: boolean };

function formatAmount(raw: string): string {
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatBalance(raw: string): string {
  return "$" + formatAmount(raw);
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true, tension: 300, friction: 10 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable style={styles.quickAction} onPress={handlePress}>
        <View style={styles.quickActionIcon}>
          <Ionicons name={icon as any} size={22} color={Colors.gold} />
        </View>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function TransactionItem({
  item,
  onPress,
}: {
  item: Transaction;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.65} style={styles.txRow}>
      <View style={styles.txIconWrap}>
        <Ionicons name={item.icon as any} size={18} color={Colors.grayLight} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txTitle}>{item.title}</Text>
        <Text style={styles.txSub}>{item.subtitle}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: item.held ? Colors.red : item.isDebit ? Colors.white : Colors.green }]}>
          {item.isDebit ? "- " : "+ "}${formatAmount(item.amount)}
        </Text>
        {item.held ? (
          <View style={styles.heldBadge}>
            <Text style={styles.heldBadgeText}>HELD</Text>
          </View>
        ) : (
          <Text style={styles.txDate}>{item.date}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

type EditTarget =
  | { type: "balance" }
  | { type: "username" }
  | { type: "tx_title"; id: string }
  | { type: "tx_amount"; id: string };

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const scaleTransfer = useRef(new Animated.Value(1)).current;

  const [balance, setBalance] = useState("142500");
  const [userName, setUserName] = useState("Alexander");
  const [transactions, setTransactions] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [actionTargetId, setActionTargetId] = useState<string | null>(null);
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(BALANCE_KEY).then((val) => { if (val) setBalance(val); });
    AsyncStorage.getItem(TRANSACTIONS_KEY).then((val) => { if (val) setTransactions(JSON.parse(val)); });
    AsyncStorage.getItem("gzb_username").then((val) => { if (val) setUserName(val); });
  }, []);

  const saveTransactions = (updated: Transaction[]) => {
    setTransactions(updated);
    AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updated));
  };

  const openActionSheet = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActionTargetId(id);
  };

  const deleteTransaction = (id: string) => {
    setActionTargetId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (!deleteTargetId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveTransactions(transactions.filter((t) => t.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  const openModal = (target: EditTarget, currentValue: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditTarget(target);
    setInputValue(currentValue);
    Animated.parallel([
      Animated.spring(modalScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.spring(modalScale, { toValue: 0.9, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setEditTarget(null));
  };

  const saveEdit = () => {
    if (!editTarget) return;
    if (editTarget.type === "balance") {
      const clean = inputValue.replace(/[^0-9.]/g, "");
      if (clean) { setBalance(clean); AsyncStorage.setItem(BALANCE_KEY, clean); }
    } else if (editTarget.type === "username") {
      const trimmed = inputValue.trim();
      if (trimmed) { setUserName(trimmed); AsyncStorage.setItem("gzb_username", trimmed); }
    } else if (editTarget.type === "tx_title") {
      const updated = transactions.map((t) =>
        t.id === editTarget.id ? { ...t, title: inputValue } : t
      );
      saveTransactions(updated);
    } else if (editTarget.type === "tx_amount") {
      const clean = inputValue.replace(/[^0-9.]/g, "");
      const updated = transactions.map((t) =>
        t.id === editTarget.id ? { ...t, amount: clean || t.amount } : t
      );
      saveTransactions(updated);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeModal();
  };

  const handleTransferPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(scaleTransfer, { toValue: 0.95, useNativeDriver: true, tension: 300, friction: 10 }),
      Animated.spring(scaleTransfer, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start(() => router.push("/transfer"));
  };

  const isAmountTarget = editTarget?.type === "balance" || editTarget?.type === "tx_amount";
  const modalTitle =
    editTarget?.type === "balance" ? "تعديل الرصيد" :
    editTarget?.type === "username" ? "تعديل الاسم" :
    editTarget?.type === "tx_title" ? "تعديل اسم العملية" :
    "تعديل مبلغ العملية";

  const avatarInitials = userName.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("");

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 16,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning,</Text>
            <TouchableOpacity onPress={() => openModal({ type: "username" }, userName)} activeOpacity={0.7}>
              <Text style={styles.userName}>{userName}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.notifBtn}>
              <Ionicons name="notifications" size={20} color={Colors.grayLight} />
              <View style={styles.notifDot} />
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardInner}>
            <View style={styles.balancePill}>
              <View style={styles.balancePillDot} />
              <Text style={styles.balancePillText}>GOLDEN ACCOUNT</Text>
            </View>
            <Text style={styles.balanceLabel}>Total Portfolio Value</Text>

            <TouchableOpacity
              onPress={() => openModal({ type: "balance" }, balance)}
              activeOpacity={0.7}
            >
              <Text style={styles.balanceAmount}>{formatBalance(balance)}</Text>
            </TouchableOpacity>

            <View style={styles.balanceSubRow}>
              <Ionicons name="trending-up" size={14} color={Colors.green} />
              <Text style={styles.balanceChange}>+$6,420.00 (4.5%) this month</Text>
            </View>

            <View style={styles.goldStrip} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <QuickAction icon="send" label="Transfer" onPress={handleTransferPress} />
          <QuickAction icon="add-circle" label="Deposit" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} />
          <QuickAction icon="card" label="Cards" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} />
          <QuickAction icon="bar-chart" label="Invest" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} />
        </View>

        {/* Transfer CTA */}
        <Animated.View style={{ transform: [{ scale: scaleTransfer }] }}>
          <Pressable style={styles.transferBtn} onPress={handleTransferPress}>
            <Ionicons name="send" size={18} color={Colors.black} />
            <Text style={styles.transferBtnText}>Transfer Funds</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.black} />
          </Pressable>
        </Animated.View>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Pressable><Text style={styles.seeAll}>See All</Text></Pressable>
          </View>
          <View style={styles.txCard}>
            {transactions.map((item, index) => (
              <View key={item.id}>
                <TransactionItem
                  item={item}
                  onPress={() => openActionSheet(item.id)}
                />
                {index < transactions.length - 1 && <View style={styles.txDivider} />}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editTarget} transparent animationType="none" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <Animated.View
            style={[
              styles.modalCard,
              { opacity: modalOpacity, transform: [{ scale: modalScale }] },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{modalTitle}</Text>

            {/* If editing tx_title, show toggle to switch to amount */}
            {editTarget?.type === "tx_title" && (
              <View style={styles.toggleRow}>
                <Pressable
                  style={[styles.toggleBtn, styles.toggleBtnActive]}
                  onPress={() => {}}
                >
                  <Text style={styles.toggleBtnTextActive}>الاسم</Text>
                </Pressable>
                <Pressable
                  style={styles.toggleBtn}
                  onPress={() => {
                    const tx = transactions.find((t) => t.id === (editTarget as any).id);
                    if (tx) setEditTarget({ type: "tx_amount", id: tx.id });
                    setInputValue(transactions.find((t) => t.id === (editTarget as any).id)?.amount ?? "");
                  }}
                >
                  <Text style={styles.toggleBtnText}>المبلغ</Text>
                </Pressable>
              </View>
            )}
            {editTarget?.type === "tx_amount" && (
              <View style={styles.toggleRow}>
                <Pressable
                  style={styles.toggleBtn}
                  onPress={() => {
                    const tx = transactions.find((t) => t.id === (editTarget as any).id);
                    if (tx) setEditTarget({ type: "tx_title", id: tx.id });
                    setInputValue(transactions.find((t) => t.id === (editTarget as any).id)?.title ?? "");
                  }}
                >
                  <Text style={styles.toggleBtnText}>الاسم</Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleBtn, styles.toggleBtnActive]}
                  onPress={() => {}}
                >
                  <Text style={styles.toggleBtnTextActive}>المبلغ</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.modalInputRow}>
              {isAmountTarget && <Text style={styles.modalCurrency}>$</Text>}
              <TextInput
                style={[styles.modalInput, !isAmountTarget && { fontSize: 20 }]}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType={isAmountTarget ? "numeric" : "default"}
                placeholder={isAmountTarget ? "0.00" : "أدخل الاسم"}
                placeholderTextColor={Colors.gray}
                selectionColor={Colors.gold}
                autoFocus
              />
            </View>

            {isAmountTarget && (
              <Text style={styles.modalPreview}>
                سيظهر كـ: ${formatAmount(inputValue || "0")}
              </Text>
            )}

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={closeModal}>
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={saveEdit}>
                <Ionicons name="checkmark" size={18} color={Colors.black} />
                <Text style={styles.modalSaveText}>حفظ</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Action Sheet */}
      <Modal visible={!!actionTargetId} transparent animationType="fade" onRequestClose={() => setActionTargetId(null)}>
        <View style={styles.actionOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActionTargetId(null)} />
          <View style={styles.actionCard}>
            <View style={styles.actionHandle} />
            <Text style={styles.actionTitle}>خيارات المعاملة</Text>
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                const tx = transactions.find((t) => t.id === actionTargetId);
                if (tx) { setActionTargetId(null); openModal({ type: "tx_title", id: tx.id }, tx.title); }
              }}
            >
              <Ionicons name="pencil" size={20} color={Colors.gold} />
              <Text style={styles.actionBtnText}>تعديل اسم المتعامل</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                const tx = transactions.find((t) => t.id === actionTargetId);
                if (tx) { setActionTargetId(null); openModal({ type: "tx_amount", id: tx.id }, tx.amount); }
              }}
            >
              <Ionicons name="cash" size={20} color={Colors.gold} />
              <Text style={styles.actionBtnText}>تعديل المبلغ</Text>
            </Pressable>
            <View style={styles.actionDivider} />
            <Pressable
              style={styles.actionBtn}
              onPress={() => actionTargetId && deleteTransaction(actionTargetId)}
            >
              <Ionicons name="trash" size={20} color={Colors.red} />
              <Text style={[styles.actionBtnText, { color: Colors.red }]}>حذف المعاملة</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteTargetId} transparent animationType="fade" onRequestClose={() => setDeleteTargetId(null)}>
        <View style={styles.deleteOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDeleteTargetId(null)} />
          <View style={styles.deleteCard}>
            <View style={styles.deleteIconWrap}>
              <Ionicons name="trash" size={28} color={Colors.red} />
            </View>
            <Text style={styles.deleteTitle}>حذف المعاملة</Text>
            <Text style={styles.deleteMessage}>هل تريد حذف هذه المعاملة نهائياً؟</Text>
            <View style={styles.deleteActions}>
              <Pressable style={styles.deleteCancelBtn} onPress={() => setDeleteTargetId(null)}>
                <Text style={styles.deleteCancelText}>إلغاء</Text>
              </Pressable>
              <Pressable style={styles.deleteConfirmBtn} onPress={confirmDelete}>
                <Ionicons name="trash" size={15} color={Colors.white} />
                <Text style={styles.deleteConfirmText}>حذف</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { color: Colors.gray, fontSize: 13, fontFamily: "Inter_400Regular" },
  userName: { color: Colors.white, fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.darkCard, alignItems: "center", justifyContent: "center" },
  notifDot: { position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.red, borderWidth: 1.5, borderColor: Colors.darkCard },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.goldDark, alignItems: "center", justifyContent: "center" },
  avatarText: { color: Colors.black, fontSize: 13, fontFamily: "Inter_700Bold" },

  balanceCard: { borderRadius: 20, overflow: "hidden", backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.darkBorder },
  balanceCardInner: { padding: 22, gap: 6, overflow: "hidden" },
  balancePill: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  balancePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gold },
  balancePillText: { color: Colors.gold, fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  balanceLabel: { color: Colors.gray, fontSize: 12, fontFamily: "Inter_400Regular", letterSpacing: 0.5 },
  balanceAmount: { color: Colors.white, fontSize: 40, fontFamily: "Inter_700Bold", letterSpacing: -1.5, marginVertical: 4 },
  balanceSubRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  balanceChange: { color: Colors.green, fontSize: 12, fontFamily: "Inter_500Medium" },
  balanceDivider: { height: 1, backgroundColor: Colors.darkBorder, marginVertical: 16 },
  balanceAccounts: { flexDirection: "row", justifyContent: "space-between" },
  balanceAccount: { flex: 1, alignItems: "center", gap: 4 },
  balanceAccountDivider: { width: 1, backgroundColor: Colors.darkBorder },
  balanceAccountLabel: { color: Colors.gray, fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 0.5, textTransform: "uppercase" },
  balanceAccountAmount: { color: Colors.white, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  goldStrip: { position: "absolute", top: 0, right: 0, width: 80, height: 3, backgroundColor: Colors.gold, borderBottomLeftRadius: 4 },

  quickActionsRow: { flexDirection: "row", justifyContent: "space-between" },
  quickAction: { alignItems: "center", gap: 8, flex: 1 },
  quickActionIcon: { width: 58, height: 58, borderRadius: 16, backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.darkBorder, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { color: Colors.grayLight, fontSize: 11, fontFamily: "Inter_500Medium" },

  transferBtn: { backgroundColor: Colors.gold, borderRadius: 14, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  transferBtnText: { color: Colors.black, fontSize: 16, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },

  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: Colors.white, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  seeAll: { color: Colors.gold, fontSize: 13, fontFamily: "Inter_500Medium" },
  txHint: { color: Colors.gray, fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },

  txCard: { backgroundColor: Colors.darkCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.darkBorder, overflow: "hidden" },
  txRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  txIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.darkSurface, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1, gap: 2 },
  txTitle: { color: Colors.white, fontSize: 14, fontFamily: "Inter_500Medium" },
  txSub: { color: Colors.gray, fontSize: 11, fontFamily: "Inter_400Regular" },
  txRight: { alignItems: "flex-end", gap: 2 },
  txAmount: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  txDate: { color: Colors.gray, fontSize: 11, fontFamily: "Inter_400Regular" },
  heldBadge: {
    backgroundColor: "rgba(255,59,48,0.15)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: Colors.red,
  },
  heldBadgeText: { color: Colors.red, fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  txDivider: { height: 1, backgroundColor: Colors.darkBorder, marginHorizontal: 16 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.75)", padding: 24 },
  modalCard: { width: "100%", backgroundColor: Colors.darkCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.darkBorder, padding: 24, gap: 14, alignItems: "center" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.darkBorder, marginBottom: 4 },
  modalTitle: { color: Colors.white, fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },

  toggleRow: { flexDirection: "row", backgroundColor: Colors.darkSurface, borderRadius: 10, padding: 4, gap: 4, width: "100%" },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  toggleBtnActive: { backgroundColor: Colors.gold },
  toggleBtnText: { color: Colors.gray, fontSize: 13, fontFamily: "Inter_500Medium" },
  toggleBtnTextActive: { color: Colors.black, fontSize: 13, fontFamily: "Inter_700Bold" },

  modalInputRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.darkSurface, borderRadius: 14, borderWidth: 1, borderColor: Colors.darkBorder, paddingHorizontal: 16, width: "100%" },
  modalCurrency: { color: Colors.gold, fontSize: 28, fontFamily: "Inter_600SemiBold", marginRight: 6 },
  modalInput: { flex: 1, color: Colors.white, fontSize: 28, fontFamily: "Inter_700Bold", paddingVertical: 14 },
  modalPreview: { color: Colors.gray, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  modalActions: { flexDirection: "row", gap: 12, width: "100%", marginTop: 4 },
  modalCancelBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: Colors.darkSurface, borderWidth: 1, borderColor: Colors.darkBorder, alignItems: "center", justifyContent: "center" },
  modalCancelText: { color: Colors.grayLight, fontSize: 15, fontFamily: "Inter_500Medium" },
  modalSaveBtn: { flex: 2, height: 50, borderRadius: 12, backgroundColor: Colors.gold, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  modalSaveText: { color: Colors.black, fontSize: 15, fontFamily: "Inter_700Bold" },

  actionOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "flex-end", padding: 16, paddingBottom: 32 },
  actionCard: { backgroundColor: Colors.darkCard, borderRadius: 20, paddingVertical: 16, width: "100%", borderWidth: 1, borderColor: Colors.darkBorder, alignItems: "center" },
  actionHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.darkBorder, marginBottom: 12 },
  actionTitle: { color: Colors.gray, fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 24, paddingVertical: 16, width: "100%" },
  actionBtnText: { color: Colors.white, fontSize: 16, fontFamily: "Inter_500Medium" },
  actionDivider: { height: 1, backgroundColor: Colors.darkBorder, width: "100%" },

  deleteOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", padding: 30 },
  deleteCard: { backgroundColor: Colors.darkCard, borderRadius: 20, padding: 28, alignItems: "center", gap: 12, borderWidth: 1, borderColor: Colors.darkBorder, width: "100%" },
  deleteIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,59,48,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.red },
  deleteTitle: { color: Colors.white, fontSize: 18, fontFamily: "Inter_700Bold" },
  deleteMessage: { color: Colors.gray, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  deleteActions: { flexDirection: "row", gap: 12, width: "100%", marginTop: 4 },
  deleteCancelBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: Colors.darkSurface, borderWidth: 1, borderColor: Colors.darkBorder, alignItems: "center", justifyContent: "center" },
  deleteCancelText: { color: Colors.grayLight, fontSize: 15, fontFamily: "Inter_500Medium" },
  deleteConfirmBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: Colors.red, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  deleteConfirmText: { color: Colors.white, fontSize: 15, fontFamily: "Inter_700Bold" },
});
