/**
 * PaywallScreen — Kayu Pro
 * Single monthly plan at $5.99/month via Dodo Payments.
 */

import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { PF } from '@/constants/colors';
import { CheckoutWebView } from '@/features/subscription/checkout-webview';
import { calcExpiresAt, PLAN_INTERVAL, PLAN_LABEL, PLAN_PERIOD, PLAN_PRICE } from '@/services/dodo-service';
import { useSubscriptionStore } from '@/store/subscription-store';

interface Props {
  visible:      boolean;
  onClose:      () => void;
  featureName?: string;
}

const FEATURES = [
  { icon: '🎞️', label: '43 Premium Filters',        sub: 'Cinematic, Vintage, Mood & more' },
  { icon: '😊', label: '7 Exclusive Sticker Packs',  sub: 'Love, Animals, Food, Music & more' },
  { icon: '𝐓',  label: '20+ Premium Fonts',          sub: 'Serif, Display, Handwriting styles' },
  { icon: '⭐', label: 'Unlimited Style Presets',    sub: 'Save & share your edit styles' },
  { icon: '📈', label: 'Advanced Tone Curves',       sub: 'Per-channel RGB control' },
  { icon: '🎨', label: 'Color Grading Wheels',       sub: 'Shadows, Midtones, Highlights' },
  { icon: '💾', label: 'Full Quality Export',        sub: 'PNG & JPEG, no watermark' },
];

export function PaywallScreen({ visible, onClose, featureName }: Props) {
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const activatePro = useSubscriptionStore((s) => s.activatePro);
  const isActive    = useSubscriptionStore((s) => s.isActive);

  const handleSubscribe = () => {
    setCheckoutVisible(true);
  };

  const handlePaymentSuccess = async () => {
    setCheckoutVisible(false);
    await activatePro(calcExpiresAt());
    Alert.alert(
      '🎉 Welcome to Kayu Pro!',
      'All premium features are now unlocked. Enjoy!',
      [{ text: 'Let\'s Go!', onPress: onClose }]
    );
  };

  const handlePaymentCancel = () => {
    setCheckoutVisible(false);
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore Purchase',
      'If you have an active Kayu Pro subscription, it will be restored automatically when you log in on a new device.\n\nFor billing issues, contact support@kayu.app',
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <Modal
        visible={visible && !checkoutVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}>
        <View style={S.root}>
          {/* Close */}
          <Pressable onPress={onClose} style={S.closeBtn} hitSlop={12}>
            <Text style={S.closeTxt}>✕</Text>
          </Pressable>

          <ScrollView
            style={S.scroll}
            contentContainerStyle={S.content}
            showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={S.header}>
              <View style={S.crownWrap}>
                <Text style={S.crown}>👑</Text>
              </View>
              <Text style={S.title}>Kayu Pro</Text>
              {featureName ? (
                <Text style={S.subtitle}>
                  Unlock <Text style={S.subtitleBold}>{featureName}</Text> and all premium features
                </Text>
              ) : (
                <Text style={S.subtitle}>Unlock the full creative toolkit</Text>
              )}
            </View>

            {/* Feature list */}
            <View style={S.featureList}>
              {FEATURES.map((f, i) => (
                <View
                  key={f.label}
                  style={[S.featureRow, i === FEATURES.length - 1 && S.featureRowLast]}>
                  <View style={S.featureIconWrap}>
                    <Text style={S.featureIcon}>{f.icon}</Text>
                  </View>
                  <View style={S.featureText}>
                    <Text style={S.featureLabel}>{f.label}</Text>
                    <Text style={S.featureSub}>{f.sub}</Text>
                  </View>
                  <Text style={S.check}>✓</Text>
                </View>
              ))}
            </View>

            {/* Pricing card */}
            <View style={S.pricingCard}>
              {/* Glow */}
              <View style={S.pricingGlow} />
              <View style={S.pricingInner}>
                <View style={S.pricingLeft}>
                  <Text style={S.planName}>{PLAN_LABEL}</Text>
                  <Text style={S.planInterval}>{PLAN_INTERVAL} subscription</Text>
                  <Text style={S.planNote}>Cancel anytime · No hidden fees</Text>
                </View>
                <View style={S.pricingRight}>
                  <Text style={S.price}>{PLAN_PRICE}</Text>
                  <Text style={S.period}>{PLAN_PERIOD}</Text>
                </View>
              </View>
            </View>

            {/* Subscribe CTA */}
            <Pressable
              onPress={handleSubscribe}
              style={({ pressed }) => [S.ctaBtn, pressed && S.ctaBtnPressed]}>
              <Text style={S.ctaTxt}>Subscribe Now</Text>
              <Text style={S.ctaSub}>{PLAN_PRICE}{PLAN_PERIOD} · Secure checkout via Dodo</Text>
            </Pressable>

            {/* Dodo badge */}
            <View style={S.dodoBadge}>
              <Text style={S.dodoBadgeTxt}>🔒 Powered by Dodo Payments · SSL Secured</Text>
            </View>

            {/* Footer */}
            <View style={S.footer}>
              <Pressable onPress={handleRestore} hitSlop={8}>
                <Text style={S.footerLink}>Restore Purchase</Text>
              </Pressable>
              <Text style={S.footerDot}>·</Text>
              <Text style={S.footerText}>Cancel anytime</Text>
              <Text style={S.footerDot}>·</Text>
              <Text style={S.footerText}>Terms & Privacy</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Dodo checkout WebView */}
      <CheckoutWebView
        visible={checkoutVisible}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    </>
  );
}

