import { Redirect, router } from 'expo-router';
import { Image } from 'expo-image';
import { type PropsWithChildren, type ReactNode, use, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Screen, brand } from '@/components/cleanodry-ui';
import { AuthContext } from '@/lib/auth-context';

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

function AppHeader({ onMenuPress }: { onMenuPress: () => void }) {
  return (
    <View style={styles.appHeader}>
      <View style={styles.headerTop}>
        <Image
          source={require('@/assets/images/logo-color.png')}
          style={styles.headerLogo}
          contentFit="contain"
          tintColor={brand.white}
          accessibilityLabel="Cleanodry"
        />
        <Pressable style={styles.headerMenuButton} onPress={onMenuPress} accessibilityLabel="Open menu">
          <View style={styles.headerMenuLine} />
          <View style={styles.headerMenuLine} />
          <View style={styles.headerMenuLine} />
        </Pressable>
      </View>
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
  if (!visible) {
    return null;
  }

  const sections: AppSection[] = ['home', 'services', 'packages', 'stores', 'about', 'support'];

  return (
    <View style={styles.menuOverlay}>
      <Pressable style={styles.menuScrim} onPress={onClose} accessibilityLabel="Close menu" />
      <View style={styles.menuPanel}>
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

export function PageHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: IconName }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <MenuGlyph name={icon} />
      </View>
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionHeaderTitle}>{title}</Text>
        <Text style={styles.sectionHeaderSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

export function LoadingScreen({ label = 'Loading Cleanodry...' }: { label?: string }) {
  return (
    <Screen contentContainerStyle={styles.loadingScreen}>
      <ActivityIndicator color={brand.green} size="large" />
      <Text style={styles.loadingText}>{label}</Text>
    </Screen>
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

  if (auth.loading) {
    return <LoadingScreen />;
  }

  if (requireAuth && !auth.user) {
    return <Redirect href="/login" />;
  }

  const name = auth.user ? `${auth.user.firstName} ${auth.user.lastName}`.trim() || 'Customer' : 'Customer';

  function handleSectionSelect(section: AppSection) {
    if (onSectionChange) {
      onSectionChange(section);
      return;
    }
    router.replace({ pathname: '/', params: { section } });
  }

  return (
    <Screen contentContainerStyle={styles.screen}>
      <AppHeader onMenuPress={() => setMenuOpen(true)} />
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

      <PageHeader title={title} subtitle={subtitle} icon={icon} />
      {children}
    </Screen>
  );
}

const styles = {
  screen: {
    alignSelf: 'center' as const,
    backgroundColor: appBackground,
    gap: 16,
    maxWidth: 520,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
    width: '100%' as const,
  },
  loadingScreen: {
    alignItems: 'center' as const,
    backgroundColor: appBackground,
    flexGrow: 1,
    gap: 12,
    justifyContent: 'center' as const,
  },
  loadingText: {
    color: brand.green,
    fontSize: 15,
    fontWeight: '800' as const,
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
  headerMenuButton: {
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
  headerMenuLine: {
    backgroundColor: brand.white,
    borderRadius: 999,
    height: 2,
    width: 21,
  },
  sectionHeader: {
    alignItems: 'center' as const,
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
  contentCard: {
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 16,
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
    bottom: 0,
    boxShadow: '-8px 0 28px rgba(0, 0, 0, 0.16)',
    padding: 16,
    paddingTop: 20,
    position: 'absolute' as const,
    right: 0,
    top: 0,
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
