import { Redirect, router } from 'expo-router';
import { Image } from 'expo-image';
import { type PropsWithChildren, type ReactNode, use, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image as NativeImage, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { Button, Screen, brand } from '@/components/cleanodry-ui';
import { getStoreNotifications, type StoreNotification } from '@/lib/api';
import { AuthContext } from '@/lib/auth-context';
import {
  addPushTokenRefreshListener,
  addStoreNotificationListeners,
  logFcmRegistrationFailure,
  registerForPushNotifications,
} from '@/lib/push-notifications';

export const appBackground = '#F4FAF1';

export type AppSection = 'home' | 'services' | 'packages' | 'stores' | 'about' | 'support';

export type IconName =
  | 'home'
  | 'services'
  | 'packages'
  | 'stores'
  | 'about'
  | 'support'
  | 'orders'
  | 'pickup'
  | 'profile'
  | 'logout'
  | 'account';

const appIcons = {
  pickup: require('@/assets/images/badge-ic-pickup.png'),
  eco: require('@/assets/images/badge-ic-eco.png'),
  express: require('@/assets/images/ft-ic-express.png'),
};

export const sectionMeta: Record<AppSection, { title: string; subtitle: string; icon: IconName }> = {
  home: {
    title: 'Home',
    subtitle: 'Book, track, and manage garment care.',
    icon: 'home',
  },
  services: {
    title: 'Services',
    subtitle: 'Premium cleaning categories.',
    icon: 'services',
  },
  packages: {
    title: 'Packages',
    subtitle: 'Save more on repeat care.',
    icon: 'packages',
  },
  stores: {
    title: 'Store Locator',
    subtitle: 'Find Cleanodry near you.',
    icon: 'stores',
  },
  about: {
    title: 'About Us',
    subtitle: 'Premium process and fabric care.',
    icon: 'about',
  },
  support: {
    title: 'Support',
    subtitle: 'Call or chat with Cleanodry.',
    icon: 'support',
  },
};

export function isAppSection(value: string | undefined): value is AppSection {
  return value !== undefined && value in sectionMeta;
}

export function MenuGlyph({ name, active = false, danger = false }: { name: IconName; active?: boolean; danger?: boolean }) {
  const color = danger ? brand.danger : active ? brand.white : brand.green;

  if (name === 'pickup') {
    return <Image source={appIcons.pickup} style={styles.assetGlyph} contentFit="contain" />;
  }

  if (name === 'orders') {
    return <Image source={appIcons.express} style={styles.assetGlyph} contentFit="contain" />;
  }

  if (name === 'services') {
    return <Image source={appIcons.eco} style={styles.assetGlyph} contentFit="contain" />;
  }

  if (name === 'home') {
    return (
      <View style={styles.glyph}>
        <View style={[styles.glyphRoof, { borderColor: color }]} />
        <View style={[styles.glyphHouseBase, { borderColor: color }]} />
      </View>
    );
  }

  if (name === 'packages') {
    return (
      <View style={styles.glyph}>
        <View style={[styles.glyphBox, { borderColor: color }]} />
        <View style={[styles.glyphBoxLine, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === 'stores') {
    return (
      <View style={styles.glyph}>
        <View style={[styles.glyphPin, { borderColor: color }]} />
        <View style={[styles.glyphPinDot, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === 'about') {
    return (
      <View style={styles.glyph}>
        <View style={[styles.glyphCircle, { borderColor: color }]} />
        <View style={[styles.glyphInfoDot, { backgroundColor: color }]} />
        <View style={[styles.glyphInfoLine, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === 'support') {
    return (
      <View style={styles.glyph}>
        <View style={[styles.glyphHeadset, { borderColor: color }]} />
        <View style={[styles.glyphHeadsetMic, { backgroundColor: color }]} />
      </View>
    );
  }

  if (name === 'profile' || name === 'account') {
    return (
      <View style={styles.glyph}>
        <View style={[styles.glyphUserHead, { borderColor: color }]} />
        <View style={[styles.glyphUserBody, { borderColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.glyph}>
      <View style={[styles.glyphLogoutLine, { backgroundColor: color }]} />
      <View style={[styles.glyphLogoutArrow, { borderColor: color }]} />
    </View>
  );
}

function notificationTitle(notification: StoreNotification) {
  return String(notification.title ?? notification.heading ?? 'Notification').trim() || 'Notification';
}

function notificationBody(notification: StoreNotification) {
  return String(notification.message ?? notification.body ?? notification.description ?? '').trim();
}

function BellGlyph({ active }: { active: boolean }) {
  const color = active ? brand.green : brand.white;
  return (
    <View style={styles.bellGlyph}>
      <View style={[styles.bellDome, { borderColor: color }]} />
      <View style={[styles.bellBase, { backgroundColor: color }]} />
      <View style={[styles.bellClapper, { backgroundColor: color }]} />
    </View>
  );
}

function AppHeader({
  notificationCount,
  notificationsOpen,
  onMenuPress,
  onNotificationsPress,
}: {
  notificationCount: number;
  notificationsOpen: boolean;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
}) {
  const hasNotifications = notificationCount > 0;
  return (
    <View style={styles.appHeader}>
      <View style={styles.headerTop}>
        <View style={styles.headerSideLeft}>
          <Pressable style={styles.headerActionButton} onPress={onMenuPress} accessibilityLabel="Open menu">
            <View style={styles.headerMenuLine} />
            <View style={styles.headerMenuLine} />
            <View style={styles.headerMenuLine} />
          </Pressable>
        </View>
        <Image
          source={require('@/assets/images/logo-color.png')}
          style={styles.headerLogo}
          contentFit="contain"
          tintColor={brand.white}
          accessibilityLabel="Cleanodry"
        />
        <View style={styles.headerSideRight}>
          <Pressable
            style={[
              styles.headerActionButton,
              hasNotifications ? styles.headerNotificationActive : null,
              notificationsOpen ? styles.headerActionSelected : null,
            ]}
            onPress={onNotificationsPress}
            accessibilityLabel="Open notifications">
            <BellGlyph active={hasNotifications || notificationsOpen} />
            {hasNotifications ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function NotificationPanel({
  loading,
  message,
  notifications,
  onClose,
}: {
  loading: boolean;
  message: string;
  notifications: StoreNotification[];
  onClose: () => void;
}) {
  return (
    <View style={styles.notificationPanel}>
      <View style={styles.notificationPanelHead}>
        <Text style={styles.notificationPanelTitle}>Notifications</Text>
        <View style={styles.notificationPanelActions}>
          <Text style={styles.notificationPanelCount}>{notifications.length}</Text>
          <Pressable style={styles.notificationClose} onPress={onClose} accessibilityLabel="Close notifications">
            <Text style={styles.notificationCloseText}>x</Text>
          </Pressable>
        </View>
      </View>
      {loading ? <LogoLoader compact /> : null}
      {message ? <Text selectable style={styles.notificationError}>{message}</Text> : null}
      {!loading && !message && notifications.length === 0 ? (
        <Text style={styles.notificationMuted}>No notifications found.</Text>
      ) : null}
      {notifications.slice(0, 5).map((notification) => {
        const body = notificationBody(notification);
        return (
          <View key={String(notification.id)} style={styles.notificationItem}>
            <View style={styles.notificationDot} />
            <View style={styles.notificationCopy}>
              <Text selectable style={styles.notificationTitle}>
                {notificationTitle(notification)}
              </Text>
              {body ? (
                <Text selectable style={styles.notificationBody}>
                  {body}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function SideMenu({
  visible,
  active,
  userName,
  storeName,
  onClose,
  onSelectSection,
  onLogout,
}: {
  visible: boolean;
  active?: AppSection;
  userName: string;
  storeName?: string;
  onClose: () => void;
  onSelectSection: (section: AppSection) => void;
  onLogout: () => void;
}) {
  const { height } = useWindowDimensions();

  if (!visible) {
    return null;
  }

  const sections: AppSection[] = ['home', 'services', 'packages', 'stores', 'about', 'support'];

  return (
    <View style={[styles.menuOverlay, { minHeight: height }]}>
      <Pressable style={styles.menuScrim} onPress={onClose} accessibilityLabel="Close menu" />
      <View style={[styles.menuPanel, { maxHeight: Math.max(420, height - 112) }]}>
        <View style={styles.menuHead}>
          <Image
            source={require('@/assets/images/logo-color.png')}
            style={styles.menuLogo}
            contentFit="contain"
            accessibilityLabel="Cleanodry"
          />
          <Pressable style={styles.menuClose} onPress={onClose} accessibilityLabel="Close menu">
            <Text style={styles.menuCloseText}>x</Text>
          </Pressable>
        </View>

        <View style={styles.menuUserCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.menuUserCopy}>
            <Text style={styles.menuUserName}>{userName}</Text>
            <Text style={styles.menuUserStore}>{storeName || 'Cleanodry Customer'}</Text>
          </View>
        </View>

        <ScrollView style={styles.menuScroll} contentContainerStyle={styles.menuScrollContent} showsVerticalScrollIndicator={false}>
          {sections.map((section) => {
            const selected = active === section;
            const meta = sectionMeta[section];
            return (
              <Pressable
                key={section}
                style={[styles.menuItem, selected ? styles.menuItemActive : null]}
                onPress={() => {
                  onSelectSection(section);
                  onClose();
                }}>
                <View style={[styles.menuItemIcon, selected ? styles.menuItemIconActive : null]}>
                  <MenuGlyph name={meta.icon} active={selected} />
                </View>
                <View style={styles.menuItemCopy}>
                  <Text style={[styles.menuItemTitle, selected ? styles.menuItemTitleActive : null]}>{meta.title}</Text>
                  <Text style={styles.menuItemSub}>{meta.subtitle}</Text>
                </View>
              </Pressable>
            );
          })}

          <View style={styles.menuDivider} />
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              onClose();
              router.push('/orders');
            }}>
            <View style={styles.menuItemIcon}>
              <MenuGlyph name="orders" />
            </View>
            <View style={styles.menuItemCopy}>
              <Text style={styles.menuItemTitle}>My Orders</Text>
              <Text style={styles.menuItemSub}>View order history</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              onClose();
              router.push('/pickups');
            }}>
            <View style={styles.menuItemIcon}>
              <MenuGlyph name="pickup" />
            </View>
            <View style={styles.menuItemCopy}>
              <Text style={styles.menuItemTitle}>Pickup Requests</Text>
              <Text style={styles.menuItemSub}>Track scheduled pickups</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              onClose();
              router.push('/profile');
            }}>
            <View style={styles.menuItemIcon}>
              <MenuGlyph name="profile" />
            </View>
            <View style={styles.menuItemCopy}>
              <Text style={styles.menuItemTitle}>Profile</Text>
              <Text style={styles.menuItemSub}>Customer details</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.menuItem, styles.logoutItem]}
            onPress={() => {
              onClose();
              onLogout();
            }}>
            <View style={[styles.menuItemIcon, styles.logoutIcon]}>
              <MenuGlyph name="logout" danger />
            </View>
            <View style={styles.menuItemCopy}>
              <Text style={styles.logoutText}>Logout</Text>
              <Text style={styles.menuItemSub}>Sign out from this device</Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

function HeaderBackGlyph() {
  return (
    <View style={styles.headerBackGlyph}>
      <View style={styles.headerBackArrow} />
      <View style={styles.headerBackLine} />
    </View>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon,
  showBack = false,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  showBack?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderMain}>
        <View style={styles.sectionIcon}>
          <MenuGlyph name={icon} />
        </View>
        <View style={styles.sectionHeaderCopy}>
          <Text style={styles.sectionHeaderTitle}>{title}</Text>
          <Text style={styles.sectionHeaderSub}>{subtitle}</Text>
        </View>
      </View>
      {showBack ? (
        <Pressable
          style={styles.headerBackButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/');
          }}
          accessibilityLabel="Go back">
          <HeaderBackGlyph />
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingScreen() {
  return (
    <Screen contentContainerStyle={styles.loadingScreen}>
      <LogoLoader />
    </Screen>
  );
}

export function LogoLoader({ compact = false }: { compact?: boolean }) {
  const opacity = useRef(new Animated.Value(0.38)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          duration: 720,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          duration: 720,
          toValue: 0.38,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <View style={compact ? styles.compactLogoLoader : styles.logoLoader}>
      <NativeImage
        source={require('@/assets/images/loader-logo.png')}
        style={compact ? styles.compactLoadingLogo : styles.loadingLogo}
        resizeMode="contain"
        accessibilityLabel="Cleanodry"
      />
      <View style={styles.loadingDots}>
        <Animated.View style={[styles.loadingDot, { opacity }]} />
        <Animated.View style={[styles.loadingDot, styles.loadingDotMiddle, { opacity }]} />
        <Animated.View style={[styles.loadingDot, { opacity }]} />
      </View>
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  actionTitle,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
      {actionTitle && onAction ? <Button title={actionTitle} onPress={onAction} /> : null}
    </View>
  );
}

export function AppCard({ children }: PropsWithChildren) {
  return <View style={styles.contentCard}>{children}</View>;
}

type FooterNavItem = {
  key: 'home' | 'pickup' | 'orders' | 'profile';
  label: string;
  icon: IconName;
  onPress: () => void;
};

export function AppFooter({ activeSection, icon }: { activeSection?: AppSection; icon?: IconName } = {}) {
  const activeKey =
    activeSection === 'home'
      ? activeSection
      : icon === 'pickup'
        ? 'pickup'
      : icon === 'orders'
        ? 'orders'
        : icon === 'profile' || icon === 'account'
          ? 'profile'
          : undefined;
  const items: FooterNavItem[] = [
    {
      key: 'home',
      label: 'Home',
      icon: 'home',
      onPress: () => router.replace('/'),
    },
    {
      key: 'pickup',
      label: 'Pickups',
      icon: 'pickup',
      onPress: () => router.push('/pickups'),
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: 'orders',
      onPress: () => router.push('/orders'),
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: 'profile',
      onPress: () => router.push('/profile'),
    },
  ];

  return (
    <View style={styles.footer}>
      <View style={styles.footerNav}>
        {items.map((item) => {
          const selected = activeKey === item.key;
          return (
            <Pressable
              key={item.key}
              style={styles.footerNavItem}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={item.label}>
              <View style={[styles.footerNavIcon, selected ? styles.footerNavIconActive : null]}>
                <MenuGlyph name={item.icon} active={selected} />
              </View>
              <Text style={[styles.footerNavText, selected ? styles.footerNavTextActive : null]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
  icon,
  activeSection,
  onSectionChange,
  requireAuth = true,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  icon: IconName;
  activeSection?: AppSection;
  onSectionChange?: (section: AppSection) => void;
  requireAuth?: boolean;
}) {
  const auth = use(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const { height, width } = useWindowDimensions();

  const loadNotifications = useCallback((showLoading = true) => {
    if (!auth.user) {
      setNotifications([]);
      setNotificationCount(0);
      setNotificationMessage('');
      return;
    }

    let mounted = true;
    if (showLoading) {
      setNotificationsLoading(true);
    }
    getStoreNotifications(auth.user.token, 20)
      .then((data) => {
        if (!mounted) {
          return;
        }
        setNotifications(data.notifications);
        setNotificationCount(data.unreadCount > 0 ? data.unreadCount : data.notifications.length);
        setNotificationMessage('');
      })
      .catch((error) => {
        if (!mounted) {
          return;
        }
        setNotifications([]);
        setNotificationCount(0);
        setNotificationMessage(error instanceof Error ? error.message : 'Could not load notifications.');
      })
      .finally(() => {
        if (mounted) {
          setNotificationsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [auth.user]);

  useEffect(() => loadNotifications(), [loadNotifications]);

  useEffect(() => {
    if (!auth.user?.token) {
      return;
    }

    void registerForPushNotifications(
      auth.user.token,
      auth.user.customerId,
      auth.user.store?.id,
      undefined,
      true,
    ).catch((error) => {
      logFcmRegistrationFailure(error, 'authenticated_session');
    });
  }, [auth.user?.customerId, auth.user?.store?.id, auth.user?.token]);

  useEffect(() => {
    if (!auth.user?.token) {
      return;
    }

    const removeNotificationListeners = addStoreNotificationListeners(() => {
      loadNotifications(false);
    });
    const removePushTokenListener = addPushTokenRefreshListener(
      auth.user.token,
      auth.user.customerId,
      auth.user.store?.id,
      (error) => {
        logFcmRegistrationFailure(error, 'push_token_refresh');
      },
    );

    return () => {
      removeNotificationListeners();
      removePushTokenListener();
    };
  }, [auth.user?.customerId, auth.user?.store?.id, auth.user?.token, loadNotifications]);

  if (auth.loading) {
    return <LoadingScreen />;
  }

  if (requireAuth && !auth.user) {
    return <Redirect href="/login" />;
  }

  const name = auth.user ? `${auth.user.firstName} ${auth.user.lastName}`.trim() || 'Customer' : 'Customer';
  const contentMinHeight = Math.max(0, height - 42);
  const footerWidth = Math.min(width, 520);
  const footerLeft = Math.max(0, (width - footerWidth) / 2);

  function handleSectionSelect(section: AppSection) {
    if (onSectionChange) {
      onSectionChange(section);
      return;
    }
    router.replace({ pathname: '/', params: { section } });
  }

  return (
    <View style={styles.shell}>
      <Screen contentContainerStyle={[styles.screen, styles.screenWithStickyFooter, { minHeight: contentMinHeight }]}>
        <AppHeader
          notificationCount={notificationCount}
          notificationsOpen={notificationsOpen}
          onNotificationsPress={() => {
            setMenuOpen(false);
            setNotificationsOpen((open) => !open);
          }}
          onMenuPress={() => {
            setNotificationsOpen(false);
            setMenuOpen(true);
          }}
        />
        {auth.user ? (
          <SideMenu
            visible={menuOpen}
            active={activeSection}
            userName={name}
            storeName={auth.user.store?.name}
            onClose={() => setMenuOpen(false)}
            onSelectSection={handleSectionSelect}
            onLogout={auth.signOut}
          />
        ) : null}

        <PageHeader title={title} subtitle={subtitle} icon={icon} showBack={activeSection ? activeSection !== 'home' : true} />
        {children}
      </Screen>
      {notificationsOpen ? (
        <View pointerEvents="box-none" style={styles.notificationOverlay}>
          <NotificationPanel
            loading={notificationsLoading}
            message={notificationMessage}
            notifications={notifications}
            onClose={() => setNotificationsOpen(false)}
          />
        </View>
      ) : null}
      <View pointerEvents="box-none" style={[styles.stickyFooterWrap, { left: footerLeft, width: footerWidth }]}>
        <AppFooter activeSection={activeSection} icon={icon} />
      </View>
    </View>
  );
}

const styles = {
  shell: {
    backgroundColor: appBackground,
    flex: 1,
    position: 'relative' as const,
  },
  screen: {
    alignSelf: 'center' as const,
    backgroundColor: appBackground,
    gap: 16,
    maxWidth: 520,
    paddingHorizontal: 16,
    paddingBottom: 28,
    width: '100%' as const,
  },
  screenWithStickyFooter: {
    paddingBottom: 132,
  },
  loadingScreen: {
    alignItems: 'center' as const,
    backgroundColor: appBackground,
    flexGrow: 1,
    justifyContent: 'center' as const,
  },
  logoLoader: {
    alignItems: 'center' as const,
    gap: 14,
    justifyContent: 'center' as const,
    padding: 18,
  },
  compactLogoLoader: {
    alignItems: 'center' as const,
    gap: 10,
    justifyContent: 'center' as const,
    paddingVertical: 10,
  },
  loadingLogo: {
    height: 164,
    width: 164,
  },
  compactLoadingLogo: {
    height: 88,
    width: 88,
  },
  loadingDots: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 7,
    height: 18,
    justifyContent: 'center' as const,
  },
  loadingDot: {
    backgroundColor: brand.green,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  loadingDotMiddle: {
    height: 10,
    width: 10,
  },
  appHeader: {
    backgroundColor: brand.green,
    borderRadius: 22,
    boxShadow: '0 12px 28px rgba(52, 122, 0, 0.20)',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  headerTop: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  headerLogo: {
    height: 54,
    width: 172,
  },
  headerSideLeft: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    flex: 1,
    justifyContent: 'flex-start' as const,
  },
  headerSideRight: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    flex: 1,
    justifyContent: 'flex-end' as const,
  },
  headerActionButton: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 15,
    borderWidth: 1,
    gap: 5,
    height: 46,
    justifyContent: 'center' as const,
    width: 46,
  },
  headerActionSelected: {
    backgroundColor: brand.white,
    borderColor: brand.white,
  },
  headerNotificationActive: {
    backgroundColor: '#EAF7E4',
    borderColor: brand.white,
  },
  bellGlyph: {
    height: 22,
    position: 'relative' as const,
    width: 22,
  },
  bellDome: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 2,
    borderBottomWidth: 0,
    height: 14,
    left: 4,
    position: 'absolute' as const,
    top: 3,
    width: 14,
  },
  bellBase: {
    borderRadius: 999,
    height: 2,
    left: 3,
    position: 'absolute' as const,
    top: 17,
    width: 16,
  },
  bellClapper: {
    borderRadius: 999,
    bottom: 1,
    height: 4,
    left: 9,
    position: 'absolute' as const,
    width: 4,
  },
  notificationBadge: {
    alignItems: 'center' as const,
    backgroundColor: '#C0392B',
    borderColor: brand.white,
    borderRadius: 999,
    borderWidth: 2,
    minWidth: 20,
    paddingHorizontal: 4,
    position: 'absolute' as const,
    right: -5,
    top: -5,
  },
  notificationBadgeText: {
    color: brand.white,
    fontSize: 10,
    fontWeight: '900' as const,
    lineHeight: 16,
  },
  headerMenuLine: {
    backgroundColor: brand.white,
    borderRadius: 999,
    height: 2,
    width: 21,
  },
  notificationPanel: {
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: '0 12px 28px rgba(31, 56, 20, 0.14)',
    gap: 10,
    padding: 14,
  },
  notificationOverlay: {
    alignSelf: 'center' as const,
    left: 0,
    maxWidth: 520,
    paddingHorizontal: 16,
    position: 'absolute' as const,
    right: 0,
    top: 118,
    width: '100%' as const,
    zIndex: 45,
  },
  notificationPanelHead: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  notificationPanelActions: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 8,
  },
  notificationPanelTitle: {
    color: '#111B0D',
    fontSize: 16,
    fontWeight: '900' as const,
  },
  notificationPanelCount: {
    backgroundColor: '#EEF6EA',
    borderRadius: 999,
    color: brand.green,
    fontSize: 12,
    fontWeight: '900' as const,
    overflow: 'hidden' as const,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  notificationClose: {
    alignItems: 'center' as const,
    backgroundColor: '#F1F5ED',
    borderColor: 'rgba(52, 122, 0, 0.14)',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center' as const,
    width: 28,
  },
  notificationCloseText: {
    color: brand.green,
    fontSize: 16,
    fontWeight: '900' as const,
    lineHeight: 18,
  },
  notificationItem: {
    alignItems: 'flex-start' as const,
    backgroundColor: '#FAFCF8',
    borderColor: 'rgba(52, 122, 0, 0.10)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 10,
    padding: 11,
  },
  notificationDot: {
    backgroundColor: brand.green,
    borderRadius: 999,
    height: 8,
    marginTop: 6,
    width: 8,
  },
  notificationCopy: {
    flex: 1,
    gap: 3,
  },
  notificationTitle: {
    color: '#111B0D',
    fontSize: 13,
    fontWeight: '900' as const,
    lineHeight: 18,
  },
  notificationBody: {
    color: '#5B6755',
    fontSize: 12,
    lineHeight: 17,
  },
  notificationMuted: {
    color: brand.gray,
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  notificationError: {
    color: brand.danger,
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  sectionHeader: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 12,
    justifyContent: 'space-between' as const,
  },
  sectionHeaderMain: {
    alignItems: 'center' as const,
    flex: 1,
    flexDirection: 'row' as const,
    gap: 12,
  },
  sectionIcon: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.14)',
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center' as const,
    width: 48,
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  sectionHeaderTitle: {
    color: '#111B0D',
    fontSize: 20,
    fontWeight: '900' as const,
  },
  sectionHeaderSub: {
    color: '#64705E',
    fontSize: 12,
    lineHeight: 17,
  },
  headerBackButton: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.14)',
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center' as const,
    width: 48,
  },
  headerBackGlyph: {
    height: 22,
    position: 'relative' as const,
    width: 22,
  },
  headerBackArrow: {
    borderColor: brand.green,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    height: 11,
    left: 4,
    position: 'absolute' as const,
    top: 6,
    transform: [{ rotate: '-45deg' }],
    width: 11,
  },
  headerBackLine: {
    backgroundColor: brand.green,
    borderRadius: 999,
    height: 3,
    left: 6,
    position: 'absolute' as const,
    top: 10,
    width: 14,
  },
  contentCard: {
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  footer: {
    alignItems: 'center' as const,
    gap: 8,
    width: '100%' as const,
  },
  stickyFooterWrap: {
    alignSelf: 'center' as const,
    backgroundColor: 'rgba(244, 250, 241, 0.96)',
    borderTopColor: 'rgba(52, 122, 0, 0.12)',
    borderTopWidth: 1,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    position: 'absolute' as const,
    zIndex: 40,
  },
  footerNav: {
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: '0 10px 24px rgba(31, 56, 20, 0.10)',
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '100%' as const,
  },
  footerNavItem: {
    alignItems: 'center' as const,
    flex: 1,
    gap: 4,
    justifyContent: 'center' as const,
    minHeight: 54,
    paddingHorizontal: 4,
  },
  footerNavIcon: {
    alignItems: 'center' as const,
    borderRadius: 14,
    height: 30,
    justifyContent: 'center' as const,
    width: 34,
  },
  footerNavIconActive: {
    backgroundColor: '#EEF6EA',
  },
  footerNavText: {
    color: '#8A9287',
    fontSize: 11,
    fontWeight: '900' as const,
    textAlign: 'center' as const,
  },
  footerNavTextActive: {
    color: brand.green,
  },
  emptyState: {
    alignItems: 'center' as const,
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 22,
  },
  emptyTitle: {
    color: '#111B0D',
    fontSize: 17,
    fontWeight: '900' as const,
    textAlign: 'center' as const,
  },
  emptySub: {
    color: brand.gray,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center' as const,
  },
  menuOverlay: {
    bottom: -40,
    left: -16,
    position: 'absolute' as const,
    right: -16,
    top: -14,
    zIndex: 50,
  },
  menuScrim: {
    backgroundColor: 'rgba(11, 24, 6, 0.42)',
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
  },
  menuPanel: {
    backgroundColor: brand.white,
    borderBottomRightRadius: 24,
    borderTopRightRadius: 24,
    boxShadow: '8px 0 28px rgba(0, 0, 0, 0.16)',
    left: 0,
    padding: 16,
    paddingTop: 20,
    position: 'absolute' as const,
    top: 18,
    width: '86%' as const,
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    gap: 6,
    paddingBottom: 12,
  },
  menuHead: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 6,
  },
  menuLogo: {
    height: 42,
    width: 132,
  },
  menuClose: {
    alignItems: 'center' as const,
    backgroundColor: '#F2F4F0',
    borderRadius: 15,
    height: 34,
    justifyContent: 'center' as const,
    width: 34,
  },
  menuCloseText: {
    color: brand.black,
    fontSize: 16,
    fontWeight: '900' as const,
  },
  menuUserCard: {
    alignItems: 'center' as const,
    backgroundColor: '#F0F7EB',
    borderRadius: 18,
    flexDirection: 'row' as const,
    gap: 10,
    marginBottom: 6,
    padding: 10,
  },
  avatar: {
    alignItems: 'center' as const,
    backgroundColor: brand.green,
    borderRadius: 16,
    height: 40,
    justifyContent: 'center' as const,
    width: 40,
  },
  avatarText: {
    color: brand.white,
    fontSize: 16,
    fontWeight: '900' as const,
  },
  menuUserCopy: {
    flex: 1,
    gap: 2,
  },
  menuUserName: {
    color: brand.black,
    fontSize: 13,
    fontWeight: '900' as const,
  },
  menuUserStore: {
    color: brand.green,
    fontSize: 11,
    fontWeight: '800' as const,
  },
  menuItem: {
    alignItems: 'center' as const,
    borderRadius: 14,
    flexDirection: 'row' as const,
    gap: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  menuItemActive: {
    backgroundColor: '#EEF6EA',
  },
  menuItemIcon: {
    alignItems: 'center' as const,
    backgroundColor: '#F2F4F0',
    borderRadius: 12,
    height: 32,
    justifyContent: 'center' as const,
    width: 32,
  },
  glyph: {
    height: 22,
    position: 'relative' as const,
    width: 22,
  },
  assetGlyph: {
    height: 28,
    width: 28,
  },
  glyphRoof: {
    borderLeftWidth: 2,
    borderTopWidth: 2,
    height: 13,
    left: 6,
    position: 'absolute' as const,
    top: 3,
    transform: [{ rotate: '45deg' }],
    width: 13,
  },
  glyphHouseBase: {
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    bottom: 4,
    height: 11,
    left: 5,
    position: 'absolute' as const,
    width: 14,
  },
  glyphHangerHook: {
    borderRadius: 8,
    borderRightWidth: 2,
    borderTopWidth: 2,
    height: 9,
    left: 10,
    position: 'absolute' as const,
    top: 2,
    width: 7,
  },
  glyphHangerLeft: {
    height: 2,
    left: 5,
    position: 'absolute' as const,
    top: 15,
    transform: [{ rotate: '-24deg' }],
    width: 11,
  },
  glyphHangerRight: {
    height: 2,
    position: 'absolute' as const,
    right: 4,
    top: 15,
    transform: [{ rotate: '24deg' }],
    width: 11,
  },
  glyphBox: {
    borderRadius: 4,
    borderWidth: 2,
    height: 16,
    left: 4,
    position: 'absolute' as const,
    top: 5,
    width: 16,
  },
  glyphBoxLine: {
    height: 2,
    left: 8,
    position: 'absolute' as const,
    top: 9,
    width: 8,
  },
  glyphPin: {
    borderRadius: 9,
    borderWidth: 2,
    height: 17,
    left: 4,
    position: 'absolute' as const,
    top: 2,
    transform: [{ rotate: '45deg' }],
    width: 17,
  },
  glyphPinDot: {
    borderRadius: 3,
    height: 6,
    left: 9,
    position: 'absolute' as const,
    top: 7,
    width: 6,
  },
  glyphCircle: {
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    left: 2,
    position: 'absolute' as const,
    top: 2,
    width: 20,
  },
  glyphInfoDot: {
    borderRadius: 2,
    height: 4,
    left: 10,
    position: 'absolute' as const,
    top: 6,
    width: 4,
  },
  glyphInfoLine: {
    borderRadius: 999,
    height: 8,
    left: 11,
    position: 'absolute' as const,
    top: 12,
    width: 2,
  },
  glyphHeadset: {
    borderRadius: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    height: 15,
    left: 4,
    position: 'absolute' as const,
    top: 4,
    width: 16,
  },
  glyphHeadsetMic: {
    borderRadius: 999,
    height: 2,
    left: 13,
    position: 'absolute' as const,
    top: 18,
    width: 7,
  },
  glyphReceipt: {
    borderRadius: 4,
    borderWidth: 2,
    height: 18,
    left: 5,
    position: 'absolute' as const,
    top: 3,
    width: 14,
  },
  glyphReceiptLineOne: {
    borderRadius: 999,
    height: 2,
    left: 8,
    position: 'absolute' as const,
    top: 9,
    width: 8,
  },
  glyphReceiptLineTwo: {
    borderRadius: 999,
    height: 2,
    left: 8,
    position: 'absolute' as const,
    top: 14,
    width: 8,
  },
  glyphUserHead: {
    borderRadius: 6,
    borderWidth: 2,
    height: 10,
    left: 7,
    position: 'absolute' as const,
    top: 3,
    width: 10,
  },
  glyphUserBody: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    height: 9,
    left: 5,
    position: 'absolute' as const,
    top: 16,
    width: 14,
  },
  glyphLogoutLine: {
    borderRadius: 999,
    height: 2,
    left: 4,
    position: 'absolute' as const,
    top: 11,
    width: 14,
  },
  glyphLogoutArrow: {
    borderRightWidth: 2,
    borderTopWidth: 2,
    height: 8,
    position: 'absolute' as const,
    right: 4,
    top: 8,
    transform: [{ rotate: '45deg' }],
    width: 8,
  },
  menuItemIconActive: {
    backgroundColor: brand.green,
  },
  menuItemCopy: {
    flex: 1,
    gap: 1,
  },
  menuItemTitle: {
    color: brand.black,
    fontSize: 12,
    fontWeight: '900' as const,
  },
  menuItemTitleActive: {
    color: brand.green,
  },
  menuItemSub: {
    color: brand.gray,
    fontSize: 10,
    lineHeight: 13,
  },
  menuDivider: {
    backgroundColor: '#EEF0EC',
    height: 1,
    marginVertical: 4,
  },
  logoutItem: {
    marginTop: 4,
  },
  logoutIcon: {
    backgroundColor: '#FDEDEC',
  },
  logoutText: {
    color: brand.danger,
    fontSize: 12,
    fontWeight: '900' as const,
  },
};
