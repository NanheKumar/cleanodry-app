import { Image } from 'expo-image';
import { forwardRef, type PropsWithChildren, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

export const brand = {
  green: '#347A00',
  greenDark: '#2B6500',
  black: '#313131',
  gray: '#616161',
  lightGray: '#F1F1F1',
  border: '#CBCBCB',
  danger: '#C0392B',
  white: '#FFFFFF',
};

export const Screen = forwardRef<ScrollView, PropsWithChildren<ScrollViewProps>>(function Screen(
  { children, contentContainerStyle, ...props },
  ref,
) {
  return (
    <ScrollView
      ref={ref}
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.screenContent, contentContainerStyle]}
      {...props}>
      {children}
    </ScrollView>
  );
});

export function Hero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <View style={styles.hero}>
      <View style={styles.brandBar}>
        <Image
          source={require('@/assets/images/logo-color.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Cleanodry"
        />
      </View>
      <View style={styles.heroCopy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.trustStrip}>
        <View style={styles.trustItem}>
          <Text style={styles.trustTitle}>Free Pickup</Text>
          <Text style={styles.trustText}>Doorstep care</Text>
        </View>
        <View style={styles.trustDivider} />
        <View style={styles.trustItem}>
          <Text style={styles.trustTitle}>Eco Process</Text>
          <Text style={styles.trustText}>Fabric safe</Text>
        </View>
        <View style={styles.trustDivider} />
        <View style={styles.trustItem}>
          <Text style={styles.trustTitle}>Premium</Text>
          <Text style={styles.trustText}>Expert finish</Text>
        </View>
      </View>
    </View>
  );
}

export function Field({
  label,
  prefix,
  ...props
}: TextInputProps & { label: string; prefix?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor="#9C9C9C"
          style={[styles.input, prefix ? styles.inputWithPrefix : null]}
          {...props}
        />
      </View>
    </View>
  );
}

export function SelectBox({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: number | string | null;
  placeholder: string;
  options: { id: number | string; name: string; detail?: string }[];
  onChange: (id: number | string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionList}>
        {options.length === 0 ? <Text style={styles.muted}>{placeholder}</Text> : null}
        {options.map((option) => {
          const selected = String(value ?? '') === String(option.id);
          return (
            <Pressable
              key={String(option.id)}
              onPress={() => onChange(option.id)}
              style={[styles.option, selected ? styles.optionSelected : null]}>
              <View>
                <Text style={[styles.optionTitle, selected ? styles.optionTitleSelected : null]}>
                  {option.name}
                </Text>
                {option.detail ? <Text style={styles.optionDetail}>{option.detail}</Text> : null}
              </View>
              <Text style={[styles.optionCheck, selected ? styles.optionCheckSelected : null]}>
                {selected ? 'Selected' : 'Select'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
}) {
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'outline' ? styles.buttonOutline : null,
        variant === 'ghost' ? styles.buttonGhost : null,
        pressed ? styles.pressed : null,
        loading ? styles.disabled : null,
      ]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? brand.white : brand.green} /> : null}
      <Text
        style={[
          styles.buttonText,
          variant === 'outline' || variant === 'ghost' ? styles.buttonTextOutline : null,
        ]}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Message({ text, tone = 'error' }: { text: string; tone?: 'error' | 'success' | 'muted' }) {
  if (!text) {
    return null;
  }
  return (
    <Text
      selectable
      style={[
        styles.message,
        tone === 'success' ? styles.success : null,
        tone === 'muted' ? styles.muted : null,
      ]}>
      {text}
    </Text>
  );
}

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text selectable style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FBF6',
  },
  screenContent: {
    alignSelf: 'center',
    gap: 18,
    maxWidth: 460,
    padding: 18,
    paddingBottom: 40,
    width: '100%',
  },
  hero: {
    gap: 16,
    paddingTop: 18,
  },
  brandBar: {
    alignItems: 'center',
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    minHeight: 86,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  logo: {
    height: 62,
    width: 164,
  },
  heroCopy: {
    gap: 8,
    paddingHorizontal: 2,
  },
  eyebrow: {
    color: brand.green,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: brand.black,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  heroSubtitle: {
    color: brand.gray,
    fontSize: 15,
    lineHeight: 22,
  },
  trustStrip: {
    alignItems: 'center',
    backgroundColor: brand.white,
    borderRadius: 10,
    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.07)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  trustItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  trustTitle: {
    color: brand.black,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  trustText: {
    color: brand.gray,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  trustDivider: {
    backgroundColor: 'rgba(52, 122, 0, 0.2)',
    height: 36,
    width: 1,
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#1F2A1B',
    fontSize: 14,
    fontWeight: '800',
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: '#FAFCF8',
    borderColor: 'rgba(52, 122, 0, 0.18)',
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  prefix: {
    alignSelf: 'stretch',
    backgroundColor: '#EEF6EA',
    color: brand.green,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingTop: 17,
  },
  input: {
    color: brand.black,
    flex: 1,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputWithPrefix: {
    paddingLeft: 12,
  },
  optionList: {
    gap: 10,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#FAFCF8',
    borderColor: 'rgba(52, 122, 0, 0.14)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  optionSelected: {
    backgroundColor: '#F0F7EB',
    borderColor: brand.green,
  },
  optionTitle: {
    color: brand.black,
    fontSize: 15,
    fontWeight: '700',
  },
  optionTitleSelected: {
    color: brand.green,
  },
  optionDetail: {
    color: brand.gray,
    fontSize: 12,
    marginTop: 2,
  },
  optionCheck: {
    color: brand.gray,
    fontSize: 12,
    fontWeight: '700',
  },
  optionCheckSelected: {
    color: brand.green,
  },
  button: {
    alignItems: 'center',
    backgroundColor: brand.green,
    borderColor: brand.green,
    borderRadius: 16,
    borderWidth: 1,
    boxShadow: '0 10px 20px rgba(52, 122, 0, 0.20)',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  buttonOutline: {
    backgroundColor: brand.white,
    boxShadow: 'none',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    boxShadow: 'none',
  },
  buttonText: {
    color: brand.white,
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  buttonTextOutline: {
    color: brand.green,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.65,
  },
  message: {
    color: brand.danger,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  success: {
    color: brand.green,
  },
  muted: {
    color: brand.gray,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: brand.white,
    borderColor: 'rgba(52, 122, 0, 0.12)',
    borderRadius: 22,
    borderWidth: 1,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.10)',
    gap: 14,
    padding: 20,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    color: brand.gray,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rowValue: {
    color: brand.black,
    fontSize: 15,
    fontWeight: '600',
  },
});
