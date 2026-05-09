/**
 * CheckoutWebView
 *
 * Opens the Dodo Payments hosted checkout in a full-screen WebView.
 * Handles both HTTPS redirect interception (primary) and
 * kayu:// deep-link fallback (secondary).
 *
 * Android note: custom-scheme URLs (kayu://) are blocked by Android WebView.
 * We use HTTPS redirect URLs and intercept them before they load.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Linking,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation, WebViewRequest } from 'react-native-webview/lib/WebViewTypes';

import { PF } from '@/constants/colors';
import {
    buildCheckoutUrl,
    detectPaymentResult
} from '@/services/dodo-service';

interface Props {
  visible:   boolean;
  email?:    string;
  onSuccess: () => void;
  onCancel:  () => void;
}

export function CheckoutWebView({ visible, email, onSuccess, onCancel }: Props) {
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError,   setLoadError]   = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handled    = useRef(false);
  const webviewRef = useRef<WebView>(null);
  const successAnim = useRef(new Animated.Value(0)).current;

  const checkoutUrl = buildCheckoutUrl(email);

  // ── Reset state when modal opens ─────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      handled.current = false;
      setPageLoading(true);
      setLoadError(false);
      setShowSuccess(false);
      successAnim.setValue(0);
    }
  }, [visible]);

  // ── Listen for deep-link fallback (external browser) ─────────────────────
  useEffect(() => {
    if (!visible) return;

    const sub = Linking.addEventListener('url', ({ url }) => {
      if (handled.current) return;
      const result = detectPaymentResult(url);
      if (result === 'success') {
        handled.current = true;
        triggerSuccess();
      } else if (result === 'cancel') {
        handled.current = true;
        onCancel();
      }
    });

    return () => sub.remove();
  }, [visible]);

  // ── Success animation then callback ──────────────────────────────────────
  const triggerSuccess = useCallback(() => {
    setShowSuccess(true);
    Animated.spring(successAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start(() => {
      setTimeout(() => onSuccess(), 1200);
    });
  }, [onSuccess, successAnim]);

  // ── Intercept navigation — fires on EVERY URL change ─────────────────────
  const handleShouldStartLoad = useCallback(
    (req: WebViewRequest): boolean => {
      if (handled.current) return false;

      const result = detectPaymentResult(req.url);
      if (result === 'success') {
        handled.current = true;
        triggerSuccess();
        return false; // stop WebView loading the redirect URL
      }
      if (result === 'cancel') {
        handled.current = true;
        onCancel();
        return false;
      }
      return true; // allow all other URLs
    },
    [triggerSuccess, onCancel]
  );

  // ── Also check onNavigationStateChange as a backup ───────────────────────
  const handleNavChange = useCallback(
    (nav: WebViewNavigation) => {
      if (handled.current) return;
      const result = detectPaymentResult(nav.url);
      if (result === 'success') {
        handled.current = true;
        triggerSuccess();
      } else if (result === 'cancel') {
        handled.current = true;
        onCancel();
      }
    },
    [triggerSuccess, onCancel]
  );

  const handleClose = () => {
    if (handled.current) return; // don't cancel after success
    handled.current = false;
    onCancel();
  };

  const handleRetry = () => {
    setLoadError(false);
    setPageLoading(true);
    webviewRef.current?.reload();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={handleClose}>

      <View style={S.root}>
        {/* ── Header ── */}
        <View style={S.header}>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [S.closeBtn, pressed && S.closeBtnPressed]}
            hitSlop={12}>
            <Text style={S.closeTxt}>✕</Text>
          </Pressable>
          <View style={S.headerCenter}>
            <Text style={S.headerTitle}>Kayu Pro</Text>
            <Text style={S.headerSub}>Secure checkout · Dodo Payments</Text>
          </View>
          <View style={S.headerRight} />
        </View>

        {/* ── Loading spinner (shown over WebView while page loads) ── */}
        {pageLoading && !loadError && (
          <View style={S.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={PF.accent} />
            <Text style={S.loadingTxt}>Loading secure checkout…</Text>
          </View>
        )}

        {/* ── Error state ── */}
        {loadError && (
          <View style={S.errorState}>
            <Text style={S.errorIcon}>⚠️</Text>
            <Text style={S.errorTitle}>Couldn't load checkout</Text>
            <Text style={S.errorSub}>
              Check your internet connection and try again.
            </Text>
            <Pressable onPress={handleRetry} style={S.retryBtn}>
              <Text style={S.retryTxt}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* ── WebView ── */}
        {!loadError && (
          <WebView
            ref={webviewRef}
            source={{ uri: checkoutUrl }}
            style={S.webview}
            // Primary interception — fires before the URL loads
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            // Backup interception — fires after navigation starts
            onNavigationStateChange={handleNavChange}
            onLoadStart={() => setPageLoading(true)}
            onLoadEnd={()   => setPageLoading(false)}
            onError={()     => { setPageLoading(false); setLoadError(true); }}
            onHttpError={(e) => {
              // Only treat as error if it's not our redirect URLs
              if (detectPaymentResult(e.nativeEvent.url) === null) {
                setPageLoading(false);
                setLoadError(true);
              }
            }}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            allowsInlineMediaPlayback
            // Android: allow mixed content for payment iframes
            mixedContentMode="compatibility"
            // iOS: allow navigation back/forward
            allowsBackForwardNavigationGestures={false}
            // User agent — some payment pages need a real browser UA
            applicationNameForUserAgent="KayuApp/1.0"
          />
        )}

        {/* ── Success overlay ── */}
        {showSuccess && (
          <Animated.View
            style={[
              S.successOverlay,
              {
                opacity: successAnim,
                transform: [{ scale: successAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
              },
            ]}>
            <View style={S.successCard}>
              <Animated.Text
                style={[
                  S.successEmoji,
                  { transform: [{ scale: successAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1.3, 1] }) }] },
                ]}>
                🎉
              </Animated.Text>
              <Text style={S.successTitle}>Payment Successful!</Text>
              <Text style={S.successSub}>Welcome to Kayu Pro. Unlocking your features…</Text>
              <ActivityIndicator color={PF.accent} style={{ marginTop: 8 }} />
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: PF.bg },

  header: {
    height: Platform.OS === 'ios' ? 88 : 60,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PF.border,
    backgroundColor: PF.bgCard,
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: PF.bgElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: PF.border,
  },
  closeBtnPressed: { opacity: 0.6 },
  closeTxt:    { fontSize: 14, color: PF.textSecondary, fontWeight: '700' },
  headerCenter:{ flex: 1, alignItems: 'center', gap: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: PF.textPrimary },
  headerSub:   { fontSize: 10, color: PF.textMuted, fontWeight: '500' },
  headerRight: { width: 34 },

  webview: { flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PF.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    zIndex: 10,
  },
  loadingTxt: { fontSize: 14, color: PF.textSecondary, fontWeight: '500' },

  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorIcon:  { fontSize: 44 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: PF.textPrimary },
  errorSub:   { fontSize: 13, color: PF.textSecondary, textAlign: 'center', lineHeight: 19 },
  retryBtn: {
    backgroundColor: PF.accent,
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 14, marginTop: 8,
    shadowColor: PF.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  retryTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  successCard: {
    backgroundColor: PF.bgCard,
    borderRadius: 28,
    padding: 36,
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 32,
    borderWidth: 1,
    borderColor: PF.borderLight,
    shadowColor: PF.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  successEmoji: { fontSize: 56 },
  successTitle: { fontSize: 22, fontWeight: '800', color: PF.textPrimary, letterSpacing: -0.3 },
  successSub:   { fontSize: 13, color: PF.textSecondary, textAlign: 'center', lineHeight: 19 },
});