const S = StyleSheet.create({
  root:    { flex: 1, backgroundColor: PF.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 64, paddingBottom: 48, gap: 22 },

  closeBtn: {
    position: 'absolute', top: 16, right: 16, zIndex: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: PF.bgElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: PF.border,
  },
  closeTxt: { fontSize: 14, color: PF.textSecondary, fontWeight: '600' },

  header:    { alignItems: 'center', gap: 10 },
  crownWrap: {
    width: 76, height: 76, borderRadius: 24,
    backgroundColor: 'rgba(245,200,66,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(245,200,66,0.35)',
    shadowColor: '#F5C842',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  crown:        { fontSize: 38 },
  title:        { fontSize: 30, fontWeight: '800', color: PF.textPrimary, letterSpacing: -0.6 },
  subtitle:     { fontSize: 14, color: PF.textSecondary, textAlign: 'center', lineHeight: 20 },
  subtitleBold: { color: PF.accent, fontWeight: '700' },

  featureList: {
    backgroundColor: PF.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: PF.border, overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: PF.border,
  },
  featureRowLast: { borderBottomWidth: 0 },
  featureIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: PF.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  featureIcon:  { fontSize: 18 },
  featureText:  { flex: 1, gap: 2 },
  featureLabel: { fontSize: 13, fontWeight: '600', color: PF.textPrimary },
  featureSub:   { fontSize: 11, color: PF.textSecondary },
  check:        { fontSize: 16, color: PF.success, fontWeight: '700' },

  pricingCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1.5, borderColor: PF.borderActive,
    backgroundColor: PF.bgCard,
  },
  pricingGlow: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: PF.accentGlow, opacity: 0.5,
  },
  pricingInner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  pricingLeft:  { gap: 3 },
  planName:     { fontSize: 18, fontWeight: '800', color: PF.textPrimary },
  planInterval: { fontSize: 12, fontWeight: '500', color: PF.textSecondary },
  planNote:     { fontSize: 10, color: PF.textMuted },
  pricingRight: { alignItems: 'flex-end' },
  price:        { fontSize: 32, fontWeight: '900', color: PF.accent, letterSpacing: -1 },
  period:       { fontSize: 13, color: PF.textSecondary, fontWeight: '500' },

  ctaBtn: {
    backgroundColor: PF.accent, borderRadius: 18,
    paddingVertical: 18, alignItems: 'center', gap: 5,
    shadowColor: PF.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55, shadowRadius: 18, elevation: 14,
  },
  ctaBtnPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  ctaTxt:  { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  ctaSub:  { fontSize: 11, color: 'rgba(255,255,255,0.65)' },

  dodoBadge: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: PF.bgElevated,
    borderRadius: 10,
    borderWidth: 1, borderColor: PF.border,
  },
  dodoBadgeTxt: { fontSize: 11, color: PF.textMuted, fontWeight: '500' },

  footer: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8, flexWrap: 'wrap',
  },
  footerLink: { fontSize: 11, color: PF.accent, fontWeight: '600' },
  footerText: { fontSize: 11, color: PF.textMuted },
  footerDot:  { fontSize: 11, color: PF.textMuted },
});
